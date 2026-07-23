# Horizontal Scroll Logic + Web Design Lessons

**Project:** Spectralmoon Studio V3 Prototype  
**Last updated:** May 2026  
**Status:** Production uses Pure Scrub (v2). Complex navLock system documented below for reference.

---

## Lessons from wonjyou.studio (Won J You)

Site analyzed: [wonjyou.studio](https://wonjyou.studio/)  
Won J You is a creative/motion director portfolio — studied as the primary scroll inspiration.

### What they do technically

- **Pure GSAP scrub** — no wheel interceptors, no discrete jumps, no animation locks
- `scrub: true` gives a rubber-band feel: the content moves exactly as fast as you scroll
- `end: "+=" + (track.offsetWidth - window.innerWidth)` — pin ends the moment the last screen is fully visible, nothing more
- Built with Next.js (React), but the scroll pattern translates directly to vanilla JS + GSAP

### Why it feels premium

The scroll is **predictable and physical**. Because it's 1:1 with your finger/wheel, your brain doesn't have to wait for the page to "decide" where to go. You feel in control. Most portfolio sites that try snapping feel clunky because the discrete jump fights your input.

### Design lessons to carry forward

**1. Less is more with scroll interaction**  
Don't fight the user's scroll. Intercept only when absolutely necessary. Every `e.preventDefault()` you write is a potential point of frustration.

**2. Pin duration = content duration**  
The pin should last exactly as long as there is content to show. No hold zones, no buffers. Trust GSAP.

**3. Horizontal reel as a rhythm break**  
The horizontal section works because the rest of the site is vertical. It feels intentional — not gimmicky — because it's used once and purposefully. Don't stack multiple horizontal reels.

**4. Typography over decoration**  
Won J You uses almost no decorative elements. Big type, strong hierarchy, generous white space. The movement IS the design.

**5. Smooth scroll should be subtle**  
Their Lenis config (or equivalent) uses short duration and light easing. Smooth scroll that's too bouncy draws attention to itself. The goal is feel, not spectacle.

**6. Mobile — just scroll normally**  
The horizontal pin is disabled on mobile. On narrow screens they fall back to a vertical layout. No fancy workarounds. This is the right call — horizontal scroll on mobile is a UX anti-pattern.

**7. Load reveals with scroll, not time**  
Text and elements fade/translate in as the user scrolls into them — not on a timer. This keeps the user engaged and in control of the pacing.

**8. Color restraint**  
2–3 colors max in the primary palette. Accent color used sparingly (one element per screen). Won J You uses near-black, off-white, and one warm accent — very similar to Spectralmoon's `--espresso`, `--cream`, `--ochre` system.

---

---

## Overview

The site has a horizontally-scrolling "pin reel" section (Section II) containing 3 panels that scroll left-to-right while the section is pinned in the viewport. Below and above it are regular vertical-scroll sections.

Two scroll libraries are in play:
- **Lenis** — smooth-scroll driver (wraps native scroll, provides `lenis.scrollTo()`)
- **GSAP ScrollTrigger** — pin management and scroll-linked animation

---

## v2 — Pure Scrub (current production approach)

Inspired by [wonjyou.studio](https://wonjyou.studio/) — their Next.js bundle used `scrub: true` with no wheel interceptors.

### How it works

```javascript
gsap.timeline({
  scrollTrigger: {
    trigger: pinSection,
    start: 'top top',
    end: () => `+=${track.scrollWidth - (window.innerWidth - sidebarW)}`,
    pin: true,
    scrub: true,          // instant 1:1 sync — no lag, no bleed
    invalidateOnRefresh: true,
    anticipatePin: 1,
    id: 'pin-reel',
  },
}).to(track, {
  x: () => `-${distance}px`,
  ease: 'none',
});
```

**Key principles:**
- `scrub: true` — GSAP translates the track pixel-perfectly with scroll position. No animation lag.
- `end = raw track distance` — pin lasts exactly as long as it takes to scroll through all content. No artificial padding.
- **No wheel interceptors.** GSAP ScrollTrigger natively handles the pin boundary in both directions.
- **No locks, no flags.** State is always derivable from scroll position. Nothing can deadlock.

**Vertical interceptor** (simplified):
```javascript
document.addEventListener('wheel', (e) => {
  const st = ScrollTrigger.getById('pin-reel');
  if (st && st.isActive) return; // pin active — GSAP owns it, do nothing
  // ... normal vertical section snapping with isSnapping guard
});
```

**Why it's better:**
- Zero visual bleed between screens (scrub lag was the root cause)
- No deadlocks — there are no locks to acquire
- No back-scroll freeze — GSAP re-enters the pin from below automatically
- Far fewer lines of code

---

## v1 — Complex navLock System (archived)

This was the approach used during development. Documented here in case any part needs to be revived.

### Core concept

The idea was to give the user a "discrete" experience — one wheel gesture = one full screen advance — rather than free scrubbing. To do this, scroll events were intercepted and converted into `lenis.scrollTo()` jumps.

### Key constants

```javascript
const HOLD_RATIO    = 0.12;  // Extra 12% scroll distance beyond track content
                              // Creates a "landing zone" so the last screen
                              // stays visible long enough for Lenis to settle.
const TOTAL_SCREENS = 3;     // Number of panels in .pin-section__track
```

**Why HOLD_RATIO existed:**  
With `scrub: 0.1` (slight lag), if the pin ended exactly when the track finished scrolling, Lenis momentum could carry the scroll past the end before GSAP caught up — causing the botanical panel to flash and disappear. The hold zone gave GSAP time to land.

### navLock

```javascript
let navLock = false;

function acquireNavLock(fallbackMs) {
  if (navLock) return false;    // another jump in progress — reject
  navLock = true;
  if (fallbackMs) setTimeout(() => { navLock = false; }, fallbackMs);
  return true;
}
function releaseNavLock() { navLock = false; }
```

The lock prevented two jumps from firing simultaneously (e.g. horizontal interceptor + vertical interceptor both reacting to the same wheel event).

**Fallback timer** was necessary because `lenis.scrollTo()` `onComplete` callbacks sometimes never fired (Lenis bug if the target was already close to current position), which would leave the lock permanently acquired.

### screenToScrollY

Converts a screen index (0, 1, 2) to the page `scrollY` that would put that screen in view:

```javascript
function screenToScrollY(idx) {
  const st = ScrollTrigger.getById('pin-reel');
  const trackEnd = 1 - HOLD_RATIO;            // 0.88
  const step     = trackEnd / (TOTAL_SCREENS - 1);  // 0.44 per screen
  // Last screen: aim for the middle of the hold zone, not the end
  if (idx >= TOTAL_SCREENS - 1) {
    return st.start + (trackEnd + HOLD_RATIO * 0.5) * (st.end - st.start);
  }
  return st.start + Math.min(trackEnd, idx * step) * (st.end - st.start);
}
```

**Why holdMid for the last screen:**  
Targeting `trackEnd` (0.88) exactly caused the botanical panel to still flash — Lenis could overshoot and exit the pin. Targeting `trackEnd + HOLD_RATIO * 0.5` (0.94) gave a safe mid-hold-zone landing.

### Pin ScrollTrigger (v1)

```javascript
const pinTL = gsap.timeline({
  scrollTrigger: {
    trigger: pinSection,
    start: 'top top',
    end: () => `+=${getDistance() / (1 - HOLD_RATIO)}`, // inflated by hold ratio
    pin: true,
    scrub: 0.1,          // 100ms lag — fast enough visually but still caused bleed
    id: 'pin-reel',
    onEnter:     () => { activeScreen = 0; },
    onLeave:     () => { /* suppress doSnap, hide hint */ },
    onLeaveBack: () => { activeScreen = 0; /* hide hint */ },
    onUpdate:    (self) => { syncScreenFromProgress(self.progress); /* hint at 0.86+ */ },
  },
});
pinTL.to(track, { x: () => `-${getDistance()}px`, ease: 'none', duration: 1 - HOLD_RATIO }, 0);
pinTL.to({}, { duration: HOLD_RATIO });  // ← hold zone: empty tween that pads the timeline
```

### Horizontal wheel interceptor (v1)

```javascript
document.addEventListener('wheel', (e) => {
  const st = ScrollTrigger.getById('pin-reel');
  if (!st || !st.isActive) return;

  // Determine direction (supports trackpad horizontal swipe too)
  const fwd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX > 4 : e.deltaY > 4;
  const bwd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX < -4 : e.deltaY < -4;

  // Last screen → forward → programmatically exit pin
  if (fwd && activeScreen >= TOTAL_SCREENS - 1) {
    lenis.scrollTo(st.end + 10, { duration: 0.7, onComplete: releaseNavLock });
    return;
  }
  // First screen → backward → let pin exit upward naturally (don't preventDefault)
  if (bwd && activeScreen <= 0) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  if (fwd) jumpToScreen(activeScreen + 1);
  if (bwd) jumpToScreen(activeScreen - 1);
}, { passive: false, capture: true });
```

### Vertical interceptor (v1) — pin re-entry

The biggest source of bugs. When scrolling **up** from the section below the pin, we wanted to land on the botanical panel (last screen), not the beginning of the pin.

```javascript
// Going UP, near the pin → re-enter at botanical
if (goingUp && stPin && lenis.scroll <= stPin.end + window.innerHeight * 2.0) {
  e.preventDefault();
  if (!acquireNavLock(900)) return;
  lenis.scrollTo(window._pinLastScreenScrollY(), {
    duration: 0.65,
    onComplete: releaseNavLock,
  });
  return;
}
```

**Why this was removed in v2:**  
With pure scrub, GSAP ScrollTrigger handles this automatically. When you scroll up and `lenis.scroll` re-enters the pin zone, GSAP unpins at the correct progress value — no manual re-entry needed.

### Known bugs in v1 (reasons it was replaced)

| Bug | Cause |
|-----|-------|
| Visual bleed between screens | `scrub: 0.1` lag → GSAP 100ms behind → neighbour screen visible |
| "Freeze halfway" on back-scroll | navLock acquired but `onComplete` never fired → permanent lock |
| Skip screen 3 going down | `isNavigating` scoped inside `if` block, invisible to vertical interceptor |
| White space at pin exit | HOLD_RATIO too large (0.25) → blank space after botanical before next section |
| Back-scroll impossible | Vertical interceptor's pin re-entry would immediately fire backward jump |

---

## Reveals ScrollTrigger

Separate from the pin timeline — triggers word-by-word reveals of text overlays.

```javascript
// v2 thresholds (pure scrub, 3 equal-width screens):
// Screen 0 (first): progress 0.00 → 0.33
// Screen 1 (manifesto): progress 0.33 → 0.66  → reveal at 0.25
// Screen 2 (botanical): progress 0.66 → 1.00  → reveal at 0.75

ScrollTrigger.create({
  trigger: '.pin-section',
  start: 'top top',
  end: () => `+=${distance}`,     // same as pin-reel end
  onUpdate: (self) => {
    if (self.progress > 0.25 && !window.__manifestoRevealed) { /* stagger in */ }
    if (self.progress > 0.75 && !window.__taglineRevealed)   { /* stagger in */ }
  },
});
```

The `window.__manifestoRevealed` / `window.__taglineRevealed` flags prevent re-triggering on back-scroll.

---

## Scroll stack summary

```
Native scroll event
  └─ Lenis (smoothing + lenis.scrollTo API)
       └─ lenis.on('scroll', ScrollTrigger.update)  ← keeps GSAP in sync
            └─ GSAP ScrollTrigger
                 └─ pin-reel: pins .pin-section, drives track.x via scrub
```

Lenis `wheelMultiplier: 0.6` and `duration: 0.5` keep the feel calm — less momentum than default.

---

## File locations

| File | Purpose |
|------|---------|
| `script.js` | All scroll, animation, carousel, modal logic |
| `style.css` | `.pin-section`, `.pin-section__track`, `.panel` layout |
| `index.html` | `.pin-section > .pin-section__track > .panel` × 3 |
