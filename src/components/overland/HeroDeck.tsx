import React from 'react';
import { buildLanes, rpmFmt, type Lane } from '@/lib/market';

/**
 * The product, shown rather than described.
 *
 * A first-time visitor does not want a paragraph about a freight exchange; they
 * want to see what the thing looks like and what a lane pays. So the hero holds
 * an app frame with the real board chrome in it, and a deck of cards that turns
 * over on its own — a few regions, a few rates, and the diesel price.
 *
 * The diesel card is the only measured number on the page, so it names its
 * source. The lane cards are modelled and say so. That distinction is the
 * product's whole argument and it should survive being put on a pretty card.
 *
 * If the diesel feed is unavailable the card is dropped from the deck rather
 * than rendered empty.
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

type Card =
  | { kind: 'lane'; lane: Lane }
  | { kind: 'diesel'; d: Diesel };

const weekLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

function LaneCard({ lane }: { lane: Lane }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="aon-eyebrow">{regionOf(lane.originCode)}</span>
        <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.62)' }}>Modelled</span>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="aon-num text-[22px]" style={{ color: INK }}>{lane.originCode}</span>
          <span className="text-[16px]" style={{ color: 'rgba(17,17,17,.45)' }}>→</span>
          <span className="aon-num text-[22px]" style={{ color: INK }}>{lane.destCode}</span>
        </div>
        <p className="aon-body mt-1 text-[12px]">
          {lane.origin} to {lane.dest} · {lane.miles.toLocaleString('en-US')} mi
        </p>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="aon-eyebrow">Per mile</span>
          <div className="aon-num mt-1 text-[30px]" style={{ color: ACCENT }}>{rpmFmt(lane.rpm)}</div>
        </div>
        <span className="aon-eyebrow rounded-full px-2.5 py-1"
              style={{ background: 'rgba(17,17,17,.05)', color: 'rgba(17,17,17,.62)', fontSize: 9 }}>
          {lane.equipment}
        </span>
      </div>
    </div>
  );
}

function DieselCard({ d }: { d: Diesel }) {
  const up = (d.changeWeek ?? 0) >= 0;
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="aon-eyebrow" style={{ color: POSITIVE }}>Measured</span>
        <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.62)' }}>EIA</span>
      </div>

      <div>
        <span className="aon-eyebrow">Diesel, national average</span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="aon-num text-[30px]" style={{ color: INK }}>${d.usdPerGallon.toFixed(2)}</span>
          <span className="aon-body text-[12px]">per gallon</span>
        </div>
        {d.changeWeek !== null && (
          <div className="aon-num mt-1 text-[12px]" style={{ color: up ? WARM : POSITIVE }}>
            {up ? '▲' : '▼'} ${Math.abs(d.changeWeek).toFixed(3)} week on week
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="aon-eyebrow">Fuel per mile</span>
          <div className="aon-num mt-1 text-[22px]" style={{ color: INK }}>${d.usdPerMile.toFixed(2)}</div>
        </div>
        <p className="aon-body max-w-[15ch] text-right text-[10px] leading-[1.45]">
          Week of {weekLabel(d.week)}. Assumes {d.mpgAssumed} mpg.
        </p>
      </div>
    </div>
  );
}

export default function HeroDeck() {
  const lanes = React.useMemo(() => buildLanes(), []);
  const [diesel, setDiesel] = React.useState<Diesel | null>(null);
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    let off = false;
    fetch('/api/diesel')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: Diesel) => { if (!off && typeof j?.usdPerGallon === 'number') setDiesel(j); })
      .catch(() => { /* the card is simply left out of the deck */ });
    return () => { off = true; };
  }, []);

  /* One card per region so the deck reads as a tour of the country rather than
     five variations on the same corridor. */
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

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    if (reduced || cards.length < 2) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % cards.length), 3600);
    return () => window.clearInterval(t);
  }, [reduced, cards.length]);

  if (!cards.length) return null;

  return (
    <div className="mx-auto w-full max-w-[400px]">
      {/* The app frame. Deliberately the product's own chrome — wordmark, sign-in
          pill — so this reads as the thing itself, not an illustration of it. */}
      <div className="rounded-[26px] p-2.5 shadow-[0_30px_70px_-40px_rgba(17,17,17,.45)]"
           style={{ background: INK }}>
        <div className="overflow-hidden rounded-[18px]" style={{ background: PAPER }}>

          <div className="flex items-center justify-between px-4 py-3"
               style={{ borderBottom: `1px solid ${HAIR}`, background: '#FFFFFF' }}>
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 128 40" width="26" height="9" aria-hidden style={{ overflow: 'visible' }}>
                <path d="M2 26 C 22 26, 26 12, 44 12 S 70 30, 90 30 S 116 14, 126 14"
                      fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
              </svg>
              <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 500,
                             letterSpacing: '.2em', fontSize: 10, color: INK }}>
                OVERLAND
              </span>
            </span>
            <span className="rounded-full px-3 py-1.5"
                  style={{ background: INK, color: PAPER, fontFamily: 'Poppins, sans-serif',
                           fontWeight: 500, fontSize: 10 }}>
              Sign in
            </span>
          </div>

          {/* The deck. Cards behind the front one are offset and scaled down, so
              the turn reads as a stack being dealt rather than a slideshow. */}
          <div className="relative px-4 pb-4 pt-4" style={{ height: 232 }}>
            {cards.map((c, n) => {
              const depth = (n - i + cards.length) % cards.length;
              /* Every card in the stack stays fully opaque. Fading them was the
                 obvious way to suggest depth and it was wrong: mid-transition two
                 translucent cards overlap and their text reads through each other.
                 Depth comes from offset, scale and shadow instead, and the card
                 that has just left lifts up and out rather than dissolving in
                 place over the one arriving. */
              const leaving = depth === cards.length - 1 && cards.length > 3;
              const stacked = depth < 3;
              const transform = leaving
                ? 'translateY(-18px) scale(1.02)'
                : stacked
                  ? `translateY(${depth * 9}px) scale(${1 - depth * 0.035})`
                  : 'translateY(20px) scale(.93)';
              return (
                <div
                  key={n}
                  aria-hidden={depth !== 0}
                  className="absolute left-4 right-4 rounded-[12px] bg-white p-4"
                  style={{
                    height: 200,
                    border: `1px solid ${HAIR}`,
                    transform,
                    opacity: stacked ? 1 : 0,
                    zIndex: cards.length - depth,
                    transition: reduced ? 'none' : 'transform .6s cubic-bezier(.22,.61,.36,1), opacity .45s ease',
                    pointerEvents: depth === 0 ? 'auto' : 'none',
                    boxShadow: depth === 0 ? '0 14px 30px -20px rgba(17,17,17,.45)' : 'none',
                  }}
                >
                  {c.kind === 'lane' ? <LaneCard lane={c.lane} /> : <DieselCard d={c.d} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {cards.map((_, n) => (
          /* The tap target stays 44px — index.css gives every button that floor
             under 768px and it is the right floor — but the visible dot must not
             be 44px of grey. So the button is transparent and centres a small
             indicator inside it. */
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
                width: n === i ? 18 : 6, height: 6,
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
