/* =============================================
   SPECTRALMOON STUDIO — V3 PROTOTYPE
   Animation + scroll logic
   Live experiment build · May 21, 2026
   ============================================= */

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

/* ----- Lenis smooth scroll — desktop only ----- */
const isMobile = window.innerWidth <= 768;
let lenis = null;

if (!isMobile) {
  lenis = new Lenis({
    duration: 0.5,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    wheelMultiplier: 0.6,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
} else {
  // Mobile — pure native iOS scroll, no Lenis at all.
  // Lenis was still running on mobile (even with smoothWheel:false) because it
  // stayed in the GSAP ticker, intercepting every scroll frame and causing
  // jumpiness + scroll-lock not recovering after modal close.
  window.addEventListener('scroll', ScrollTrigger.update, { passive: true });
}


/* ----- Word splitter (for [data-split] paragraphs) -----
   Wraps each word in <span class="split-word"><span>word</span></span>
   so we can stagger-translate them on reveal (Won J You pattern). */
function splitWords(el) {
  const text = el.textContent.trim();
  const words = text.split(/(\s+)/); // keep whitespace
  el.textContent = '';
  words.forEach((chunk) => {
    if (/^\s+$/.test(chunk)) {
      el.appendChild(document.createTextNode(chunk));
    } else {
      const outer = document.createElement('span');
      outer.className = 'split-word';
      const inner = document.createElement('span');
      inner.textContent = chunk;
      outer.appendChild(inner);
      el.appendChild(outer);
    }
  });
}
document.querySelectorAll('[data-split]').forEach(splitWords);


/* ----- HERO (now Lyra-mask STUDIO) page-load entrance ----- */
if (!isMobile) gsap.set('.stack-line__inner', { yPercent: 110 });

const heroTL = gsap.timeline({ defaults: { ease: 'expo.out' } });

heroTL.from('.hero__mask-svg', {
  opacity: 0,
  scale: 1.04,
  duration: 1.3,
  transformOrigin: 'center center',
}, 0.2);

heroTL.to('.hero__tagline .split-word > span', {
  y: 0,
  duration: 0.7,
  stagger: 0.04,
}, 0.9);

// scroll cue is always visible — CSS scrollBlink handles the pulsing
gsap.set('.hero__scroll-cue', { opacity: 0.6, y: 0, clearProps: 'all' });

/* ----- Pin-progress reveals — manifesto + botanical statement -----
   Pure scrub: progress 0→1 maps 1:1 to track translation.
   3 screens of equal width → manifesto visible ~0.25, botanical ~0.75. */
/* ----- Reveals: desktop uses scroll-progress, mobile reveals immediately -----
   On mobile the track is stacked vertically so scrollWidth ≈ viewportWidth
   and distance = 0, which breaks the ScrollTrigger end calc.
   Solution: just set y:0 immediately on mobile — text is visible on load. */
if (window.innerWidth <= 768) {
  gsap.set(
    '.manifesto__line .split-word > span, .botanical-statement__line .split-word > span',
    { y: 0 }
  );
} else {
  ScrollTrigger.create({
    trigger: '.pin-section',
    start: 'top top',
    end: () => {
      const revealTrack = document.querySelector('.pin-section__track');
      const sidebarW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 84;
      const distance = revealTrack.scrollWidth - (window.innerWidth - sidebarW);
      return `+=${distance}`;
    },
    onUpdate: (self) => {
      if (self.progress > 0.25 && !window.__manifestoRevealed) {
        window.__manifestoRevealed = true;
        gsap.to('.manifesto__line .split-word > span', {
          y: 0, duration: 0.85, stagger: 0.04, ease: 'expo.out',
        });
      }
      if (self.progress > 0.75 && !window.__taglineRevealed) {
        window.__taglineRevealed = true;
        gsap.to('.botanical-statement__line .split-word > span', {
          y: 0, duration: 0.9, stagger: 0.04, ease: 'expo.out',
        });
      }
    },
  });
}


/* ----- Section II — Horizontal pin reel -----
   Pure scrub approach (inspired by wonjyou.studio):
   - scrub: true → 1:1 sync with scroll position, zero visual lag
   - No wheel interceptors, no locks, no discrete jumps
   - GSAP ScrollTrigger handles pin entry/re-entry natively
   - end = raw track distance (no hold zone padding needed) */

const track = document.querySelector('.pin-section__track');
const pinSection = document.querySelector('.pin-section');

if (track && pinSection && window.innerWidth > 768) {
  const getSidebarW = () =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w')) || 84;
  const getDistance = () => track.scrollWidth - (window.innerWidth - getSidebarW());

  gsap.timeline({
    scrollTrigger: {
      trigger: pinSection,
      start: 'top top',
      end: () => `+=${getDistance()}`,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      id: 'pin-reel',
      onLeave: () => {
        const hint = document.getElementById('continue-hint');
        if (hint) hint.style.opacity = '0';
        // Snap explicitly to the first section below — prevents Lenis momentum overshoot
        isSnapping = true;
        clearTimeout(snapDebounce);
        const firstSection = document.querySelector('.section-intro--work');
        if (firstSection) {
          lenis.scrollTo(
            Math.round(firstSection.getBoundingClientRect().top + lenis.scroll),
            {
              duration: 0.45,
              easing: (t) => 1 - Math.pow(1 - t, 3),
              onComplete: () => { isSnapping = false; },
            }
          );
        } else {
          setTimeout(() => { isSnapping = false; }, 600);
        }
      },
      onLeaveBack: () => {
        const hint = document.getElementById('continue-hint');
        if (hint) hint.style.opacity = '0';
      },
      onUpdate: (self) => {
        const hint = document.getElementById('continue-hint');
        if (hint) hint.style.opacity = self.progress >= 0.85 ? '0.75' : '0';
      },
    },
  }).to(track, {
    x: () => `-${getDistance()}px`,
    ease: 'none',
  });
}

/* ----- Sidebar: moon (Home) + I–VI section tracking -----
   Reads the existing pin-reel ScrollTrigger (id:'pin-reel') to know
   when we're in the horizontal reel → show moon.
   After the reel, uses lenis scroll + getBoundingClientRect to find
   which vertical section is dominant → highlight matching nav item.
   No second conflicting ScrollTrigger. */
const sidebarLinks = document.querySelectorAll('.sidebar__link');
const moonEl       = document.querySelector('.sidebar__moon');

// Pulse-ring click burst — adds .is-clicking for 600ms on mousedown
sidebarLinks.forEach(link => {
  link.addEventListener('mousedown', () => {
    link.classList.add('is-clicking');
    setTimeout(() => link.classList.remove('is-clicking'), 600);
  });
});

// Moon — scroll to top + pulse burst
if (moonEl) {
  moonEl.addEventListener('click', (e) => {
    e.preventDefault();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  });
  moonEl.addEventListener('mousedown', () => {
    moonEl.classList.add('is-clicking');
    setTimeout(() => moonEl.classList.remove('is-clicking'), 600);
  });
}

function clearSidebar() {
  sidebarLinks.forEach(a => a.classList.remove('is-active'));
  if (moonEl) moonEl.classList.remove('is-active');
}
function showMoon() {
  if (moonEl && moonEl.classList.contains('is-active')) return;
  clearSidebar();
  if (moonEl) moonEl.classList.add('is-active');
}
function showLink(idx) {
  if (sidebarLinks[idx] && sidebarLinks[idx].classList.contains('is-active')) return;
  clearSidebar();
  if (sidebarLinks[idx]) sidebarLinks[idx].classList.add('is-active');
}

// Each vertical section mapped to its sidebar index 0–5
const navSections = [
  { el: document.querySelector('#screen-cinema'),    idx: 0 },
  { el: document.querySelector('#screen-identity'),  idx: 1 },
  { el: document.querySelector('#screen-dwellings'), idx: 2 },
  { el: document.querySelector('#section-insights'), idx: 3 },
  { el: document.querySelector('#section-about'),    idx: 4 },
  { el: document.querySelector('#section-contact'),  idx: 5 },
].filter(s => s.el);

function updateSidebar() {
  // Is the horizontal pin reel active?
  const pin = ScrollTrigger.getById('pin-reel');
  if (pin && pin.isActive) { showMoon(); return; }

  // Vertical sections — find the one whose top is closest to 35% down viewport
  const target = window.innerHeight * 0.35;
  let best = null, bestDist = Infinity;
  navSections.forEach(s => {
    const rect = s.el.getBoundingClientRect();
    if (rect.bottom < 50 || rect.top > window.innerHeight - 50) return;
    const dist = Math.abs(rect.top - target);
    if (dist < bestDist) { bestDist = dist; best = s; }
  });

  if (best) showLink(best.idx);
  else clearSidebar();
}

// Fire on every Lenis tick + handle scroll-snap
const SNAP_SECTIONS = [
  '.section-intro--work',
  '#screen-cinema',
  '#screen-identity',
  '#screen-dwellings',
  '#section-insights',
  '#section-about',
  '#section-contact',
].map(s => document.querySelector(s)).filter(Boolean);

// #insights-enter now links to insights.html (target="_blank") — no JS override needed

let snapDebounce = null;
let isSnapping   = false;

function getSectionTop(el) {
  // Use getBoundingClientRect + current scroll — reliable even when GSAP
  // inserts a pin-spacer that breaks the offsetParent chain.
  const scrollY = lenis ? lenis.scroll : window.scrollY;
  return Math.round(el.getBoundingClientRect().top + scrollY);
}

function doSnap() {
  if (window.innerWidth <= 768) return; // mobile — no snap, let touch scroll freely
  if (isSnapping) return;
  const pin = ScrollTrigger.getById('pin-reel');
  if (pin && pin.isActive) return; // pin owns scroll — don't snap vertical sections
  const scrollY = lenis ? lenis.scroll : window.scrollY;
  const winH    = window.innerHeight;
  let best = null, bestDist = Infinity;

  SNAP_SECTIONS.forEach(el => {
    const top  = getSectionTop(el);
    const dist = Math.abs(top - scrollY);
    // Only consider sections within 45% of a viewport — avoids trapping
    // users mid-panel on taller sections
    if (dist < winH * 0.6 && dist < bestDist) {
      bestDist = dist;
      best = top;
    }
  });

  if (best !== null && bestDist > 16) {
    isSnapping = true;
    lenis.scrollTo(best, {
      duration: 0.55,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      onComplete: () => { isSnapping = false; }, // unlock as soon as scroll lands
    });
    setTimeout(() => { isSnapping = false; }, 700); // fallback in case onComplete doesn't fire
  }
}

if (lenis) {
  // Desktop — Lenis scroll event drives sidebar + snap debounce
  lenis.on('scroll', ({ velocity }) => {
    updateSidebar();
    const pinReel = ScrollTrigger.getById('pin-reel');
    if (isSnapping || (pinReel && pinReel.isActive)) return; // don't schedule doSnap while pin is active
    clearTimeout(snapDebounce);
    if (Math.abs(velocity) < 0.08) {
      snapDebounce = setTimeout(doSnap, 220);
    }
  });
} else {
  // Mobile — no Lenis; use native scroll event just for sidebar updates
  window.addEventListener('scroll', updateSidebar, { passive: true });
}

/* ----- Mobile snap — handled by CSS scroll-snap-type: y mandatory -----
   Native CSS snap integrates with iOS momentum scroll — no JS debounce bounce.
   JS snap removed to avoid fighting the browser's native snap behaviour. */

/* ----- Vertical snap interceptor — one section per wheel gesture -----
   Fires only when the horizontal pin reel is NOT active.
   Pure scrub: no navLock, no manual pin re-entry — GSAP handles
   the transition back into the pin automatically when scrolling up. */

document.addEventListener('wheel', (e) => {
  if (window.innerWidth <= 768) return;
  const st = ScrollTrigger.getById('pin-reel');
  if (st && st.isActive) return; // pin is active — GSAP scrub owns this
  if (SNAP_SECTIONS.length === 0) return;

  const goingDown = e.deltaY > 4;
  const goingUp   = e.deltaY < -4;
  if (!goingDown && !goingUp) return;

  // Find closest vertical snap section
  const scrollY = lenis.scroll;
  let closestIdx = 0, closestDist = Infinity;
  SNAP_SECTIONS.forEach((el, i) => {
    const dist = Math.abs(getSectionTop(el) - scrollY);
    if (dist < closestDist) { closestDist = dist; closestIdx = i; }
  });

  // Not near any snap section — let Lenis scroll freely
  if (closestDist > window.innerHeight) return;

  const atClosest = SNAP_SECTIONS[closestIdx].getBoundingClientRect().top <= 10;
  // At last section + going down → let natural scroll continue
  if (goingDown && closestIdx >= SNAP_SECTIONS.length - 1 && atClosest) return;

  // Compute target BEFORE preventing default
  const targetIdx = atClosest
    ? closestIdx + (goingDown ? 1 : -1)
    : closestIdx;

  // Going up from the very first snap section → release to natural scroll.
  // GSAP re-enters the horizontal pin automatically as scroll backs into pin zone.
  if (targetIdx < 0) return;

  // Don't intercept while a snap is in progress — let events pass through to Lenis freely
  if (isSnapping) return;

  // We own this event — stop Lenis seeing it
  e.preventDefault();
  e.stopImmediatePropagation();

  isSnapping = true;
  lenis.scrollTo(getSectionTop(SNAP_SECTIONS[Math.max(0, Math.min(SNAP_SECTIONS.length - 1, targetIdx))]), {
    duration: 0.65,
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    onComplete: () => { isSnapping = false; },
  });
}, { passive: false, capture: true });

/* ----- Refresh ScrollTrigger after layout shift + set initial state ----- */
window.addEventListener('load', () => {
  if (isMobile) {
    // On mobile there should be no ScrollTrigger instances.
    // Kill any that got created (e.g. from a landscape load) to prevent
    // pin spacers or wrong scroll distances from causing section jumps.
    ScrollTrigger.getAll().forEach(t => t.kill());
  } else {
    ScrollTrigger.refresh();
  }
  setTimeout(updateSidebar, 150);
});

// If user rotates from landscape (where GSAP pin was initialised) to portrait,
// kill all triggers so the pin spacer doesn't leave phantom scroll space.
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (window.innerWidth <= 768) {
      ScrollTrigger.getAll().forEach(t => t.kill());
    }
  }, 300); // small delay so the viewport has finished resizing
});

/* ----- Slow + trim the botanical loop -----
   Half-speed playback + loop back to start at LOOP_CUT seconds
   (avoids the big sunflower coming into full view at the end). */
const BOTANICAL_LOOP_CUT = 5.0;     // seconds — tweak to taste
document.querySelectorAll('.botanical-statement__video').forEach((v) => {
  const slow = () => { v.playbackRate = 0.5; };
  v.addEventListener('loadedmetadata', slow);
  if (v.readyState >= 1) slow();

  v.addEventListener('timeupdate', () => {
    if (v.currentTime >= BOTANICAL_LOOP_CUT) {
      v.currentTime = 0;
      v.play();
    }
  });
});

// Console hello — confirms script loaded
console.log('%c🌒 Spectralmoon V3 prototype loaded', 'color:#A8302C; font-weight:bold;');

/* ----- Carousel: dots + auto-advance + hover-pause -----
   - scrollLeft used (not scrollIntoView) → no vertical page jumps
   - only the carousel currently in viewport auto-advances
   - click item → next card
   - hover → pause; mouse out → resume
   - 6s interval */

const SLIDE_MS = 6000;

// Track which carousel is in the viewport
const carouselPanels = document.querySelectorAll('.panel');
let activePanelIdx = -1;
const panelObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    const idx = Array.from(carouselPanels).indexOf(e.target);
    if (e.isIntersecting && e.intersectionRatio > 0.5) activePanelIdx = idx;
  });
}, { threshold: 0.5 });
carouselPanels.forEach(p => panelObserver.observe(p));

document.querySelectorAll("[data-carousel]").forEach((carousel, carouselIdx) => {
  const track = carousel.querySelector(".carousel__track");
  const items = Array.from(carousel.querySelectorAll(".carousel__item"));
  const dots  = Array.from(carousel.querySelectorAll(".carousel__dot"));
  if (!track || items.length < 1) return;

  let currentIdx = 0;
  let timer = null;
  const panel = carousel.closest('.panel');

  const scrollTo = (idx) => {
    currentIdx = (idx + items.length) % items.length;
    // Use scrollLeft — stays within the track, no vertical jump
    const itemLeft = items[currentIdx].offsetLeft;
    track.scrollTo({ left: itemLeft, behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === currentIdx));
    items.forEach((it, i) => it.classList.toggle("is-active", i === currentIdx));
  };

  const startTimer = () => {
    if (items.length < 2) return;
    stopTimer();
    timer = setInterval(() => {
      // Only advance if this carousel's panel is the one in viewport
      const myIdx = Array.from(carouselPanels).indexOf(panel);
      if (myIdx === activePanelIdx) scrollTo(currentIdx + 1);
    }, SLIDE_MS);
  };
  const stopTimer = () => { clearInterval(timer); timer = null; };

  // Sync dot highlight on manual swipe
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio > 0.6) {
        const idx = items.indexOf(e.target);
        if (idx >= 0) {
          currentIdx = idx;
          dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
          items.forEach((it, i) => it.classList.toggle("is-active", i === idx));
        }
      }
    });
  }, { root: track, threshold: [0.6, 0.9] });
  items.forEach((item, i) => { io.observe(item); if (i === 0) item.classList.add("is-active"); });

  // Dot click
  dots.forEach((dot, i) => {
    dot.style.cursor = "pointer";
    dot.style.pointerEvents = "auto";
    dot.addEventListener("click", (e) => { e.stopPropagation(); scrollTo(i); });
  });

  // All panels: left 25% = prev, middle 50% = expand (video modal or image lightbox), right 25% = next.
  // Guard against clicks that were really vertical scroll swipes.
  // Note: expand icons call e.stopPropagation() — won't trigger carousel nav.
  items.forEach((item) => {
    item.style.cursor = "pointer";

    let touchStartY   = 0;
    let touchScrolled = false;

    item.addEventListener('touchstart', (e) => {
      touchStartY   = e.touches[0].clientY;
      touchScrolled = false;
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
      if (Math.abs(e.touches[0].clientY - touchStartY) > 8) touchScrolled = true;
    }, { passive: true });

    // Cursor hints — all cards show zone intent on hover
    item.addEventListener('mousemove', (e) => {
      const rect   = item.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width * 0.25)       item.style.cursor = 'w-resize';
      else if (clickX > rect.width * 0.75)  item.style.cursor = 'e-resize';
      else                                   item.style.cursor = 'zoom-in';
    });
    item.addEventListener('mouseleave', () => { item.style.cursor = 'pointer'; });

    item.addEventListener("click", (e) => {
      if (touchScrolled) { touchScrolled = false; return; }
      const rect   = item.getBoundingClientRect();
      const clickX = e.clientX - rect.left;

      if (clickX < rect.width * 0.25) {
        scrollTo(currentIdx - 1);
      } else if (clickX > rect.width * 0.75) {
        scrollTo(currentIdx + 1);
      } else {
        // Middle zone → open appropriate fullscreen
        if (item.dataset.lightboxSrc) {
          item.dispatchEvent(new CustomEvent('lightbox:expand', { bubbles: true }));
        } else {
          item.dispatchEvent(new CustomEvent('cinema:expand', { bubbles: true }));
        }
      }
    });
  });

  // Cinema never auto-advances (viewers browse intentionally; timer caused modal ghost)
  if (!panel || !panel.classList.contains('panel--cinema')) {
    carousel.addEventListener("mouseenter", stopTimer);
    carousel.addEventListener("mouseleave", startTimer);
    startTimer();
  }

  // ── Reset to the first project whenever this carousel's panel leaves the
  //    viewport. So returning from the hero — or moving to another section's
  //    lightbox — always starts at card 01, never wherever auto-advance or a
  //    previous browse parked it (this is why Brand kept opening on "Sepal"
  //    instead of "Limitless"). The reset runs while the panel is off-screen,
  //    so the jump is never visible. The auto-advance timer is left running —
  //    it already only advances the panel that's currently in view, so it
  //    simply resumes from card 01 the next time this section is on screen.
  if (panel && 'IntersectionObserver' in window) {
    const resetObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting && currentIdx !== 0) {
          currentIdx = 0;
          track.scrollTo({ left: 0, behavior: 'auto' }); // instant — panel is off-screen
          dots.forEach((d, i) => d.classList.toggle('is-active', i === 0));
          items.forEach((it, i) => it.classList.toggle('is-active', i === 0));
        }
      });
    }, { threshold: 0 });
    resetObs.observe(panel);
  }
});;

/* ----- Live preview boxes: restart from the beginning on re-enter -----
   Browsers pause offscreen <video> and RESUME mid-clip when it returns.
   We want the ambient preview to start clean each time its section comes
   back into view (and pausing offscreen also saves decode/CPU). */
(function () {
  const previews = document.querySelectorAll(
    '.carousel__video, .botanical-statement__video, .contact-reveal__video'
  );
  if (!previews.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        try { v.currentTime = 0; } catch (_) {}
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });

  previews.forEach((v) => io.observe(v));
})();

/* ── Fullscreen modal — works for all panels with video ── */
(function () {
  const modal      = document.getElementById('cinema-modal');
  const modalVideo = document.getElementById('cinema-modal-video');
  const modalTitle = document.getElementById('cinema-modal-title');
  const closeBtn   = document.getElementById('cinema-modal-close');
  const playIcon   = document.getElementById('cinema-modal-play-icon');
  const playBtn    = document.getElementById('cinema-modal-play-btn');
  const scrub      = document.getElementById('cinema-modal-scrub');
  const timeEl     = document.getElementById('cinema-modal-time');
  const volBtn     = document.getElementById('cinema-modal-vol-btn');
  const volSlider  = document.getElementById('cinema-modal-vol-slider');
  const fsBtn      = document.getElementById('cinema-modal-fs-btn');
  const videoWrap  = modal.querySelector('.cinema-modal__video-wrap');
  if (!modal) return;

  const allCarouselVideos = () => document.querySelectorAll('.carousel__video');

  // Scroll guard — ignore taps that land right after a swipe ends
  let lastScrollTime = 0;
  window.addEventListener('scroll', () => { lastScrollTime = Date.now(); }, { passive: true });

  function showPlayIcon() { if (playIcon) playIcon.style.opacity = '1'; }
  function hidePlayIcon() { if (playIcon) playIcon.style.opacity = '0'; }

  function fmtTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return `${m}:${sec}`;
  }
  function setPlayBtnState(playing) {
    if (!playBtn) return;
    playBtn.classList.toggle('is-playing', playing);
    playBtn.classList.toggle('is-paused',  !playing);
  }
  function resetControls() {
    if (scrub)  scrub.value = 0;
    if (timeEl) timeEl.textContent = '0:00';
    setPlayBtnState(false);
  }

  function openModal(src, title) {
    // Pause every carousel video (tracks stay visible — modal bg is opaque, no bleed-through)
    allCarouselVideos().forEach(v => v.pause());

    // Always start from beginning, no loop, with sound
    // src must be set BEFORE currentTime — setting src resets seek position
    modalVideo.loop   = false;
    modalVideo.muted  = false;
    modalVideo.volume = 1;
    if (volSlider) volSlider.value = 100;
    modalVideo.src    = src;
    modalVideo.load(); // force fresh load from byte 0
    modalVideo.currentTime = 0;
    modalTitle.textContent = title;

    hidePlayIcon();
    resetControls();
    modal.style.touchAction = 'none';
    modal.classList.add('is-open');

    modalVideo.play().catch(() => { showPlayIcon(); });
  }

  // ── iPhone: use TRUE native fullscreen so Safari's top/bottom chrome
  //    auto-hides on rotate. A CSS modal can NEVER hide that chrome — only
  //    the OS native player can. iPad + desktop keep the custom modal above.
  const isIPhone = /iPhone|iPod/.test(navigator.userAgent);
  let nativeFsVideo = null;
  function getNativeFsVideo() {
    if (nativeFsVideo) return nativeFsVideo;
    const v = document.createElement('video');
    v.setAttribute('playsinline', '');   // must be inline-capable before FS
    v.playsInline = true;
    v.controls = true;                   // native player shows its own controls
    // present in the DOM and NOT display:none (an iOS requirement for
    // webkitEnterFullscreen), but visually out of the way until used.
    v.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0.01;border:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(v);
    nativeFsVideo = v;
    return v;
  }
  function iosSupportsNativeFs() {
    return typeof getNativeFsVideo().webkitEnterFullscreen === 'function';
  }
  function openCinemaNativeIOS(src) {
    const v = getNativeFsVideo();
    allCarouselVideos().forEach(x => x.pause());
    v.loop = false; v.muted = false; v.volume = 1;
    v.src = src;
    v.load();
    const enterFs = () => { try { v.webkitEnterFullscreen(); } catch (_) {} };
    // start playback inside the user's tap gesture, then go native fullscreen
    v.play().catch(() => {});
    if (v.readyState >= 1) enterFs();
    else v.addEventListener('loadedmetadata', enterFs, { once: true });
    // on exit from native fullscreen: stop this video, resume ambient previews
    v.addEventListener('webkitendfullscreen', () => {
      v.pause();
      v.removeAttribute('src');
      v.load();
      allCarouselVideos().forEach(x => { try { x.currentTime = 0; } catch (_) {} x.play().catch(() => {}); });
    }, { once: true });
  }
  // Single entry point every cinema video-tap uses.
  function openCinema(src, title) {
    if (isIPhone && iosSupportsNativeFs()) openCinemaNativeIOS(src);
    else openModal(src, title);
  }

  function closeModal() {
    // Remove .is-open first — this sets visibility:hidden IMMEDIATELY.
    // visibility:hidden fully releases iOS touch tracking, unlike pointer-events:none alone.
    // opacity fades out via CSS transition (0.35s) as a visual flourish.
    modal.classList.remove('is-open');
    modal.style.touchAction = '';
    isSnapping = false;
    modalVideo.pause();
    modalVideo.src = '';
    hidePlayIcon();
    resetControls();
    // Restart carousel preview videos — save/restore scroll positions so carousels don't reset to card 1
    const carouselTracks = Array.from(document.querySelectorAll('.carousel__track'));
    const savedPositions = carouselTracks.map(t => t.scrollLeft);
    allCarouselVideos().forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
    requestAnimationFrame(() => {
      carouselTracks.forEach((t, i) => { t.scrollLeft = savedPositions[i]; });
    });
  }

  // Tap-to-play / tap-to-pause (on video itself)
  modalVideo.addEventListener('click', () => {
    if (modalVideo.paused || modalVideo.ended) {
      modalVideo.play().catch(() => {});
    } else {
      modalVideo.pause();
    }
  });

  // Play icon + control button driven by video state
  modalVideo.addEventListener('play', () => {
    hidePlayIcon();
    setPlayBtnState(true);
  });
  modalVideo.addEventListener('pause', () => {
    showPlayIcon();
    setPlayBtnState(false);
  });
  modalVideo.addEventListener('ended', () => {
    showPlayIcon();
    setPlayBtnState(false);
  });

  // Scrub bar — update position as video plays
  modalVideo.addEventListener('timeupdate', () => {
    if (!scrub || !modalVideo.duration) return;
    scrub.value = (modalVideo.currentTime / modalVideo.duration) * 100;
    if (timeEl) timeEl.textContent = fmtTime(modalVideo.currentTime);
  });

  // Scrub bar — seek when user drags
  if (scrub) {
    scrub.addEventListener('input', () => {
      if (modalVideo.duration) {
        modalVideo.currentTime = (scrub.value / 100) * modalVideo.duration;
      }
    });
    // Stop touches on the scrub bar from closing the modal (tap-outside handler)
    scrub.addEventListener('click', (e) => e.stopPropagation());
  }

  // Play/pause button
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modalVideo.paused || modalVideo.ended) {
        modalVideo.play().catch(() => {});
      } else {
        modalVideo.pause();
      }
    });
  }

  // Volume — reflect mute state on the icon
  function reflectVolume() {
    const muted = modalVideo.muted || modalVideo.volume === 0;
    if (volBtn) {
      volBtn.classList.toggle('is-muted', muted);
      volBtn.classList.toggle('is-on', !muted);
    }
  }
  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      const v = volSlider.value / 100;
      modalVideo.volume = v;
      modalVideo.muted = (v === 0);
      reflectVolume();
    });
    volSlider.addEventListener('click', (e) => e.stopPropagation());
  }
  if (volBtn) {
    volBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      modalVideo.muted = !modalVideo.muted;
      if (!modalVideo.muted && modalVideo.volume === 0) modalVideo.volume = 1;
      if (volSlider) volSlider.value = modalVideo.muted ? 0 : Math.round(modalVideo.volume * 100);
      reflectVolume();
    });
  }
  modalVideo.addEventListener('volumechange', reflectVolume);

  // Fullscreen — give the biggest possible viewing experience
  if (fsBtn) {
    fsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const target = videoWrap || modalVideo;
        const req = target.requestFullscreen || target.webkitRequestFullscreen
                 || modalVideo.webkitEnterFullscreen; // iOS Safari falls back to native player
        if (req) req.call(target.requestFullscreen ? target : modalVideo);
      }
    });
  }

  // Add expand icon to every carousel item that has a video
  document.querySelectorAll('.carousel__item').forEach((item) => {
    const vid = item.querySelector('.carousel__video');
    if (!vid) return; // image-only items get no icon

    // Two-screens "expand" icon — overlapping rectangles
    const hint = document.createElement('div');
    hint.className = 'cinema-item__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML =
      '<svg width="34" height="28" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="2" y="4" width="34" height="26" rx="3.5" stroke="white" stroke-opacity="0.45" stroke-width="2" fill="none"/>' +
        '<rect x="20" y="18" width="34" height="26" rx="3.5" stroke="white" stroke-width="2.2" fill="rgba(255,255,255,0.08)"/>' +
      '</svg>';
    item.appendChild(hint);

    // Prevent hint taps from bubbling to carousel scroll logic
    hint.addEventListener('click', (e) => e.stopPropagation());
    hint.addEventListener('touchend', (e) => e.stopPropagation(), { passive: false });

    const hintSvg = hint.querySelector('svg');
    hintSvg.style.transform = 'scale(0.72)';

    item.addEventListener('mouseenter', () => {
      hint.style.opacity    = '1';
      hint.style.background = 'rgba(42,32,26,0.32)';
      hintSvg.style.transform = 'scale(1)';
      vid.style.filter = 'brightness(1.14)';
    });
    item.addEventListener('mouseleave', () => {
      hint.style.opacity    = '0';
      hint.style.background = 'rgba(42,32,26,0)';
      hintSvg.style.transform = 'scale(0.72)';
      vid.style.filter = '';
    });

    // Icon tap → open modal (scroll guard: ignore if swipe just ended)
    hintSvg.style.pointerEvents = 'auto';
    hintSvg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!item.classList.contains('is-active')) return;
      if (Date.now() - lastScrollTime < 400) return;
      const fullSrc    = item.dataset.fullSrc;
      const previewSrc = item.querySelector('source')?.src;
      const src        = fullSrc || previewSrc;
      const title      = item.querySelector('.carousel__title')?.textContent || '';
      if (!src) return;
      openCinema(src, title);
    });
  });

  // Middle-zone click on image card fires this event
  document.addEventListener('lightbox:expand', (e) => {
    const item = e.target.closest('.carousel__item');
    if (!item || !item.dataset.lightboxSrc) return;
    const idx = allLightboxItems.indexOf(item);
    if (idx === -1) return;
    currentLightboxIdx = idx;
    openLightbox(item.dataset.lightboxSrc, item.dataset.lightboxCaption);
  });

  // Middle-zone click on cinema/brand card fires this event
  document.addEventListener('cinema:expand', (e) => {
    const item = e.target.closest('.carousel__item');
    if (!item) return;
    if (Date.now() - lastScrollTime < 400) return;
    const fullSrc    = item.dataset.fullSrc;
    const previewSrc = item.querySelector('source')?.src;
    const src        = fullSrc || previewSrc;
    const title      = item.querySelector('.carousel__title')?.textContent || '';
    if (!src) return;
    openCinema(src, title);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();

/* ----- Image lightbox — modern redesign ----- */
(function () {
  const lightbox    = document.getElementById('img-lightbox');
  const lightboxImg = document.getElementById('img-lightbox-img');
  const lightboxCap = document.getElementById('img-lightbox-caption');
  const closeBtn    = document.getElementById('img-lightbox-close');
  const prevBtn     = document.getElementById('img-lightbox-prev');
  const nextBtn     = document.getElementById('img-lightbox-next');
  const stage       = document.getElementById('img-lightbox-stage');
  const dotsWrap    = document.getElementById('img-lightbox-dots');
  if (!lightbox) return;

  const allLightboxItems = Array.from(document.querySelectorAll('.carousel__item[data-lightbox-src]'));
  let currentLightboxIdx = 0;
  let dots = [];

  // Build pagination dots dynamically
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    dots = allLightboxItems.map((_, i) => {
      const d = document.createElement('span');
      d.className = 'img-lightbox__dot';
      d.addEventListener('click', (e) => { e.stopPropagation(); goToIdx(i); });
      dotsWrap.appendChild(d);
      return d;
    });
  }

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === currentLightboxIdx));
  }

  let justOpened = false;

  function openLightbox(src, caption) {
    // Consistency with the video modal: pause the carousel preview videos
    // playing behind the lightbox so nothing animates underneath an open image.
    document.querySelectorAll('.carousel__video').forEach(v => v.pause());
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCap.textContent = caption || '';
    lightbox.style.touchAction = 'none';
    lightbox.classList.remove('is-zoomed');
    lightbox.classList.add('is-open');
    justOpened = true;
    setTimeout(() => { justOpened = false; }, 350); // ignore stray clicks from opening tap
    updateDots();
  }

  function goToIdx(idx) {
    currentLightboxIdx = ((idx % allLightboxItems.length) + allLightboxItems.length) % allLightboxItems.length;
    const item = allLightboxItems[currentLightboxIdx];
    openLightbox(item.dataset.lightboxSrc, item.dataset.lightboxCaption);
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open', 'is-zoomed');
    lightbox.style.touchAction = '';
    setTimeout(() => { lightboxImg.src = ''; }, 350);
    // Resume the carousel preview videos we paused on open (mirrors the video modal).
    document.querySelectorAll('.carousel__video').forEach(v => { v.play().catch(() => {}); });
  }

  buildDots();

  // Wire up carousel items — hover hint + icon click to open
  allLightboxItems.forEach((item, idx) => {
    item.style.cursor = 'pointer';

    const hint = document.createElement('div');
    hint.className = 'cinema-item__hint';
    hint.innerHTML =
      '<svg width="34" height="28" viewBox="0 0 56 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="2" y="4" width="34" height="26" rx="3.5" stroke="white" stroke-opacity="0.45" stroke-width="2" fill="none"/>' +
        '<rect x="20" y="18" width="34" height="26" rx="3.5" fill="rgba(42,32,26,0.55)" stroke="white" stroke-opacity="0.9" stroke-width="2"/>' +
      '</svg>';
    item.appendChild(hint);

    const hintSvg = hint.querySelector('svg');
    const img = item.querySelector('.carousel__img');
    hintSvg.style.transform = 'scale(0.72)';
    hintSvg.style.pointerEvents = 'auto';

    item.addEventListener('mouseenter', () => {
      hint.style.opacity = '1';
      hint.style.background = 'rgba(42,32,26,0.32)';
      hintSvg.style.transform = 'scale(1)';
      if (img) img.style.filter = 'brightness(1.08)';
    });
    item.addEventListener('mouseleave', () => {
      hint.style.opacity = '0';
      hint.style.background = 'rgba(42,32,26,0)';
      hintSvg.style.transform = 'scale(0.72)';
      if (img) img.style.filter = '';
    });

    hint.addEventListener('click',    (e) => e.stopPropagation());
    hint.addEventListener('touchend', (e) => e.stopPropagation(), { passive: false });

    hintSvg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!item.classList.contains('is-active')) return;
      currentLightboxIdx = idx;
      openLightbox(item.dataset.lightboxSrc, item.dataset.lightboxCaption);
    });
  });

  // Large zone clicks = prev / next
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goToIdx(currentLightboxIdx - 1); });
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goToIdx(currentLightboxIdx + 1); });

  // Image stage click = zoom toggle (ignore immediate tap from opening gesture)
  if (stage) stage.addEventListener('click', (e) => {
    e.stopPropagation();
    if (justOpened) return;
    lightbox.classList.toggle('is-zoomed');
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      if (lightbox.classList.contains('is-zoomed')) lightbox.classList.remove('is-zoomed');
      else closeLightbox();
    }
    if (e.key === 'ArrowLeft')  goToIdx(currentLightboxIdx - 1);
    if (e.key === 'ArrowRight') goToIdx(currentLightboxIdx + 1);
  });
})();

// Topbar logo colour — JS-controlled inline swap (light/dark sections)
(function() {
  const topbar    = document.querySelector('.topbar');
  const brand     = document.querySelector('.topbar__brand');
  const brandName = document.querySelector('.topbar__brand-name');
  const brandSub  = document.querySelector('.topbar__brand-sub');
  if (!topbar || !brand) return;

  function setBrandColor(overDark) {
    const col = overDark ? '#FAFAF7' : '#5C3D2E';  // cream on dark hero, warm brown on light
    [brand, brandName, brandSub].forEach(el => {
      if (el) el.style.color = col;
    });
    topbar.classList.toggle('topbar--over-dark', overDark);
  }

  // Apply immediately on load
  setBrandColor(false);

  const darkSections = document.querySelectorAll('.screen--lyra, .screen--hero, #screen-lyra');
  if (!darkSections.length) return;
  const obs = new IntersectionObserver((entries) => {
    const anyDark = [...entries].some(e => e.isIntersecting);
    setBrandColor(anyDark);
  }, { threshold: 0.25 });
  darkSections.forEach(s => obs.observe(s));
})();

/* ----- Mobile burger menu ----- */
(function () {
  const burgerBtn  = document.getElementById('burger-btn');
  const mobileNav  = document.getElementById('mobile-nav');
  const closeBtn   = document.getElementById('mobile-nav-close');
  if (!burgerBtn || !mobileNav) return;

  function openNav() {
    mobileNav.classList.add('is-open');
    burgerBtn.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    burgerBtn.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop(); else document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    mobileNav.classList.remove('is-open');
    burgerBtn.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    burgerBtn.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start(); else document.body.style.overflow = '';
  }

  burgerBtn.addEventListener('click', () => {
    mobileNav.classList.contains('is-open') ? closeNav() : openNav();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeNav);

  // Clicking a nav link closes the menu and scrolls to the section
  mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target   = document.querySelector(targetId);
      closeNav();
      if (target) {
        // Short delay so nav fade-out completes before scroll
        setTimeout(() => {
          if (lenis) lenis.scrollTo(target, { duration: 0.8, offset: 0 });
          else target.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    });
  });
})();

/* ----- Scroll-aware frosted topbar (mobile) -----
   Adds .topbar--scrolled once the user has scrolled past the hero threshold.
   CSS transitions the background from transparent → frosted glass.
   Uses native scroll event — Lenis is disabled on mobile. */
(function () {
  if (window.innerWidth > 768) return; // mobile only — desktop topbar uses blend mode
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  const THRESHOLD = 80; // px — clear the hero before frosting kicks in

  window.addEventListener('scroll', () => {
    topbar.classList.toggle('topbar--scrolled', window.scrollY > THRESHOLD);
  }, { passive: true });
})();

/* ----- Logo tap — scroll to top ----- */
const brandLink = document.querySelector('.topbar__brand');
if (brandLink) {
  let logoTouchStartX = 0;
  let logoTouchStartY = 0;
  let logoTouchMoved  = false;

  function scrollToTop() {
    // Sonar ring animation
    brandLink.classList.remove('is-pulsing');
    void brandLink.offsetWidth; // force reflow so re-tap restarts animation
    brandLink.classList.add('is-pulsing');
    setTimeout(() => brandLink.classList.remove('is-pulsing'), 1100);
    if (lenis) {
      lenis.scrollTo(0, { immediate: true }); // instant jump — no drag through sections
      setTimeout(() => ScrollTrigger.update(), 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  brandLink.addEventListener('touchstart', (e) => {
    logoTouchStartX = e.touches[0].clientX;
    logoTouchStartY = e.touches[0].clientY;
    logoTouchMoved  = false;
  }, { passive: true });

  brandLink.addEventListener('touchmove', (e) => {
    const dx = Math.abs(e.touches[0].clientX - logoTouchStartX);
    const dy = Math.abs(e.touches[0].clientY - logoTouchStartY);
    if (dx > 12 || dy > 12) logoTouchMoved = true;
  }, { passive: true });

  brandLink.addEventListener('touchend', (e) => {
    if (logoTouchMoved) { logoTouchMoved = false; return; } // was a scroll gesture, ignore
    e.preventDefault(); // block the delayed click + href="#" native scroll
    scrollToTop();
  }, { passive: false });

  // Desktop fallback
  brandLink.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToTop();
  });
}

/* ----- Contact — fish: slow drift setup (loop control handled by resetSync below) ----- */
(function () {
  const videos = Array.from(document.querySelectorAll('#section-contact .contact-mask__video'));
  if (!videos.length) return;
  function init(v) {
    v.playbackRate = 0.3;             /* slow drift — both layers */
    v.removeAttribute('loop');        /* resetSync controls restarts */
  }
  videos.forEach(v => {
    v.addEventListener('loadedmetadata', () => init(v));
    if (v.readyState >= 1) init(v);
  });
}());

/* ----- Manifesto line 1 — text cycling (curtain open/close — Maëlan Le Meur) -----
   EXIT:  chars split at center, left half exits LEFT, right half exits RIGHT  (curtains closing)
   ENTER: left half arrives from LEFT, right half from RIGHT, lock at center   (curtains opening)
   scaleX 1.25 -> 1 on entry gives the elastic stamp feel from the hero entrance. */
(function () {
  const el = document.querySelector('.manifesto__line--1');
  if (!el) return;

  const phrases = [
    'Made by hand.',
    'With intention.',
    'Imagined first.',
    'Conjured slowly.',
  ];

  let phraseIdx = 0;
  let cycling = false;

  function buildChars(text) {
    el.innerHTML = '';
    return text.split('').map((char) => {
      const span = document.createElement('span');
      span.style.display = 'inline-block';
      span.textContent = char === ' ' ? ' ' : char;
      el.appendChild(span);
      return span;
    });
  }

  function showPhrase(text) {
    const chars = buildChars(text);
    const mid = Math.ceil(chars.length / 2);
    chars.forEach((span, i) => {
      const fromLeft = i < mid;
      const delay = Math.abs(i - mid) * 0.024;   /* slightly wider stagger — more organic */
      gsap.fromTo(span,
        { x: fromLeft ? -70 : 70, opacity: 0, scaleX: 1.2 },
        { x: 0, opacity: 1, scaleX: 1, duration: 0.55, delay, ease: 'power2.out' }
      );
    });
  }

  function cycleNext() {
    if (cycling) return;
    cycling = true;
    const spans = Array.from(el.querySelectorAll('span'));
    if (!spans.length) {
      phraseIdx = (phraseIdx + 1) % phrases.length;
      showPhrase(phrases[phraseIdx]);
      cycling = false;
      return;
    }
    const mid = Math.ceil(spans.length / 2);
    let done = 0;
    spans.forEach((span, i) => {
      const toLeft = i < mid;
      const delay = (mid - Math.abs(i - mid)) * 0.014;  /* chars closest to center exit last */
      gsap.to(span, {
        x: toLeft ? -60 : 60,
        opacity: 0,
        scaleX: 1.1,
        duration: 0.18,
        delay,
        ease: 'power2.in',
        onComplete: () => {
          done++;
          if (done === spans.length) {
            phraseIdx = (phraseIdx + 1) % phrases.length;
            showPhrase(phrases[phraseIdx]);
            cycling = false;
          }
        }
      });
    });
  }

  /* Initial render */
  showPhrase(phrases[phraseIdx]);
  setInterval(cycleNext, 2500);
}());

/* ----- Hero entrance — STU from left, DIO from right via GSAP attr tween -----
   Using attr: {x} instead of CSS transform — more reliable inside SVG <mask> contexts,
   especially on mobile Safari. Duration 2.5s gives a slow, deliberate landing. */
(function () {
  // Desktop SVG: both texts at x="520", slide in ±200px
  const desktopTexts = document.querySelectorAll('.hero__mask-svg--desktop text');
  if (desktopTexts.length >= 2) {
    gsap.from(desktopTexts[0], { attr: { x: 220 }, duration: 5.0, ease: 'power1.out', delay: 0.1 });
    gsap.from(desktopTexts[1], { attr: { x: 820 }, duration: 5.0, ease: 'power1.out', delay: 0.2 });
  }
  // Mobile SVG: STU at x="225", DIO at x="200", slide in ±180px
  const mobileTexts = document.querySelectorAll('.hero__mask-svg--mobile text');
  if (mobileTexts.length >= 2) {
    gsap.from(mobileTexts[0], { attr: { x: 45  }, duration: 5.0, ease: 'power1.out', delay: 0.1 });
    gsap.from(mobileTexts[1], { attr: { x: 380 }, duration: 5.0, ease: 'power1.out', delay: 0.2 });
  }
}());

/* ----- Mobile logo swap: typographic on hero, sigil past it ----- */
(function () {
  if (window.innerWidth > 768) return; // mobile only
  const topbar = document.querySelector('.topbar');
  const hero   = document.querySelector('#screen-lyra');
  if (!topbar || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      // Add class when hero is OUT of view, remove when it's IN view
      topbar.classList.toggle('past-hero', !entry.isIntersecting);
    },
    {
      threshold: 0.1  // trigger once 90% of the hero has scrolled away
    }
  );
  observer.observe(hero);
}());

/* ----- Contact fish video — slow drift loop ----- */
(function () {
  // Single video, full-screen approach. Fish play freely across the right panel.
  // playbackRate 0.3 = slow drift. Clip is 10s. Start at t=3s (fish entering busy zone).
  // Loop every 6000ms real time = consumes 1.8s of footage per loop (t=3.0→4.8s on each cycle).
  const video = document.querySelector('#section-contact .contact-mask__video:not(.contact-mask__video--lower):not(.contact-mask__video--tip)');
  if (!video) return;

  function startLoop() {
    video.playbackRate = 0.3;
    video.removeAttribute('loop');
    video.currentTime = 3.0;
    video.play().catch(() => {});
  }

  video.addEventListener('loadedmetadata', startLoop);
  if (video.readyState >= 1) startLoop();

  setInterval(() => {
    video.currentTime = 3.0;
    video.play().catch(() => {});
  }, 6000);
}());
