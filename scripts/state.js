// State management and persistence
const STORAGE_KEY = 'halloween-rock:v1';

const defaultState = {
  coins: 0,
  owned: { drums: [], hats: [], memes: [] },
  equipped: { drum: null, hat: null, meme: null },
  version: 1
};

// Shop items configuration
export const SHOP_ITEMS = [
  { id: 'tom', kind: 'drum', name: 'Tom', price: 0, icon: 'public/images/icon_tom.png' },
  { id: 'cymbal', kind: 'drum', name: 'Cymbal', price: 0, icon: 'public/images/icon_cymbal.png' },
  { id: 'snare', kind: 'drum', name: 'Snare', price: 0, icon: 'public/images/icon_snare.png' },
  { id: 'hat', kind: 'hat', name: 'Spooky Hat', price: 0 },
  { id: 'meme1', kind: 'meme', name: 'Pumpkin Poster', price: 0 }
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
  
  // Auto-equip drums on purchase
  if (item.kind === 'drum') {
    state.equipped = state.equipped || { drum: null, hat: null, meme: null };
    state.equipped.drum = item.id;
  }
  
  return { success: true };
}

export function equipItem(state, item) {
  state.equipped = state.equipped || { drum: null, hat: null, meme: null };
  state.equipped[item.kind] = item.id;
  return state;
}
