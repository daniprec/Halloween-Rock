// UI rendering and animations
import { SHOP_ITEMS, saveState, buyItem as stateBuyItem, equipItem as stateEquipItem } from './state.js';

// DOM element references
let coinCount, face, openShop, shopModal, closeShop, itemsList;
let bodyImg, armsImg, drumImg, cymbalImgEl, drumTapImg, cymbalTapImg, faceImg;
let playArea, idleHint;

// Initialize DOM references
export function initializeUI() {
  coinCount = document.getElementById('coinCount');
  face = document.getElementById('face');
  openShop = document.getElementById('openShop');
  shopModal = document.getElementById('shopModal');
  closeShop = document.getElementById('closeShop');
  itemsList = document.getElementById('itemsList');
  bodyImg = document.getElementById('bodyImg');
  armsImg = document.getElementById('armsImg');
  drumImg = document.getElementById('drumImg');
  cymbalImgEl = document.getElementById('cymbalImg');
  drumTapImg = document.getElementById('drumTapImg');
  cymbalTapImg = document.getElementById('cymbalTapImg');
  faceImg = document.getElementById('face');
  playArea = document.querySelector('.play-area');
  
  // Create idle hint
  idleHint = document.createElement('div');
  idleHint.id = 'idleHint';
  idleHint.className = 'idle-hint';
  idleHint.textContent = 'Tap to drum!';
  playArea.appendChild(idleHint);
}

// Main render function
export function render(state) {
  coinCount.textContent = state.coins;
  updateFigureImages(state);
  renderOwnedPlayButtons(state);
}

// Update which images are shown in the stacked figure
function updateFigureImages(state) {
  if (drumImg) drumImg.src = 'public/images/drum.png';
  if (armsImg) armsImg.src = 'public/images/arms.png';
  
  // Show cymbal overlay only when equipped
  const isEquippedCymbal = state.equipped && state.equipped.drum === 'cymbal';
  if (cymbalImgEl) cymbalImgEl.style.display = isEquippedCymbal ? 'block' : 'none';
}

// Coin animation
export function showCoinAnimation(n = 1) {
  try {
    const coinEl = document.getElementById('coinCount');
    const rect = coinEl.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'coin-fly';
    el.textContent = `+${n}`;
    document.body.appendChild(el);
    
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + rect.height / 2) + 'px';
    el.style.transform = 'translate(-50%, 0)';
    el.style.opacity = '1';
    
    requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -48px)';
      el.style.opacity = '0';
    });
    
    setTimeout(() => el.remove(), 900);
  } catch (e) {
    console.warn('coin animation failed', e);
  }
}

// Visual tap effects
export function showTapVisual(id) {
  const faceEl = document.getElementById('face');
  
  // Hide both taps first
  if (drumTapImg) drumTapImg.style.opacity = '0';
  if (cymbalTapImg) cymbalTapImg.style.opacity = '0';
  
  if (id === 'cymbal') {
    // Cymbal tap visual
    const prevCymbalVisible = cymbalImgEl && (cymbalImgEl.style.display !== 'none');
    if (cymbalImgEl) cymbalImgEl.style.display = 'none';
    if (cymbalTapImg) {
      cymbalTapImg.style.transition = 'opacity 120ms ease';
      cymbalTapImg.style.opacity = '1';
    }
    if (armsImg) armsImg.src = 'public/images/arms_cymbal.png';
    if (faceEl) faceEl.classList.add('smile');
    
    setTimeout(() => {
      if (cymbalTapImg) cymbalTapImg.style.opacity = '0';
      if (cymbalImgEl) cymbalImgEl.style.display = prevCymbalVisible ? 'block' : 'none';
      if (armsImg) armsImg.src = 'public/images/arms.png';
      if (faceEl) faceEl.classList.remove('smile');
    }, 180);
  } else {
    // Drum tap visual
    const prevCymbalVisible = cymbalImgEl && (cymbalImgEl.style.display !== 'none');
    if (prevCymbalVisible && cymbalImgEl) cymbalImgEl.style.display = 'none';
    if (drumTapImg) {
      drumTapImg.style.transition = 'opacity 120ms ease';
      drumTapImg.style.opacity = '1';
    }
    if (faceEl) faceEl.classList.add('smile');
    
    setTimeout(() => {
      if (drumTapImg) drumTapImg.style.opacity = '0';
      if (faceEl) faceEl.classList.remove('smile');
      if (prevCymbalVisible && cymbalImgEl) cymbalImgEl.style.display = 'block';
    }, 140);
  }
}

// Idle hint management
let _idleTimer = null;
const IDLE_DELAY = 2000;

export function showIdleHint() {
  if (!idleHint.classList.contains('show')) idleHint.classList.add('show');
}

export function hideIdleHint() {
  if (idleHint.classList.contains('show')) idleHint.classList.remove('show');
}

export function resetIdleTimer() {
  if (_idleTimer) clearTimeout(_idleTimer);
  _idleTimer = setTimeout(() => {
    showIdleHint();
  }, IDLE_DELAY);
}

// Shop modal
export function renderShop(state) {
  itemsList.innerHTML = '';
  
  SHOP_ITEMS.forEach(it => {
    const row = document.createElement('div');
    row.className = 'item';
    
    const left = document.createElement('div');
    left.innerHTML = `<div><strong>${it.name}</strong><div class='small'>${it.price} coins</div></div>`;
    
    const right = document.createElement('div');
    const owned = (state.owned[it.kind + 's'] || []).includes(it.id);
    
    if (owned) {
      row.classList.add('owned');
      const isEquipped = state.equipped && state.equipped[it.kind] === it.id;
      if (isEquipped) {
        right.innerHTML = '<span class="small">Equipped</span>';
      } else {
        const eq = document.createElement('button');
        eq.textContent = 'Equip';
        eq.addEventListener('click', () => {
          stateEquipItem(state, it);
          saveState(state);
          render(state);
          renderShop(state);
        });
        right.appendChild(eq);
      }
    } else {
      const b = document.createElement('button');
      b.textContent = 'Buy';
      b.addEventListener('click', () => {
        const result = stateBuyItem(state, it);
        if (!result.success) {
          alert(result.message);
          return;
        }
        saveState(state);
        render(state);
        renderShop(state);
        
        // Show purchase confirmation
        const toast = document.createElement('div');
        toast.textContent = 'Purchased!';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:8px 12px;border-radius:8px;z-index:9999';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1200);
      });
      right.appendChild(b);
    }
    
    row.appendChild(left);
    row.appendChild(right);
    itemsList.appendChild(row);
  });
}

export function openShopModal() {
  shopModal.classList.add('open');
}

export function closeShopModal() {
  shopModal.classList.remove('open');
}

// Render play buttons for owned instruments
function renderOwnedPlayButtons(state) {
  const row = document.getElementById('ownedPlayRow');
  row.innerHTML = '';
  
  const ownedDrums = state.owned.drums || [];
  if (ownedDrums.length === 0) {
    row.style.display = 'none';
    return;
  }
  
  row.style.display = 'flex';
  
  ownedDrums.forEach(id => {
    const it = SHOP_ITEMS.find(s => s.id === id);
    const name = it ? it.name : id;
    const b = document.createElement('button');
    b.className = 'small-play-btn';
    b.title = name;
    b.setAttribute('aria-label', name);
    
    if (it && it.icon) {
      const img = document.createElement('img');
      img.src = it.icon;
      img.alt = name;
      img.width = 40;
      img.height = 40;
      b.appendChild(img);
    } else {
      b.textContent = name;
    }
    
    // Store instrument id for event handler
    b.dataset.instrumentId = id;
    row.appendChild(b);
  });
}

// Get UI elements for external access
export function getUIElements() {
  return {
    openShop,
    closeShop,
    playArea,
    shopModal
  };
}
