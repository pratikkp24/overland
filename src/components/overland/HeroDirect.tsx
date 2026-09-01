import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import HeroDeck from './HeroDeck';
import Logo from './Logo';

/**
 * Straight-to-business hero.
 *
 * A first-time visitor has three questions: what is this, what does a lane pay, and
 * how do I start. This answers all three above the fold, with no scrolling required.
 * The diorama film still exists further down as the narrative version.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

export default function HeroDirect() {
  const { user, openAuth } = useAuth();
  const nav = useNavigate();
  return (
    <section className="bg-[#FAF9F7] pt-10 pb-14 md:pt-12 md:pb-16">
      <div className="mx-auto max-w-[1126px] px-6">
        {/* On a phone the app frame is the hook and belongs directly under the
            headline, not below three paragraphs — so the column is split in two
            and the frame is ordered between them. On lg the original two-column
            arrangement is restored by explicit placement. */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">

          <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
            {/* The mark alone, and larger. The full lockup sits in the nav about
                90px above this, so repeating the wordmark here read as a mistake
                rather than as branding. */}
            <Logo size={26} variant="mark" />

            <h1 className="aon-display mt-6 max-w-[14ch] text-[clamp(38px,6vw,68px)]">
              Freight and trucks, <span style={{ color: ACCENT }}>priced in the open.</span>
            </h1>

          </div>

          <div className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <HeroDeck />
          </div>

          <div className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
            {/* Two questions, answered in two sentences. A visitor who reads only
                this much should already know whether the product is for them. */}
            <dl className="mt-7 max-w-[38ch] space-y-5 lg:mt-0">
              <div>
                <dt className="aon-eyebrow">What we do</dt>
                <dd className="aon-body mt-1.5 text-[16px] leading-[1.55]">
                  Post a load or a truck. Every bid is public.
                </dd>
              </div>
              <div>
                <dt className="aon-eyebrow">Who it is for</dt>
                <dd className="aon-body mt-1.5 text-[16px] leading-[1.55]">
                  Owner-operators, small fleets, and shippers who are tired of
                  guessing the rate.
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (user ? nav('/board') : openAuth('shipper'))}
                className="aon-cta aon-cta--dark"
              >
                {user ? 'Go to the board' : 'Sign up free'}
              </button>
              <a href="#book" className="aon-cta aon-cta--ghost">Open the board</a>
            </div>

            <p className="aon-eyebrow mt-7" style={{ lineHeight: 1.9 }}>
              Free · No fees · No cut of your rate
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
