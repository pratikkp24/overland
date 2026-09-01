import React, { useState } from 'react';
import { parseQuery, type ParsedQuery } from '@/lib/parseQuery';

/**
 * Search box with an AI toggle.
 *
 * Off: plain substring matching, which is what most people want and is instant.
 * On:  the deterministic parser runs first; only if it understood nothing does the
 *      request go to the model. So the common case never pays the latency or the cost,
 *      and results stay reproducible.
 *
 * Whatever it understood is shown back as chips. A search box that silently reinterprets
 * your words is worse than one that ignores them.
 */

const INK = '#111111';
const ACCENT = '#1E4D6B';
const HAIR = 'rgba(17,17,17,.10)';

export default function SmartSearch({
  value, onChange, onParsed,
}: { value: string; onChange: (v: string) => void; onParsed: (p: ParsedQuery | null) => void }) {
  const [ai, setAi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    if (!ai || !value.trim()) { setParsed(null); onParsed(null); return; }
    setNote(null);

    const local = parseQuery(value);
    if (!local.residual) {          // parser handled it - no model call
      setParsed(local); onParsed(local);
      return;
    }

    const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!base) { setParsed(local); onParsed(local); setNote('Could not interpret that.'); return; }

    setBusy(true);
    try {
      const r = await fetch(`${base}/functions/v1/ai-search`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q: value }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json();
      const merged: ParsedQuery = {
        kind: d.kind ?? undefined, originCode: d.originCode ?? undefined,
        destCode: d.destCode ?? undefined, equipment: d.equipment ?? undefined,
        maxRate: d.maxRate ?? undefined, minRate: d.minRate ?? undefined,
        sort: d.sort ?? undefined, dims: d.dims ?? undefined,
        weightLbs: d.weightLbs ?? undefined,
        understood: d.understood ?? [],
      };
      setParsed(merged); onParsed(merged);
      if (!merged.understood.length) setNote('Could not interpret that. Showing a plain text match.');
    } catch {
      setParsed(local); onParsed(local);
      setNote('Smart search is unavailable. Showing a plain text match.');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
            onBlur={run}
            placeholder={ai
              ? 'Try: cheap trucks for 15x15 carton from LA to SF'
              : 'Search a city or code — Dallas, DFW, reefer…'}
            aria-label="Search lanes"
            className="w-full rounded-[9px] px-4 py-2.5 text-[14px] outline-none"
            style={{ fontFamily: 'Poppins, sans-serif', background: 'rgba(17,17,17,.04)',
                     border: `1px solid ${ai ? 'rgba(30,77,107,.35)' : HAIR}` }}
          />
          {busy && (
            <span className="aon-eyebrow absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ fontSize: 9, color: ACCENT }}>thinking…</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => { const next = !ai; setAi(next); if (!next) { setParsed(null); onParsed(null); setNote(null); } }}
          aria-pressed={ai}
          className="aon-eyebrow flex items-center gap-2 rounded-full px-4 py-2.5 transition-colors"
          style={{ background: ai ? INK : 'transparent', color: ai ? '#FAF9F7' : 'rgba(17,17,17,.62)',
                   border: `1px solid ${ai ? INK : HAIR}` }}
        >
          <span aria-hidden style={{ opacity: ai ? 1 : 0.45 }}>✦</span>
          Smart search
        </button>
      </div>

      {ai && parsed && parsed.understood.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="aon-eyebrow" style={{ fontSize: 9, color: 'rgba(17,17,17,.65)' }}>reading this as</span>
          {parsed.understood.map((u) => (
            <span key={u} className="aon-eyebrow rounded-full px-2.5 py-1"
                  style={{ fontSize: 9, background: 'rgba(30,77,107,.08)', color: ACCENT }}>
              {u}
            </span>
          ))}
        </div>
      )}

      {ai && note && (
        <p className="aon-body mt-2 text-[12px]">{note}</p>
      )}
    </div>
  );
}
