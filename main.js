import Lenis from 'lenis';

// ==========================================================================
// CONSTANTS & STATE
// ==========================================================================
const TOTAL_FRAMES = 240;
const FRAME_PATH_PREFIX = '/frames/ezgif-frame-';
const FRAME_PATH_EXT = '.jpg';

const frames = [];
let loadedCount = 0;
let currentFrameIndex = 0;

// Sound Synthesizer State
let audioCtx = null;
let soundEnabled = false;
let fizzGain = null;
let lastPopFrame = -1;
let lastSplashFrame = -1;

// DOM Elements
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressFrames = document.getElementById('progress-frames');

const canvas = document.getElementById('coke-canvas');
const ctx = canvas.getContext('2d');
const frameCounter = document.getElementById('frame-counter');
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

// ==========================================================================
// LENIS SMOOTH SCROLL INITIALIZATION
// ==========================================================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ==========================================================================
// PRELOADING 240 FRAMES
// ==========================================================================
function getFrameUrl(index) {
  const paddedIndex = String(index + 1).padStart(3, '0');
  return `${FRAME_PATH_PREFIX}${paddedIndex}${FRAME_PATH_EXT}`;
}

function preloadFrames() {
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFrameUrl(i);

    img.onload = () => {
      loadedCount++;
      const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressPercent) progressPercent.textContent = `${percent}%`;
      if (progressFrames) progressFrames.textContent = `${loadedCount} / ${TOTAL_FRAMES}`;

      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    img.onerror = () => {
      console.warn(`Frame failed to load: ${img.src}`);
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onAllFramesLoaded();
      }
    };

    frames.push(img);
  }
}

function onAllFramesLoaded() {
  setTimeout(() => {
    if (preloader) preloader.classList.add('fade-out');
    resizeCanvas();
    renderFrame(0);
  }, 350);
}

// ==========================================================================
// CANVAS RENDERING ENGINE (FULL-PAGE COVER)
// ==========================================================================
function resizeCanvas() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);
  renderFrame(currentFrameIndex);
}

window.addEventListener('resize', resizeCanvas);

function renderFrame(index) {
  if (!canvas || !ctx) return;
  const img = frames[index];
  if (!img || !img.complete) return;

  const dpr = window.devicePixelRatio || 1;
  const cWidth = canvas.width / dpr;
  const cHeight = canvas.height / dpr;

  ctx.clearRect(0, 0, cWidth, cHeight);

  // Full-page cover algorithm: seamlessly covers 100% of the viewport
  const hRatio = cWidth / img.naturalWidth;
  const vRatio = cHeight / img.naturalHeight;
  const ratio = Math.max(hRatio, vRatio);

  const drawWidth = img.naturalWidth * ratio;
  const drawHeight = img.naturalHeight * ratio;
  const offsetX = (cWidth - drawWidth) / 2;
  const offsetY = (cHeight - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  // Update Frame HUD if present
  if (frameCounter) {
    const padded = String(index + 1).padStart(3, '0');
    frameCounter.textContent = `FRAME ${padded} / ${TOTAL_FRAMES}`;
  }

  // Check audio cues on milestones
  checkAudioCues(index);
}

// ==========================================================================
// SCROLL TRACKER ACROSS FULL DOCUMENT
// ==========================================================================
function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return;

  const scrollY = window.scrollY || window.pageYOffset;
  const scrollFraction = Math.max(0, Math.min(1, scrollY / maxScroll));

  const frameIndex = Math.min(
    TOTAL_FRAMES - 1,
    Math.floor(scrollFraction * TOTAL_FRAMES)
  );

  if (frameIndex !== currentFrameIndex) {
    currentFrameIndex = frameIndex;
    renderFrame(currentFrameIndex);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

// ==========================================================================
// SYNTHESIZED WEB AUDIO EFFECTS (FIZZ, CAP POP & SPLASH)
// ==========================================================================
function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 4200;
  bandpass.Q.value = 1.8;

  fizzGain = audioCtx.createGain();
  fizzGain.gain.value = 0.03;

  whiteNoise.connect(bandpass);
  bandpass.connect(fizzGain);
  fizzGain.connect(audioCtx.destination);
  whiteNoise.start(0);
}

function playCapPop() {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.13);
}

function playSplashBurst() {
  if (!soundEnabled || !audioCtx) return;
  const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < output.length; i++) {
    output[i] = (Math.random() * 2 - 1) * (1 - i / output.length);
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, audioCtx.currentTime);
  filter.frequency.linearRampToValueAtTime(400, audioCtx.currentTime + 0.35);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start();
}

function checkAudioCues(frameIndex) {
  if (!soundEnabled) return;

  // Cap pop around frame 85-95
  if (frameIndex >= 85 && frameIndex <= 95 && Math.abs(frameIndex - lastPopFrame) > 30) {
    lastPopFrame = frameIndex;
    playCapPop();
  }

  // Major liquid explosion around frame 130-150
  if (frameIndex >= 135 && frameIndex <= 150 && Math.abs(frameIndex - lastSplashFrame) > 40) {
    lastSplashFrame = frameIndex;
    playSplashBurst();
  }
}

if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundBtn.classList.add('text-primary', 'border-primary');
      if (soundIcon) soundIcon.textContent = 'volume_up';
      if (fizzGain) fizzGain.gain.setTargetAtTime(0.04, audioCtx.currentTime, 0.1);
      playCapPop();
    } else {
      soundBtn.classList.remove('text-primary', 'border-primary');
      if (soundIcon) soundIcon.textContent = 'volume_off';
      if (fizzGain) fizzGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.1);
    }
  });
}

// Start preloading the 240 frames
preloadFrames();
