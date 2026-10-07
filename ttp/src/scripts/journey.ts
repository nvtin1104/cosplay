const root = document.documentElement;
const rail = document.querySelector<HTMLElement>('.journey-nav');
const next = document.querySelector<HTMLAnchorElement>('.journey-next');
const previous = document.querySelector<HTMLAnchorElement>('.journey-previous');
const current = document.querySelector<HTMLElement>('.journey-current');
const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [
  { id: 'top', label: 'TTP', element: document.querySelector('.hero')! },
  ...[['about', 'Về Phát'], ['story', 'Câu chuyện'], ['chapter', '27.09.2026'], ['gallery', 'Khoảnh khắc'], ['community', 'Cộng đồng'], ['next', 'Chương tiếp theo']].map(([id, label]) => ({ id, label, element: document.getElementById(id)! })),
];
let paused = false;
try { paused = sessionStorage.getItem('ttp-motion-paused') === 'true'; } catch { /* Storage is optional. */ }

function syncMotion() {
  const disabled = paused || reduced.matches;
  root.classList.toggle('motion-enabled', !disabled && !document.hidden);
  root.classList.toggle('motion-paused', disabled);
  toggle?.setAttribute('aria-pressed', String(disabled));
  const label = reduced.matches ? 'Chuyển động đã giảm theo thiết bị' : disabled ? 'Bật chuyển động nhẹ' : 'Tạm dừng chuyển động';
  toggle?.setAttribute('aria-label', label);
  toggle?.setAttribute('title', label);
  if (toggle) {
    toggle.disabled = reduced.matches;
    toggle.querySelector('span')!.textContent = disabled ? '▷' : 'Ⅱ';
  }
  if (disabled) document.getAnimations().forEach(animation => {
    if (animation.effect instanceof KeyframeEffect && animation.effect.target?.classList.contains('reveal')) animation.cancel();
  });
}
toggle?.addEventListener('click', () => {
  paused = !paused;
  try { sessionStorage.setItem('ttp-motion-paused', String(paused)); } catch { /* Continue without persistence. */ }
  syncMotion();
});
reduced.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
syncMotion();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      if (!paused && !reduced.matches) {
        element.classList.add('reveal');
        element.animate([{ transform: 'translateY(24px)' }, { transform: 'translateY(0)' }], {
          duration: 850,
          delay: Number(element.dataset.motionDelay || 0),
          easing: 'cubic-bezier(.22,1,.36,1)',
        });
      }
      observer.unobserve(element);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.hero-copy > *, .section-heading, .about-copy, .about-visual, .story-quote, .story-steps article, .chapter-heading, .gallery-heading, .gallery-grid .photo, .community-inner > *, .next > *').forEach((element, index) => {
    (element as HTMLElement).dataset.motionDelay = String((index % 3) * 75);
    observer.observe(element);
  });
  const wind = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('wind-visible', entry.isIntersecting)));
  document.querySelectorAll('.hero-art, .community').forEach(element => wind.observe(element));
}

let scheduled = false;
function updateJourney() {
  scheduled = false;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  root.style.setProperty('--reading-progress', String(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0));
  let index = 0;
  chapters.forEach((chapter, i) => { if (chapter.element.getBoundingClientRect().top <= window.innerHeight * 0.3) index = i; });
  const chapter = chapters[index];
  const destination = chapters[index + 1] || chapters[0];
  const before = chapters[Math.max(0, index - 1)];
  if (current) current.textContent = `${String(index + 1).padStart(2, '0')} / ${chapter.label}`;
  if (next) { next.href = `#${destination.id}`; next.innerHTML = `${index === chapters.length - 1 ? 'Về đầu trang' : destination.label} <span aria-hidden="true">→</span>`; }
  if (previous) { previous.href = `#${before.id}`; previous.setAttribute('aria-label', index ? `Về ${before.label}` : 'Về đầu trang'); }
  document.querySelectorAll<HTMLAnchorElement>('.header nav a').forEach(link => {
    if (link.hash === `#${chapter.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('.header')?.classList.toggle('header-scrolled', window.scrollY > 50);
}
function requestUpdate() { if (!scheduled) { scheduled = true; requestAnimationFrame(updateJourney); } }
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
window.addEventListener('load', requestUpdate);
document.fonts.ready.then(requestUpdate);
if (rail) rail.hidden = false;
updateJourney();
