import React, { useMemo, useState } from 'react';
import Stars from './Stars';
import { getProfile, stats, ago, type Profile } from '@/lib/profiles';

/**
 * Counterparty profile.
 *
 * Opened from a bid, because that is the moment the question "who is this?" actually
 * arises. Shows the only things that matter on an unvetted board: how long they have
 * been here, what other people said, and whether their deals actually completed.
 *
 * MC and USDOT are shown as entered, labelled unverified, with a direct FMCSA lookup -
 * we surface the claim and let the reader check it.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

export default function ProfilePanel({ id, onClose }: { id: string; onClose: () => void }) {
  const p = useMemo<Profile | null>(() => getProfile(id), [id]);
  const [tab, setTab] = useState<'reviews' | 'activity'>('reviews');

  /* Returning null here meant the panel opened onto nothing: the click registered, the
     overlay never appeared, and there was no way to tell a missing profile from a dead
     button. Anyone who signed up through the database has no local profile row, so this
     was the normal case, not the edge case. */
  if (!p) {
    return (
      <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: 'rgba(17,17,17,.45)' }} onClick={onClose}>
        <div className="mx-auto my-6 w-full max-w-[420px] px-4" onClick={(e) => e.stopPropagation()}>
          <div className="rounded-[9px] bg-white p-7" style={{ border: `1px solid ${HAIR}` }}>
            <span className="aon-eyebrow" style={{ color: ACCENT }}>Profile</span>
            <h2 className="aon-display mt-2 text-[22px]">Nothing public yet.</h2>
            <p className="aon-body mt-3 text-[14px] leading-[1.7]">
              This member has not completed a deal on Overland, so there is no rating or
              history to show. Check their MC or USDOT number on the FMCSA register before
              you agree to anything.
            </p>
            <a href="https://safer.fmcsa.dot.gov/CompanySnapshot.aspx"
               target="_blank" rel="noopener noreferrer nofollow"
               className="aon-cta aon-cta--ghost mt-5 w-full justify-center">
              Open FMCSA SAFER ↗
            </a>
            <button type="button" onClick={onClose} className="aon-cta aon-cta--dark mt-3 w-full justify-center">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = stats(p);
  const fmcsa = p.usdotNumber
    ? `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${p.usdotNumber}`
    : 'https://safer.fmcsa.dot.gov/CompanySnapshot.aspx';

  return (
    <div className="fixed inset-0 z-[95] overflow-y-auto" style={{ background: 'rgba(17,17,17,.45)' }} onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-[560px] px-4" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-[9px] bg-white" style={{ border: `1px solid ${HAIR}` }}>

          <div className="flex items-start justify-between gap-4 p-6" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <div className="min-w-0">
              <span className="aon-eyebrow">
                {p.accountType === 'company' ? 'Company' : 'Individual'} ·{' '}
                {p.role === 'carrier' ? 'Carrier' : 'Shipper'}
              </span>
              <h2 className="aon-display mt-1.5 truncate text-[26px]">{p.name}</h2>
              <p className="aon-body mt-1 text-[13px]">{p.city} · on the board {s.monthsOn} months</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close"
                    className="shrink-0 text-[20px] leading-none" style={{ color: 'rgba(17,17,17,.65)' }}>×</button>
          </div>

          {/* the three numbers that matter */}
          <dl className="grid grid-cols-3" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <div className="p-5">
              <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Rating</dt>
              <dd className="mt-1.5 flex items-center gap-2">
                <span className="aon-num text-[20px]" style={{ color: INK }}>{s.count ? s.avg : '—'}</span>
                {!!s.count && <Stars value={s.avg} />}
              </dd>
              <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>
                {s.count} review{s.count === 1 ? '' : 's'}
              </span>
            </div>
            <div className="p-5" style={{ borderLeft: `1px solid ${HAIR}` }}>
              <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Completed</dt>
              <dd className="aon-num mt-1.5 text-[20px]" style={{ color: INK }}>{s.confirmed}</dd>
            </div>
            <div className="p-5" style={{ borderLeft: `1px solid ${HAIR}` }}>
              <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Went through</dt>
              <dd className="aon-num mt-1.5 text-[20px]" style={{ color: s.completion !== null && s.completion < 80 ? '#DC2626' : INK }}>
                {s.completion !== null ? `${s.completion}%` : '—'}
              </dd>
              {s.completion === null && (
                <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>too few deals</span>
              )}
            </div>
          </dl>

          {/* self-declared authority */}
          <div className="p-6" style={{ borderBottom: `1px solid ${HAIR}` }}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span><span className="aon-eyebrow" style={{ fontSize: 9 }}>MC </span>
                <span className="aon-num text-[14px]">{p.mcNumber ?? '—'}</span></span>
              <span><span className="aon-eyebrow" style={{ fontSize: 9 }}>USDOT </span>
                <span className="aon-num text-[14px]">{p.usdotNumber ?? '—'}</span></span>
            </div>
            <p className="aon-body mt-3 text-[12px] leading-[1.6]">
              Entered by the user and not checked by us.{' '}
              <a href={fmcsa} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: ACCENT }}>
                Look them up on FMCSA
              </a>{' '}before you move anything.
            </p>
          </div>

          <div className="flex gap-1 px-6 pt-4">
            {(['reviews', 'activity'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                      className="aon-eyebrow rounded-full px-3 py-1.5"
                      style={{ background: tab === t ? INK : 'transparent', color: tab === t ? '#FAF9F7' : 'rgba(17,17,17,.62)' }}>
                {t === 'reviews' ? `Reviews (${p.ratings.length})` : `Activity (${p.deals.length})`}
              </button>
            ))}
          </div>

          <div className="max-h-[300px] overflow-y-auto p-6 pt-4">
            {tab === 'reviews' ? (
              p.ratings.length ? (
                <ul className="space-y-4">
                  {p.ratings.map((r) => (
                    <li key={r.id} className="pb-4" style={{ borderBottom: `1px solid ${HAIR}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[14px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{r.fromName}</span>
                        <Stars value={r.stars} size={13} />
                      </div>
                      {r.note && <p className="aon-body mt-1.5 text-[13px] leading-[1.6]">{r.note}</p>}
                      <span className="aon-eyebrow mt-1 block" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>{ago(r.at)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="aon-body text-[13px]">No reviews yet. Nobody has completed a deal with them on the board.</p>
            ) : (
              p.deals.length ? (
                <ul className="space-y-3">
                  {p.deals.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{d.lane}</div>
                        <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>{ago(d.at)}</span>
                      </div>
                      <span className="aon-eyebrow shrink-0" style={{ color: d.status === 'confirmed' ? '#0F7A4A' : d.status === 'fell-through' ? '#DC2626' : 'rgba(17,17,17,.4)' }}>
                        {d.status === 'confirmed' ? 'Completed' : d.status === 'fell-through' ? 'Fell through' : 'Awaiting'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="aon-body text-[13px]">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
