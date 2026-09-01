import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { buildLanes, money, rpmFmt } from '@/lib/market';

/**
 * "Get trucking now" - open listings as cards.
 *
 * Demo listings for now. Once real postings exist these come from the same table the
 * board reads, and ranking becomes a real algorithm instead of a slice().
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

type Kind = 'loads' | 'trucks';

export default function BookCards() {
  const [kind, setKind] = useState<Kind>('loads');
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const lanes = useMemo(() => buildLanes(), []);

  const cards = lanes.slice(0, 6).map((l, i) => ({
    lane: l,
    posterKind: kind,
    poster: kind === 'loads'
      ? ['Reed Logistics', 'Heartland Foods', 'Cascade Foods', 'Ridgeline Supply', 'Delta Mills', 'Fairview Goods'][i]
      : ['Thompson Trucking', 'Rio Grande Carriers', 'Keystone Logistics', 'Summit Freight', 'Bluecap Haulage', 'Northline Fleet'][i],
    isCompany: i % 3 !== 0,
    ready: ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Mon'][i],
  }));

  const go = () => (user ? navigate('/board') : openAuth(kind === 'loads' ? 'carrier' : 'shipper'));

  return (
    <section id="book" className="bg-[#FAF9F7] py-20 md:py-28">
      <div className="mx-auto max-w-[1126px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="aon-eyebrow"><span className="dot" /> The open marketplace</span>
            <h2 className="aon-display mt-4 text-[clamp(30px,4vw,50px)]">
              Get trucking <span style={{ color: ACCENT }}>now.</span>
            </h2>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-[1.7]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.62)' }}>
              Everything posted is public. Bid on freight, or offer freight to a truck
              running empty. Agree, and you each get the other&rsquo;s email and phone.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['loads', 'trucks'] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="aon-eyebrow rounded-full px-4 py-2 transition-colors"
                style={{
                  background: kind === k ? INK : 'transparent',
                  color: kind === k ? '#FAF9F7' : 'rgba(17,17,17,.62)',
                  border: `1px solid ${kind === k ? INK : HAIR}`,
                }}
              >
                {k === 'loads' ? 'Freight looking for a truck' : 'Trucks looking for freight'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ lane: l, poster, isCompany, ready }) => (
            <article key={l.id} className="aon-card aon-card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="aon-num text-[12px]" style={{ color: 'rgba(17,17,17,.65)' }}>
                  {l.originCode} → {l.destCode}
                </span>
                <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)' }}>{l.equipment}</span>
              </div>

              <h3 className="aon-display mt-3 text-[20px]">{l.origin} → {l.dest}</h3>

              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Rate</dt>
                  <dd className="aon-num mt-1 text-[16px]" style={{ color: INK }}>{money(l.linehaul)}</dd>
                </div>
                <div>
                  <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Per mile</dt>
                  <dd className="aon-num mt-1 text-[16px]" style={{ color: ACCENT }}>{rpmFmt(l.rpm)}</dd>
                </div>
                <div>
                  <dt className="aon-eyebrow" style={{ fontSize: 9 }}>Ready</dt>
                  <dd className="aon-num mt-1 text-[16px]" style={{ color: INK }}>{ready}</dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: HAIR }}>
                <div>
                  <div className="text-[13px]" style={{ fontFamily: 'Poppins, sans-serif', color: INK }}>{poster}</div>
                  {/* Company vs individual is asked at sign-up and shown here - it changes
                      who you think you are dealing with. */}
                  <span className="aon-eyebrow" style={{ color: 'rgba(17,17,17,.65)', fontSize: 9 }}>
                    {isCompany ? 'Company' : 'Individual'} · {l.bids} bids
                  </span>
                </div>
                <button type="button" onClick={go} className="aon-eyebrow" style={{ color: ACCENT }}>
                  {kind === 'loads' ? 'Bid →' : 'Offer freight →'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <button type="button" onClick={go} className="aon-cta aon-cta--dark">Open the board</button>
          <p className="text-[12px] leading-[1.7]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
            Demo listings. Rates are indicative, not quotes — verify every counterparty yourself.
          </p>
        </div>
      </div>
    </section>
  );
}
