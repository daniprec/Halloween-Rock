// State management and persistence
const STORAGE_KEY = 'halloween-rock:v1';

const defaultState = {
  coins: 0,
  owned: { drums: ['kick'], hats: [], memes: [] },
  equipped: { costume: null, meme: null },
  version: 1
};

// Shop items configuration
export const SHOP_ITEMS = [
  { id: 'kick', kind: 'drum', name: 'Bombo', price: 0, icon: 'public/images/icon_kick.png', sample: 'public/audio/kick.wav' },
  { id: 'tom', kind: 'drum', name: 'Tom', price: 0, icon: 'public/images/icon_tom.png', sample: 'public/audio/tom.wav' },
  { id: 'cymbal', kind: 'drum', name: 'Plato', price: 0, icon: 'public/images/icon_cymbal.png', sample: 'public/audio/cymbal.wav' },
  { id: 'snare', kind: 'drum', name: 'Caja', price: 0, icon: 'public/images/icon_snare.png', sample: 'public/audio/snare.wav' },
  { id: 'costume', kind: 'costume', name: 'Gnomo', price: 0, face: 'public/images/face_gnome.png' },
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
  state.coins = (state.coins || 0) + n;
  return state;
}

export function buyItem(state, item) {
  if (state.coins < item.price) {
    return { success: false, message: 'Not enough coins' };
  }
  
  state.coins -= item.price;
  state.owned[item.kind + 's'] = state.owned[item.kind + 's'] || [];
  
  if (!state.owned[item.kind + 's'].includes(item.id)) {
    state.owned[item.kind + 's'].push(item.id);
  }
  
  return { success: true };
}

export function equipItem(state, item) {
  state.equipped = state.equipped || { drum: null, costume: null, meme: null };
  state.equipped[item.kind] = item.id;
  return state;
}
