// Audio management
import { SHOP_ITEMS } from './state.js';

// Audio context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Sample storage
const samples = {}; // id -> AudioBuffer
const SAMPLE_EXTS = ['wav', 'mp3', 'ogg', 'm4a'];

// Load a single sample by trying different extensions
async function loadSampleIfExists(id) {
  for (const ext of SAMPLE_EXTS) {
    const url = `public/audio/${id}.${ext}`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
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
      // ignore and try next ext
    }
  }
  return false;
}

// Load all available samples
export async function loadAllSamples() {
  const ids = new Set(SHOP_ITEMS.map(s => s.id));
  ids.add('basic');
  ids.add('drum');
  ids.add('kick');
  
  await Promise.all(Array.from(ids).map(id => loadSampleIfExists(id)));
  
  // Fallback: use 'drum' or 'kick' as 'basic' if no explicit basic sample exists
  if (!samples['basic']) {
    if (samples['drum']) samples['basic'] = samples['drum'];
    else if (samples['kick']) samples['basic'] = samples['kick'];
  }
}

// Play an instrument sound
export function playInstrument(id) {
  // Resume audio context if suspended
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  // If a static sample exists, play it
  if (samples[id]) {
    try {
      const src = audioCtx.createBufferSource();
      src.buffer = samples[id];
      src.connect(audioCtx.destination);
      src.start();
      setTimeout(() => {
        try {
          src.disconnect();
        } catch (e) {}
      }, (samples[id].duration + 0.1) * 1000);
      return;
    } catch (e) {
      console.warn('sample playback failed, falling back', e);
    }
  }
  
  // Fallback: synthesized short hit
  const freqMap = { snare: 220, tom: 150, basic: 120 };
  const freq = (freqMap[id] || freqMap.basic);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  setTimeout(() => o.stop(), 160);
}

export function getAudioContext() {
  return audioCtx;
}
