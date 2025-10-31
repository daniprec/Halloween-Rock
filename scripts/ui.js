// UI rendering and animations
import { SHOP_ITEMS, saveState, buyItem as stateBuyItem, equipItem as stateEquipItem } from './state.js';
import { setInstrumentSample, resetInstrumentSample, playSampleUrl } from './audio.js';

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
  idleHint.textContent = '¡Sube el volumen y después toca repetidamente el botón de abajo!';
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
      // preload tap/arm assets for skins (may include GIFs)
      if (it.tap) staticImgs.push(it.tap);
      if (it.armLeft) staticImgs.push(it.armLeft);
      if (it.armRight) staticImgs.push(it.armRight);
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
      idleHint.textContent = '¡Pulsa el botón de arriba y usa tus monedas para comprar nuevos instrumentos!';
      idleHint.classList.add('show');
    }

    if (alreadyPurchased) {
      idleHint.classList.remove('show');
    }
  } catch (e) {
    // non-fatal; UI should still render
    console.warn('shop reveal check failed', e);
  }

  updateCostumeImages(state);
  updateFigureImages(state);
  updateInstrumentSkins(state);
  // Sync audio samples for equipped skins (best-effort, async)
  try {
    // fire-and-forget: don't await here to keep render sync
    syncInstrumentAudio(state).catch(e => console.warn('syncInstrumentAudio failed', e));
  } catch (e) {}
  renderOwnedPlayButtons(state);
}

// Update instrument images based on equipped skins (general for any instrument)
function updateInstrumentSkins(state) {
  try {
    const skins = (state.equipped && state.equipped.skins) || {};

    // kick drum (DOM uses drumImg/drumTapImg)
    if (skins.kick) {
      const skinItem = SHOP_ITEMS.find(s => s.id === skins.kick);
      if (drumImg && skinItem && skinItem.image) drumImg.src = skinItem.image;
      if (drumTapImg && skinItem && skinItem.tap) drumTapImg.src = skinItem.tap;
    } else {
      if (drumImg) drumImg.src = 'public/images/drum.png';
      if (drumTapImg) drumTapImg.src = 'public/images/drum_tap.png';
    }

    // cymbal
    if (skins.cymbal) {
      const skinItem = SHOP_ITEMS.find(s => s.id === skins.cymbal);
      if (cymbalImg && skinItem && skinItem.image) cymbalImg.src = skinItem.image;
      if (cymbalTapImg && skinItem && skinItem.tap) cymbalTapImg.src = skinItem.tap;
    } else {
      if (cymbalImg) cymbalImg.src = 'public/images/cymbal.png';
      if (cymbalTapImg) cymbalTapImg.src = 'public/images/cymbal_tap.png';
    }

    // tom
    if (skins.tom) {
      const skinItem = SHOP_ITEMS.find(s => s.id === skins.tom);
      if (tomImg && skinItem && skinItem.image) tomImg.src = skinItem.image;
      if (tomTapImg && skinItem && skinItem.tap) tomTapImg.src = skinItem.tap;
    } else {
      if (tomImg) tomImg.src = 'public/images/tom.png';
      if (tomTapImg) tomTapImg.src = 'public/images/tom_tap.png';
    }

    // snare
    if (skins.snare) {
      const skinItem = SHOP_ITEMS.find(s => s.id === skins.snare);
      if (snareImg && skinItem && skinItem.image) snareImg.src = skinItem.image;
      if (snareTapImg && skinItem && skinItem.tap) snareTapImg.src = skinItem.tap;
    } else {
      if (snareImg) snareImg.src = 'public/images/snare.png';
      if (snareTapImg) snareTapImg.src = 'public/images/snare_tap.png';
    }
  } catch (e) {
    console.warn('updateInstrumentSkins failed', e);
  }
}

// Sync audio samples for currently equipped skins. This updates the sample mapping
// so playInstrument uses the skin's sample for the target instrument.
async function syncInstrumentAudio(state) {
  const skins = (state.equipped && state.equipped.skins) || {};

  // For each instrument we know about, set or reset sample mapping
  const instruments = ['cymbal', 'tom', 'snare', 'kick'];
  for (const inst of instruments) {
    try {
      const skinId = skins[inst];
      if (skinId) {
        const it = SHOP_ITEMS.find(s => s.id === skinId);
        if (it && it.sample) await setInstrumentSample(inst, it.sample);
      } else {
        await resetInstrumentSample(inst);
      }
    } catch (e) {
      // continue for other instruments
      console.warn('syncInstrumentAudio error for', inst, e);
    }
  }
}

// Costumes may change the face and body images
export function updateCostumeImages(state) {
  const equippedCostumeId = state.equipped ? state.equipped.costume : null;
  const costumeItem = SHOP_ITEMS.find(it => it.kind === 'costume' && it.id === equippedCostumeId);

  // Update all costume parts
  if (costumeItem) {
    if (face && costumeItem.face) {
      face.src = `public/images/face_${costumeItem.id}.png`;
    } else {
      face.src = 'public/images/face.png';
    }
    if (bodyImg && costumeItem.body) {
      bodyImg.src = `public/images/body_${costumeItem.id}.png`;
    } else {
      bodyImg.src = 'public/images/body.png';
    }
    // All arms
    if (armRightImg && costumeItem.armRight) {
      armRightImg.src = `public/images/arm_right_${costumeItem.id}.png`;
    } else {
      armRightImg.src = 'public/images/arm_right.png';
    }
    if (armLeftImg && costumeItem.armLeft) {
      armLeftImg.src = `public/images/arm_left_${costumeItem.id}.png`;
    } else {
      armLeftImg.src = 'public/images/arm_left.png';
    }
    if (armLeftCymbalImg && costumeItem.armLeft) {
      armLeftCymbalImg.src = `public/images/arm_left_cymbal_${costumeItem.id}.png`;
    } else {
      armLeftCymbalImg.src = 'public/images/arm_left_cymbal.png';
    }
    if (armLeftTomImg && costumeItem.armLeft) {
      armLeftTomImg.src = `public/images/arm_left_tom_${costumeItem.id}.png`;
    } else {
      armLeftTomImg.src = 'public/images/arm_left_tom.png';
    }
    if (armRightTomImg && costumeItem.armRight) {
      armRightTomImg.src = `public/images/arm_right_tom_${costumeItem.id}.png`;
    } else {
      armRightTomImg.src = 'public/images/arm_right_tom.png';
    }
    if (armRightSnareImg && costumeItem.armRight) {
      armRightSnareImg.src = `public/images/arm_right_snare_${costumeItem.id}.png`;
    } else {
      armRightSnareImg.src = 'public/images/arm_right_snare.png';
    }
  } else {
    // Reset to default images
    if (face) {face.src = 'public/images/face.png';}
    if (bodyImg) {bodyImg.src = 'public/images/body.png';}
    if (armRightImg) {armRightImg.src = 'public/images/arm_right.png';}
    if (armLeftImg) {armLeftImg.src = 'public/images/arm_left.png';}
    if (armLeftCymbalImg) {armLeftCymbalImg.src = 'public/images/arm_left_cymbal.png';}
    if (armLeftTomImg) {armLeftTomImg.src = 'public/images/arm_left_tom.png';}
    if (armRightTomImg) {armRightTomImg.src = 'public/images/arm_right_tom.png';}
    if (armRightSnareImg) {armRightSnareImg.src = 'public/images/arm_right_snare.png';}
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
    if (armLeftTomImg) armLeftTomImg.style.opacity = '0';
    if (cymbalImg) cymbalImg.style.opacity = '0';
    if (cymbalTapImg) cymbalTapImg.style.opacity = '1';
  } else if (id === 'tom' ) {
    if (tomImg) tomImg.style.opacity = '0';
    if (tomTapImg) tomTapImg.style.opacity = '1';
    if (armLeftImg) armLeftImg.style.opacity = '0';
    if (armLeftCymbalImg) armLeftCymbalImg.style.opacity = '0';
    if (armLeftTomImg) armLeftTomImg.style.opacity = '1';
    if (armRightImg) armRightImg.style.opacity = '0';
    if (armRightTomImg) armRightTomImg.style.opacity = '1';
    if (armRightSnareImg) armRightSnareImg.style.opacity = '0';
  } else if (id === 'snare' ) {
    if (snareImg) snareImg.style.opacity = '0';
    if (snareTapImg) snareTapImg.style.opacity = '1';
    if (armRightImg) armRightImg.style.opacity = '0';
    if (armRightTomImg) armRightTomImg.style.opacity = '0';
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
    // Also hide upgrades after purchase (one-time upgrades should disappear)
    const ownedDrums = (state.owned && state.owned.drums) || [];
    const ownedUpgrades = (state.owned && state.owned.upgrades) || [];
    if ((it.kind === 'drum' && ownedDrums.includes(it.id)) || (it.kind === 'upgrade' && ownedUpgrades.includes(it.id))) {
      return;
    }

    const row = document.createElement('div');
    row.className = 'item';
    
    const left = document.createElement('div');
    left.innerHTML = `<div><strong>${it.name}</strong><div class='small'>${it.price} monedas</div></div>`;
    
    const right = document.createElement('div');
    const owned = (state.owned[it.kind + 's'] || []).includes(it.id);

    if (owned) {
      row.classList.add('owned');
      // Determine equipped state. Skins are stored in state.equipped.skins[target]
      let isEquipped = false;
      if (it.kind && it.kind.endsWith('-skin')) {
        const target = it.target;
        isEquipped = !!(state.equipped && state.equipped.skins && state.equipped.skins[target] === it.id);
      } else {
        isEquipped = state.equipped && state.equipped[it.kind] === it.id;
      }

      if (isEquipped) {
        // Allow the user to unequip skins and costumes
        if (it.kind === 'costume' || (it.kind && it.kind.endsWith('-skin'))) {
          const uneq = document.createElement('button');
          uneq.textContent = 'Desequipar';
          uneq.addEventListener('click', () => {
            try {
              if (it.kind && it.kind.endsWith('-skin')) {
                // pass target so equipItem knows which skin to unset
                stateEquipItem(state, { kind: it.kind, id: null, target: it.target });
              } else {
                stateEquipItem(state, { kind: it.kind, id: null });
              }
            } catch (e) {
              // fallback
              state.equipped = state.equipped || {};
              if (it.kind && it.kind.endsWith('-skin')) {
                if (state.equipped.skins) delete state.equipped.skins[it.target];
              } else {
                state.equipped[it.kind] = null;
              }
            }
            saveState(state);
            render(state);
            renderShop(state);
          });
          right.appendChild(uneq);
        } else {
          right.innerHTML = '<span class="small">Equipado</span>';
        }
      } else {
        const eq = document.createElement('button');
        eq.textContent = 'Equipar';
        eq.addEventListener('click', () => {
          // Equip the item (skin or normal)
          stateEquipItem(state, it);
          // Play preview of its sample if available
          try { if (it.sample) playSampleUrl(it.sample); } catch (e) {}
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
          // Equip the item by default after purchase and preview its sound
          try {
            stateEquipItem(state, it);
            if (it.sample) playSampleUrl(it.sample);
          } catch (e) {
            console.warn('auto-equip after purchase failed', e);
          }
        saveState(state);
        render(state);
        renderShop(state);
  // If the app exposes an update for passive income, call it so upgrades take effect immediately
  try { if (window._hr && typeof window._hr.updatePassiveIncome === 'function') window._hr.updatePassiveIncome(); } catch (e) {}
        
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
