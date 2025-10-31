// audio.js (optimized)
import { SHOP_ITEMS } from './state.js';

/** @typedef {{ id:string, sample?:string }} ShopItem */

// --- Audio graph ------------------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.gain.value = 1.0;
masterGain.connect(audioCtx.destination);

// --- State -----------------------------------------------------------------
/** @type {Record<string, AudioBuffer>} */
const samples = Object.create(null); // key: sample URL or 'default'
/** @type {Record<string, string|undefined>} */
const instrumentToSample = Object.create(null); // instrument id -> sample URL (or undefined)
for (const s of SHOP_ITEMS) instrumentToSample[s.id] = s.sample || undefined;

// Default buffer: short percussive “tick”
function createDefaultBuffer(duration = 0.16) {
  const sr = audioCtx.sampleRate || 44100;
  const n = Math.floor(duration * sr);
  const buf = audioCtx.createBuffer(1, n, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.exp(-7 * t);
    const sine = Math.sin(2 * Math.PI * 130 * t) * 0.7;
    const noise = (Math.random() * 2 - 1) * 0.25;
    data[i] = (sine + noise) * env * 0.7;
  }
  return buf;
}
samples.default = createDefaultBuffer();

// --- Resume-once hook (call from first user gesture) ------------------------
let started = false;
export async function ensureAudioStarted() {
  if (!started && audioCtx.state === 'suspended') {
    await audioCtx.resume().catch(() => {});
  }
  started = true;
}

// --- Small concurrency limiter for fetch+decode -----------------------------
function pLimit(max) {
  let active = 0;
  /** @type {Array<() => void>} */
  const queue = [];
  const next = () => {
    active--;
    const fn = queue.shift();
    if (fn) fn();
  };
  return async fn => {
    if (active >= max) await new Promise(r => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      next();
    }
  };
}
const limit = pLimit(3); // decode 3 at a time is a good mobile-friendly cap

// --- Loading ---------------------------------------------------------------
async function loadSampleURL(url) {
  if (samples[url]) return true; // already loaded
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return false;
    const ab = await res.arrayBuffer(); // no copies
    const buf = await audioCtx.decodeAudioData(ab);
    samples[url] = buf;
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload all unique sample URLs referenced by SHOP_ITEMS.
 * - No extension probing
 * - Bounded concurrency
 * - Fallback: if 'basic' instrument points to a URL that fails, we still have samples.default
 */
export async function loadAllSamples() {
  /** Unique URLs present in SHOP_ITEMS */
  const urls = Array.from(new Set(SHOP_ITEMS.map(s => s.sample).filter(Boolean)));

  // Optional: add a commonly used “basic” alias if present in mapping
  // (only if some item literally uses 'basic' URL). Otherwise skip.
  const tasks = urls.map(url => limit(() => loadSampleURL(url)));

  const results = await Promise.allSettled(tasks);

  // Debug summary (cheap)
  if (typeof console !== 'undefined' && console.groupCollapsed) {
    console.groupCollapsed('[Audio] Load summary');
    console.log('Requested URLs:', urls);
    console.log('Loaded keys:', Object.keys(samples));
    console.log(
      'Results:',
      results.map(r => r.status)
    );
    console.groupEnd();
  }
}

// --- Dynamic sample mapping helpers --------------------------------------
/**
 * Set the sample URL used for a logical instrument id (e.g. 'cymbal', 'tom').
 * If `sampleUrl` is truthy the sample will be loaded (best-effort).
 */
export async function setInstrumentSample(instrumentId, sampleUrl) {
  try {
    instrumentToSample[instrumentId] = sampleUrl || undefined;
    if (sampleUrl) await loadSampleURL(sampleUrl);
  } catch (e) {
    console.warn('setInstrumentSample failed', e);
  }
}

/**
 * Reset the instrument sample mapping back to the default declared in SHOP_ITEMS.
 */
export async function resetInstrumentSample(instrumentId) {
  try {
    const def = SHOP_ITEMS.find(s => s.id === instrumentId && s.sample);
    const url = def ? def.sample : undefined;
    instrumentToSample[instrumentId] = url;
    if (url) await loadSampleURL(url);
  } catch (e) {
    console.warn('resetInstrumentSample failed', e);
  }
}

// --- Playback --------------------------------------------------------------
export function playInstrument(instrumentId) {
  // Hot path: no decode, no fetch, minimal branching.
  // Do NOT call resume() every tap; call ensureAudioStarted() once from UI.
  const url = instrumentToSample[instrumentId];
  const buf = (url && samples[url]) || samples.default;

  if (!buf) return; // shouldn't happen

  try {
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(masterGain);
    // Use onended to detach; avoids timers and leaked AudioParams.
    src.onended = () => {
      try {
        src.disconnect();
      } catch {}
    };
    src.start();
  } catch (e) {
    // ultra-rare: if buffer playback fails, do a minimal synth blip
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 120;
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.connect(g);
      g.connect(masterGain);
      o.start();
      o.stop(audioCtx.currentTime + 0.16);
    } catch {}
  }
}

export function getAudioContext() {
  return audioCtx;
}
export function setMasterVolume(v) {
  masterGain.gain.value = Math.max(0, Math.min(1, v));
}

/**
 * Play a sample by URL. Loads the sample if needed, then plays it once.
 * This is a convenience for previewing item sounds.
 */
export async function playSampleUrl(url) {
  if (!url) return;
  try {
    await loadSampleURL(url);
    const buf = samples[url] || samples.default;
    if (!buf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(masterGain);
    src.onended = () => {
      try {
        src.disconnect();
      } catch {}
    };
    src.start();
  } catch (e) {
    console.warn('playSampleUrl failed', e);
  }
}
