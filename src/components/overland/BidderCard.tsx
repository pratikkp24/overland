import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import Stars from './Stars';
import { carrierLinks } from '@/lib/carrier';

/**
 * Who is behind an offer.
 *
 * We verify nobody, so the only useful thing this can do is show every self-declared
 * detail plainly, say plainly that it is self-declared, and put the real check - the
 * FMCSA register - one click away. A bid with no identity attached is not a market,
 * it is a number, and nobody should book a load against a number.
 *
 * Shared by the demo lane board and the live listings so the two cannot drift.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

export type BidderInfo = {
  name: string;
  accountType: 'individual' | 'company';
  orgName?: string | null;
  city?: string | null;
  website?: string | null;
  mcNumber?: string | null;
  usdotNumber?: string | null;
  /** Epoch ms. Time on the board is weak evidence, but it is evidence. */
  joinedAt?: number | null;
  rating?: { avg: number; count: number; confirmed: number; completion: number | null } | null;
};

const onBoard = (t: number) => {
  const d = Math.round((Date.now() - t) / 864e5);
  if (d < 30) return `${Math.max(1, d)}d`;
  const m = Math.round(d / 30);
  return m < 12 ? `${m}mo` : `${Math.round(m / 12)}y`;
};

/** Shown once beneath a list of offers, not on every card - it is the same sentence. */
export function BidderDisclaimer() {
  return (
    <p className="mt-3 text-[11px] leading-[1.6]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
      Names, MC/USDOT numbers and websites are self-declared. SAFER is the FMCSA&rsquo;s own register:
      check anyone there before you move freight.
    </p>
  );
}

export default function BidderCard({ info, onOpenProfile, onReport }: { info: BidderInfo; onOpenProfile?: () => void; onReport?: () => void }) {
  const { user, openAuth } = useAuth();

  /* Who is behind an offer is the part worth having an account for. The amount stays
     public - open pricing is the whole promise - but the identity, the DOT number and
     the links to check them are for signed-in people. It is also the only honest place
     to draw the line: we can hold someone to a verified email, and nothing else. */
  if (!user) {
    return (
      <div className="mt-2 rounded-[9px] px-3 py-2.5 text-center"
           style={{ background: 'rgba(30,77,107,.05)', border: `1px dashed rgba(30,77,107,.22)` }}>
        <p className="text-[12px]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,0.62)' }}>
          Carrier name, MC/USDOT and safety record are visible to members.
        </p>
        <button
          type="button"
          onClick={() => openAuth('shipper')}
          className="mt-1.5 text-[12px] underline underline-offset-2"
          style={{ fontFamily: 'Poppins, sans-serif', color: ACCENT }}
        >
          Sign in to see who bid
        </button>
      </div>
    );
  }

  const links = carrierLinks({
    name: info.orgName || info.name,
    city: info.city ?? undefined,
    website: info.website ?? undefined,
    mcNumber: info.mcNumber ?? undefined,
    usdotNumber: info.usdotNumber ?? undefined,
  });

  const facts: string[] = [info.accountType === 'company' ? 'Company' : 'Owner-operator'];
  if (info.city) facts.push(info.city);
  if (info.joinedAt) facts.push(`on the board ${onBoard(info.joinedAt)}`);

  return (
    <div className="mt-2">
      {info.rating && info.rating.count > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Stars value={info.rating.avg} size={12} />
          <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>
            {info.rating.count} review{info.rating.count === 1 ? '' : 's'} · {info.rating.confirmed} completed
            {info.rating.completion !== null && ` · ${info.rating.completion}% went through`}
          </span>
        </div>
      )}
      {(!info.rating || info.rating.count === 0) && (
        <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>
          No completed deals on Overland yet
        </span>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px]"
           style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)' }}>
        {facts.map((f, i) => (
          <React.Fragment key={f}>
            {i > 0 && <span aria-hidden>·</span>}
            <span>{f}</span>
          </React.Fragment>
        ))}
        {info.usdotNumber && (
          <><span aria-hidden>·</span><span className="aon-num" style={{ fontSize: 11, color: INK }}>DOT {info.usdotNumber}</span></>
        )}
        {info.mcNumber && (
          <><span aria-hidden>·</span><span className="aon-num" style={{ fontSize: 11, color: INK }}>MC {info.mcNumber}</span></>
        )}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="rounded-[6px] px-2 py-[3px] text-[10.5px]"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: l.weight === 'verify' ? ACCENT : 'rgba(17,17,17,.65)',
              background: l.weight === 'verify' ? 'rgba(30,77,107,.07)' : 'transparent',
              border: `1px solid ${l.weight === 'verify' ? 'rgba(30,77,107,.22)' : HAIR}`,
            }}
          >
            {l.label} ↗
          </a>
        ))}
        {onOpenProfile && (
          <button type="button" onClick={onOpenProfile}
                  className="rounded-[6px] px-2 py-[3px] text-[10.5px]"
                  style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)', border: `1px solid ${HAIR}` }}>
            Profile
          </button>
        )}
        {onReport && (
          <button type="button" onClick={onReport}
                  className="rounded-[6px] px-2 py-[3px] text-[10.5px]"
                  style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,.65)', border: `1px solid ${HAIR}` }}>
            Report
          </button>
        )}
      </div>
    </div>
  );
}
