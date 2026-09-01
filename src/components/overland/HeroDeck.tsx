import React from 'react';
import { buildLanes, rpmFmt, type Lane } from '@/lib/market';
import Logo from './Logo';

/**
 * The product, shown rather than described.
 *
 * This is a screenshot of the board, in a phone. Not a decorative panel with a
 * rate in it — the proportions, the status bar, the header and the tab bar are
 * all the real thing, because a visitor decides whether software is worth their
 * time by looking at it for about a second.
 *
 * The featured card at the top turns over on its own: a few regions, and the
 * diesel price. Diesel is the only measured number anywhere in this product, so
 * its card names the EIA, the week, and the mpg assumption behind the per-mile
 * figure. The lane cards say "Modelled". That distinction is the whole argument
 * and it has to survive being put on something people will screenshot.
 *
 * If the diesel feed is unavailable the card drops out of the rotation rather
 * than rendering empty.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const PAPER = '#FAF9F7';
const HAIR = 'rgba(17,17,17,.10)';
const POSITIVE = '#0F7A4A';
const WARM = '#A8412F';

/** Which part of the country a lane reads as, for the card's eyebrow. */
const REGION: Record<string, string> = {
  LAX: 'West', PHX: 'Southwest', SEA: 'Northwest', SLC: 'Mountain',
  DFW: 'Texas', HOU: 'Gulf', ATL: 'Southeast', MIA: 'Southeast',
  CHI: 'Midwest', DTW: 'Great Lakes', MCI: 'Plains', MEM: 'Mid-South',
  EWR: 'Northeast', CLT: 'Southeast', DEN: 'Mountain', LAS: 'Southwest',
};
const regionOf = (code: string) => REGION[code] ?? 'National';

type Diesel = {
  week: string;
  usdPerGallon: number;
  changeWeek: number | null;
  usdPerMile: number;
  mpgAssumed: number;
};

type Card = { kind: 'lane'; lane: Lane } | { kind: 'diesel'; d: Diesel };

const weekLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

/* ---------------------------------------------------------------- phone chrome */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-3.5 pb-1 pt-2.5">
      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: 11, color: INK }}>
        9:41
      </span>
      <span className="flex items-center gap-1" aria-hidden>
        <svg width="15" height="10" viewBox="0 0 15 10" fill={INK}>
          <rect x="0" y="7" width="2.4" height="3" rx=".6" />
          <rect x="3.7" y="5" width="2.4" height="5" rx=".6" />
          <rect x="7.4" y="2.7" width="2.4" height="7.3" rx=".6" />
          <rect x="11.1" y="0" width="2.4" height="10" rx=".6" />
        </svg>
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round">
          <path d="M1 3.2a8 8 0 0 1 11 0" />
          <path d="M3.2 5.6a5 5 0 0 1 6.6 0" />
          <circle cx="6.5" cy="8.3" r=".9" fill={INK} stroke="none" />
        </svg>
        <svg width="20" height="10" viewBox="0 0 20 10">
          <rect x="0.5" y="0.5" width="16" height="9" rx="2.4" fill="none" stroke={INK} strokeOpacity=".4" />
          <rect x="2" y="2" width="12" height="6" rx="1.4" fill={INK} />
          <path d="M18 3.6v2.8a1.6 1.6 0 0 0 0-2.8Z" fill={INK} fillOpacity=".4" />
        </svg>
      </span>
    </div>
  );
}

function TabBar() {
  const tabs = [
    { k: 'Board', on: true, d: 'M3 5.5h14M3 10h14M3 14.5h9' },
    { k: 'Post', on: false, d: 'M10 4v12M4 10h12' },
    { k: 'Lanes', on: false, d: 'M4 15l12-10' },
    { k: 'You', on: false, d: 'M10 9.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2ZM4.5 16c.9-2.6 3-4 5.5-4s4.6 1.4 5.5 4' },
  ];
  return (
    <div className="flex items-center justify-around px-2 pb-1 pt-2"
         style={{ borderTop: `1px solid ${HAIR}`, background: '#FFFFFF' }}>
      {tabs.map((t) => (
        <span key={t.k} className="flex flex-col items-center gap-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
               stroke={t.on ? INK : 'rgba(17,17,17,.5)'} strokeWidth="1.5" strokeLinecap="round">
            <path d={t.d} />
          </svg>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 8.5,
                         color: t.on ? INK : 'rgba(17,17,17,.62)' }}>
            {t.k}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- the featured card */

function LaneCard({ lane }: { lane: Lane }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="aon-eyebrow" style={{ fontSize: 8.5 }}>{regionOf(lane.originCode)}</span>
        <span className="aon-eyebrow" style={{ fontSize: 8.5, color: 'rgba(17,17,17,.62)' }}>Modelled</span>
      </div>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="aon-num text-[19px]" style={{ color: INK }}>{lane.originCode}</span>
        <span className="text-[13px]" style={{ color: 'rgba(17,17,17,.4)' }}>→</span>
        <span className="aon-num text-[19px]" style={{ color: INK }}>{lane.destCode}</span>
      </div>
      <p className="aon-body mt-0.5 text-[10.5px]">
        {lane.miles.toLocaleString('en-US')} mi · {lane.equipment}
      </p>

      <div className="mt-2.5 flex items-end justify-between">
        <span className="aon-num text-[27px]" style={{ color: ACCENT }}>{rpmFmt(lane.rpm)}</span>
        <span className="aon-eyebrow" style={{ fontSize: 8.5 }}>per mile</span>
      </div>
    </>
  );
}

function DieselCard({ d }: { d: Diesel }) {
  const up = (d.changeWeek ?? 0) >= 0;
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="aon-eyebrow" style={{ fontSize: 8.5, color: POSITIVE }}>Measured</span>
        <span className="aon-eyebrow" style={{ fontSize: 8.5, color: 'rgba(17,17,17,.62)' }}>EIA</span>
      </div>

      <p className="aon-eyebrow mt-2.5" style={{ fontSize: 8.5 }}>Diesel, national average</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="aon-num text-[27px]" style={{ color: INK }}>${d.usdPerGallon.toFixed(2)}</span>
        <span className="aon-body text-[10.5px]">per gallon</span>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="aon-num text-[12px] whitespace-nowrap" style={{ color: up ? WARM : POSITIVE }}>
          {up ? '▲' : '▼'} ${Math.abs(d.changeWeek ?? 0).toFixed(3)}/wk
        </span>
        <span className="aon-num text-[12px] whitespace-nowrap" style={{ color: INK }}>
          ${d.usdPerMile.toFixed(2)}/mi
        </span>
      </div>
      <p className="aon-body mt-1 text-[8.5px] whitespace-nowrap">
        Fuel per mile · week of {weekLabel(d.week)} · {d.mpgAssumed} mpg
      </p>
    </>
  );
}

/* -------------------------------------------------------------------- the phone */

export default function HeroDeck() {
  const lanes = React.useMemo(() => buildLanes(), []);
  const [diesel, setDiesel] = React.useState<Diesel | null>(null);
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    let off = false;
    fetch('/api/diesel')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Diesel) => { if (!off && typeof j?.usdPerGallon === 'number') setDiesel(j); })
      .catch(() => { /* the card simply drops out of the rotation */ });
    return () => { off = true; };
  }, []);

  /* One card per region, so the rotation reads as a tour of the country rather
     than five variations on the same corridor. */
  const cards = React.useMemo<Card[]>(() => {
    const seen = new Set<string>();
    const picked: Card[] = [];
    for (const lane of lanes) {
      const r = regionOf(lane.originCode);
      if (seen.has(r)) continue;
      seen.add(r);
      picked.push({ kind: 'lane', lane });
      if (picked.length === 4) break;
    }
    if (diesel) picked.splice(2, 0, { kind: 'diesel', d: diesel });
    return picked;
  }, [lanes, diesel]);

  /* The list under the card is the board itself, and it is not the same lanes as
     the rotation — a screenshot where the hero card duplicates row one looks
     staged. */
  const rows = React.useMemo(() => lanes.slice(5, 10), [lanes]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    if (reduced || cards.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % cards.length), 3600);
    return () => window.clearInterval(t);
  }, [reduced, cards.length]);

  if (!cards.length) return null;
  const card = cards[i];

  return (
    <div className="mx-auto w-full max-w-[236px] sm:max-w-[292px]">
      {/* Device. 9:19.5 is the real proportion of a modern handset; the squat
          rounded rectangle it replaced read as a widget, not a product. */}
      <div
        className="relative rounded-[42px] p-[9px]"
        style={{
          background: 'linear-gradient(160deg,#2b2b2b 0%,#111111 42%,#000000 100%)',
          boxShadow: '0 44px 88px -44px rgba(17,17,17,.6), 0 0 0 1px rgba(17,17,17,.9)',
        }}
      >
        {/* the thin bright edge a real chassis catches */}
        <span aria-hidden className="pointer-events-none absolute inset-[3px] rounded-[39px]"
              style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,.22)' }} />

        <div className="relative overflow-hidden rounded-[34px]" style={{ background: PAPER, aspectRatio: '9 / 19.5' }}>
          <StatusBar />

          {/* dynamic island */}
          <span aria-hidden className="absolute left-1/2 top-[9px] h-[17px] w-[50px] -translate-x-1/2 rounded-full"
                style={{ background: '#000' }} />

          <div className="flex items-center justify-between px-4 pb-2 pt-2"
               style={{ borderBottom: `1px solid ${HAIR}` }}>
            <Logo size={9} />
            <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full"
                  style={{ background: INK, color: PAPER, fontFamily: 'Poppins, sans-serif',
                           fontWeight: 600, fontSize: 8 }}>
              M
            </span>
          </div>

          <div className="px-3.5 pt-3">
            {/* the card that turns over */}
            <div key={i} className="rounded-[13px] bg-white px-3.5 py-3"
                 style={{
                   border: `1px solid ${HAIR}`,
                   boxShadow: '0 10px 22px -18px rgba(17,17,17,.5)',
                   animation: reduced ? undefined : 'aon-card-in .55s cubic-bezier(.22,.61,.36,1) both',
                 }}>
              {card.kind === 'lane' ? <LaneCard lane={card.lane} /> : <DieselCard d={card.d} />}
            </div>

            <p className="aon-eyebrow mt-3.5" style={{ fontSize: 8 }}>Lane index</p>

            <ul className="mt-1">
              {rows.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-[7px]"
                    style={{ borderBottom: `1px solid ${HAIR}` }}>
                  <span className="aon-num text-[11px]" style={{ color: INK }}>
                    {l.originCode} → {l.destCode}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="aon-eyebrow" style={{ fontSize: 7 }}>{l.equipment}</span>
                    <span className="aon-num text-[11px]" style={{ color: ACCENT }}>{rpmFmt(l.rpm)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute inset-x-0 bottom-0">
            <TabBar />
            <span aria-hidden className="mx-auto mb-1.5 mt-1 block h-[3.5px] w-[92px] rounded-full"
                  style={{ background: 'rgba(17,17,17,.28)' }} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-0.5">
        {cards.map((_, n) => (
          /* The tap target keeps the 44px floor index.css sets under 768px; only
             the visible indicator is small. */
          <button
            key={n}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Show card ${n + 1} of ${cards.length}`}
            aria-current={n === i}
            className="flex items-center justify-center bg-transparent p-0"
            style={{ width: 26, height: 26 }}
          >
            <span
              className="block rounded-full"
              style={{
                width: n === i ? 16 : 5, height: 5,
                background: n === i ? INK : 'rgba(17,17,17,.22)',
                transition: reduced ? 'none' : 'width .3s ease, background .3s ease',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
