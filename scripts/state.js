// State management and persistence
const STORAGE_KEY = 'halloween-rock:v1.1';

const defaultState = {
  coins: 0,
  shopShown: false,
  // Give the user the graveyard background by default (owned & equipped)
  // `owned` entries are arrays (collections). `equipped.background` is a single id.
  owned: { drum: ['kick'], upgrade: [], costume: [], skin: [], background: ['graveyard'] },
  equipped: { costume: null, skin: {}, background: 'graveyard' },
  version: 1.1
};

// Shop items configuration
export const SHOP_ITEMS = [
  { id: 'kick', kind: 'drum', name: 'Bombo', price: 0, icon: 'public/images/icon_kick.png', sample: 'public/audio/kick.wav' },
  { id: 'tom', kind: 'drum', name: 'Tom', price: 5, icon: 'public/images/icon_tom.png', sample: 'public/audio/tom.wav' },
  { id: 'cymbal', kind: 'drum', name: 'Plato', price: 20, icon: 'public/images/icon_cymbal.png', sample: 'public/audio/cymbal.wav' },
  { id: 'snare', kind: 'drum', name: 'Caja', price: 50, icon: 'public/images/icon_snare.png', sample: 'public/audio/snare.wav' },
  // Upgrades
  { id: 'autocoin', kind: 'upgrade', name: '+1 moneda/segundo', price: 200, passive: 1 },
  { id: 'double', kind: 'upgrade', name: 'Ganancias x2', price: 500 },
  // Progressive multipliers: only show after previous unlocked
  { id: 'triple', kind: 'upgrade', name: 'Ganancias x3', price: 1000, requires: 'double' },
  { id: 'quintuple', kind: 'upgrade', name: 'Ganancias x5', price: 2000, requires: 'triple' },
  { id: 'decuple', kind: 'upgrade', name: 'Ganancias x10', price: 4000, requires: 'quintuple' },
  // Costumes
  { id: 'sunglasses', kind: 'costume', name: 'Gafas de sol', price: 10, face: 'y' },
  { id: 'dante', kind: 'costume', name: 'Máscara de Dante', price: 40, face: 'y' },
  { id: 'vampire', kind: 'costume', name: 'Disfraz de Vampiro', price: 100, face: 'y', body: 'y' },
  { id: 'gnome', kind: 'costume', name: 'Disfraz de Mago', price: 300, face: 'y', body: 'y', armRight: 'y', armLeft: 'y', sample: 'public/audio/gnome.mp3' },
  { id: 'firecape', kind: 'costume', name: 'Capa de Llamas', price: 10000, body: 'gif', armLeft: 'y', sample: 'public/audio/runescape.mp3' },
  // Drum skins
  { id: 'cursed', kind: 'skin', name: 'Bombo Maldito', price: 666, sample: 'public/audio/jumpscare.mp3', target: 'kick', image: 'public/images/drum_cursed.png', tap: 'public/images/drum_tap_cursed.png'},
  { id: 'oiia', kind: 'skin', name: 'Bombo OIIA', price: 5000, sample: 'public/audio/oiia.mp3', target: 'kick', image: 'public/images/drum_oiia.png', tap: 'public/images/drum_tap_oiia.gif'},
  { id: 'skull', kind: 'skin', name: 'Tom de Calaveras', price: 130, sample: 'public/audio/skull.mp3', target: 'tom', image: 'public/images/tom_skull.png', tap: 'public/images/tom_tap_skull.png'},
  { id: 'goomba', kind: 'skin', name: 'Tom Goomba', price: 700, sample: 'public/audio/goomba.mp3', target: 'tom', image: 'public/images/tom_goomba.png', tap: 'public/images/tom_tap_goomba.png'},
  { id: 'blood', kind: 'skin', name: 'Plato de Sangre', price: 210, sample: 'public/audio/blood.mp3', target: 'cymbal', image: 'public/images/cymbal_blood.png', tap: 'public/images/cymbal_tap_blood.png'},
  { id: 'bombardino', kind: 'skin', name: 'Plato Bombardino', price: 3000, sample: 'public/audio/bombardino.mp3', target: 'cymbal', image: 'public/images/cymbal_bombardino.png', tap: 'public/images/cymbal_tap_bombardino.png'},
  { id: 'ghost', kind: 'skin', name: 'Caja Fantasma', price: 330, sample: 'public/audio/ghost.mp3', target: 'snare', image: 'public/images/snare_ghost.png', tap: 'public/images/snare_tap_ghost.png'},
  { id: 'kolog', kind: 'skin', name: 'Caja Kolog', price: 2500, sample: 'public/audio/kolog.mp3', target: 'snare', image: 'public/images/snare_kolog.png', tap: 'public/images/snare_tap_kolog.png'},
  // Backgrounds (can be purchased and equipped via the shop)
  { id: 'graveyard', kind: 'background', name: 'Fondo: Cementerio', price: 0, image: 'public/background/graveyard.jpg' },
  { id: 'forest', kind: 'background', name: 'Fondo: Bosque', price: 30, image: 'public/background/forest.jpg' },
  { id: 'stage', kind: 'background', name: 'Fondo: Escenario', price: 70, image: 'public/background/stage.jpg' },
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
  // Apply any coin multipliers provided by upgrade (e.g. 'double')
  try {
    const upgrade = (state.owned && state.owned.upgrade) || [];
    // priority: decuple > quintuple > triple > double
    let multiplier = 1;
    if (upgrade.includes('decuple')) multiplier = 10;
    else if (upgrade.includes('quintuple')) multiplier = 5;
    else if (upgrade.includes('triple')) multiplier = 3;
    else if (upgrade.includes('double')) multiplier = 2;
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
  let key;
  if (item.kind && item.kind === 'skin') key = 'skin';
  else key = item.kind;
  // Ensure the owned collection is an array. Some older saved states or
  // accidental mutations may have left a non-array value (string). Coerce
  // to array to avoid runtime errors when pushing.
  if (!Array.isArray(state.owned[key])) {
    state.owned[key] = state.owned[key] ? [state.owned[key]] : [];
  }

  if (!state.owned[key].includes(item.id)) {
    state.owned[key].push(item.id);
  }
  
  return { success: true };
}

export function equipItem(state, item) {
  // Ensure equipped structure
  state.equipped = state.equipped || { drum: null, costume: null, skin: {} };

  // Skin items target an instrument (item.target should be provided)
  if (item && typeof item.kind === 'string' && item.kind === 'skin') {
    const target = item.target;
    if (!target) return state;
    if (!state.equipped.skin) state.equipped.skin = {};
    if (item.id == null) {
      // unequip
      delete state.equipped.skin[target];
    } else {
      state.equipped.skin[target] = item.id;
    }
    return state;
  }

  // Default: set by kind (costume, drum, etc.)
  state.equipped[item.kind] = item.id;
  return state;
}
