# Tomorrow Brief — Thursday 2026-06-11
**Project:** Spectralmoon Studio V3
**Written:** Wed 2026-06-10, end of session

---

## Main goal tomorrow
Decide the **parallax direction** (keep one clean version / redo / drop it), then **resync the live Netlify site with the clean local baseline** — right now they've diverged (see the state note below).

---

## ⚠️ State note: local and live are OUT OF SYNC
- Earlier today we deployed to Netlify (deploy `6a29a4c1…`). **That deploy included the experimental parallax/3D/rim code.**
- We then **removed all that experimental code locally.**
- So: **local files = clean baseline**, but **spectralmoonstudio.netlify.app still has the experimental parallax.**
- → To fix: run the deploy command again once you're happy with the clean baseline (see Quick reference).

---

## What we did today (2026-06-10)
- **KEPT (live + local):** Brand Identity carousel reorder — **Frostrand moved to position 02** (01 Limitless · 02 Frostrand · 03 Sepal · 04 Grime · 05 Grime Glow). Already deployed.
- **KEPT (local; needs redeploy):** Hero **font-race fix** — removed "Anton" from the desktop STUDIO mask font stack, so it no longer flashes the mobile font before Archivo Black loads on a cold load.
- **EXPLORED, then REMOVED:** parallax on panels/contact/about — card-slide, real 3D `translateZ`/perspective, inset "container" rim, contact background drift, and the contact sequenced reveal. All stripped from local at your request. (Still on Netlify until next deploy.)
- **Filed Zera Lesson 14** transcript → vault: `Learning/Studio/Web Building/_transcripts/zera-lesson-14-refining-and-fixing-ai-outputs.txt` (Lesson 13 was already filed).
- **UNUSED-ASSETS:** reviewed (1.2 GB, 34 files incl. `dwell.mp4` at 955 MB). Decided **NOT** to delete — you'll back up to iCloud first, then delete.

---

## Key lessons learned (so we don't repeat them)
- **Confirm the test environment FIRST.** We lost a lot of time because the page was being viewed (a) on the **live Netlify URL** instead of localhost, and (b) in DevTools **responsive mode below 768px**, where ALL desktop-only effects are switched off by `isMobile = innerWidth <= 768`. → Test on **localhost at full desktop width**.
- `isMobile` is read **once at page load** — after resizing, hard-refresh or it stays stuck in the old mode.
- The local `python3 -m http.server 8000` can **hang on the heavy video requests** (stops responding while still holding the port). If localhost goes dead: kill it and restart.
- **Cache-bust** by bumping the `?v=` number on `script.js` / `style.v2.css` in `index.html`.

---

## Bugs found during QA (open)
- **Mobile expand-icon:** the carousel "enlarge" icon is hover-driven (`mouseenter`), so it's invisible/non-functional on touch. There's CSS to show it on `.carousel__item.is-active` on mobile — needs verifying/fixing so it's discoverable.
- **Frostrand caption:** a large ghosted "…STRAND" overlapped the small caption in one screenshot — check whether it's a transient caption animation or a real bug.

---

## Open follow-ups (priority)

| Priority | Item | Notes |
|---|---|---|
| High | Resync Netlify with clean local | Redeploy so the live site no longer has the removed experimental parallax. |
| High | GoDaddy → point domain at V3 | STILL the big one from the original brief — `spectralmoonstudio.com` still serves the OLD site. Needs your GoDaddy login + DNS decision (let Netlify manage DNS vs. A record + CNAME). |
| High | Cloudinary video delivery | You asked how to connect — biggest speed win. Free account → upload the 22 used videos → swap `src`s to `…/f_auto,q_auto/…`. Claude does the swap once they're uploaded. |
| Medium | Decide parallax direction | Keep one subtle version / redo / drop. If keeping, build ONE clean version (Lesson 14: one layer at a time). |
| Medium | Mobile expand-icon fix | Show the icon persistently on touch devices. |
| Medium | Mobile QA on a real phone | Eyeball `<768px` on your actual phone. |
| Low | Connect Claude-in-Chrome extension | Installed but not signed in — sign in so Claude can debug the page live next session. |
| Low | Delete UNUSED-ASSETS | Only after the iCloud backup is confirmed. |

---

## Quick reference
```bash
# Local test
cd "/Users/spectralmoon/Developer/spectral-moon-studio-v3-proto"
python3 -m http.server 8000   # → http://localhost:8000  (Cmd+Shift+R to bust cache; test at FULL desktop width)

# Deploy to production (resync Netlify)
netlify deploy --dir . --prod --site a8f14c41-afa4-403c-88d4-25168a148c15
```
- **Live (Netlify):** https://spectralmoonstudio.netlify.app
- **Old prod (to be replaced):** https://spectralmoonstudio.com
- **Unused assets archive:** `/Users/spectralmoon/Developer/spectral-moon-studio-v3-UNUSED-ASSETS`
- **Zera course vault:** `Spectralmoon OS/Learning/Studio/Web Building/`
