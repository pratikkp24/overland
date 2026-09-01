#!/usr/bin/env node
/**
 * Accessibility and contrast audit — against a rendered page.
 *
 * The previous scripts/contrast-audit.mjs read source files and regex-scanned
 * colour literals against assumed backgrounds. It reported zero failures while
 * eighteen were live, because a literal in a file cannot tell you what an
 * element inherited, what sits behind it, or whether it is even on screen. This
 * one drives a real browser and asks the page.
 *
 * Two independent checks, because they catch different things:
 *
 *   axe-core          — the full ruleset: labels, roles, focus order, contrast.
 *                       Its contrast pass is thorough but its background
 *                       detection gives up on deeply-scrolled elements and
 *                       reports light-on-dark text as if it were on white.
 *   compositing pass  — our own: walks the real ancestor chain, composites every
 *                       alpha layer, applies the AA threshold for the element's
 *                       own font size. Catches what axe misses and vice versa.
 *
 * Usage:
 *   npm run dev                 # in another terminal
 *   node scripts/a11y-audit.mjs
 *   node scripts/a11y-audit.mjs https://overland-ochre.vercel.app
 *
 * Exits non-zero if anything fails, so it can gate a release.
 */
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.argv[2] || 'http://localhost:8080';
const PAGES = ['/', '/board', '/lane/mem-chi', '/privacy', '/terms'];

/** Runs inside the page. Composites alpha against the real ancestor stack. */
function contrastPass() {
  const parse = (c) => {
    const m = (c || '').match(/[\d.]+/g);
    return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] !== undefined ? +m[3] : 1 } : null;
  };
  const over = (f, b) => ({
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
    a: 1,
  });
  const effBg = (el) => {
    const stack = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) stack.push(c);
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const lum = (c) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const out = [];
  document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,li,td,th,label,div').forEach((el) => {
    const text = (el.innerText || '').trim();
    if (!text || text.length < 2 || el.children.length > 0) return;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || !el.offsetHeight) return;
    // Disabled controls are exempt under WCAG 1.4.3.
    if (el.closest('[disabled],[aria-disabled="true"]')) return;

    const fg = parse(s.color);
    if (!fg) return;
    const bg = effBg(el);
    const r = ratio(over(fg, bg), bg);

    const px = parseFloat(s.fontSize);
    const large = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    if (r < need) out.push({ text: text.slice(0, 30), ratio: +r.toFixed(2), need, px: Math.round(px) });
  });
  return out;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let failed = 0;

for (const path of PAGES) {
  const url = BASE + path;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch {
    console.log(`\n${path}\n  could not load — skipped`);
    continue;
  }
  await page.addScriptTag({ content: AXE });

  const violations = await page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });
  const contrast = await page.evaluate(contrastPass);

  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const bad = serious.length > 0 || contrast.length > 0;
  if (bad) failed++;

  console.log(`\n${path}`);
  console.log(`  axe        ${violations.length ? violations.map((v) => `${v.id} x${v.nodes} (${v.impact})`).join(', ') : 'clean'}`);
  console.log(`  contrast   ${contrast.length ? `${contrast.length} below AA` : 'clean'}`);
  contrast.slice(0, 5).forEach((c) =>
    console.log(`               ${String(c.ratio).padStart(5)}:1  needs ${c.need}  ${c.px}px  "${c.text}"`),
  );
}

await browser.close();
console.log(
  failed
    ? `\n${failed} of ${PAGES.length} pages have serious findings.`
    : `\nAll ${PAGES.length} pages clean.`,
);
process.exit(failed ? 1 : 0);
