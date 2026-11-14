const portraitStand = document.querySelector('.portrait-stand');
const portraitCard = portraitStand.querySelector('.portrait-frame');
const portraitMotion = matchMedia('(prefers-reduced-motion: reduce)');

function resetPortraitTilt() {
  portraitCard.classList.remove('is-tilting');
  portraitCard.style.removeProperty('--tilt-x');
  portraitCard.style.removeProperty('--tilt-y');
}

portraitStand.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || portraitMotion.matches) return;
  const bounds = portraitStand.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

  portraitCard.style.setProperty('--tilt-x', (0.5 - y) * 18 + 'deg');
  portraitCard.style.setProperty('--tilt-y', (x - 0.5) * 18 + 'deg');
  portraitCard.style.setProperty('--shine-x', x * 100 + '%');
  portraitCard.style.setProperty('--shine-y', y * 100 + '%');
  portraitCard.classList.add('is-tilting');
});

portraitStand.addEventListener('pointerleave', resetPortraitTilt);
portraitStand.addEventListener('pointercancel', resetPortraitTilt);
portraitMotion.addEventListener('change', resetPortraitTilt);

const portraitVideo = document.getElementById('portrait-video');
let portraitVisible = false;

function canPlayPortrait() {
  return portraitVisible && !document.hidden && !portraitMotion.matches;
}

function updatePortraitVideo() {
  if (!canPlayPortrait()) {
    portraitVideo.pause();
    if (portraitMotion.matches) portraitCard.classList.remove('is-playing');
    return;
  }
  if (!portraitVideo.hasAttribute('src')) portraitVideo.src = portraitVideo.dataset.src;
  portraitVideo.play().catch(() => {});
}

portraitVideo.addEventListener('playing', () => {
  if (canPlayPortrait()) portraitCard.classList.add('is-playing');
});
portraitVideo.addEventListener('error', () => portraitCard.classList.remove('is-playing'));
portraitMotion.addEventListener('change', updatePortraitVideo);
document.addEventListener('visibilitychange', updatePortraitVideo);
new IntersectionObserver(([entry]) => {
  portraitVisible = entry.isIntersecting;
  updatePortraitVideo();
}).observe(portraitStand);
