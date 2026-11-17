import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../services/db';
import {
  FxBook,
  FxRateRow,
  SwapDirection,
  SwapQuote,
  USD_NGN_POLICY_MESSAGE,
  computeSwapQuote,
  directionFor,
  findActiveRate,
  formatMinor,
  fromMinor,
  isRateStale,
  isRestrictedPair,
  toMinor,
  SWAP_DIRECTIONS
} from '../services/fxEngine';
import type { Currency } from '../types';

export interface FxSwapState {
  book: FxBook | null;
  loading: boolean;
  refresh: () => Promise<void>;
  direction: SwapDirection | null;
  restricted: boolean;
  rateRow?: FxRateRow;
  stale: boolean;
  feePercent: number;
  minAmountMinor: number;
  amountMinor: number;
  quote: SwapQuote | null;
  /** Effective customer rate for 1 unit of `from` expressed in `to` (display only). */
  effectiveRate: number | null;
  /** First blocking problem, or null when the swap can be submitted. */
  error: string | null;
}

/**
 * Shared pre-flight engine for the Exchange screen and the Currency Swap modal.
 * Integer minor-unit math only; the server re-computes and is authoritative.
 */
export function useFxSwap(from: Currency, to: Currency, amountStr: string, balance: number, active: boolean = true): FxSwapState {
  const [book, setBook] = useState<FxBook | null>(null);
  const [loading, setLoading] = useState(false);
  const lastSeenUpdate = useRef<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getFxBook();
      setBook(data);
    } catch {
      /* keep the previous book; the header shows its age */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    refresh();
    const unsub = db.subscribe(() => {
      // Admin published new rates / fees => server pushes state; re-pull the book once per change
      const stamp = (db.getState() as any)?.system_settings?.rates?.lastUpdated || 0;
      if (stamp !== lastSeenUpdate.current) {
        lastSeenUpdate.current = stamp;
        refresh();
      }
    });
    return unsub;
  }, [active, refresh]);

  const direction = directionFor(from, to);
  const restricted = isRestrictedPair(from, to);

  return useMemo<FxSwapState>(() => {
    const dirDef = direction ? SWAP_DIRECTIONS[direction] : null;
    const rateRow = dirDef && book ? findActiveRate(book, dirDef.base, dirDef.quote) : undefined;
    const fee = direction && book ? book.fees[direction] : undefined;
    const feePercent = fee ? fee.fee_percent : 0.5;
    const minAmountMinor = fee ? fee.min_amount_minor : 0;
    const stale = !!book && !!dirDef && isRateStale(rateRow, book.max_rate_age_minutes, book.server_time || Date.now());
    const amountMinor = toMinor(amountStr);

    let quote: SwapQuote | null = null;
    if (direction && rateRow && amountMinor > 0) {
      quote = computeSwapQuote({ direction, amountMinor, rate: rateRow, feePercent });
    }

    let effectiveRate: number | null = null;
    if (dirDef && rateRow) {
      const applied = dirDef.from === dirDef.base ? rateRow.buy_rate : rateRow.sell_rate;
      effectiveRate = dirDef.from === dirDef.base ? applied : 1 / applied;
    }

    let error: string | null = null;
    if (restricted) error = USD_NGN_POLICY_MESSAGE;
    else if (from === to) error = 'Source and destination currencies cannot be identical';
    else if (!direction) error = `Unsupported swap pair ${from} → ${to}`;
    else if (!book) error = 'Loading live rates…';
    else if (!rateRow) error = 'No active exchange rate is published for this pair yet';
    else if (stale) error = 'The published rate has expired — awaiting treasury republish';
    else if (amountMinor <= 0) error = 'Enter an amount to swap';
    else if (amountMinor < minAmountMinor) error = `Minimum swap is ${formatMinor(minAmountMinor, from)}`;
    else if (amountMinor > toMinor(balance)) error = `Insufficient ${from} balance`;
    else if (quote && quote.ok === false) error = (quote as { ok: false; error: string }).error;

    return { book, loading, refresh, direction, restricted, rateRow, stale, feePercent, minAmountMinor, amountMinor, quote, effectiveRate, error };
  }, [book, loading, refresh, direction, restricted, from, to, amountStr, balance]);
}

export { formatMinor, fromMinor, toMinor, USD_NGN_POLICY_MESSAGE };
