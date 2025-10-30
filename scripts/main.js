// Main application initialization
import { loadState, saveState, giveCoin } from './state.js';
import { loadAllSamples, playInstrument, getAudioContext } from './audio.js';
import {
  initializeUI,
  render,
  renderShop,
  openShopModal,
  closeShopModal,
  showTapVisual,
  hideIdleHint,
  getUIElements
} from './ui.js';

// Application state
let state = loadState();

// Play an instrument with visual feedback
function playAndShow(id) {
  const audioCtx = getAudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  playInstrument(id);
  showTapVisual(id);
  // Award coin
  giveCoin(state, 1);
  // Remove idle hint
  hideIdleHint();
  // Save state
  saveState(state);
  // Revert after 180ms
  setTimeout(() => {
    render(state);
  }, 500);
}

// Initialize the application
function init() {
  // Initialize UI elements
  initializeUI();
  
  // Get UI elements
  const { openShop, closeShop, playArea } = getUIElements();
  
  // Initial render
  render(state);
  
  // Load audio samples
  loadAllSamples().catch(e => console.warn('loading static samples failed', e));
  
  // Event listeners
  openShop.addEventListener('click', () => {
    renderShop(state);
    openShopModal();
  });
  
  closeShop.addEventListener('click', () => {
    closeShopModal(state);
  });
  
  // Owned instrument play buttons (event delegation)
  const ownedPlayRow = document.getElementById('ownedPlayRow');
  ownedPlayRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.small-play-btn');
    if (!btn) return;
    
    const instrumentId = btn.dataset.instrumentId;
    if (instrumentId) {
      playAndShow(instrumentId);
    }
  });

  // Debug / cheat key: press 'f' to get 1000 coins (ignored when typing in inputs)
  document.addEventListener('keydown', (e) => {
    try {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      if (e.key === 'f' || e.key === 'F') {
        giveCoin(state, 1000);
        saveState(state);
        render(state);
        // small toast confirmation
        const toast = document.createElement('div');
        toast.textContent = '+1000 monedas';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:grey;padding:8px 12px;border-radius:8px;z-index:9999';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1400);
      }
    } catch (err) {
      console.warn('cheat key handler failed', err);
    }
  });
  
  // Expose state for debugging
  window._hr = { state, saveState, loadState };
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
