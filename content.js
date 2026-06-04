const OVERLAY_ID = 'yt-scanfilter-overlay';
const ENABLED_KEY = 'yt_scanfilter_enabled';
let enabled = true;

function getLayers(w, h) {
  const urls = [1, 2, 3].map(i =>
    `url("${chrome.runtime.getURL(`filter_col${i}.svg`)}") no-repeat left top / ${w}px ${h}px`
  );
  return urls.join(', ');
}

//function getLayers(w, h) {
//  return `url("${chrome.runtime.getURL('filter.svg')}") no-repeat left top / ${w}px ${h}px`;
//}

function applyFilter() {
  removeFilter();

  const player = document.querySelector('#movie_player');
  if (!player) { setTimeout(applyFilter, 500); return; }

  const video = player.querySelector('video.html5-main-video');
  if (!video) { setTimeout(applyFilter, 500); return; }
  
  video.style.filter = 'grayscale(1)';

  // Убеждаемся что плеер position:relative/absolute
  const cs = getComputedStyle(player);
  if (cs.position === 'static') player.style.position = 'relative';

  const w = player.offsetWidth;
  const h = player.offsetHeight;
  if (!w || !h) { setTimeout(applyFilter, 500); return; }

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.style.cssText = `
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: ${getLayers(w, h)} !important;
    pointer-events: none !important;
    z-index: 50 !important;
    transition: opacity 0.2s ease !important;
  `;

  player.appendChild(overlay);

  // Скрывать при hover — контролы поверх
  //player.addEventListener('mouseenter', hideOverlay);
  //player.addEventListener('mouseleave', showOverlay);

  // Пересчёт при изменении размера плеера (wide/theater/fullscreen)
  if (window._yt_resizeObserver) window._yt_resizeObserver.disconnect();
  window._yt_resizeObserver = new ResizeObserver(() => rescaleOverlay());
  window._yt_resizeObserver.observe(player);
}

function rescaleOverlay() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) return;
  const player = document.querySelector('#movie_player');
  if (!player) return;
  const w = player.offsetWidth;
  const h = player.offsetHeight;
  //overlay.style.backgroundSize = `${w}px ${h}px`;
  overlay.style.backgroundSize = [1,2,3].map(() => `${w}px ${h}px`).join(', ');
}

function hideOverlay() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.style.opacity = '0';
}

function showOverlay() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) overlay.style.opacity = '1';
}

function removeFilter() {
  const el = document.getElementById(OVERLAY_ID);
  if (el) el.remove();

  const video = document.querySelector('video.html5-main-video');
  if (video) video.style.filter = '';

  const player = document.querySelector('#movie_player');
  if (player) {
    player.removeEventListener('mouseenter', hideOverlay);
    player.removeEventListener('mouseleave', showOverlay);
  }

  if (window._yt_resizeObserver) {
    window._yt_resizeObserver.disconnect();
    window._yt_resizeObserver = null;
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'TOGGLE') {
    enabled = msg.value;
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
    enabled ? applyFilter() : removeFilter();
  }
  if (msg.type === 'GET_STATE') { sendResponse({ enabled }); }
  return true;
});

const stored = localStorage.getItem(ENABLED_KEY);
enabled = stored === null ? true : stored === '1';
if (enabled) applyFilter();

let lastUrl = location.href;
new MutationObserver(() => {
  if (!enabled) return;
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(applyFilter, 1000);
  }
  if (!document.getElementById(OVERLAY_ID)) applyFilter();
}).observe(document.body, { childList: true, subtree: true });
