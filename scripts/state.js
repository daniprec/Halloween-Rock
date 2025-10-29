// State management and persistence
const STORAGE_KEY = 'halloween-rock:v1';

const defaultState = {
  coins: 0,
  owned: { drums: ['kick'], hats: [], memes: [] },
  equipped: { hat: null, meme: null },
  version: 1
};

// Shop items configuration
export const SHOP_ITEMS = [
  { id: 'kick', kind: 'drum', name: 'Bombo', price: 0, icon: 'public/images/icon_kick.png', sample: 'public/audio/kick.wav' },
  { id: 'tom', kind: 'drum', name: 'Tom', price: 0, icon: 'public/images/icon_tom.png', sample: 'public/audio/tom.wav' },
  { id: 'cymbal', kind: 'drum', name: 'Plato', price: 0, icon: 'public/images/icon_cymbal.png', sample: 'public/audio/cymbal.wav' },
  { id: 'snare', kind: 'drum', name: 'Caja', price: 0, icon: 'public/images/icon_snare.png', sample: 'public/audio/snare.wav' },
  { id: 'hat', kind: 'hat', name: 'Gorro de Gnomo', price: 0, image: 'public/images/hat_gnome.png' },
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
  
  return { success: true };
}

export function equipItem(state, item) {
  state.equipped = state.equipped || { drum: null, hat: null, meme: null };
  state.equipped[item.kind] = item.id;
  // If the item is a hat, update the hat image immediately
  if (item.kind === 'hat') {
    if (hat) {
      hat.src = item.image;
      hat.style.opacity = '1';
    }
  }
  return state;
}
