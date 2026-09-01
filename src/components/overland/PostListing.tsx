import { sanitizeAmount, toAmount, amountError, MAX_AMOUNT } from '@/lib/money';
import React, { useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { CITIES, laneMiles } from '@/lib/usmap';
import { money } from '@/lib/market';
import { isLive, createListing } from '@/lib/db';

/**
 * Post a load or a truck.
 *
 * The action the whole board exists for. Origin and destination are picked from the
 * known city list so mileage is computed rather than typed - a self-reported mileage
 * is the first thing people argue about, and rate-per-mile is meaningless without it.
 *
 * Writes to Supabase when the migration has been run; otherwise queues locally and
 * says so, rather than pretending the listing is public.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';
const DANGER = '#DC2626';

/* The common three, then anything. Freight equipment has a long tail - step deck,
   conestoga, power only, hotshot, tanker - and a fixed list turns those people away
   at the one moment they were ready to post. */
const EQUIPMENT = [
  'Dry van', 'Reefer', 'Flatbed', 'Step deck', 'Conestoga',
  'Power only', 'Hotshot', 'Box truck', 'Sprinter van', 'Tanker',
  'Car hauler', 'Lowboy / RGN', 'Dump', 'Intermodal container',
];
/** Matches listings_notes_len in 0002_harden.sql. */
const NOTES_MAX = 500;
const OTHER = '__other__';
const LOCAL_KEY = 'overland.mylistings.v1';

export type Draft = {
  kind: 'load' | 'truck';
  origin_code: string; dest_code: string;
  equipment: string; ready_date: string;
  target_rate: number | null; notes: string;
};

export default function PostListing({ onClose, onPosted }: { onClose: () => void; onPosted?: () => void }) {
  const { user } = useAuth();
  const [kind, setKind] = useState<'load' | 'truck'>(user?.role === 'carrier' ? 'truck' : 'load');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [equipment, setEquipment] = useState(EQUIPMENT[0]);
  const [customEquip, setCustomEquip] = useState('');
  const [ready, setReady] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const codes = useMemo(() => Object.keys(CITIES).sort((a, b) => CITIES[a].name.localeCompare(CITIES[b].name)), []);
  const miles = from && to && from !== to ? laneMiles(from, to) : 0;
  const rpm = miles && Number(rate) ? Number(rate) / miles : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!from || !to) return setErr('Pick an origin and a destination.');
    if (from === to) return setErr('Origin and destination cannot be the same.');
    const rateProblem = amountError(rate, 'rate');
    if (rateProblem) return setErr(rateProblem);
    if (equipment === OTHER && !customEquip.trim()) return setErr('Name the equipment you need.');

    setBusy(true);
    const row = {
      kind,
      origin: CITIES[from].name, origin_code: from,
      dest: CITIES[to].name, dest_code: to,
      miles,
      equipment: equipment === OTHER ? customEquip.trim() : equipment,
      ready_date: ready || null,
      target_rate: rate ? toAmount(rate) : null,
      notes: notes.trim() || null,
    };

    try {
      if (isLive()) {
        /* Never fall through to local storage while a real backend is configured.
           The old condition was `isLive() && user`, so a missing session sent the
           listing to localStorage and still reported success - the poster saw
           "it is on the board" for a row that existed only in their browser. */
        if (!user) throw new Error('Your session expired. Sign in again and repost.');
        await createListing({ ...row, owner_id: user.id });
      } else {
        // No database configured: keep it locally so the flow is testable, and say so.
        const mine = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        mine.unshift({ ...row, id: `local-${Date.now()}`, created_at: new Date().toISOString() });
        localStorage.setItem(LOCAL_KEY, JSON.stringify(mine));
      }
      setDone(true);
      onPosted?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not post. Try again.';
      if (msg.includes('P0001') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('limit')) {
        setErr('Hourly rate limit reached (maximum 20 listings per hour).');
      } else if (msg.includes('target_rate') || msg.includes('listings_target_rate')) {
        setErr(`The target rate must be between $1 and $${MAX_AMOUNT.toLocaleString('en-US')}.`);
      } else if (msg.toLowerCase().includes('notes')) {
        setErr('Notes must be under 500 characters.');
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-2 w-full rounded-[9px] px-3 py-2.5 text-[14px] outline-none';
  const sty = { fontFamily: 'Poppins, sans-serif', background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: 'rgba(17,17,17,.45)' }} onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-[520px] px-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative rounded-[9px] bg-white p-7" style={{ border: `1px solid ${HAIR}` }}
             role="dialog" aria-modal="true" aria-labelledby="post-listing-title">
          <button type="button" onClick={onClose} aria-label="Close"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(17,17,17,.06)]"
                  style={{ color: 'rgba(17,17,17,.65)', fontSize: 20, lineHeight: 1 }}>×</button>

          {done ? (
            <>
              <span className="aon-eyebrow" style={{ color: ACCENT }}>Posted</span>
              <h2 id="post-listing-title" className="aon-display mt-2 text-[24px]">
                {CITIES[from].name} → {CITIES[to].name}
              </h2>
              <p className="aon-body mt-4 text-[14px] leading-[1.7]">
                {isLive()
                  ? 'It is on the board. You will be emailed when someone bids.'
                  : 'Saved on this device only. The shared database has not been set up yet, so nobody else can see it.'}
              </p>
              <button type="button" onClick={onClose} className="aon-cta aon-cta--dark mt-6 w-full justify-center">Done</button>
            </>
          ) : (
            <>
              <span className="aon-eyebrow" style={{ color: ACCENT }}>New listing</span>
              <h2 className="aon-display mt-2 text-[24px]">What are you posting?</h2>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {(['load', 'truck'] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setKind(k)}
                          className="rounded-[9px] px-3 py-2.5 text-[13px]"
                          style={{ fontFamily: 'Poppins, sans-serif',
                                   background: kind === k ? INK : 'rgba(17,17,17,.04)',
                                   color: kind === k ? '#FAF9F7' : 'rgba(17,17,17,.6)' }}>
                    {k === 'load' ? 'Freight to move' : 'A truck with space'}
                  </button>
                ))}
              </div>

              <form onSubmit={submit}>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="aon-eyebrow block" htmlFor="ov-from">From</label>
                    <select id="ov-from" value={from} onChange={(e) => setFrom(e.target.value)} className={field} style={sty}>
                      <option value="">—</option>
                      {codes.map((c) => <option key={c} value={c}>{CITIES[c].name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="aon-eyebrow block" htmlFor="ov-to">To</label>
                    <select id="ov-to" value={to} onChange={(e) => setTo(e.target.value)} className={field} style={sty}>
                      <option value="">—</option>
                      {codes.map((c) => <option key={c} value={c}>{CITIES[c].name}</option>)}
                    </select>
                  </div>
                </div>

                {equipment === OTHER && (
                  <>
                    <label className="aon-eyebrow mt-4 block" htmlFor="ov-eq-custom">Equipment needed</label>
                    <input id="ov-eq-custom" value={customEquip} onChange={(e) => setCustomEquip(e.target.value)}
                           className={field} style={sty} placeholder="Double drop, curtainside, flatbed with moffett…" />
                  </>
                )}

                {miles > 0 && (
                  <p className="aon-num mt-2 text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
                    {miles.toLocaleString()} mi{rpm ? ` · ${'$' + rpm.toFixed(2)}/mi` : ''}
                  </p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="aon-eyebrow block" htmlFor="ov-eq">Equipment</label>
                    <select id="ov-eq" value={equipment} onChange={(e) => setEquipment(e.target.value)} className={field} style={sty}>
                      {EQUIPMENT.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
                      <option value={OTHER}>Something else…</option>
                    </select>
                  </div>
                  <div>
                    <label className="aon-eyebrow block" htmlFor="ov-ready">Ready</label>
                    <input id="ov-ready" type="date" value={ready} onChange={(e) => setReady(e.target.value)}
                           /* A listing ready before today reads as stale the moment it
                              is posted; the board had one dated yesterday. */
                           min={new Date().toISOString().slice(0, 10)}
                           className={field} style={sty} />
                  </div>
                </div>

                <label className="aon-eyebrow mt-4 block" htmlFor="ov-rate">
                  {kind === 'load' ? 'Target rate (optional)' : 'Asking rate (optional)'}
                </label>
                <input id="ov-rate" inputMode="numeric" value={rate}
                       onChange={(e) => setRate(sanitizeAmount(e.target.value))}
                       className={field} style={sty} placeholder={miles ? String(Math.round(miles * 2.2)) : '2400'} />
                {!rate && (
                  <p className="aon-body mt-1 text-[12px]">
                    Leave blank to let the board price it. {miles ? `Similar lanes run around ${money(Math.round(miles * 2.2))}.` : ''}
                  </p>
                )}

                <label className="aon-eyebrow mt-4 block" htmlFor="ov-notes">Notes</label>
                <input id="ov-notes" value={notes} maxLength={NOTES_MAX}
                       onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX))}
                       className={field} style={sty} placeholder="Tarps, appointment times, weight…" />

                {err && <p className="mt-4 text-[13px]" role="alert"
                           style={{ fontFamily: 'Poppins, sans-serif', color: DANGER }}>{err}</p>}

                <button type="submit" disabled={busy} className="aon-cta aon-cta--dark mt-6 w-full justify-center"
                        style={{ opacity: busy ? 0.5 : 1 }}>
                  {busy ? 'Posting…' : kind === 'load' ? 'Post this load' : 'Post this truck'}
                </button>

                <p className="aon-body mt-3 text-[12px] leading-[1.6]">
                  Anyone on the board can see it and bid. Your contact details stay hidden
                  until you accept a bid.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
