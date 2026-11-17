/**
 * FlyeMass FX Engine (client preview math)
 * Mirror of /fx-engine.cjs — the server is authoritative; this module only
 * renders quotes. Integer minor units + BigInt => zero floating-point drift.
 */
import type { Currency } from '../types';

export type SwapDirection = 'NGN_TO_CNY' | 'CNY_TO_NGN' | 'USD_TO_CNY' | 'CNY_TO_USD';

export interface FxRateRow {
  id: string;
  base: Currency;
  quote: Currency;
  buy_rate: number;
  sell_rate: number;
  is_active: boolean;
  published_at: number;
  published_by?: string;
  published_by_name?: string;
  swappable?: boolean;
}

export interface FxFeeSetting {
  fee_percent: number;
  min_amount_minor: number;
}

export interface FxBook {
  rates: FxRateRow[];
  fees: Record<SwapDirection, FxFeeSetting>;
  max_rate_age_minutes: number;
  server_time: number;
}

export const SWAP_DIRECTIONS: Record<SwapDirection, { from: Currency; to: Currency; base: Currency; quote: Currency }> = {
  NGN_TO_CNY: { from: 'NGN', to: 'CNY', base: 'CNY', quote: 'NGN' },
  CNY_TO_NGN: { from: 'CNY', to: 'NGN', base: 'CNY', quote: 'NGN' },
  USD_TO_CNY: { from: 'USD', to: 'CNY', base: 'USD', quote: 'CNY' },
  CNY_TO_USD: { from: 'CNY', to: 'USD', base: 'USD', quote: 'CNY' }
};

export const USD_NGN_POLICY_MESSAGE = 'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.';

export const isRestrictedPair = (from: Currency, to: Currency) =>
  (from === 'USD' && to === 'NGN') || (from === 'NGN' && to === 'USD');

export const directionFor = (from: Currency, to: Currency): SwapDirection | null => {
  const key = `${from}_TO_${to}` as SwapDirection;
  return SWAP_DIRECTIONS[key] ? key : null;
};

export const toMinor = (major: number | string): number => {
  const n = Number(major);
  if (!isFinite(n)) return 0;
  return Math.round(Number(n.toFixed(2)) * 100);
};

export const fromMinor = (minor: number): number => minor / 100;

export const findActiveRate = (book: FxBook | null, base: Currency, quote: Currency): FxRateRow | undefined =>
  book?.rates.find((r) => r.base === base && r.quote === quote && r.is_active);

export const isRateStale = (rate: FxRateRow | undefined, maxAgeMinutes: number, now = Date.now()) =>
  !rate || now - rate.published_at > maxAgeMinutes * 60 * 1000;

export type SwapQuote =
  | {
      ok: true;
      direction: SwapDirection;
      from: Currency;
      to: Currency;
      amountMinor: number;
      feeMinor: number;
      netMinor: number;
      creditedMinor: number;
      appliedRate: number;
      rateSide: 'buy' | 'sell';
    }
  | { ok: false; error: string; code: string };

export const computeSwapQuote = (params: {
  direction: SwapDirection;
  amountMinor: number;
  rate?: { buy_rate: number; sell_rate: number };
  feePercent: number;
}): SwapQuote => {
  const { direction, amountMinor, rate, feePercent } = params;
  const dir = SWAP_DIRECTIONS[direction];
  if (!dir) return { ok: false, error: `Unsupported swap direction ${direction}`, code: 'UNSUPPORTED' };
  if (!rate || !(Number(rate.buy_rate) > 0) || !(Number(rate.sell_rate) > 0)) {
    return { ok: false, error: `No active ${dir.base}/${dir.quote} rate published`, code: 'NO_RATE' };
  }
  const amt = BigInt(Math.trunc(Number(amountMinor) || 0));
  if (amt <= 0n) return { ok: false, error: 'Invalid swap amount', code: 'INVALID_AMOUNT' };

  const feeMilli = BigInt(Math.round(Number(feePercent || 0) * 1000));
  const feeMinor = (amt * feeMilli + 50000n) / 100000n;
  const netMinor = amt - feeMinor;

  const customerSellsBase = dir.from === dir.base;
  const appliedRate = customerSellsBase ? Number(rate.buy_rate) : Number(rate.sell_rate);
  const rateMicro = BigInt(Math.round(appliedRate * 1e6));
  const creditedMinor = customerSellsBase ? (netMinor * rateMicro) / 1000000n : (netMinor * 1000000n) / rateMicro;

  if (creditedMinor <= 0n) return { ok: false, error: 'Converted amount too small', code: 'TOO_SMALL' };

  return {
    ok: true,
    direction,
    from: dir.from,
    to: dir.to,
    amountMinor: Number(amt),
    feeMinor: Number(feeMinor),
    netMinor: Number(netMinor),
    creditedMinor: Number(creditedMinor),
    appliedRate,
    rateSide: customerSellsBase ? 'buy' : 'sell'
  };
};

export const CURRENCY_SYMBOL: Record<string, string> = { NGN: '₦', CNY: '¥', USD: '$' };

export const formatMinor = (minor: number, currency: Currency | string) =>
  `${CURRENCY_SYMBOL[currency] || ''}${fromMinor(minor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
