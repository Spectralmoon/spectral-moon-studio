
// Featured film play/pause
var featuredVideo = document.getElementById('featuredVideo');
var featuredPlayBtn = document.getElementById('featuredPlayBtn');
var isPlaying = false;
document.getElementById('featuredFilm').addEventListener('click', function() {
  if (isPlaying) {
    featuredVideo.pause();
    featuredPlayBtn.style.opacity = '1';
    isPlaying = false;
  } else {
    featuredVideo.play();
    featuredPlayBtn.style.opacity = '0';
    isPlaying = true;
  }
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
      if (f === 'all' || item.dataset.cat === f) { item.classList.remove('hidden'); }
      else { item.classList.add('hidden'); }
    });
  });
});

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxMedia').innerHTML = '';
  document.body.style.overflow = '';
}

document.querySelectorAll('.masonry-item').forEach(function(item) {
  item.addEventListener('click', function() {
    var file = this.dataset.file;
    var type = this.dataset.type;
    var mediaEl = file
      ? (type === 'video'
          ? '<video controls autoplay muted playsinline><source src="' + file + '" type="video/mp4"></video>'
          : '<img src="' + file + '" alt="' + this.dataset.title + '">')
      : '<div class="lightbox-coming">Coming soon</div>';
    document.getElementById('lightboxMedia').innerHTML = mediaEl;
    document.getElementById('lightboxCat').textContent = this.dataset.category;
    document.getElementById('lightboxTitle').textContent = this.dataset.title;
    document.getElementById('lightboxDesc').textContent = this.dataset.desc;
    document.getElementById('lightboxTags').innerHTML = this.dataset.tags.split(',').map(function(t) {
      return '<span class="lightbox-tag">' + t.trim() + '</span>';
    }).join('');
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});
