/**
 * FlyeMass FX Engine (server-authoritative math)
 * ------------------------------------------------
 * - All money is integer minor units (kobo / fen / cents, 100 per major unit).
 * - Rates are scaled to integer micro-units (x 1,000,000); fees to milli-percent.
 * - BigInt arithmetic only => zero floating-point drift.
 *
 * Keep in sync with src/services/fxEngine.ts (parity is asserted in tests).
 */

const SWAP_DIRECTIONS = {
  NGN_TO_CNY: { from: 'NGN', to: 'CNY', base: 'CNY', quote: 'NGN' },
  CNY_TO_NGN: { from: 'CNY', to: 'NGN', base: 'CNY', quote: 'NGN' },
  USD_TO_CNY: { from: 'USD', to: 'CNY', base: 'USD', quote: 'CNY' },
  CNY_TO_USD: { from: 'CNY', to: 'USD', base: 'USD', quote: 'CNY' }
};

const RESTRICTED_DIRECTIONS = ['USD_TO_NGN', 'NGN_TO_USD'];
const USD_NGN_POLICY_MESSAGE = 'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.';

const PUBLISHABLE_PAIRS = [
  { base: 'CNY', quote: 'NGN', swappable: true },
  { base: 'USD', quote: 'CNY', swappable: true },
  { base: 'USD', quote: 'NGN', swappable: false } // valuations & shipping estimates only
];

const DEFAULT_FEE_SETTINGS = {
  NGN_TO_CNY: { fee_percent: 0.5, min_amount_minor: 1000000 }, // ₦10,000.00
  CNY_TO_NGN: { fee_percent: 0.5, min_amount_minor: 5000 },    // ¥50.00
  USD_TO_CNY: { fee_percent: 0.5, min_amount_minor: 1000 },    // $10.00
  CNY_TO_USD: { fee_percent: 0.5, min_amount_minor: 5000 }     // ¥50.00
};
const DEFAULT_MAX_RATE_AGE_MINUTES = 1440; // 24h

function directionFor(from, to) {
  const key = `${from}_TO_${to}`;
  return key;
}

function toMinor(major) {
  const n = Number(major);
  if (!isFinite(n)) return 0;
  // String-based rounding avoids 1.005 * 100 = 100.49999 artefacts
  return Math.round(Number(n.toFixed(2)) * 100);
}

function fromMinor(minor) {
  return Number(minor) / 100;
}

function rateToMicro(rate) {
  return BigInt(Math.round(Number(rate) * 1e6));
}

function feeToMilliPercent(feePercent) {
  return BigInt(Math.round(Number(feePercent) * 1000));
}

/**
 * Compute a swap quote.
 * @returns {{ok:true, direction, from, to, amountMinor, feeMinor, netMinor, creditedMinor, appliedRate, rateSide}
 *          | {ok:false, error}}
 */
function computeSwapQuote({ direction, amountMinor, rate, feePercent }) {
  if (RESTRICTED_DIRECTIONS.includes(direction)) return { ok: false, error: USD_NGN_POLICY_MESSAGE, code: 'POLICY_RESTRICTED' };
  const dir = SWAP_DIRECTIONS[direction];
  if (!dir) return { ok: false, error: `Unsupported swap direction ${direction}`, code: 'UNSUPPORTED' };
  if (!rate || !(Number(rate.buy_rate) > 0) || !(Number(rate.sell_rate) > 0)) {
    return { ok: false, error: `No active ${dir.base}/${dir.quote} rate published`, code: 'NO_RATE' };
  }
  const amt = BigInt(Math.trunc(Number(amountMinor) || 0));
  if (amt <= 0n) return { ok: false, error: 'Invalid swap amount', code: 'INVALID_AMOUNT' };

  const feeMilli = feeToMilliPercent(feePercent || 0);
  const feeMinor = (amt * feeMilli + 50000n) / 100000n; // round half-up
  const netMinor = amt - feeMinor;

  const customerSellsBase = dir.from === dir.base;
  const appliedRate = customerSellsBase ? Number(rate.buy_rate) : Number(rate.sell_rate);
  const rateMicro = rateToMicro(appliedRate);
  const creditedMinor = customerSellsBase
    ? (netMinor * rateMicro) / 1000000n
    : (netMinor * 1000000n) / rateMicro;

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
}

function generateSwapReference(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = require('crypto').randomBytes(4).toString('hex').toUpperCase();
  return `SW-${y}${m}${d}-${rand}`;
}

module.exports = {
  SWAP_DIRECTIONS,
  RESTRICTED_DIRECTIONS,
  USD_NGN_POLICY_MESSAGE,
  PUBLISHABLE_PAIRS,
  DEFAULT_FEE_SETTINGS,
  DEFAULT_MAX_RATE_AGE_MINUTES,
  directionFor,
  toMinor,
  fromMinor,
  computeSwapQuote,
  generateSwapReference
};
