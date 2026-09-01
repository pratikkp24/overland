import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { scrollToEl } from '@/lib/scrollTo';

/**
 * Mobile bottom tab bar.
 *
 * Phones get an app shell rather than a scrolling brochure: persistent bottom
 * navigation, thumb-reachable, safe-area aware. Hidden from md upward, where the
 * top nav does the job.
 */

const ACCENT = '#1E4D6B';
const INK = '#111111';

/* Icons are drawn rather than pulled from a set so each one says what the tab
   actually is. The generic versions were a chart, a plus, a pulse line and a
   person - none of which mean anything in freight. A lane is two places and the
   road between them, so that is what the lane icon draws. */

type IconProps = { active: boolean };

const S = {
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** The board: a rate sheet - a framed table with a header rule and rows. */
const BoardIcon = ({ active }: IconProps) => (
  <svg {...S}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M3 8.75h18" />
    <path d="M6.75 12.5h4.5M6.75 16h8" />
    {active && <circle cx="16.5" cy="12.5" r="1.15" fill="currentColor" stroke="none" />}
  </svg>
);

/** Post: the primary action, so it carries weight the others do not. */
const PostIcon = ({ active }: IconProps) => (
  <svg {...S} strokeWidth={active ? 0 : 1.6}>
    <circle cx="12" cy="12" r="8.6" fill={active ? 'currentColor' : 'none'} />
    <path d="M12 8.2v7.6M8.2 12h7.6"
          stroke={active ? '#FAF9F7' : 'currentColor'} strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** A lane: an origin, a destination, and the road between them. */
const LanesIcon = ({ active }: IconProps) => (
  <svg {...S}>
    <path d="M6.5 16.4c3.4 0 3.4-4.4 5.5-4.4s2.1 -4.4 5.5-4.4" />
    <circle cx="5.6" cy="17.4" r="2.1" fill={active ? 'currentColor' : 'none'} />
    <circle cx="18.4" cy="6.6" r="2.1" fill={active ? 'currentColor' : 'none'} />
  </svg>
);

/** You. */
const YouIcon = ({ active }: IconProps) => (
  <svg {...S}>
    <circle cx="12" cy="8.4" r="3.6" fill={active ? 'currentColor' : 'none'} />
    <path d="M5.4 19.8a6.6 6.6 0 0 1 13.2 0" />
  </svg>
);

const TABS = [
  { key: 'board', label: 'Board', href: '/board', Icon: BoardIcon },
  { key: 'post',  label: 'Post',  href: '#post',  Icon: PostIcon },
  { key: 'lanes', label: 'Lanes', href: '#lanes', Icon: LanesIcon },
  { key: 'you',   label: 'You',   href: '#you',   Icon: YouIcon },
];

export default function MobileTabBar({ onPost }: { onPost?: () => void } = {}) {
  const { user, openAuth } = useAuth();
  const nav = useNavigate();
  const { pathname, hash } = useLocation();

  const go = (t: typeof TABS[number]) => {
    // Was nav('/board'), which is the tab next to it - so "You" appeared to do nothing.
    if (t.key === 'you') {
      if (!user) return openAuth('shipper');
      return window.dispatchEvent(new CustomEvent('overland:open-profile'));
    }
    if (t.key === 'post') { if (!user) return openAuth('shipper'); if (onPost) return onPost(); return nav('/board'); }
    if (t.href.startsWith('/')) return nav(t.href);
    const el = document.querySelector(t.href);
    el ? scrollToEl(el, { offset: 64 }) : nav('/' + t.href);
  };

  // No fallback: on a page that is none of these, nothing should look selected.
  const activeKey =
    hash === '#lanes' ? 'lanes'
    : hash === '#you' ? 'you'
    : pathname === '/board' ? 'board'
    : null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] md:hidden"
      style={{
        background: 'rgba(250,249,247,.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(17,17,17,.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const on = t.key === activeKey;
          return (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => go(t)}
                aria-current={on ? 'page' : undefined}
                className="flex w-full flex-col items-center gap-1 py-2.5"
                style={{ color: on ? ACCENT : 'rgba(17,17,17,.45)' }}
              >
                <t.Icon active={on} />
                <span
                  className="text-[10px]"
                  style={{ fontFamily: 'Poppins, sans-serif', fontWeight: on ? 600 : 400, color: on ? INK : 'rgba(17,17,17,.62)' }}
                >
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
