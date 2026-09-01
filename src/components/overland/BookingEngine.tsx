import React, { useEffect, useRef, useState } from 'react';

/**
 * Booking engine walkthrough.
 *
 * A working miniature of the real flow: post a lane, take open bids, accept one and get
 * an email introduction. It ends at the introduction on purpose - Overland does not
 * broker the load, hold money or handle paperwork, so the demo must not imply it does.
 *
 * Entirely local - no network, no backend.
 */

const INK = '#111111';
const GROUND = '#FAF9F7';
const ACCENT = '#1E4D6B';

const LOAD = {
  id: 'LD-001',
  route: 'Dallas → Los Angeles',
  cargo: 'Electronics – 11,000 lbs',
  equipment: 'Dry van 53ft',
  pickup: 'Tomorrow, 08:00 – 12:00',
  budget: '$2,200 – $2,800',
};

type Bid = { name: string; bid: number; rating: number; verified: boolean };

const BIDS: Bid[] = [
  { name: 'Summit Freight', bid: 2600, rating: 4.4, verified: false },
  { name: 'Keystone Logistics', bid: 2510, rating: 4.6, verified: true },
  { name: 'Rio Grande Carriers', bid: 2450, rating: 4.8, verified: true },
];

const STEPS = [
  ['Post your lane', 'Route, equipment and dates. Confirm your email and it is on the board.'],
  ['Open bids arrive', 'Anyone on the board can bid. Every bid is visible to everyone.'],
  ['Accept and connect', 'Take a bid and we email you both. From there it is your deal.'],
];

const money = (n: number) => `$${n.toLocaleString()}`;

export default function BookingEngine() {
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);          // how many bids have landed
  const [awarded, setAwarded] = useState<Bid | null>(null);
  const timers = useRef<number[]>([]);

  // Stage 2 streams bids in so the rate visibly settles downward.
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (step !== 1) return;
    setShown(0);
    BIDS.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setShown(i + 1), 500 + i * 900),
      );
    });
    return () => timers.current.forEach(clearTimeout);
  }, [step]);

  const goto = (i: number) => {
    setStep(i);
    if (i < 2) setAwarded(null);
  };

  const live = BIDS.slice(0, shown);
  const lowest = live.length ? Math.min(...live.map((b) => b.bid)) : null;

  return (
    <section id="booking" className="bg-[#FAF9F7] py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <span className="aon-eyebrow" style={{ color: ACCENT }}>How the board works</span>
        <h2 className="aon-display mt-5 max-w-[20ch] text-[clamp(32px,4.4vw,57px)]">
          Post it, price it, deal direct.
        </h2>
        <p className="aon-body mt-6 max-w-[48ch] text-[15px] leading-[1.7]">
          This is the real flow, running here on the page. Step through it.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
          {/* step rail */}
          <ol className="flex flex-col gap-1">
            {STEPS.map(([title, body], i) => {
              const on = i === step;
              return (
                <li key={title}>
                  <button
                    type="button"
                    onClick={() => goto(i)}
                    aria-current={on}
                    className="w-full rounded-[9px] p-5 text-left transition-colors duration-200"
                    style={{ background: on ? '#FFFFFF' : 'transparent', boxShadow: on ? '0 1px 0 rgba(17,17,17,.06)' : 'none' }}
                  >
                    <span className="aon-eyebrow" style={{ color: on ? ACCENT : 'rgba(17,17,17,.62)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {/* Inactive steps read as faded by design, but 0.45 put this
                        heading at 2.99:1. 0.62 keeps the distinction and clears AA. */}
                    <h3 className="aon-display mt-2 text-[19px]" style={{ opacity: on ? 1 : 0.62 }}>
                      {title}
                    </h3>
                    {on && <p className="aon-body mt-2 text-[13px] leading-[1.6]">{body}</p>}
                  </button>
                </li>
              );
            })}
          </ol>

          {/* product panel */}
          <div
            className="overflow-hidden rounded-[9px] bg-white"
            style={{ border: '1px solid rgba(17,17,17,.08)', boxShadow: '0 30px 60px -40px rgba(17,17,17,.35)' }}
          >
            {/* panel chrome */}
            <div className="flex items-center justify-between border-b border-[rgba(17,17,17,.07)] px-6 py-4">
              <span className="aon-eyebrow" style={{ fontSize: 9 }}>
                Overland exchange · {LOAD.id}
              </span>
              <span className="flex items-center gap-2 aon-eyebrow" style={{ fontSize: 9, color: ACCENT }}>
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: ACCENT }} />
                {step === 0 ? 'Draft' : awarded ? 'Connected' : 'Open'}
              </span>
            </div>

            <div className="p-6 lg:p-8">
              {/* ---------------------------------------------- 1. post */}
              {step === 0 && (
                <div>
                  <dl className="grid gap-px overflow-hidden rounded-[9px] bg-[rgba(17,17,17,.07)] sm:grid-cols-2">
                    {[
                      ['Route', LOAD.route],
                      ['Cargo', LOAD.cargo],
                      ['Equipment', LOAD.equipment],
                      ['Pickup window', LOAD.pickup],
                      ['Target range', LOAD.budget],
                      ['Visible to', 'Everyone on the board'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white px-5 py-4">
                        <dt className="aon-eyebrow" style={{ fontSize: 9 }}>{k}</dt>
                        <dd className="mt-2 text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <button type="button" onClick={() => goto(1)} className="aon-cta aon-cta--dark mt-7 w-full justify-center">
                    Post to exchange
                  </button>
                </div>
              )}

              {/* ---------------------------------------------- 2. bid */}
              {step === 1 && (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <span className="aon-eyebrow" style={{ fontSize: 9 }}>Lowest bid</span>
                      <div className="aon-display mt-1 text-[40px]" style={{ color: ACCENT }}>
                        {lowest ? money(lowest) : '—'}
                      </div>
                    </div>
                    <span className="aon-body text-[13px]">
                      {shown} of {BIDS.length} carriers bidding · target {LOAD.budget}
                    </span>
                  </div>

                  <ul className="mt-8 space-y-2" aria-live="polite">
                    {BIDS.map((b, i) => {
                      const landed = i < shown;
                      const best = lowest === b.bid && landed;
                      return (
                        <li
                          key={b.name}
                          className="flex items-center justify-between rounded-[9px] px-5 py-4 transition-all duration-500"
                          style={{
                            background: best ? 'rgba(30,77,107,.06)' : 'rgba(17,17,17,.025)',
                            border: `1px solid ${best ? 'rgba(30,77,107,.25)' : 'transparent'}`,
                            opacity: landed ? 1 : 0,
                            transform: landed ? 'none' : 'translateY(8px)',
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{b.name}</span>
                              {b.verified && (
                                <span className="aon-eyebrow" style={{ fontSize: 8, color: ACCENT }}>Verified</span>
                              )}
                            </div>
                            <span className="aon-body text-[12px]">Rating {b.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-[17px]" style={{ fontFamily: 'Poppins, sans-serif', color: best ? ACCENT : INK }}>
                            {money(b.bid)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    onClick={() => goto(2)}
                    disabled={shown < BIDS.length}
                    className="aon-cta aon-cta--dark mt-7 w-full justify-center"
                    style={{ opacity: shown < BIDS.length ? 0.35 : 1, pointerEvents: shown < BIDS.length ? 'none' : 'auto' }}
                  >
                    {shown < BIDS.length ? 'Bids arriving…' : 'Review bids'}
                  </button>
                </div>
              )}

              {/* -------------------------------------------- 3. award */}
              {step === 2 && !awarded && (
                <div>
                  <p className="aon-body text-[14px] leading-[1.7]">
                    Accept on price, on rating, or on neither. Nobody takes a cut of the
                    number you agree.
                  </p>
                  <ul className="mt-7 space-y-2">
                    {BIDS.map((b) => (
                      <li key={b.name}>
                        <button
                          type="button"
                          onClick={() => setAwarded(b)}
                          className="flex w-full items-center justify-between rounded-[9px] px-5 py-4 text-left transition-colors duration-200"
                          style={{ background: 'rgba(17,17,17,.025)', border: '1px solid transparent' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(30,77,107,.35)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{b.name}</span>
                              {b.verified && <span className="aon-eyebrow" style={{ fontSize: 8, color: ACCENT }}>Verified</span>}
                            </div>
                            <span className="aon-body text-[12px]">Rating {b.rating.toFixed(1)}</span>
                          </div>
                          <span className="aon-eyebrow" style={{ color: ACCENT }}>Accept {money(b.bid)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 2 && awarded && (
                <div>
                  <span className="aon-eyebrow" style={{ color: ACCENT }}>Introduced</span>
                  <h3 className="aon-display mt-3 text-[30px]">
                    You and {awarded.name} have each other&rsquo;s details.
                  </h3>
                  <dl className="mt-8 grid gap-px overflow-hidden rounded-[9px] bg-[rgba(17,17,17,.07)] sm:grid-cols-3">
                    {[
                      ['Agreed rate', money(awarded.bid)],
                      ['Emails sent', '2'],
                      ['Overland\u2019s cut', '$0'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white px-5 py-4">
                        <dt className="aon-eyebrow" style={{ fontSize: 9 }}>{k}</dt>
                        <dd className="mt-2 text-[17px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="aon-body mt-6 text-[13px] leading-[1.7]">
                    Rate confirmation, insurance and payment are between the two of you.
                    Check each other&rsquo;s authority on the FMCSA register first &mdash; we
                    verify emails, not businesses.
                  </p>
                  <button type="button" onClick={() => goto(0)} className="aon-cta aon-cta--dark mt-7 w-full justify-center">
                    Run it again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
