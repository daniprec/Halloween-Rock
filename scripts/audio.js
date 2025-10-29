// Audio management
import { SHOP_ITEMS } from './state.js';

// Audio context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Sample storage
const samples = {}; // id -> AudioBuffer
// Map from instrument id -> sample id (null when not explicitly provided)
const instrumentToSample = {};
SHOP_ITEMS.forEach(s => {
  // Only map explicit sample values. If an item doesn't declare `sample`, we'll
  // use the shared default buffer at play time.
  instrumentToSample[s.id] = s.sample || null;
});
const SAMPLE_EXTS = ['wav', 'mp3', 'ogg', 'm4a'];

// Create a short generated default buffer (average sound) to use when no sample
// is available for an instrument. This ensures a consistent fallback for all.
function createDefaultBuffer(duration = 0.18) {
  const sampleRate = audioCtx.sampleRate || 44100;
  const frameCount = Math.floor(duration * sampleRate);
  const buf = audioCtx.createBuffer(1, frameCount, sampleRate);
  const data = buf.getChannelData(0);
  // simple decaying noise + sine mix
  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    // decaying envelope
    const env = Math.exp(-6 * t);
    // sine body
    const sine = Math.sin(2 * Math.PI * 120 * t) * 0.6;
    // noise component
    const noise = (Math.random() * 2 - 1) * 0.35;
    data[i] = (sine + noise) * env * 0.6;
  }
  return buf;
}

// store default buffer under the key 'default'
try {
  samples['default'] = createDefaultBuffer();
} catch (e) {
  console.warn('Failed to create default audio buffer', e);
}

// Load a single sample by trying different extensions
async function loadSampleIfExists(id) {
  // If id looks like a path (contains '/' or ends with a known extension), try it directly first
  const looksLikePath = id.includes('/') || /\.(wav|mp3|ogg|m4a)$/i.test(id);
  if (looksLikePath) {
    try {
      const res = await fetch(id);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        try {
          const buf = await audioCtx.decodeAudioData(ab.slice(0));
          samples[id] = buf;
          console.log('Loaded sample', id, 'from direct URL');
          return true;
        } catch (decodeErr) {
          console.warn('Failed to decode', id, decodeErr);
        }
      }
    } catch (e) {
      // fall through to trying constructed paths
    }
  }

  for (const ext of SAMPLE_EXTS) {
    const url = `public/audio/${id}.${ext}`;
    try {
      console.debug('Trying', url);
      const res = await fetch(url);
      if (!res.ok) { console.debug('Not found:', url, res.status); continue; }
      const ab = await res.arrayBuffer();
      try {
        const buf = await audioCtx.decodeAudioData(ab.slice(0));
        samples[id] = buf;
        console.log('Loaded sample', id, 'from', url);
        return true;
      } catch (decodeErr) {
        console.warn('Failed to decode', url, decodeErr);
        continue;
      }
    } catch (fetchErr) {
      console.debug('fetch failed for', url, fetchErr);
      // ignore and try next ext
    }
  }
  return false;
}

// Load all available samples
export async function loadAllSamples() {
  // Collect explicit sample values declared in SHOP_ITEMS
  const ids = new Set(SHOP_ITEMS.map(s => s.sample).filter(Boolean));
  // Always include some common fallback keys to try
  ids.add('basic');
  ids.add('drum');
  ids.add('kick');

  const attempts = Array.from(ids).map(id => ({ id, p: loadSampleIfExists(id) }));
  await Promise.all(attempts.map(a => a.p.catch(e => { console.warn('load failed for', a.id, e); })));

  // Log a helpful summary for debugging
  console.group('Audio sample load summary')
  console.log('Requested sample ids:', Array.from(ids))
  console.log('Loaded sample keys:', Object.keys(samples))
  console.groupEnd()

  // If someone provided a 'drum' or 'kick' sample but not 'basic', map them.
  if (!samples['basic']) {
    if (samples['drum']) samples['basic'] = samples['drum'];
    else if (samples['kick']) samples['basic'] = samples['kick'];
  }
}

// Play an instrument sound
export function playInstrument(id) {
  // Resume audio context if suspended
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // Map instrument id to an explicit sample id when configured. If item wasn't
  // given a `sample`, instrumentToSample[id] will be null and we'll use the
  // shared default buffer.
  const sampleId = instrumentToSample[id] || 'default';

  // Play the AudioBuffer if present (either a loaded file or the generated default)
  const buf = samples[sampleId];
  if (buf) {
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.start();
      setTimeout(() => { try { src.disconnect(); } catch (e) {} }, (buf.duration + 0.1) * 1000);
      return;
    } catch (e) {
      console.warn('sample playback failed for', sampleId, e);
    }
  }

  // As a last resort (shouldn't happen because we create a default buffer),
  // fall back to a tiny synth hit so the app still produces sound.
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(120, audioCtx.currentTime);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
  o.connect(g); g.connect(audioCtx.destination); o.start(); setTimeout(() => o.stop(), 160);
}

export function getAudioContext() {
  return audioCtx;
}
