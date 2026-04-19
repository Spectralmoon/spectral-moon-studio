var featuredVideo = document.getElementById('featuredVideo');
var lightboxEl = document.getElementById('lightbox');
var lightboxClose = document.getElementById('lightboxClose');
var lastFocusedBeforeLightbox = null;

function openLightbox(opts) {
  // Remember what had focus so we can return focus on close (WCAG 2.4.3)
  lastFocusedBeforeLightbox = document.activeElement;

  var mutedAttr = opts.muted ? ' muted' : '';
  var posterAttr = opts.poster ? ' poster="' + opts.poster + '"' : '';
  var mediaEl = opts.file
    ? (opts.type === 'video'
        ? '<video controls autoplay' + mutedAttr + ' playsinline preload="metadata"' + posterAttr + '><source src="' + opts.file + '" type="video/mp4"></video>'
        : '<img src="' + opts.file + '" alt="' + opts.title + '">')
    : '<div class="lightbox-coming">Coming soon</div>';
  document.getElementById('lightboxMedia').innerHTML = mediaEl;
  var v = document.querySelector('#lightboxMedia video');
  if (v) {
    v.volume = 0.5;
    v.currentTime = 0;
    v.play().catch(function() {});
    v.addEventListener('ended', function() {
      v.currentTime = 0;
    });
  }
  document.getElementById('lightboxCat').textContent = opts.category;
  document.getElementById('lightboxTitle').textContent = opts.title;
  document.getElementById('lightboxDesc').textContent = opts.desc;
  document.getElementById('lightboxTags').innerHTML = opts.tags.split(',').map(function(t) {
    return '<span class="lightbox-tag">' + t.trim() + '</span>';
  }).join('');
  lightboxEl.classList.add('open');
  lightboxEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (featuredVideo && !featuredVideo.paused) featuredVideo.pause();

  // Move focus into the dialog so keyboard users land inside
  setTimeout(function() {
    if (lightboxClose) lightboxClose.focus();
  }, 0);
}

function closeLightbox() {
  lightboxEl.classList.remove('open');
  lightboxEl.setAttribute('aria-hidden', 'true');
  document.getElementById('lightboxMedia').innerHTML = '';
  document.body.style.overflow = '';
  if (featuredVideo) {
    featuredVideo.pause();
    featuredVideo.currentTime = 0;
  }
  // Return focus to whatever opened the dialog
  if (lastFocusedBeforeLightbox && typeof lastFocusedBeforeLightbox.focus === 'function') {
    lastFocusedBeforeLightbox.focus();
  }
}

// ── Featured film (click + keyboard) ──
var featuredFilmEl = document.getElementById('featuredFilm');
function openFeaturedFilm() {
  openLightbox({
    file: document.querySelector('#featuredVideo source').src,
    poster: featuredVideo ? featuredVideo.poster : '',
    type: 'video',
    muted: false,
    category: "Film · AI Short Film / Narrative Fantasy",
    title: "Where the Stars Align",
    desc: "A woman walks a path of ancient trials — not battles to win, but layers to shed. The studio's first fully structured AI short film, built scene by scene: sacred geometry, celestial symbolism, and the quiet return that feels less like arrival and more like remembering.",
    tags: "Narrative Fantasy, Heroine's Journey, Mythic Cinema"
  });
}
if (featuredFilmEl) {
  featuredFilmEl.addEventListener('click', openFeaturedFilm);
  featuredFilmEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFeaturedFilm();
    }
  });
}

// ── Smooth scroll nav links (unchanged) ──
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Filter buttons (click + aria-pressed toggle) ──
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('active');
    this.setAttribute('aria-pressed', 'true');
    var f = this.dataset.filter;
    document.querySelectorAll('.masonry-item').forEach(function(item) {
      if (f === 'all' || item.dataset.cat === f) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
    var grid = document.querySelector('.masonry-grid');
    if (f === 'all') {
      grid.classList.remove('filtered-view');
    } else {
      grid.classList.add('filtered-view');
    }
  });
});

// ── Masonry items (click + keyboard) ──
document.querySelectorAll('.masonry-item').forEach(function(item) {
  function openItem() {
    var thumb = item.querySelector('.masonry-thumb');
    openLightbox({
      file: item.dataset.file,
      poster: thumb ? thumb.src : '',
      type: item.dataset.type,
      muted: false,
      category: item.dataset.category,
      title: item.dataset.title,
      desc: item.dataset.desc,
      tags: item.dataset.tags
    });
  }
  item.addEventListener('click', openItem);
  item.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openItem();
    }
  });
});

// ── Close button + backdrop click ──
lightboxClose.addEventListener('click', closeLightbox);
lightboxEl.addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});

// ── Escape to close + trap Tab inside dialog when open (WCAG 2.1.2) ──
document.addEventListener('keydown', function(e) {
  if (!lightboxEl.classList.contains('open')) return;
  if (e.key === 'Escape') {
    closeLightbox();
    return;
  }
  if (e.key !== 'Tab') return;
  var focusables = lightboxEl.querySelectorAll('button, a[href], video, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  var first = focusables[0];
  var last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

// ── Hero video playback rate (unchanged) ──
const heroVid = document.getElementById('heroVideo');
if (heroVid) {
  heroVid.playbackRate = 0.3;
  heroVid.addEventListener('loadedmetadata', () => { heroVid.playbackRate = 0.3; });
  heroVid.addEventListener('play', () => { heroVid.playbackRate = 0.3; });
}

// ── Respect prefers-reduced-motion: stop autoplay videos (WCAG 2.3.3) ──
if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach(function(v) {
    v.removeAttribute('autoplay');
    v.pause();
  });
}
