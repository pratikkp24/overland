import React, { useEffect, useState } from 'react';

/**
 * "Add to Home Screen" prompt.
 *
 * Two different mechanics, because the platforms differ:
 *  - Android/Chrome fires `beforeinstallprompt`, which we capture and replay on tap.
 *    That gives a real OS install dialog.
 *  - iOS Safari has no such event. Apple only allows install through Share ->
 *    Add to Home Screen, so there we show instructions instead of a button that
 *    cannot work.
 *
 * Suppressed when already installed, and dismissal is remembered for 30 days so it
 * never turns into nagging.
 */

const DISMISS_KEY = 'overland.install.dismissed';
const DISMISS_DAYS = 30;
const ACCENT = '#1E4D6B';
const INK = '#111111';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);

const recentlyDismissed = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < DISMISS_DAYS * 864e5;
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Android / desktop Chrome
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // iOS: no event exists, so offer instructions after the visitor has engaged
    let t: number | undefined;
    if (isIOS()) {
      t = window.setTimeout(() => { setIos(true); setShow(true); }, 12000);
    }

    const onInstalled = () => setShow(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      if (t) window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-3 z-[80] md:hidden"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      role="dialog"
      aria-label="Add Overland to your home screen"
    >
      <div
        className="flex items-start gap-3 rounded-[12px] p-4"
        style={{ background: '#FFFFFF', border: '1px solid rgba(17,17,17,.10)', boxShadow: '0 18px 40px -20px rgba(17,17,17,.35)' }}
      >
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: INK, color: '#FAF9F7', fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600 }}
        >
          OV
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-tight" style={{ fontFamily: 'Poppins, sans-serif', color: INK, fontWeight: 500 }}>
            Keep the board one tap away
          </p>

          {ios ? (
            <p className="mt-1 text-[12.5px] leading-[1.55]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,0.62)' }}>
              Tap <span style={{ color: ACCENT }}>Share</span>, then{' '}
              <span style={{ color: ACCENT }}>Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1 text-[12.5px] leading-[1.55]" style={{ fontFamily: 'Poppins, sans-serif', color: 'rgba(17,17,17,0.62)' }}>
              Add Overland to your home screen. Opens full screen, no browser bars.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {!ios && (
              <button type="button" onClick={install} className="aon-cta aon-cta--dark">
                Add to home screen
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="aon-eyebrow"
              style={{ color: 'rgba(17,17,17,.65)', padding: '6px 4px' }}
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 p-1"
          style={{ color: 'rgba(17,17,17,.65)', fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
