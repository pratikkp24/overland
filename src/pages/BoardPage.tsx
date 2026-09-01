import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import LaneDetail from '@/components/overland/LaneDetail';
import MobileTabBar from '@/components/overland/MobileTabBar';
import AccountMenu from '@/components/overland/AccountMenu';
import PostListing from '@/components/overland/PostListing';
import SmartSearch from '@/components/overland/SmartSearch';
import type { ParsedQuery } from '@/lib/parseQuery';
import LiveListings from '@/components/overland/LiveListings';
import DieselStrip from '@/components/overland/DieselStrip';
import { boardCounts, isLive } from '@/lib/db';
import { events } from '@/lib/analytics';
import {
  buildLanes, tick, nationalIndex, money, rpmFmt, sparkPath,
  type Lane, type Equipment,
} from '@/lib/market';

/**
 * The rate board.
 *
 * A lane market, read the way a trader reads an equities screen: last, average,
 * spread against average, volume. Rate-per-mile is the primary column because that
 * is the number US freight actually trades on - linehaul alone tells you nothing
 * until you know the miles.
 *
 * Uses the .ov-* app design system (not the .aon-* marketing layer).
 */

const INK = '#111111';
const UP = '#0F7A4A';
const DOWN = '#A8412F';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

type SortKey = 'lane' | 'rpm' | 'avgRpm' | 'spread' | 'linehaul' | 'bids';

const spreadOf = (l: Lane) => (l.rpm - l.avgRpm) / l.avgRpm;

export default function BoardPage() {
  const { user } = useAuth();
  const [lanes, setLanes] = useState<Lane[]>(() => buildLanes());
  const [equip, setEquip] = useState<Equipment | 'All'>('All');
  const [q, setQ] = useState('');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [minRpm, setMinRpm] = useState('');
  const [maxMiles, setMaxMiles] = useState('');
  const [ai, setAi] = useState<ParsedQuery | null>(null);
  const [sort, setSort] = useState<SortKey>('spread');
  const [desc, setDesc] = useState(true);
  const [clock, setClock] = useState(() => new Date());
  const [open, setOpen] = useState<Lane | null>(null);
  const [posting, setPosting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /* Real board totals. The header used to print the seeded lane model's figures,
     so the page could claim 143 open loads directly above a board holding one. */
  const [counts, setCounts] = useState<{ loads: number; bids: number } | null>(null);
  useEffect(() => { let off = false;
    boardCounts().then((c) => { if (!off) setCounts(c); }).catch(() => {});
    return () => { off = true; };
  }, []);
  const { slug } = useParams();

  /* A shared /lane/lax-dfw link should land on that lane's detail, not the bare board. */
  useEffect(() => {
    if (!slug || open) return;
    const hit = lanes.find((l) => `${l.originCode}-${l.destCode}`.toLowerCase() === slug.toLowerCase());
    if (hit) setOpen(hit);
  }, [slug, lanes, open]);

  useEffect(() => { events.boardOpened(); }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    const m = setInterval(() => setLanes((prev) => tick(prev)), 2200);
    return () => { clearInterval(t); clearInterval(m); };
  }, []);

  const idx = useMemo(() => nationalIndex(lanes), [lanes]);
  const idxDelta = idx.now - idx.avg;

  /* Cities present on the board, for the origin/destination pickers. Derived rather
     than hard-coded so the lists can never drift from the data. */
  const origins = useMemo(
    () => [...new Map(lanes.map((l) => [l.originCode, l.origin])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])), [lanes]);
  const dests = useMemo(
    () => [...new Map(lanes.map((l) => [l.destCode, l.dest])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])), [lanes]);

  const activeCount =
    (equip !== 'All' ? 1 : 0) + (q ? 1 : 0) + (origin ? 1 : 0) +
    (dest ? 1 : 0) + (minRpm ? 1 : 0) + (maxMiles ? 1 : 0);

  const clearAll = () => {
    setEquip('All'); setQ(''); setOrigin(''); setDest(''); setMinRpm(''); setMaxMiles('');
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const minR = Number(minRpm) || 0;
    const maxM = Number(maxMiles) || Infinity;

    const filtered = lanes.filter((l) => {
      if (equip !== 'All' && l.equipment !== equip) return false;
      if (origin && l.originCode !== origin) return false;
      if (dest && l.destCode !== dest) return false;
      if (l.rpm < minR) return false;
      if (l.miles > maxM) return false;
      if (ai?.maxRate && l.linehaul > ai.maxRate) return false;
      if (ai?.minRate && l.linehaul < ai.minRate) return false;
      if (term && !ai) {
        // match city names and airport-style codes, so "DFW" and "Dallas" both work
        const hay = `${l.origin} ${l.dest} ${l.originCode} ${l.destCode} ${l.equipment}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const val = (l: Lane) =>
      sort === 'lane' ? `${l.origin}${l.dest}` :
      sort === 'spread' ? spreadOf(l) :
      (l[sort] as number);
    return [...filtered].sort((a, b) => {
      const A = val(a), B = val(b);
      const c = typeof A === 'string' ? String(A).localeCompare(String(B)) : (A as number) - (B as number);
      return desc ? -c : c;
    });
  }, [lanes, equip, sort, desc, q, origin, dest, minRpm, maxMiles, ai]);

  const setSorting = (k: SortKey) => {
    if (k === sort) setDesc((d) => !d);
    else { setSort(k); setDesc(true); }
  };

  const Th = ({ k, children, align = 'right' }: { k: SortKey; children: React.ReactNode; align?: 'left' | 'right' }) => (
    <th className={`px-4 py-3 text-${align}`}>
      <button
        type="button"
        onClick={() => setSorting(k)}
        className="aon-eyebrow inline-flex items-center gap-1"
        style={{ color: sort === k ? ACCENT : 'rgba(17,17,17,.62)' }}
      >
        {children}
        <span aria-hidden style={{ opacity: sort === k ? 1 : 0 }}>{desc ? '▾' : '▴'}</span>
      </button>
    </th>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      {/* ---- terminal header ---------------------------------------------- */}
      <header className="border-b" style={{ borderColor: HAIR }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-4">
          <a href="/?home=1" className="aon-eyebrow" style={{ color: INK, letterSpacing: '.18em' }}>OVERLAND</a>
          <div className="flex items-center gap-5">
            <span className="aon-eyebrow inline-flex items-center gap-2">
              <span className="ov-livedot" /> Market open
            </span>
            <span className="aon-num text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
              {clock.toLocaleTimeString('en-US', { hour12: false })} ET
            </span>
            <button
              type="button"
              onClick={() => setPosting(true)}
              className="aon-cta aon-cta--dark"
            >
              + Post
            </button>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-6 py-8">
        {/* The board's visible headings start at h2 by design. A document with no
            h1 is a real defect for a screen reader and for search, so name the
            page here rather than restyling the header. */}
        <h1 className="sr-only">Overland rate board — open freight and truck listings with every bid public</h1>
        {/* ---- index board ------------------------------------------------ */}
        <section className="ov-board p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="aon-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Overland national lane index · USD per mile
              </p>
              <div className="mt-3 flex items-baseline gap-4">
                <span className="aon-num text-[clamp(38px,6vw,58px)] leading-none">{rpmFmt(idx.now)}</span>
                <span className="aon-num text-[16px]" style={{ color: idxDelta >= 0 ? '#4ADE80' : '#F87171' }}>
                  {idxDelta >= 0 ? '▲' : '▼'} {rpmFmt(Math.abs(idxDelta))}
                  <span className="ml-2">
                    ({((idxDelta / idx.avg) * 100).toFixed(2)}%)
                  </span>
                </span>
              </div>
              <p className="aon-num mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                30-session average {rpmFmt(idx.avg)} · miles-weighted across {lanes.length} lanes
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-8">
              {[
                // Real counts when the backend is live; a dash while they load, never
                // a simulated number dressed as a real one.
                ['Open loads', isLive() ? (counts ? counts.loads.toLocaleString() : '—')
                                        : lanes.reduce((a, l) => a + l.loads, 0).toLocaleString()],
                ['Bids placed', isLive() ? (counts ? counts.bids.toLocaleString() : '—')
                                         : lanes.reduce((a, l) => a + l.bids, 0).toLocaleString()],
                ['Lanes priced', String(lanes.length)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="aon-eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>{k}</dt>
                  <dd className="aon-num mt-2 text-[22px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <LiveListings />

        {/* The real number goes immediately above the modelled ones. A carrier
            reading $2.50/mi should see what fuel is costing in the same glance. */}
        <div className="mt-14">
          <DieselStrip />
        </div>

        {/* ---- lane index header ------------------------------------------- */}
        {/* Heading left, the two things you came to do on the right. The filter
            panel this replaced put four dropdowns, a search field and a pill row
            above the table before you had seen a single lane. */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>
              Reference rates · simulated
            </span>
            <h2 className="aon-display mt-2 text-[clamp(24px,3vw,34px)]">Lane index</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[min(340px,58vw)]">
              <SmartSearch
                value={q}
                onChange={setQ}
                onParsed={(p) => {
                  setAi(p);
                  // A parsed query drives the real controls, so the reader can see and
                  // adjust what it did rather than trusting a black box.
                  if (p?.originCode) setOrigin(p.originCode);
                  if (p?.destCode) setDest(p.destCode);
                  if (p?.equipment) setEquip(p.equipment as Equipment);
                  if (p?.maxRate) setMaxMiles('');
                  // Open the panel when a query set something, so the reader can see
                  // what the parser did instead of the filters changing invisibly.
                  if (p?.originCode || p?.destCode) setFiltersOpen(true);
                }}
              />
            </div>
            <button type="button" onClick={() => setPosting(true)} className="aon-cta aon-cta--dark whitespace-nowrap">
              Post
            </button>
          </div>
        </div>

        <p className="aon-body mt-2 max-w-[52ch] text-[13px] leading-[1.6]">
          Indicative rates modelled from miles and equipment, not live transactions.
          Use them to sanity-check a bid, not as a quote.
        </p>

        {/* ---- equipment + count, with the rest folded away ------------------ */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(['All', 'Dry van', 'Reefer', 'Flatbed'] as const).map((e) => (
            <button key={e} type="button" onClick={() => setEquip(e)}
                    className="aon-eyebrow rounded-full px-4 py-2 transition-colors"
                    style={{ background: equip === e ? INK : 'transparent',
                             color: equip === e ? '#FBFAF8' : 'rgba(17,17,17,.62)',
                             border: `1px solid ${equip === e ? INK : HAIR}` }}>
              {e}
            </button>
          ))}

          <button type="button" onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  className="aon-eyebrow rounded-full px-4 py-2 transition-colors"
                  style={{ color: activeCount > 0 ? ACCENT : 'rgba(17,17,17,.62)',
                           border: `1px solid ${activeCount > 0 ? ACCENT : HAIR}` }}>
            Filters{activeCount > 0 ? ` · ${activeCount}` : ''} {filtersOpen ? '\u2191' : '\u2193'}
          </button>

          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="aon-eyebrow" style={{ color: ACCENT }}>
              Clear
            </button>
          )}

          <span className="aon-num ml-auto text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
            {rows.length} of {lanes.length} lanes
          </span>
        </div>

        {filtersOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-[9px] p-3"
               style={{ background: '#FFFFFF', border: `1px solid ${HAIR}` }}>
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} aria-label="Origin"
                    className="rounded-[9px] px-3 py-2.5 text-[14px] outline-none"
                    style={{ fontFamily: 'Poppins, sans-serif', background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }}>
              <option value="">From: anywhere</option>
              {origins.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <select value={dest} onChange={(e) => setDest(e.target.value)} aria-label="Destination"
                    className="rounded-[9px] px-3 py-2.5 text-[14px] outline-none"
                    style={{ fontFamily: 'Poppins, sans-serif', background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }}>
              <option value="">To: anywhere</option>
              {dests.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
            <input value={minRpm} onChange={(e) => setMinRpm(e.target.value.replace(/[^\d.]/g, ''))}
                   placeholder="Min $/mi" aria-label="Minimum rate per mile" inputMode="decimal"
                   className="aon-num w-[110px] rounded-[9px] px-3 py-2.5 text-[14px] outline-none"
                   style={{ background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }} />
            <input value={maxMiles} onChange={(e) => setMaxMiles(e.target.value.replace(/[^\d]/g, ''))}
                   placeholder="Max miles" aria-label="Maximum miles" inputMode="numeric"
                   className="aon-num w-[110px] rounded-[9px] px-3 py-2.5 text-[14px] outline-none"
                   style={{ background: 'rgba(17,17,17,.04)', border: `1px solid ${HAIR}` }} />
          </div>
        )}

        {/* ---- the board --------------------------------------------------- */}
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Lane index, scrolls horizontally">
          <table className="w-full min-w-[940px] border-collapse">
            <thead>
              <tr>
                <Th k="lane" align="left">Lane</Th>
                <th className="px-4 py-3 text-left"><span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>Equip</span></th>
                <th className="px-4 py-3 text-right"><span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>Miles</span></th>
                <Th k="rpm">Last $/mi</Th>
                <Th k="avgRpm">30d avg</Th>
                <Th k="spread">vs avg</Th>
                <th className="px-4 py-3 text-center"><span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>30d</span></th>
                <Th k="linehaul">Linehaul</Th>
                <Th k="bids">Bids</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => {
                const spread = spreadOf(l);
                const up = l.rpm >= l.prevRpm;
                const hot = spread > 0.03;
                return (
                  <tr key={l.id} className="ov-mkt-row cursor-pointer" onClick={() => setOpen(l)}
                      tabIndex={0} role="button"
                      onKeyDown={(e) => { if (e.key === 'Enter') setOpen(l); }}>
                    <td className="px-4 py-4">
                      <div className="flex items-baseline gap-2">
                        <span className="aon-num text-[13px]" style={{ color: 'rgba(17,17,17,.65)' }}>{l.originCode}</span>
                        <span style={{ color: '#C9C3B8' }}>→</span>
                        <span className="aon-num text-[13px]" style={{ color: 'rgba(17,17,17,.65)' }}>{l.destCode}</span>
                      </div>
                      <div className="mt-1 text-[14px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>
                        {l.origin} → {l.dest}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>{l.equipment}</span>
                    </td>
                    <td className="aon-num px-4 py-4 text-right text-[13px]" style={{ color: 'rgba(17,17,17,.65)' }}>
                      {l.miles.toLocaleString()}
                    </td>
                    <td className="aon-num px-4 py-4 text-right text-[17px]" style={{ color: up ? UP : DOWN }}>
                      {rpmFmt(l.rpm)}
                    </td>
                    <td className="aon-num px-4 py-4 text-right text-[15px]" style={{ color: 'rgba(17,17,17,.65)' }}>
                      {rpmFmt(l.avgRpm)}
                    </td>
                    <td className="aon-num px-4 py-4 text-right text-[14px]" style={{ color: spread >= 0 ? UP : DOWN }}>
                      {spread >= 0 ? '+' : ''}{(spread * 100).toFixed(1)}%
                      {hot && (
                        <span className="aon-eyebrow ml-2 rounded px-1.5 py-0.5"
                              style={{ background: 'rgba(168,65,47,.09)', color: DOWN }}>
                          tight
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <svg viewBox="0 0 100 28" width="100" height="28" className="ov-spark block" aria-hidden>
                        <path d={sparkPath(l.history)} fill="none" stroke={spread >= 0 ? UP : DOWN} strokeWidth="1.25" />
                      </svg>
                    </td>
                    <td className="aon-num px-4 py-4 text-right text-[15px]" style={{ color: INK }}>
                      {money(l.linehaul)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="aon-num text-[14px]" style={{ color: 'rgba(17,17,17,.65)' }}>{l.bids}</span>
                      <div className="aon-eyebrow mt-0.5" style={{ color: 'rgba(17,17,17,.65)' }}>{l.loads} open</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="py-14 text-center">
              <p className="aon-display text-[18px]">No lanes match that.</p>
              <button type="button" onClick={clearAll} className="aon-cta aon-cta--ghost mt-4">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {open && <LaneDetail lane={open} onClose={() => setOpen(null)} />}
        {posting && <PostListing onClose={() => setPosting(false)} />}

        <p className="aon-num mt-6 text-[11px]" style={{ color: 'rgba(17,17,17,.65)' }}>
          Demo data. Rates are simulated from miles and equipment, not live market feeds.
        </p>
      </main>
      <MobileTabBar onPost={() => setPosting(true)} />
    </div>
  );
}
