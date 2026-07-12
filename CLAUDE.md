# Spectralmoon Studio V3 — Project Context

**Last updated:** May 2026
**Status:** Active learning project. Portfolio proof. Not yet a service offering.

---

## What this project is

This is Susana's **practice site** — she is learning web design and front-end development by building her own studio portfolio. It is not a client project. It is proof of capability: "I can build this."

The v3 prototype lives at: https://spectralmoonstudio.netlify.app  
The live production site (old version) is at: https://spectralmoonstudio.com  
The v3 replaces the old site once QA passes.

**Do not treat this like a client deadline project.** This is a learning environment. Explain bugs, patterns, and decisions as you fix them. The goal is understanding, not just shipping.

---

## Current offering context

Susana currently offers:
- AI video production (primary income stream)
- Branding / conscious brand strategy

Web building is a **future service** she is working toward. She does not feel ready to offer it yet. The v3 site is her proof of concept — when it's solid, she'll know she's ready.

---

## Tech stack

| Tool | Purpose |
|------|---------|
| HTML / CSS / JS | Vanilla — no framework |
| GSAP + ScrollTrigger | Horizontal pin reel, scroll reveals |
| Lenis | Smooth scroll driver |
| Netlify | Hosting + deployment |
| Cloudinary | Video delivery (CDN optimized) |

---

## File map

| File | What it does |
|------|-------------|
| `index.html` | Main portfolio page — all sections |
| `insights.html` | Manuals / field guides page |
| `style.css` | All styles including mobile breakpoints |
| `script.js` | All scroll, animation, carousel, modal logic |
| `MANUALS.md` | Index of all 5 manuals — live URLs + vault paths |
| `horizontal-scroll-logic.md` | Documented scroll system — v2 pure scrub approach + lessons from wonjyou.studio |
| `assets/` | Images, SVGs, local assets |
| `manuals/` | Local copies of the 5 published manuals |

---

## Scroll system (v2 — pure scrub)

The horizontal pin section uses GSAP `scrub: true` — zero lag, 1:1 with scroll position. No wheel interceptors, no locks. Documented in full in `horizontal-scroll-logic.md`.

Key principles:
- `scrub: true` not `scrub: 0.1` — eliminates visual bleed
- `end = track.scrollWidth - (window.innerWidth - sidebarW)` — exact distance, no padding
- `onLeave` → explicit `lenis.scrollTo` to first section below (prevents Lenis momentum overshoot)
- `isSnapping` flag checked BEFORE `e.preventDefault()` in vertical interceptor

**Mobile:** GSAP pin is completely bypassed on mobile (`window.innerWidth > 768`). Panels stack vertically via CSS.

---

## Known issues (as of May 2026)

All previously logged issues resolved. Awaiting mobile QA pass on live site.

| # | Status | Issue |
|---|--------|-------|
| 1 | ✅ | `doSnap` mobile guard added (line 268 + 300 in script.js) |
| 2 | ✅ | Reveals ScrollTrigger wrapped in desktop-only `else` block |
| 3 | ✅ | Lenis `smoothWheel: !isMobile` |
| 4 | ✅ | `doSnap` has `onComplete` callback + fallback setTimeout |

---

## Design philosophy

Inspired by [wonjyou.studio](https://wonjyou.studio/) — a motion director portfolio studied for scroll interaction patterns. Core lessons:
- Pure scrub over discrete jumps
- Pin duration = content duration (trust GSAP, no artificial buffers)
- Typography over decoration
- Horizontal reel used once, purposefully — not stacked

---

## Local testing

Test changes locally before deploying — serves the project folder exactly as it is,
including any uncommitted edits.

```bash
cd "/Users/spectralmoon/Developer/spectral-moon-studio-v3-proto"
python3 -m http.server 8000
# then open http://localhost:8000  (hard-refresh with Cmd+Shift+R to bypass cache)
# Ctrl+C in the terminal to stop the server
```

Note: localhost has no CDN, so videos load at their slowest here — that's expected,
not a bug. Claude can start/stop this server via Desktop Commander on request.

---

## Deployment

```bash
# Deploy to Netlify (production)
cd /Users/spectralmoon/Developer/spectral-moon-studio-v3-proto
netlify deploy --dir . --prod --site a8f14c41-afa4-403c-88d4-25168a148c15
```

**Rule:** Only deploy when Susana explicitly asks. Do not deploy after every small change.

---

## Obsidian vault references

| Topic | Vault path |
|-------|-----------|
| Manuals index | `Spectralmoon OS/Manuals/` |
| Scroll system docs | `spectral-moon-studio-v3-proto/horizontal-scroll-logic.md` |
| Studio engineering learning path | `Spectralmoon OS/Learning/Studio Engineering — Learning Path & Methodology.md` |
| Teaching modules | `Spectralmoon OS/Learning/Studio/AI Automation Foundations/` |
