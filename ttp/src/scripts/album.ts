const wall = document.querySelector<HTMLElement>('.album-wall');
const dialog = document.querySelector<HTMLDialogElement>('.photo-viewer');
if (wall && dialog) {
  const photos: {src: string; alt: string}[] = JSON.parse(wall.dataset.photos || '[]');
  const image = dialog.querySelector<HTMLImageElement>('.viewer-image')!;
  const zoom = dialog.querySelector<HTMLButtonElement>('.viewer-zoom')!;
  let active = 0;
  let opener: HTMLElement | null = null;
  const templates = Array.from(wall.querySelectorAll<HTMLElement>('.album-tile')).slice(0, photos.length);
  let lastWidth = 0;
  let lastHeight = 0;
  function ensureCoverage() {
    const width = wall!.clientWidth;
    const height = window.innerHeight;
    if (!width || (width === lastWidth && height === lastHeight)) return;
    lastWidth = width;
    lastHeight = height;
    // CSS owns masonry from the first paint; only extend unusually tall screens.
    const columns = Number.parseInt(getComputedStyle(wall!).columnCount, 10) || 2;
    const gap = Number.parseFloat(getComputedStyle(wall!).columnGap) || 0;
    const tileWidth = (width - gap * (columns - 1)) / columns;
    const meanHeight = templates.reduce((total, tile) => total + tileWidth / Number(tile.dataset.ratio) + gap, 0) / templates.length;
    const required = Math.ceil(height * 1.5 / meanHeight) * columns;
    const current = wall!.childElementCount;
    if (current >= required) return;
    const fragment = document.createDocumentFragment();
    for (let i = current; i < required; i++) fragment.append(templates[i % templates.length].cloneNode(true));
    wall!.append(fragment);
  }
  function show(index: number) {
    active = (index + photos.length) % photos.length;
    image.src = photos[active].src;
    image.alt = photos[active].alt;
    dialog!.querySelector('.viewer-caption')!.textContent = photos[active].alt;
    dialog!.querySelector('.viewer-count')!.textContent = `${String(active + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
    dialog!.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.setAttribute('aria-label', 'Phóng to ảnh');
  }
  wall.addEventListener('click', event => {
    const tile = (event.target as HTMLElement).closest<HTMLAnchorElement>('.album-tile');
    if (!tile || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = tile;
    show(Number(tile.dataset.index));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
  dialog.querySelector('.viewer-close')!.addEventListener('click', () => dialog.close());
  dialog.querySelector('.viewer-prev')!.addEventListener('click', () => show(active - 1));
  dialog.querySelector('.viewer-next')!.addEventListener('click', () => show(active + 1));
  zoom.addEventListener('click', () => {
    const enlarged = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.setAttribute('aria-label', enlarged ? 'Thu nhỏ ảnh' : 'Phóng to ảnh');
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus({preventScroll:true}); });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); show(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(active - 1); }
  });
  let frame = 0;
  new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(ensureCoverage); }).observe(wall);
  window.addEventListener('resize', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(ensureCoverage); });
  ensureCoverage();
}
