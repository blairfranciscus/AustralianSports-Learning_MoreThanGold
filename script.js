// Progressive enhancement: the story, scorecard and photo links work without JS.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const progress = document.querySelector('.reading-progress');
const journeyLinks = [...document.querySelectorAll('.journey a')];
const chapters = journeyLinks.map(link => document.querySelector(link.hash));
let scrollQueued = false;
function updateReading() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const fraction = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
  progress.style.transform = `scaleX(${fraction})`;
  let current = -1;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= 150) current = index;
  });
  journeyLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  scrollQueued = false;
}
function queueReading() {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateReading); }
}
window.addEventListener('scroll', queueReading, { passive: true });
window.addEventListener('resize', queueReading);
window.addEventListener('load', queueReading);
updateReading();
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reducedMotion.matches) entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
const explored = new Set();
const challenges = [...document.querySelectorAll('.challenge')];
document.querySelector('.challenge-progress').hidden = false;
function celebrate() {
  if (reducedMotion.matches) return;
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.setAttribute('aria-hidden', 'true');
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 520}px`);
    piece.style.setProperty('--y', `${100 + Math.random() * 300}px`);
    piece.style.setProperty('--r', `${Math.random() * 540}deg`);
    piece.style.background = ['#edc655', '#183d34', '#a9572a'][i % 3];
    document.body.append(piece);
    setTimeout(() => piece.remove(), 1100);
  }
}
challenges.forEach((challenge, index) => {
  challenge.addEventListener('toggle', () => {
    queueReading();
    if (!challenge.open || explored.has(index)) return;
    explored.add(index);
    document.querySelector('#challenge-count').textContent = explored.size;
    if (explored.size === challenges.length) {
      document.querySelector('#challenge-finish').hidden = false;
      celebrate();
    }
  });
});
document.querySelectorAll('details:not(.challenge)').forEach(detail => detail.addEventListener('toggle', queueReading));
const dialog = document.querySelector('#photo-dialog');
if (typeof dialog.showModal === 'function') {
  const expandedPhoto = document.querySelector('#expanded-photo');
  const caption = document.querySelector('#expanded-caption');
  let opener;
  document.querySelectorAll('[data-photo]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      expandedPhoto.src = link.href;
      expandedPhoto.alt = link.querySelector('img').alt;
      caption.textContent = link.closest('figure').querySelector('figcaption')?.textContent || '';
      dialog.showModal();
      document.body.classList.add('modal-open');
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    opener?.focus({ preventScroll: true });
  });
}
