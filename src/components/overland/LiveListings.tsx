import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { sanitizeAmount, toAmount, amountError } from '@/lib/money';

/** Matches bids_notes_len in 0002_harden.sql. */
const NOTE_MAX = 500;
import { fetchListings, fetchBids, placeBid, getPublicProfiles, isLive, type Listing, type Bid, type PublicProfile } from '@/lib/db';
import BidderCard, { BidderDisclaimer } from './BidderCard';
import { money } from '@/lib/market';
import PostListing from './PostListing';

/**
 * Real listings, from the database.
 *
 * Separate from the rate index above it: that is a simulated market read, this is what
 * people have actually posted. Keeping them visually distinct matters - a user must
 * never be unable to tell demo data from a real load they could bid on.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';
const DANGER = '#DC2626';

type Row = Listing & { bids: Bid[]; best: number | null };

export default function LiveListings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [kind, setKind] = useState<'all' | 'load' | 'truck'>('all');
  const [mineOnly, setMineOnly] = useState(false);
  const [posting, setPosting] = useState(false);
  const [bidding, setBidding] = useState<Row | null>(null);
  const [openBids, setOpenBids] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLive()) { setLoading(false); return; }
    try {
      setErr(null);
      const ls = await fetchListings();
      const withBids = await Promise.all(
        ls.map(async (l) => {
          const bids = await fetchBids(l.id).catch(() => [] as Bid[]);
          const open = bids.filter((b) => b.status !== 'withdrawn');
          return { ...l, bids: open, best: open.length ? Math.min(...open.map((b) => b.amount)) : null };
        }),
      );
      setRows(withBids);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load listings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(
    () => rows.filter((r) => (kind === 'all' || r.kind === kind) && (!mineOnly || r.owner_id === user?.id)),
    [rows, kind, mineOnly, user?.id],
  );

  const chip = (on: boolean) => ({
    background: on ? INK : 'transparent',
    color: on ? '#FAF9F7' : 'rgba(17,17,17,.55)',
    border: `1px solid ${on ? INK : HAIR}`,
  });

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="aon-eyebrow" style={{ color: ACCENT }}>Posted by people · live</span>
          <h2 className="aon-display mt-2 text-[clamp(24px,3vw,34px)]">Open listings</h2>
        </div>
        <button type="button" onClick={() => setPosting(true)} className="aon-cta aon-cta--dark">+ Post</button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([['all','Everything'],['load','Freight'],['truck','Trucks']] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)}
                  className="aon-eyebrow rounded-full px-4 py-2" style={chip(kind === k)}>
            {label}
          </button>
        ))}
        {user && (
          <button type="button" onClick={() => setMineOnly((m) => !m)}
                  className="aon-eyebrow rounded-full px-4 py-2" style={chip(mineOnly)}>
            Mine
          </button>
        )}
        <span className="aon-num ml-auto text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
          {shown.length} listing{shown.length === 1 ? '' : 's'}
        </span>
      </div>

      {err && (
        <p className="mt-6 text-[13px]" role="alert" style={{ fontFamily: 'Poppins, sans-serif', color: DANGER }}>
          {err}
        </p>
      )}

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0,1,2].map((i) => (
            <div key={i} className="h-[76px] rounded-[9px]" style={{ background: 'rgba(17,17,17,.04)' }} />
          ))}
        </div>
      ) : shown.length === 0 ? (
        /* An empty board is the normal state on day one. Say so, and give the one
           action that fixes it, rather than showing a shrug. */
        <div className="mt-6 rounded-[9px] p-10 text-center" style={{ background: '#FFFFFF', border: `1px dashed ${HAIR}` }}>
          <p className="aon-display text-[20px]">
            {mineOnly ? 'You have not posted anything yet.' : 'Nothing posted yet.'}
          </p>
          <p className="aon-body mx-auto mt-2 max-w-[42ch] text-[14px] leading-[1.65]">
            {mineOnly
              ? 'Post a load or a truck and it appears here with any bids against it.'
              : 'The board is new. Post the first load or truck and it goes live for everyone immediately.'}
          </p>
          <button type="button" onClick={() => setPosting(true)} className="aon-cta aon-cta--dark mt-6">
            Post the first one
          </button>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {shown.map((r) => {
            const mine = r.owner_id === user?.id;
            return (
              <li key={r.id} className="rounded-[9px] p-5" style={{ background: '#FFFFFF', border: `1px solid ${HAIR}` }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="aon-eyebrow" style={{ fontSize: 9, color: r.kind === 'load' ? ACCENT : 'rgba(17,17,17,.65)' }}>
                        {r.kind === 'load' ? 'Freight' : 'Truck'}
                      </span>
                      <span className="aon-eyebrow" style={{ fontSize: 9 }}>{r.equipment}</span>
                      {mine && <span className="aon-eyebrow" style={{ fontSize: 9, color: ACCENT }}>Yours</span>}
                    </div>
                    <h3 className="aon-display mt-1.5 text-[19px]">{r.origin} → {r.dest}</h3>
                    <p className="aon-num mt-1 text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
                      {r.miles.toLocaleString()} mi
                      {r.ready_date ? ` · ready ${r.ready_date}` : ''}
                      {r.target_rate ? ` · asking ${money(r.target_rate)}` : ' · open to bids'}
                    </p>
                    {r.notes && <p className="aon-body mt-1.5 text-[13px]">{r.notes}</p>}
                  </div>

                  <div className="text-right">
                    <span className="aon-eyebrow" style={{ fontSize: 9 }}>Best bid</span>
                    <div className="aon-num text-[20px]" style={{ color: r.best ? ACCENT : 'rgba(17,17,17,.65)' }}>
                      {r.best ? money(r.best) : '—'}
                    </div>
                    {r.bids.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setOpenBids(openBids === r.id ? null : r.id)}
                        className="aon-eyebrow"
                        style={{ fontSize: 9, color: ACCENT }}
                        aria-expanded={openBids === r.id}
                      >
                        {r.bids.length} bid{r.bids.length === 1 ? '' : 's'} {openBids === r.id ? '\u2191' : '\u2193'}
                      </button>
                    ) : (
                      <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>no bids yet</span>
                    )}
                    {!mine && (
                      <button type="button" onClick={() => setBidding(r)} className="aon-cta aon-cta--dark mt-3 w-full justify-center">
                        Place a bid
                      </button>
                    )}
                  </div>
                </div>

                {openBids === r.id && <OffersList row={r} />}
              </li>
            );
          })}
        </ul>
      )}

      {posting && <PostListing onClose={() => setPosting(false)} onPosted={load} />}
      {bidding && <BidSheet row={bidding} onClose={() => setBidding(null)} onDone={() => { setBidding(null); load(); }} />}
    </section>
  );
}

/* --------------------------------------------------------------- offers */

/**
 * Every bid on a listing, with who is behind it.
 *
 * Bids are public on this board by design - that is the product - so this is shown to
 * everyone, not only the poster. Seeing a name, a DOT number and a SAFER link next to
 * a number is the difference between a market and a wall of anonymous prices.
 *
 * Contact details are not here and must never be: they unlock on acceptance.
 */
function OffersList({ row }: { row: Row }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let off = false;
    getPublicProfiles(row.bids.map((b) => b.bidder_id))
      .then((p) => { if (!off) setProfiles(p); })
      .catch(() => { /* names are a nicety; the amounts still render */ })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [row.bids]);

  const sorted = [...row.bids].sort((a, b) => a.amount - b.amount);
  const ask = row.target_rate;

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: HAIR }}>
      <div className="flex items-baseline justify-between">
        <span className="aon-eyebrow">Offers on this {row.kind === 'load' ? 'load' : 'truck'}</span>
        <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>
          lowest first
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {sorted.map((b) => {
          const p = profiles[b.bidder_id];
          const rpm = row.miles ? b.amount / row.miles : 0;
          const delta = ask ? b.amount - ask : null;
          return (
            <li key={b.id} className="rounded-[9px] px-4 py-3"
                style={{ background: '#FAF9F7', border: `1px solid ${HAIR}` }}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[14px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {!user ? 'A carrier on the board' : p ? (p.org_name || p.name) : loading ? 'Loading\u2026' : 'A carrier on the board'}
                </span>
                <span className="text-right">
                  <span className="aon-num text-[15px]">{money(b.amount)}</span>
                  {rpm > 0 && (
                    <span className="aon-num ml-2" style={{ fontSize: 11, color: 'rgba(17,17,17,.65)' }}>
                      ${rpm.toFixed(2)}/mi
                    </span>
                  )}
                </span>
              </div>

              {delta !== null && (
                <span className="aon-num" style={{ fontSize: 11, color: delta <= 0 ? '#0F7A4A' : DANGER }}>
                  {delta <= 0 ? `${money(Math.abs(delta))} under asking` : `${money(delta)} over asking`}
                </span>
              )}

              {b.note && (
                <p className="mt-1 text-[13px]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
                  {b.note}
                </p>
              )}

              {p && (
                <BidderCard
                  info={{
                    name: p.name, accountType: p.account_type, orgName: p.org_name,
                    city: p.city, website: p.website,
                    mcNumber: p.mc_number, usdotNumber: p.usdot_number,
                    joinedAt: p.created_at ? Date.parse(p.created_at) : null,
                    rating: null,
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>

      <BidderDisclaimer />
    </div>
  );
}

/* ------------------------------------------------------------------ bid */

function BidSheet({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: () => void }) {
  const { user, openAuth } = useAuth();
  const [amount, setAmount] = useState(String(row.target_rate ?? Math.round(row.miles * 2.2)));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rpm = Number(amount) && row.miles ? Number(amount) / row.miles : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onClose(); openAuth('carrier'); return; }
    const problem = amountError(amount, 'bid');
    if (problem) { setErr(problem); return; }
    const n = toAmount(amount);
    if (!n || n <= 0) { setErr('Enter an amount.'); return; }
    setBusy(true); setErr(null);
    try {
      await placeBid(row.id, user.id, n, note.trim() || undefined);
      onDone();
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : 'Could not place the bid.';
      if (msg.includes('P0001') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('limit')) {
        setErr('Hourly limit reached (maximum 60 bids per hour).');
      } else if (msg.toLowerCase().includes('own listing') || msg.toLowerCase().includes('self')) {
        setErr('You cannot bid on your own listing.');
      } else if (msg.toLowerCase().includes('note')) {
        setErr('Note must be under 500 characters.');
      } else if (msg.toLowerCase().includes('amount')) {
        setErr('Bid amount must be between $1 and $1,000,000.');
      } else {
        setErr(msg);
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center"
         style={{ background: 'rgba(17,17,17,.45)' }} onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-t-[16px] bg-white p-7 sm:rounded-[9px]"
           onClick={(e) => e.stopPropagation()}>
        <span className="aon-eyebrow" style={{ color: ACCENT }}>Place a bid</span>
        <h2 className="aon-display mt-2 text-[22px]">{row.origin} → {row.dest}</h2>
        <p className="aon-num mt-1 text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
          {row.miles.toLocaleString()} mi · {row.equipment}
          {row.best ? ` · best so far ${money(row.best)}` : ''}
        </p>

        <form onSubmit={submit} className="mt-5">
          <label className="aon-eyebrow block" htmlFor="ov-bid">Your bid</label>
          <input id="ov-bid" inputMode="numeric" value={amount}
                 onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                 className="aon-num mt-2 w-full rounded-[9px] px-4 py-3 text-[17px] outline-none"
                 style={{ background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }} />
          {rpm > 0 && (
            <p className="aon-num mt-1.5 text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
              ${rpm.toFixed(2)} per mile
            </p>
          )}

          <label className="aon-eyebrow mt-4 block" htmlFor="ov-bidnote">Note</label>
          <input id="ov-bidnote" value={note} maxLength={NOTE_MAX}
                 onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                 placeholder="Dates, equipment, anything they should know"
                 className="mt-2 w-full rounded-[9px] px-4 py-3 text-[14px] outline-none"
                 style={{ fontFamily: 'Poppins, sans-serif', background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }} />

          {err && <p className="mt-4 text-[13px]" role="alert"
                     style={{ fontFamily: 'Poppins, sans-serif', color: DANGER }}>{err}</p>}

          <button type="submit" disabled={busy} className="aon-cta aon-cta--dark mt-6 w-full justify-center"
                  style={{ opacity: busy ? 0.5 : 1 }}>
            {busy ? 'Placing…' : user ? 'Place bid' : 'Sign in to bid'}
          </button>
          <p className="aon-body mt-3 text-[12px] leading-[1.6]">
            Your bid is visible to everyone. Contact details are exchanged only if they
            accept.
          </p>
        </form>
      </div>
    </div>
  );
}
