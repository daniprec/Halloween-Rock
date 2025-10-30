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
  resetIdleTimer,
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
  resetIdleTimer();
  // Save state
  saveState(state);
  // Revert after 180ms
  setTimeout(() => {
    render(state);
  }, 180);
}

// Initialize the application
function init() {
  // Initialize UI elements
  initializeUI();
  
  // Get UI elements
  const { openShop, closeShop, playArea } = getUIElements();
  
  // Initial render
  render(state);
  
  // Start idle timer
  resetIdleTimer();
  
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
  
  // Expose state for debugging
  window._hr = { state, saveState, loadState };
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
