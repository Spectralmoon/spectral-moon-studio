
var featuredVideo = document.getElementById('featuredVideo');

function openLightbox(opts) {
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
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (featuredVideo && !featuredVideo.paused) featuredVideo.pause();
}

document.getElementById('featuredFilm').addEventListener('click', function() {
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
});

document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var t = document.querySelector(this.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
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

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxMedia').innerHTML = '';
  document.body.style.overflow = '';
  if (featuredVideo) {
    featuredVideo.pause();
    featuredVideo.currentTime = 0;
  }
}

document.querySelectorAll('.masonry-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var thumb = this.querySelector('.masonry-thumb');
    openLightbox({
      file: this.dataset.file,
      poster: thumb ? thumb.src : '',
      type: this.dataset.type,
      muted: false,
      category: this.dataset.category,
      title: this.dataset.title,
      desc: this.dataset.desc,
      tags: this.dataset.tags
    });
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});

// Hero video playback rate — set immediately, not on canplay
const heroVid = document.getElementById('heroVideo');
if (heroVid) {
  heroVid.playbackRate = 0.3;
  heroVid.addEventListener('loadedmetadata', () => { heroVid.playbackRate = 0.3; });
  heroVid.addEventListener('play', () => { heroVid.playbackRate = 0.3; });
}
