/**
 * Amount entry for rates and bids.
 *
 * Both fields previously sanitised with `replace(/[^\d]/g, '')`, which deletes
 * the decimal point rather than the decimals. Typing a perfectly ordinary
 * "2400.50" produced "240050" — the figure the user submitted was a hundred
 * times what they typed, silently, with the wrong number sitting in the field
 * in front of them. On a bid that is public and acted upon, that is the worst
 * kind of bug: it does not look like a failure.
 *
 * These are whole-dollar totals for a load, not per-mile figures, so cents are
 * dropped on submit — but they are accepted while typing, because refusing the
 * keystroke is what caused the damage.
 */

/** Matches `bids_amount_sane` and `listings_target_rate_sane` in 0002_harden.sql. */
export const MAX_AMOUNT = 1_000_000;

/**
 * Sanitise as the user types. Keeps digits, at most one decimal point and at
 * most two decimals, and holds the value at the ceiling the database enforces.
 * Deliberately tolerant of half-typed input: "2." and "" are both valid states
 * on the way to a number.
 */
export function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');

  // Collapse any decimal points after the first.
  const dot = cleaned.indexOf('.');
  const single =
    dot === -1 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, '');

  const [rawWhole, dec] = single.split('.');
  // A leading "." is a real thing people type for ".50".
  const whole = (rawWhole === '' && dec !== undefined ? '0' : rawWhole).replace(/^0+(?=\d)/, '');

  const out = dec === undefined ? whole : `${whole}.${dec.slice(0, 2)}`;

  // Clamp rather than reject, so the field cannot hold a value the database
  // will refuse on submit with an error the user cannot act on.
  return Number(out) > MAX_AMOUNT ? String(MAX_AMOUNT) : out;
}

/** The integer actually sent. `NaN` for anything unusable, so callers can reject. */
export function toAmount(raw: string): number {
  const n = Number(sanitizeAmount(raw));
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

/** Human-readable reason an amount is unusable, or null when it is fine. */
export function amountError(raw: string, label = 'amount'): string | null {
  if (!raw.trim()) return null; // empty is "not supplied", handled by the caller
  const n = toAmount(raw);
  if (!Number.isFinite(n) || n <= 0) return `Enter a ${label} greater than zero.`;
  if (n > MAX_AMOUNT) return `The most you can enter is $${MAX_AMOUNT.toLocaleString('en-US')}.`;
  return null;
}
