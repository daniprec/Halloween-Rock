// State management and persistence
const STORAGE_KEY = 'halloween-rock:v1';

const defaultState = {
  coins: 0,
  shopShown: false,
  owned: { drums: ['kick'], upgrades: [], costumes: [] , skins: [] },
  equipped: { costume: null, skins: {} },
  version: 1
};

// Shop items configuration
export const SHOP_ITEMS = [
  { id: 'kick', kind: 'drum', name: 'Bombo', price: 0, icon: 'public/images/icon_kick.png', sample: 'public/audio/kick.wav' },
  { id: 'tom', kind: 'drum', name: 'Tom', price: 5, icon: 'public/images/icon_tom.png', sample: 'public/audio/tom.wav' },
  { id: 'cymbal', kind: 'drum', name: 'Plato', price: 20, icon: 'public/images/icon_cymbal.png', sample: 'public/audio/cymbal.wav' },
  { id: 'snare', kind: 'drum', name: 'Caja', price: 50, icon: 'public/images/icon_snare.png', sample: 'public/audio/snare.wav' },
  { id: 'double', kind: 'upgrade', name: 'Ganancias x2', price: 100 },
  { id: 'vampire', kind: 'costume', name: 'Disfraz de Vampiro', price: 60, face: 'y', body: 'y' },
  { id: 'gnome', kind: 'costume', name: 'Disfraz de Gnomo', price: 120, face: 'y', body: 'y', armRight: 'y', armLeft: 'y' },
  { id: 'goomba', kind: 'drum-skin', name: 'Goomba (Tom)', price: 30, sample: 'public/audio/goomba.wav', target: 'tom', image: 'public/images/tom_goomba.png', tap: 'public/images/tom_tap_goomba.png'},
  { id: 'kolog', kind: 'drum-skin', name: 'Kolog (Caja)', price: 40, sample: 'public/audio/kolog.wav', target: 'snare', image: 'public/images/snare_kolog.png', tap: 'public/images/snare_tap_kolog.png'},
  { id: 'bombardino', kind: 'drum-skin', name: 'Bombardino (Plato)', price: 100, sample: 'public/audio/bombardino.wav', target: 'cymbal', image: 'public/images/cymbal_bombardino.png', tap: 'public/images/cymbal_tap_bombardino.png'},
  { id: 'oiia', kind: 'drum-skin', name: 'OIIA (Bombo)', price: 200, sample: 'public/audio/oiia.wav', target: 'kick', image: 'public/images/drum_oiia.png', tap: 'public/images/drum_tap_oiia.gif'},
];

export function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  } catch (e) {
    return defaultState;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function giveCoin(state, n = 1) {
  // Apply any coin multipliers provided by upgrades (e.g. 'double')
  try {
    const upgrades = (state.owned && state.owned.upgrades) || [];
    const multiplier = upgrades.includes('double') ? 2 : 1;
    state.coins = (state.coins || 0) + (n * multiplier);
  } catch (e) {
    // fallback: simple increment
    state.coins = (state.coins || 0) + n;
  }
  return state;
}

export function buyItem(state, item) {
  if (state.coins < item.price) {
    return { success: false, message: 'No tienes suficientes monedas' };
  }
  
  state.coins -= item.price;
  state.owned[item.kind + 's'] = state.owned[item.kind + 's'] || [];
  
  if (!state.owned[item.kind + 's'].includes(item.id)) {
    state.owned[item.kind + 's'].push(item.id);
  }
  
  return { success: true };
}

export function equipItem(state, item) {
  // Ensure equipped structure
  state.equipped = state.equipped || { drum: null, costume: null, skins: {} };

  // Skin items target an instrument (item.target should be provided)
  if (item && typeof item.kind === 'string' && item.kind.endsWith('-skin')) {
    const target = item.target;
    if (!target) return state;
    if (!state.equipped.skins) state.equipped.skins = {};
    if (item.id == null) {
      // unequip
      delete state.equipped.skins[target];
    } else {
      state.equipped.skins[target] = item.id;
    }
    return state;
  }

  // Default: set by kind (costume, drum, etc.)
  state.equipped[item.kind] = item.id;
  return state;
}
