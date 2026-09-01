import React, { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import RateTicker from './RateTicker';
import AccountMenu from './AccountMenu';

/**
 * Overland homepage sections, built on the Aonami UI language (aonamitech.com):
 * Archivo Light display, Poppins body, warm off-white ground, near-black ink,
 * slate accent, 9px card radii, small pill CTAs.
 *
 * Section patterns mirror the Aonami page in order: minimal nav, numbered problem
 * statement, audience cards, four-step process, product grid with status badges,
 * integration wordmarks, ROI stats plus a comparison table, FAQ accordion, closer.
 * Shared type/colour primitives live in index.css as .aon-*.
 */

const INK = '#111111';
const GROUND = '#FAF9F7';
const ACCENT = '#1E4D6B';

/* ---------------------------------------------------------------- nav */

const NAV_LINKS: Array<[string, string]> = [
  ['Marketplace', '#book'],
  ['Lanes', '#lanes'],
  ['How it works', '#how'],
];

export function AonNav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, openAuth, signOut } = useAuth();
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-[60]">
      <RateTicker />
      <div
      className="transition-colors duration-300"
      style={{
        background: solid ? 'rgba(250,249,247,.82)' : 'transparent',
        backdropFilter: solid ? 'blur(14px)' : 'none',
        WebkitBackdropFilter: solid ? 'blur(14px)' : 'none',
        borderBottom: solid ? '1px solid rgba(17,17,17,.07)' : '1px solid transparent',
      }}
    >
      <div className="mx-auto flex h-[62px] max-w-[1126px] items-center justify-between px-6">
        <a href="/" className="aon-eyebrow inline-flex items-center gap-2.5" style={{ color: INK, letterSpacing: '.18em' }}>
          <svg viewBox="0 0 128 40" width="30" height="10" aria-hidden style={{ overflow: 'visible' }}>
            <path d="M6 27 H30 C38 27 38 13 46 13 C54 13 54 23 62 23 C70 23 70 13 78 13 C86 13 86 27 94 27 H122"
                  fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          OVERLAND
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="aon-body text-[13px] transition-colors hover:text-[#111]"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center md:hidden"
          >
            <span className="relative block h-[9px] w-[18px]" aria-hidden>
              <span
                className="absolute left-0 block h-px w-full transition-transform duration-300"
                style={{ background: INK, top: 0, transform: open ? 'translateY(4px) rotate(45deg)' : 'none' }}
              />
              <span
                className="absolute left-0 block h-px w-full transition-transform duration-300"
                style={{ background: INK, bottom: 0, transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none' }}
              />
            </span>
          </button>
          {user ? (
            <>
              <a href="/board" className="aon-cta aon-cta--dark hidden sm:inline-flex">Open the board</a>
              <AccountMenu />
            </>
          ) : (
            <button type="button" onClick={() => openAuth('shipper')} className="aon-cta aon-cta--dark">
              Sign in
            </button>
          )}
        </div>
      </div>

      </div>

      {/* mobile drawer */}
      <div
        className="grid overflow-hidden transition-all duration-300 md:hidden"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          background: 'rgba(250,249,247,.98)',
          backdropFilter: 'blur(14px)',
          borderBottom: open ? '1px solid rgba(17,17,17,.07)' : 'none',
        }}
      >
        <nav className="overflow-hidden">
          <ul className="px-6 py-2">
            {NAV_LINKS.map(([label, href]) => (
              <li key={href} className="border-b border-[rgba(17,17,17,.06)] last:border-0">
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-[16px]"
                  style={{ fontFamily: 'Poppins, sans-serif', color: INK }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}


/* ---------------------------------------------------------------- hero */

export function HeroSection() {
  const { openAuth } = useAuth();
  return (
    <section className="relative overflow-hidden bg-[#FAF9F7] pt-32 pb-20 md:pt-40 md:pb-28 lg:pt-44 lg:pb-32">
      <div className="mx-auto max-w-[1126px] px-6">
        <span className="aon-eyebrow">
          Open board · FTL &amp; PTL · United States
        </span>

        <h1 className="aon-display mt-7 max-w-[15ch] text-[clamp(40px,7vw,80px)]">
          The freight market, priced in the open.
        </h1>

        <p className="aon-body mt-8 max-w-[52ch] text-[17px] leading-[1.65]">
          Post a load or post a truck. Anyone can bid and everyone can see the rate.
          Accept a bid and we email you both. After that it is your deal, on your terms.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => openAuth('shipper')} className="aon-cta aon-cta--dark">Post a load</button>
          <button
            type="button"
            onClick={() => openAuth('carrier')}
            className="aon-cta aon-cta--ghost"
            style={{ background: 'transparent', color: INK, boxShadow: 'inset 0 0 0 1px rgba(17,17,17,.18)' }}
          >
            Post a truck
          </button>
          <a href="#lanes" className="aon-body ml-1 text-[13px] underline underline-offset-4">
            or just look at the rates
          </a>
        </div>

        {/* The trade-off, stated up front rather than buried in the FAQ. */}
        <p className="aon-eyebrow mt-12 max-w-[46ch]" style={{ lineHeight: 1.9 }}>
          Free to browse · Email verification only · We do not take a cut
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ problem */

/* Live figures mirror the exchange stats the original hero carried. */
const KPIS: Array<[string, string, string]> = [
  ['Open auctions', '247', '+12 today'],
  ['Bids placed', '1,863', '+47 live'],
  ['Avg settled rate', '$2,400', '+2.5%'],
  ['Fill rate', '96.4%', '+0.8%'],
];

const PROBLEM = [
  ['Closed', 'Most boards cost money before you can even see what a lane pays.'],
  ['Indirect', 'You reach a desk, the desk reaches a truck, and the number changes on the way.'],
  ['Slow', 'A load and a truck can sit two phone calls apart for a day and a half.'],
];

export function ProblemSection() {
  return (
    <section className="bg-[#FAF9F7] py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display max-w-[16ch] text-[clamp(34px,4.6vw,57px)]">
          It is not just expensive.
          <br />
          You are bidding blind.
        </h2>
        <p className="aon-body mt-8 max-w-[46ch] text-[15px] leading-[1.7]">
          The real cost is not the middleman. It is every decision you made without
          knowing what the lane was actually worth.
        </p>

        <ol className="mt-20 grid gap-px overflow-hidden rounded-[9px] border border-[rgba(17,17,17,.08)] bg-[rgba(17,17,17,.08)] md:grid-cols-3">
          {PROBLEM.map(([title, body], i) => (
            <li key={title} className="bg-[#FAF9F7] p-8 lg:p-10">
              <span className="aon-eyebrow" style={{ color: ACCENT }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="aon-display mt-5 text-[22px]">{title}</h3>
              <p className="aon-body mt-3 text-[14px] leading-[1.7]">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- audience */

const AUDIENCES = [
  {
    eyebrow: 'Individuals & small business',
    title: 'Anyone with freight',
    tag: 'SHIPPERS',
    points: [
      'One pallet or one trailer, same board',
      'See the going rate before you post',
      'Take the bid you want, or none of them',
    ],
  },
  {
    eyebrow: 'Fleets & owner-operators',
    title: 'Carriers',
    tag: 'CARRIERS',
    points: [
      'Bid on freight going your way',
      'Post an empty leg and take bids on it',
      'Deal with the shipper directly',
    ],
  },
  {
    eyebrow: 'Companies with freight',
    title: 'Businesses',
    tag: 'CORPORATES',
    points: [
      'Post regular lanes and watch them price',
      'Reach carriers you do not already have',
      'Keep your own contracts and terms',
    ],
  },
];

export function AudienceSection() {
  return (
    <section className="bg-[#FAF9F7] pb-20 md:pb-28 lg:pb-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <span className="aon-eyebrow">Two sides, no middle</span>
        <h2 className="aon-display mt-5 max-w-[18ch] text-[clamp(32px,4.4vw,57px)]">
          Who is on the board.
        </h2>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <article
              key={a.title}
              className="aon-card flex flex-col p-8 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(17,17,17,.25)]"
            >
              <span className="aon-eyebrow">{a.eyebrow}</span>
              <h3 className="aon-display mt-4 text-[30px]">{a.title}</h3>
              <ul className="mt-6 flex-1 space-y-3">
                {a.points.map((p) => (
                  <li key={p} className="aon-body flex gap-3 text-[14px] leading-[1.6]">
                    <span aria-hidden className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[#1E4D6B]" />
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between">
                <a href="#book" className="aon-cta aon-cta--dark">Open the board</a>
                <span className="aon-eyebrow" style={{ fontSize: 9 }}>{a.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ process */

const STEPS = [
  ['Post', 'A load or a truck. Route, equipment, dates. Confirm your email and it is on the board.'],
  ['Bid', 'Anyone on the board can bid, either way round. Every bid is out in the open.'],
  ['Connect', 'Accept a bid and we email you both. Names, numbers, the lane, the price.'],
  ['Deal direct', 'From there it is your conversation, your paperwork, your terms. We step out.'],
];

export function ProcessSection() {
  return (
    <section id="how" className="bg-[#111111] py-28 text-[#FAF9F7] lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display aon-display--light text-[clamp(32px,4.4vw,57px)]">
          Here is how it works.
        </h2>
        <div className="mt-20 grid gap-12 sm:grid-cols-2 md:gap-10 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <div key={title}>
              <div className="mb-6 h-px w-full bg-[rgba(250,249,247,.18)]" />
              <span className="aon-eyebrow" style={{ color: 'rgba(250,249,247,0.72)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="aon-display aon-display--light mt-4 text-[26px]">{title}</h3>
              <p
                className="mt-3 text-[14px] leading-[1.7]"
                style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(250,249,247,0.72)' }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- products */

/* Deliberately framed as what the platform does and does not do. Overland introduces
   two parties and stops; anything stronger would be a claim it cannot stand behind. */
const PRODUCTS = [
  ['WE DO', 'Open rates', 'Every posted load and every bid is visible without paying to look.'],
  ['WE DO', 'Both directions', 'Post a load and take bids, or post a truck and bid on freight.'],
  ['WE DO', 'The introduction', 'Accept a bid and both sides get an email with each other\u2019s details.'],
  ['WE DO NOT', 'Sit in the middle', 'No cut of the rate, no dispatch, no paperwork, no custody of your money.'],
];

/* Lanes carried over from the live market board. */
const LANES: Array<[string, string, string]> = [
  ['Los Angeles', 'Dallas', '$2,340'],
  ['Dallas', 'Newark', '$3,110'],
  ['Atlanta', 'Miami', '$1,180'],
  ['Phoenix', 'Los Angeles', '$980'],
  ['Chicago', 'Denver', '$2,050'],
  ['Seattle', 'Salt Lake City', '$1,690'],
];

const PLANS = [
  { name: 'Starter', price: '$0', tagline: 'Getting your first loads moving',
    features: ['Pay-per-load pricing', 'Standard bids', '3 RFQs per day', 'Basic support', 'Standard tracking'] },
  { name: 'Pro', price: '$49', tagline: 'Posting and bidding every day', featured: true,
    features: ['Unlimited bids', 'Analytics dashboard', 'Early RFQ access', 'Priority support', 'Advanced tracking', 'Custom reports'] },
  { name: 'Enterprise', price: 'Custom', tagline: 'High-volume fleets and shippers',
    features: ['Dedicated support', 'API access', 'White-label bidding', 'Custom integrations', 'Advanced analytics', 'Priority support'] },
];

const VOICES = [
  { name: 'Marcus Reed', role: 'Logistics Manager', company: 'Reed Logistics',
    quote: 'We used to spend a full day working the phones for one lane. On Overland the rate settles itself in minutes, and every carrier is already verified.' },
  { name: 'Emily Carter', role: 'Transport Coordinator', company: 'Heartland Foods',
    quote: 'Live tracking and instant booking cut our dwell time noticeably. I can see exactly where every load sits without chasing a single dispatcher.' },
  { name: 'Dave Thompson', role: 'Owner-Operator', company: 'Thompson Trucking',
    quote: 'As a carrier, this is the first board where I win loads on service, not just who called first. It has grown my monthly revenue for real.' },
];

export function ProductsSection() {
  return (
    <section id="products" className="bg-[#FAF9F7] py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display text-[clamp(32px,4.4vw,57px)]">What you get.</h2>
        <p className="aon-body mt-6 max-w-[52ch] text-[15px] leading-[1.7]">
          One exchange underneath. Every load is verified, priced in the open, and
          tracked to delivery without a single check-call.
        </p>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[9px] border border-[rgba(17,17,17,.08)] bg-[rgba(17,17,17,.08)] sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map(([status, name, body]) => (
            <article key={name} className="bg-[#FAF9F7] p-7">
              <span
                className="aon-eyebrow"
                style={{
                  fontSize: 9,
                  color: status === 'LIVE' ? ACCENT : 'rgba(17,17,17,.62)',
                }}
              >
                {status}
              </span>
              <h3 className="aon-display mt-4 text-[21px]">{name}</h3>
              <p className="aon-body mt-2 text-[13px] leading-[1.65]">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- integrations */

const SYSTEMS = ['MCLEOD', 'TMW', 'SAP TM', 'ORACLE OTM', 'PROJECT44', 'HIGHWAY', 'RMIS', 'QUICKBOOKS'];

export function IntegrationsSection() {
  return (
    <section className="border-y border-[rgba(17,17,17,.08)] bg-[#FAF9F7] py-20">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display text-[clamp(24px,2.6vw,32px)]">
          Overland speaks your language.
        </h2>
        <p className="aon-body mt-3 text-[14px]">Works with the systems you already run.</p>
        <ul className="mt-12 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {SYSTEMS.map((s) => (
            <li key={s} className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------- exchange / pricing */

export function KpiBand() {
  return (
    <section className="border-y border-[rgba(17,17,17,.08)] bg-[#FAF9F7] py-16">
      <div className="mx-auto grid max-w-[1126px] grid-cols-2 gap-10 px-6 lg:grid-cols-4">
        {KPIS.map(([label, value, delta]) => (
          <div key={label}>
            <div className="aon-display text-[clamp(30px,3.4vw,44px)]">{value}</div>
            <p className="aon-body mt-1 text-[13px]">{label}</p>
            <span className="aon-eyebrow" style={{ color: ACCENT, fontSize: 9 }}>{delta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LanesSection() {
  return (
    <section id="lanes" className="bg-[#FAF9F7] py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <span className="aon-eyebrow" style={{ color: ACCENT }}>Market open</span>
        <h2 className="aon-display mt-5 text-[clamp(32px,4.4vw,57px)]">Live lanes.</h2>
        <p className="aon-body mt-6 max-w-[46ch] text-[15px] leading-[1.7]">
          A sample of what is trading right now. Rates settle as carriers bid, so the
          number you see is the number the market agreed on.
        </p>

        {/* tabIndex + role make the horizontal scroll reachable from the keyboard;
            without them the table can only be panned with a pointer. */}
        <div className="mt-14 overflow-x-auto" tabIndex={0} role="region" aria-label="Lane index, scrolls horizontally">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-[rgba(17,17,17,.12)]">
                <th className="aon-eyebrow py-4 text-left">Origin</th>
                <th className="aon-eyebrow py-4 text-left">Destination</th>
                <th className="aon-eyebrow py-4 text-right">Settled rate</th>
              </tr>
            </thead>
            <tbody>
              {LANES.map(([o, d, rate]) => (
                <tr key={o + d} className="border-b border-[rgba(17,17,17,.06)]">
                  <td className="py-5 text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{o}</td>
                  <td className="py-5 text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{d}</td>
                  <td className="py-5 text-right text-[15px]" style={{ fontFamily: 'Poppins, sans-serif', color: ACCENT }}>{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function PlansSection() {
  return (
    <section id="pricing" className="bg-[#FAF9F7] pb-20 md:pb-28 lg:pb-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display text-[clamp(32px,4.4vw,57px)]">Pricing.</h2>
        <p className="aon-body mt-6 max-w-[46ch] text-[15px] leading-[1.7]">
          A flat fee, never a slice of the linehaul. Our incentive does not move with
          your rate.
        </p>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className="flex flex-col rounded-[9px] p-8"
              style={
                plan.featured
                  ? { background: INK, color: GROUND }
                  : { background: '#FFFFFF', border: '1px solid rgba(17,17,17,.08)' }
              }
            >
              <span
                className="aon-eyebrow"
                style={{ color: plan.featured ? 'rgba(250,249,247,0.72)' : undefined }}
              >
                {plan.name}
              </span>
              <div
                className={plan.featured ? 'aon-display aon-display--light mt-5 text-[44px]' : 'aon-display mt-5 text-[44px]'}
              >
                {plan.price}
                {plan.price.startsWith('$') && plan.price !== '$0' && (
                  <span className="aon-body text-[14px]" style={{ color: plan.featured ? 'rgba(250,249,247,0.72)' : undefined }}> /mo</span>
                )}
              </div>
              <p
                className="mt-2 text-[13px] leading-[1.6]"
                style={{ fontFamily: 'Poppins, sans-serif', color: plan.featured ? 'rgba(250,249,247,0.72)' : 'rgba(17,17,17,.6)' }}
              >
                {plan.tagline}
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex gap-3 text-[14px] leading-[1.6]"
                    style={{ fontFamily: 'Poppins, sans-serif', color: plan.featured ? 'rgba(250,249,247,.75)' : 'rgba(17,17,17,.6)' }}
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full"
                      style={{ background: plan.featured ? GROUND : ACCENT }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#demo"
                className={plan.featured ? 'aon-cta aon-cta--ghost mt-9 self-start' : 'aon-cta aon-cta--dark mt-9 self-start'}
              >
                {plan.price === 'Custom' ? 'Contact sales' : 'Get started'}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VoicesSection() {
  return (
    <section className="border-t border-[rgba(17,17,17,.08)] bg-[#FAF9F7] py-20 md:py-28 lg:py-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display text-[clamp(32px,4.4vw,57px)]">From the board.</h2>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {VOICES.map((v) => (
            <figure key={v.name} className="aon-card flex flex-col p-8">
              <blockquote className="aon-display flex-1 text-[19px] leading-[1.45]">
                {v.quote}
              </blockquote>
              <figcaption className="mt-8">
                <div className="text-[14px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{v.name}</div>
                <div className="aon-eyebrow mt-1" style={{ fontSize: 9 }}>{v.role} · {v.company}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- FAQ */

const FAQ: Array<[string, string]> = [
  ['What does it cost?', 'Nothing. Posting, browsing and bidding are free. There is no subscription and we take no percentage of any rate you agree.'],
  ['Do you vet carriers or shippers?', 'No. You verify that an email address is real and nothing beyond that. Everyone on the board is responsible for checking who they are dealing with before money or freight moves. We show the MC and USDOT numbers people enter so you can look them up yourself on the FMCSA register.'],
  ['Are you a freight broker?', 'No. We do not take custody of freight, quote on your behalf, or handle payment. We introduce two parties by email and step out. That is the whole product.'],
  ['Who can post?', 'Anyone. An individual with one pallet, a corporate shipping department, an owner-operator with an empty return leg, or a fleet with spare capacity.'],
  ['What happens after I accept a bid?', 'You both get an email with the other side\u2019s contact details and the terms as posted. Rate confirmation, insurance, paperwork and payment are between you.'],
  ['FTL or PTL?', 'Both. Post a full trailer, or post a partial and let it share space with freight going the same way.'],
]

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-[#FAF9F7] pb-20 md:pb-28 lg:pb-36">
      <div className="mx-auto max-w-[1126px] px-6">
        <h2 className="aon-display text-[clamp(32px,4.4vw,57px)]">Common questions.</h2>
        <p className="aon-body mt-4 text-[15px]">
          Still have one?{' '}
          <a href="#demo" className="underline underline-offset-4" style={{ color: ACCENT }}>
            Open the board.
          </a>
        </p>

        <div className="mt-14 border-t border-[rgba(17,17,17,.08)]">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="border-b border-[rgba(17,17,17,.08)]">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="aon-display text-[19px]">{q}</span>
                <span
                  aria-hidden
                  className="shrink-0 text-[20px] leading-none transition-transform duration-300"
                  style={{ color: ACCENT, transform: open === i ? 'rotate(45deg)' : 'none' }}
                >
                  +
                </span>
              </button>
              <div
                className="grid transition-all duration-300"
                style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p className="aon-body max-w-[62ch] pb-7 text-[14px] leading-[1.75]">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- closer */

export function CloserSection() {
  return (
    <section id="demo" className="bg-[#111111] py-20 text-[#FAF9F7] md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1126px] px-6 text-center">
        <span className="aon-eyebrow" style={{ color: 'rgba(250,249,247,0.72)' }}>Overland</span>
        <h2 className="aon-display aon-display--light mx-auto mt-6 max-w-[16ch] text-[clamp(36px,5.4vw,63px)]">
          The freight market, priced in the open.
        </h2>
        <p
          className="mx-auto mt-7 max-w-[46ch] text-[15px] leading-[1.7]"
          style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(250,249,247,0.72)' }}
        >
          Post a load or a truck. Take the bid you want. Deal direct.
        </p>
        <div className="mt-9 flex items-center justify-center">
          {/* White pill, not the ghost variant - ghost is dark-on-transparent and
              disappears against this section's black ground. */}
          <a href="#book" className="aon-cta">Open the board</a>
        </div>
      </div>
    </section>
  );
}

export function AonFooter() {
  return (
    <footer className="border-t border-[rgba(250,249,247,.12)] bg-[#111111] py-12 text-[#FAF9F7]">
      <div className="mx-auto flex max-w-[1126px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <span className="aon-eyebrow inline-flex items-center gap-2.5" style={{ color: 'rgba(250,249,247,0.72)', letterSpacing: '.18em' }}>
          <svg viewBox="0 0 128 40" width="30" height="10" aria-hidden style={{ overflow: 'visible' }}>
            <path d="M6 27 H30 C38 27 38 13 46 13 C54 13 54 23 62 23 C70 23 70 13 78 13 C86 13 86 27 94 27 H122"
                  fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          OVERLAND
        </span>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex gap-4">
            <a href="/terms" className="aon-eyebrow" style={{ color: 'rgba(250,249,247,0.72)' }}>Terms</a>
            <a href="/privacy" className="aon-eyebrow" style={{ color: 'rgba(250,249,247,0.72)' }}>Privacy</a>
          </div>
          {/* Stated in the footer of every page, not buried in the terms. */}
          <p className="aon-eyebrow max-w-[52ch] sm:text-right" style={{ color: 'rgba(250,249,247,0.72)', lineHeight: 1.9 }}>
            Overland is not a freight broker. We list, connect and step out. We take no
            cut and never handle payment. We verify emails, not businesses.
          </p>
          <p className="aon-eyebrow" style={{ color: 'rgba(250,249,247,0.72)' }}>
            © {new Date().getFullYear()} Overland
          </p>
        </div>
      </div>
    </footer>
  );
}
