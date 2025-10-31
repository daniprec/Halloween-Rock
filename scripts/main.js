// Main application initialization
import { loadState, saveState, giveCoin, SHOP_ITEMS } from './state.js';
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
let _passiveInterval = null;

function updatePassiveIncome() {
  try {
    // Clear any existing interval
    if (_passiveInterval) {
      clearInterval(_passiveInterval);
      _passiveInterval = null;
    }

    // Compute passive income per second from owned upgrades
    const ownedUpgrades = (state.owned && state.owned.upgrades) || [];
    let passive = 0;
    if (Array.isArray(SHOP_ITEMS)) {
      for (const it of SHOP_ITEMS) {
        if (it.kind === 'upgrade' && it.passive && ownedUpgrades.includes(it.id)) {
          passive += Number(it.passive) || 0;
        }
      }
    }

    if (passive > 0) {
      _passiveInterval = setInterval(() => {
        giveCoin(state, passive);
        saveState(state);
        render(state);
      }, 1000);
    }
  } catch (e) {
    console.warn('updatePassiveIncome failed', e);
  }
}

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

  // Start passive income if any owned upgrades provide it
  updatePassiveIncome();
  
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
  window._hr = { state, saveState, loadState, updatePassiveIncome };
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
