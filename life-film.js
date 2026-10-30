/** The edited, title-free opening film. Its encoded duration is exactly 10 s. */
export function mountLifeFilm(container) {
  if (!container) return { paused: true, togglePause: () => true, destroy() {} };
  const video = document.createElement('video');
  video.className = 'life-background-film';
  video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
  video.preload = 'none';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.poster = new URL('./branch-life-10s-poster.jpg', import.meta.url).href;
  video.src = new URL('./branch-life-10s.mp4', import.meta.url).href;
  container.append(video);
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = media.matches, visible = false, destroyed = false, attempt = 0;
  const button = () => document.querySelector('[data-action="tunnel-pause"]');
  function syncButton() {
    const control = button(); if (!control) return;
    control.textContent = paused ? '▷' : 'Ⅱ';
    control.setAttribute('aria-label', paused ? '播放人物视频' : '暂停人物视频');
    control.setAttribute('aria-pressed', String(paused));
  }
  function sync() {
    const request = ++attempt;
    syncButton();
    if (destroyed || paused || !visible || document.hidden) { video.pause(); return; }
    video.play()?.then(() => {
      if (destroyed || paused || !visible || document.hidden) video.pause();
    }).catch(() => {
      if (destroyed || request !== attempt) return;
      paused = true; syncButton();
    });
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false; sync();
  }, { threshold: .01 }) : null;
  if (observer) observer.observe(container); else visible = true;
  function motion() { paused = media.matches; sync(); }
  document.addEventListener('visibilitychange', sync);
  media.addEventListener('change', motion);
  sync();
  return {
    get paused() { return paused; },
    togglePause() { paused = !paused; sync(); return paused; },
    destroy() {
      destroyed = true; attempt++; observer?.disconnect();
      document.removeEventListener('visibilitychange', sync); media.removeEventListener('change', motion);
      video.pause(); video.removeAttribute('src'); video.load(); video.remove();
    },
  };
}
