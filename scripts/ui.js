// UI rendering and animations
import { SHOP_ITEMS, saveState, buyItem as stateBuyItem, equipItem as stateEquipItem } from './state.js';

// DOM element references
let coinCount, face, openShop, shopModal, closeShop, itemsList;
let bodyImg;
let armRightImg, armLeftImg;
let drumImg, drumTapImg;
let cymbalImg, cymbalTapImg, armLeftCymbalImg;
let tomImg, tomTapImg, armLeftTomImg, armRightTomImg;
let snareImg, snareTapImg, armRightSnareImg;
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
  armRightImg = document.getElementById('armRightImg');
  armLeftImg = document.getElementById('armLeftImg');
  drumImg = document.getElementById('drumImg');
  drumTapImg = document.getElementById('drumTapImg');
  cymbalImg = document.getElementById('cymbalImg');
  cymbalTapImg = document.getElementById('cymbalTapImg');
  armLeftCymbalImg = document.getElementById('armLeftCymbalImg');
  tomImg = document.getElementById('tomImg');
  tomTapImg = document.getElementById('tomTapImg');
  armLeftTomImg = document.getElementById('armLeftTomImg');
  armRightTomImg = document.getElementById('armRightTomImg');
  snareImg = document.getElementById('snareImg');
  snareTapImg = document.getElementById('snareTapImg');
  armRightSnareImg = document.getElementById('armRightSnareImg');
  playArea = document.querySelector('.play-area');
  
  // Create idle hint
  idleHint = document.createElement('div');
  idleHint.id = 'idleHint';
  idleHint.className = 'idle-hint';
  idleHint.textContent = '¡Toca la batería para ganar monedas!';
  idleHint.classList.add('show');
  playArea.appendChild(idleHint);

  // Preload commonly used images (warm the browser/SW cache so swaps are fast)
  try {
    const staticImgs = [
      'public/images/body.png',
      'public/images/arm_left.png',
      'public/images/arm_right.png',
      'public/images/drum.png',
      'public/images/drum_tap.png',
      'public/images/cymbal.png',
      'public/images/cymbal_tap.png',
      'public/images/arm_left_cymbal.png',
      'public/images/snare.png',
      'public/images/snare_tap.png',
      'public/images/arm_right_snare.png',
      'public/images/tom.png',
      'public/images/tom_tap.png',
      'public/images/arm_left_tom.png',
      'public/images/arm_right_tom.png',
      'public/images/face.png',
    ];

    // also include any images/icons declared in SHOP_ITEMS
    SHOP_ITEMS.forEach(it => {
      if (it.icon) staticImgs.push(it.icon);
      if (it.image) staticImgs.push(it.image);
      if (it.face) staticImgs.push(it.face);
    });

    // dedupe and start loading
    Array.from(new Set(staticImgs)).forEach(src => {
      const img = new Image();
      img.src = src;
      // best-effort decode to warm decoder, ignore failures
      if (img.decode) img.decode().catch(() => {});
    });
  } catch (e) {
    // non-fatal
    console.warn('preload images failed', e);
  }
}

// Main render function
export function render(state) {
  coinCount.textContent = state.coins;

  // Show the shop button when the user first reaches 5 coins.
  // Persist that we've shown it so it stays visible afterwards.
  try {
    const alreadyShown = !!state.shopShown;
    const alreadyPurchased = (state.owned.drums || []).length > 1;
    const reachedThreshold = (state.coins || 0) >= 5;
    if (openShop) {
      if (alreadyShown || reachedThreshold) {
        openShop.style.opacity = '1';
        openShop.style.pointerEvents = 'auto';
      } else {
        openShop.style.opacity = '0';
        openShop.style.pointerEvents = 'none';
      }
    }

    if (reachedThreshold && !alreadyShown) {
      // mark as shown and persist
      state.shopShown = true;
      saveState(state);
    }

    // Change idleHint message and show
    if (reachedThreshold && !alreadyPurchased) {
      idleHint.textContent = '¡Compra nuevos instrumentos en Mejoras!';
      idleHint.classList.add('show');
    }
  } catch (e) {
    // non-fatal; UI should still render
    console.warn('shop reveal check failed', e);
  }

  updateCostumeImages(state);
  updateFigureImages(state);
  renderOwnedPlayButtons(state);
}

// Costumes may change the face and body images
export function updateCostumeImages(state) {
  const equippedCostumeId = state.equipped ? state.equipped.costume : null;
  const costumeItem = SHOP_ITEMS.find(it => it.kind === 'costume' && it.id === equippedCostumeId);

  // Update face image
  if (costumeItem) {
    if (face && costumeItem.face) {
      face.src = `public/images/face_${costumeItem.id}.png`;
    }
    // Update body image
    if (bodyImg && costumeItem.body) {
      bodyImg.src = `public/images/body_${costumeItem.id}.png`;
    }
    // All arms
    if (armRightImg && costumeItem.armRight) {
      armRightImg.src = `public/images/arm_right_${costumeItem.id}.png`;
    }
    if (armLeftImg && costumeItem.armLeft) {
      armLeftImg.src = `public/images/arm_left_${costumeItem.id}.png`;
    }
    if (armLeftCymbalImg && costumeItem.armLeft) {
      armLeftCymbalImg.src = `public/images/arm_left_cymbal_${costumeItem.id}.png`;
    }
    if (armLeftTomImg && costumeItem.armLeft) {
      armLeftTomImg.src = `public/images/arm_left_tom_${costumeItem.id}.png`;
    }
    if (armRightTomImg && costumeItem.armRight) {
      armRightTomImg.src = `public/images/arm_right_tom_${costumeItem.id}.png`;
    }
    if (armRightSnareImg && costumeItem.armRight) {
      armRightSnareImg.src = `public/images/arm_right_snare_${costumeItem.id}.png`;
    }
  }
}

// Update which images are shown in the stacked figure
function updateFigureImages(state) {
  // Check if smile needs to be removed
  if (face && face.classList.contains('smile')) {
    face.classList.remove('smile');
  }
  // Remove animation tap effects
  if (drumTapImg) drumTapImg.style.opacity = '0';
  if (cymbalTapImg) cymbalTapImg.style.opacity = '0';
  if (armLeftCymbalImg) armLeftCymbalImg.style.opacity = '0';
  if (tomTapImg) tomTapImg.style.opacity = '0';
  if (armLeftTomImg) armLeftTomImg.style.opacity = '0';
  if (armRightTomImg) armRightTomImg.style.opacity = '0';
  if (snareTapImg) snareTapImg.style.opacity = '0';
  if (armRightSnareImg) armRightSnareImg.style.opacity = '0';
  // Reset opacities to max
  if (armLeftImg) armLeftImg.style.opacity = '1';
  if (armRightImg) armRightImg.style.opacity = '1';
  if (drumImg) drumImg.style.opacity = '1';
  // Opacity of the other instruments depends on ownership
  const ownedDrums = state.owned.drums || [];
  if (ownedDrums.includes('cymbal')) {
    if (cymbalImg) cymbalImg.style.opacity = '1';
  } else {
    if (cymbalImg) cymbalImg.style.opacity = '0.25';
  }
  if (ownedDrums.includes('tom')) {
    if (tomImg) tomImg.style.opacity = '1';
  } else {
    if (tomImg) tomImg.style.opacity = '0.25';
  }
  if (ownedDrums.includes('snare')) {
    if (snareImg) snareImg.style.opacity = '1';
  } else {
    if (snareImg) snareImg.style.opacity = '0.25';
  }
}

// Visual tap effects
export function showTapVisual(id) {
  if (id === 'kick') {
    if (face) face.classList.add('smile');
    if (drumImg) drumImg.style.opacity = '0';
    if (drumTapImg) drumTapImg.style.opacity = '1';
  } else if (id === 'cymbal') {
    if (armLeftImg) armLeftImg.style.opacity = '0';
    if (armLeftCymbalImg) armLeftCymbalImg.style.opacity = '1';
    if (cymbalImg) cymbalImg.style.opacity = '0';
    if (cymbalTapImg) cymbalTapImg.style.opacity = '1';
  } else if (id === 'tom' ) {
    if (tomImg) tomImg.style.opacity = '0';
    if (tomTapImg) tomTapImg.style.opacity = '1';
    if (armLeftImg) armLeftImg.style.opacity = '0';
    if (armLeftTomImg) armLeftTomImg.style.opacity = '1';
    if (armRightImg) armRightImg.style.opacity = '0';
    if (armRightTomImg) armRightTomImg.style.opacity = '1';
  } else if (id === 'snare' ) {
    if (snareImg) snareImg.style.opacity = '0';
    if (snareTapImg) snareTapImg.style.opacity = '1';
    if (armRightImg) armRightImg.style.opacity = '0';
    if (armRightSnareImg) armRightSnareImg.style.opacity = '1';
  }
}

export function showIdleHint() {
  if (!idleHint.classList.contains('show')) idleHint.classList.add('show');
}

export function hideIdleHint() {
  if (idleHint.classList.contains('show')) idleHint.classList.remove('show');
}

// Shop modal
export function renderShop(state) {
  itemsList.innerHTML = '';
  
  SHOP_ITEMS.forEach(it => {
    // If the item is a drum and the user owns it, skip showing it in the shop
    if (it.kind === 'drum' && (state.owned.drums || []).includes(it.id)) {
      return;
    }

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
        eq.textContent = 'Equipar';
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
      b.textContent = 'Comprar';
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
        toast.textContent = '¡Comprado!';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#222;color:grey;padding:8px 12px;border-radius:8px;z-index:9999';
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
