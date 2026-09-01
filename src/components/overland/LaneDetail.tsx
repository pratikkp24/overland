import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import USLaneMap from './USLaneMap';
import ProfilePanel from './ProfilePanel';
import Stars from './Stars';
import { allProfiles, rateDeal, stats } from '@/lib/profiles';
import { events } from '@/lib/analytics';
import { applySeo, laneTitle, laneDescription, laneAnswers, laneJsonLd, laneSlug } from '@/lib/seo';
import { money, rpmFmt, type Lane } from '@/lib/market';
import { laneMiles } from '@/lib/usmap';
import BidderCard, { BidderDisclaimer } from './BidderCard';
import { sanitizeAmount, toAmount } from '@/lib/money';

/** Matches bids_note_len in 0002_harden.sql. */
const NOTE_MAX = 500;
import ReportModal from './ReportModal';


/**
 * Lane detail: the map, the open bids, and a counter-offer.
 *
 * Counter-offers are exchanged in-app so neither side has to reveal contact details
 * until they agree. Only on acceptance is the introduction made - which is the whole
 * product. Anything before that stays on the board.
 *
 * Offers persist to localStorage keyed by lane, so the thread survives a reload. No
 * backend yet: a real build puts these in Postgres and fires the email from a
 * server function.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const UP = '#0F7A4A';
const HAIR = 'rgba(17,17,17,.10)';

type Offer = {
  id: string;
  from: 'you' | string;      // 'you' or a carrier name
  amount: number;
  note?: string;
  at: number;
  kind: 'bid' | 'counter';
};

const seedOffers = (lane: Lane): Offer[] => {
  const base = lane.linehaul;
  return [
    { id: 'o1', from: 'Rio Grande Carriers', amount: Math.round(base * 1.02 / 5) * 5, at: Date.now() - 1000 * 60 * 42, kind: 'bid' },
    { id: 'o2', from: 'Keystone Logistics',  amount: Math.round(base * 0.99 / 5) * 5, at: Date.now() - 1000 * 60 * 26, kind: 'bid' },
    { id: 'o3', from: 'Summit Freight',      amount: Math.round(base * 0.965 / 5) * 5, at: Date.now() - 1000 * 60 * 8,  kind: 'bid' },
  ];
};

/** Bidders on the board map to profiles; the demo seeds share their names. */
const profileIdFor = (name: string) =>
  allProfiles().find((p) => p.name === name)?.id ?? null;

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
};

/**
 * How the board rate was arrived at.
 *
 * The number at the top of this panel is not a quote and not an opinion - it is
 * miles x rate per mile, and anyone about to bid against it deserves to see the
 * arithmetic rather than trust it. Showing the working is also what stops the board
 * rate reading as an offer from us: we are not a party to the deal, we are showing
 * what the lane has been paying.
 */
function RateBreakdown({ lane, best }: { lane: Lane; best: number | null }) {
  // Practical miles price the load; the map draws a road estimate from coordinates.
  // They rarely agree, and an unexplained gap between two mileage figures on the same
  // screen reads as a bug, so both are named.
  const road = laneMiles(lane.originCode, lane.destCode);
  const atAvg = Math.round((lane.avgRpm * lane.miles) / 5) * 5;
  const deltaPct = ((lane.rpm - lane.avgRpm) / lane.avgRpm) * 100;
  const bestRpm = best ? best / lane.miles : null;
  const bestDelta = best ? best - lane.linehaul : null;

  const Row = ({ label, value, sub, strong = false, color }:
    { label: string; value: string; sub?: string; strong?: boolean; color?: string }) => (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[12.5px]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
        {label}
      </span>
      <span className="text-right">
        <span className="aon-num" style={{ fontSize: strong ? 16 : 13.5, color: color ?? INK }}>{value}</span>
        {sub && (
          <span className="aon-num ml-2" style={{ fontSize: 11, color: 'rgba(17,17,17,.65)' }}>{sub}</span>
        )}
      </span>
    </div>
  );

  return (
    <div className="mt-5 rounded-[9px] p-4" style={{ background: '#FAF9F7', border: `1px solid ${HAIR}` }}>
      <span className="aon-eyebrow">How this rate is calculated</span>

      <div className="mt-2 divide-y" style={{ borderColor: HAIR }}>
        <div className="pb-1">
          <Row label="Practical miles" value={lane.miles.toLocaleString()} sub="mi" />
          <Row label={`Last paid, ${lane.equipment.toLowerCase()}`} value={`${rpmFmt(lane.rpm)}`} sub="/mi" />
          <Row label="Board rate" value={money(lane.linehaul)} sub={`${lane.miles.toLocaleString()} × ${rpmFmt(lane.rpm)}`} strong />
        </div>

        <div className="py-1">
          <Row label="30-day average" value={`${rpmFmt(lane.avgRpm)}`} sub="/mi" />
          <Row
            label="At the 30-day average this lane pays"
            value={money(atAvg)}
            sub={`${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}% today`}
            color={deltaPct >= 0 ? UP : '#DC2626'}
          />
        </div>

        {best !== null && bestRpm !== null && (
          <div className="py-1">
            <Row
              label="Best open offer"
              value={money(best)}
              sub={`${rpmFmt(bestRpm)}/mi`}
              color={UP}
            />
            <Row
              label={(bestDelta ?? 0) <= 0 ? 'Under the board rate by' : 'Over the board rate by'}
              value={money(Math.abs(bestDelta ?? 0))}
              color={(bestDelta ?? 0) <= 0 ? UP : '#DC2626'}
            />
          </div>
        )}

        <div className="pt-1">
          <Row label="Road estimate, map" value={road.toLocaleString()} sub="mi" />
        </div>
      </div>

      <p className="mt-3 text-[11.5px] leading-[1.65]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
        Linehaul only. Fuel surcharge, detention, tarps, lumper and tolls are between you
        and the carrier. Practical miles price the load; the map figure is a straight-line
        road estimate, so the two differ. This is what the lane has been paying — not a
        quote, and not an offer from Overland.
      </p>
    </div>
  );
}

/**
 * Who is behind an offer.
 *
 * We verify nobody, so the only useful thing we can do is show every self-declared
 * detail plainly, label it as self-declared, and put the real check - the FMCSA
 * register - one click away. A bid with no name attached to it is not a market, it is
 * a number, and nobody should wire a load against a number.
 */
function Bidder({ name, onOpen, onReport }: { name: string; onOpen: () => void; onReport?: () => void }) {
  const prof = useMemo(() => allProfiles().find((x) => x.name === name) ?? null, [name]);
  if (!prof) return null;
  const st = stats(prof);
  return (
    <BidderCard
      onOpenProfile={onOpen}
      onReport={onReport}
      info={{
        name: prof.name, accountType: prof.accountType, orgName: prof.orgName,
        city: prof.city, website: prof.website,
        mcNumber: prof.mcNumber, usdotNumber: prof.usdotNumber, joinedAt: prof.joinedAt,
        rating: { avg: st.avg, count: st.count, confirmed: st.confirmed, completion: st.completion },
      }}
    />
  );
}

export default function LaneDetail({ lane, onClose }: { lane: Lane; onClose: () => void }) {
  const { user, openAuth } = useAuth();
  const key = `overland.offers.${lane.id}`;

  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Offer[];
    } catch { /* ignore */ }
    return seedOffers(lane);
  });
  const [amount, setAmount] = useState(String(lane.linehaul));
  const [note, setNote] = useState('');
  const [accepted, setAccepted] = useState<Offer | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [stars, setStars] = useState<0|1|2|3|4|5>(0);
  const [feedback, setFeedback] = useState('');
  const [rated, setRated] = useState(false);
  const [reporting, setReporting] = useState<{ type: 'listing' | 'bid'; id: string } | null>(null);

  useEffect(() => { localStorage.setItem(key, JSON.stringify(offers)); }, [key, offers]);

  useEffect(() => { events.laneOpened(`${lane.origin} \u2192 ${lane.dest}`); }, [lane.origin, lane.dest]);

  /* Give the open lane its own URL and metadata. Without this the most valuable page on
     the site - what a named lane pays - is unshareable and invisible to search. */
  useEffect(() => {
    const seo = {
      originCode: lane.originCode, destCode: lane.destCode,
      origin: lane.origin, dest: lane.dest,
      miles: lane.miles, equipment: lane.equipment,
      rpm: lane.rpm, linehaul: lane.linehaul, avgRpm: lane.avgRpm,
    };
    const url = `${window.location.origin}/lane/${laneSlug(lane.originCode, lane.destCode)}`;
    const prevTitle = document.title;
    const prevPath = window.location.pathname + window.location.search;

    applySeo({ title: laneTitle(seo), description: laneDescription(seo), canonical: url, jsonLd: laneJsonLd(seo, url) });
    window.history.replaceState({}, '', `/lane/${laneSlug(lane.originCode, lane.destCode)}`);

    return () => {
      document.title = prevTitle;
      document.getElementById('ov-jsonld')?.remove();
      window.history.replaceState({}, '', prevPath);
    };
  }, [lane]);

  const answers = laneAnswers({
    originCode: lane.originCode, destCode: lane.destCode,
    origin: lane.origin, dest: lane.dest, miles: lane.miles,
    equipment: lane.equipment, rpm: lane.rpm, linehaul: lane.linehaul, avgRpm: lane.avgRpm,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const best = useMemo(
    () => offers.filter((o) => o.from !== 'you').reduce<Offer | null>((b, o) => (!b || o.amount < b.amount ? o : b), null),
    [offers],
  );

  const submitCounter = (e: React.FormEvent) => {
    e.preventDefault();
    /* Was Number(amount.replace(/[^\d]/g, '')), which deleted the decimal point
       and not the decimals: the field showed 2400.50 while 240050 was recorded. */
    const n = toAmount(amount);
    if (!n || n <= 0) return;
    setOffers((prev) => [
      ...prev,
      { id: `c${Date.now()}`, from: 'you', amount: n, note: note.trim() || undefined, at: Date.now(), kind: 'counter' },
    ]);
    setNote('');
  };

  return (
    <>
    {viewing && <ProfilePanel id={viewing} onClose={() => setViewing(null)} />}
    <div className="fixed inset-0 z-[90] overflow-y-auto" style={{ background: 'rgba(17,17,17,.45)' }} onClick={onClose}>
      <div className="mx-auto my-6 w-full max-w-[1000px] px-4" onClick={(e) => e.stopPropagation()}>
        <div className="aon-card overflow-hidden">
          {/* head */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4" style={{ borderColor: HAIR }}>
            <div>
              <span className="aon-eyebrow">{lane.equipment} · {lane.miles.toLocaleString()} mi</span>
              <h2 className="aon-display mt-1 text-[26px]">{lane.origin} → {lane.dest}</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="aon-eyebrow">Board rate</span>
                <div className="aon-num text-[22px]" style={{ color: INK }}>{money(lane.linehaul)}</div>
                <div className="aon-num text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>{rpmFmt(lane.rpm)}/mi</div>
              </div>
              <button type="button" onClick={() => setReporting({ type: 'listing', id: lane.id })} className="aon-cta aon-cta--ghost">Report load</button>
              <button type="button" onClick={onClose} className="aon-cta aon-cta--ghost">Close</button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Plain-language answers. Generative engines cannot run a bidding UI, so
                the facts have to exist as prose in the DOM, not only in the widgets. */}
            <div className="col-span-full border-b px-6 py-5" style={{ borderColor: HAIR }}>
              <h3 className="aon-display text-[15px]">
                {answers[0][0]}
              </h3>
              <p className="aon-body mt-1.5 max-w-[80ch] text-[13px] leading-[1.65]">
                {answers[0][1]}
              </p>
            </div>

            {/* map */}
            <div className="border-b p-6 lg:border-b-0 lg:border-r" style={{ borderColor: HAIR }}>
              <USLaneMap from={lane.originCode} to={lane.destCode} height={300} />
              <RateBreakdown lane={lane} best={best ? best.amount : null} />
            </div>

            {/* offers */}
            <div className="p-6">
              {accepted ? (
                <>
                  <span className="aon-eyebrow" style={{ color: UP }}>Introduced</span>
                  <h3 className="aon-display mt-2 text-[22px]">
                    You and {accepted.from} have each other&rsquo;s details.
                  </h3>
                  {/* Contact details are revealed only at this point - never before
                      both sides have agreed. */}
                  <dl className="mt-5 space-y-3 rounded-[9px] p-4" style={{ background: '#FAF9F7', border: `1px solid ${HAIR}` }}>
                    <div className="flex items-baseline justify-between">
                      <dt className="aon-eyebrow">Agreed rate</dt>
                      <dd className="aon-num text-[18px]">{money(accepted.amount)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <dt className="aon-eyebrow">Email</dt>
                      <dd className="aon-num text-[14px]">dispatch@{accepted.from.toLowerCase().replace(/[^a-z]/g, '')}.com</dd>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <dt className="aon-eyebrow">Phone</dt>
                      <dd className="aon-num text-[14px]">(214) 555-0148</dd>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <dt className="aon-eyebrow">MC / USDOT</dt>
                      <dd className="aon-num text-[14px]" style={{ color: 'rgba(17,17,17,.65)' }}>self-declared</dd>
                    </div>
                  </dl>
                  <p className="mt-5 text-[13px] leading-[1.7]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
                    Rate confirmation, insurance and payment are between the two of you.
                    Check each other on the FMCSA register before anything moves. You verify
                    emails, not businesses.
                  </p>
                  <button type="button" onClick={onClose} className="aon-cta aon-cta--dark mt-6 w-full justify-center">Back to the board</button>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="aon-eyebrow">Open offers</span>
                    {best && <span className="aon-num text-[13px]" style={{ color: UP }}>best {money(best.amount)}</span>}
                  </div>

                  <ul className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {offers.slice().sort((a, b) => a.at - b.at).map((o) => {
                      const mine = o.from === 'you';
                      return (
                        <li key={o.id} className="rounded-[9px] px-4 py-3"
                            style={{ background: mine ? 'rgba(30,77,107,.05)' : '#FAF9F7', border: `1px solid ${mine ? 'rgba(30,77,107,.18)' : HAIR}` }}>
                          <div className="flex items-center justify-between gap-3">
                            {/* The amount is public; the name is not. Masking here as well as
                                in BidderCard means the identity is gated in one consistent
                                place rather than half-leaking through the row header. */}
                            <span className="text-[14px]" style={{ fontFamily: 'Poppins, sans-serif', color: user || mine ? INK : 'rgba(17,17,17,.45)' }}>
                              {mine ? 'Your counter' : user ? o.from : 'A carrier on the board'}
                            </span>
                            <span className="aon-num text-[15px]" style={{ color: mine ? ACCENT : INK }}>{money(o.amount)}</span>
                          </div>
                          {!mine && (
                            <Bidder name={o.from} onOpen={() => { const pid = profileIdFor(o.from); if (pid) setViewing(pid); }} onReport={() => setReporting({ type: 'bid', id: o.id })} />
                          )}
                          {o.note && <p className="mt-1 break-words text-[13px]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>{o.note}</p>}
                          <div className="mt-1 flex items-center justify-between">
                            <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>{ago(o.at)}</span>
                            {/* Accepting is what unlocks contact details, so it cannot be
                                reachable without an account - otherwise the one thing we
                                hold back is handed to anyone who opens the page. */}
                            {!mine && (
                              <button
                                type="button"
                                onClick={() => (user ? setAccepted(o) : openAuth('shipper'))}
                                className="aon-eyebrow"
                                style={{ color: ACCENT }}
                              >
                                {user ? 'Accept and connect →' : 'Sign in to accept →'}
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <BidderDisclaimer />

                  <form onSubmit={submitCounter} className="mt-5 border-t pt-5" style={{ borderColor: HAIR }}>
                    <label className="aon-eyebrow block" htmlFor="ov-amt">Counter with</label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="ov-amt" inputMode="numeric" value={amount}
                        onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
                        className="aon-num w-[140px] rounded-[10px] px-3 py-2 text-[15px] outline-none"
                        style={{ background: '#FAF9F7', border: `1px solid ${HAIR}` }}
                      />
                      <input
                        value={note} maxLength={NOTE_MAX}
                        onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                        placeholder="Optional note — dates, tarps, detention…"
                        className="flex-1 rounded-[10px] px-3 py-2 text-[14px] outline-none"
                        style={{ fontFamily: 'Poppins, sans-serif', background: '#FAF9F7', border: `1px solid ${HAIR}` }}
                      />
                    </div>
                    <button type="submit" className="aon-cta aon-cta--dark mt-3 w-full justify-center">
                      Send counter{user ? '' : ' (sign in first)'}
                    </button>
                    <p className="mt-3 text-[12px] leading-[1.6]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
                      Counters stay on the board. Nobody sees your contact details until
                      one of you accepts.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {reporting && (
        <ReportModal subjectType={reporting.type} subjectId={reporting.id} onClose={() => setReporting(null)} />
      )}
    </div>
    </>
  );
}
