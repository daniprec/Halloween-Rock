# Halloween Rock

Fun side project for Javier's Halloween party.

Javier is a bass player, and is organizing a Halloween party. He wants each attendee to bring a meme, printed. My idea is to bring a QR code. To what? A small online game developed here. The game shows a doodle of a drum player, with Javier's face, and the user can make him play drums by clicking on the screen. Each click plays a drum sound, and gives you a coin. You can use the coins to buy more pieces of the drum set, until you have the full set and can play a full drum kit.

## Visuals

The app is designed vertically, to be used on mobile phones.

Central elements:

- The drum player doodle.
- Javier's face, cut from a photo. The face changes expression when the user clicks.
- Drum pieces that can be bought with coins.
- Background with Halloween theme.

Bottom elements:

- Play buttons. You start with a basic drum, and can buy more pieces.

Top elements:

- Coin counter to the left.
- Shop button to the right, to open the shop modal.

Shop modal:

- Shows the available drum pieces to buy.
- Each piece shows its price in coins.
- Already bought pieces are marked as owned and greyed out.
- There are also hats that can be bought to customize Javier's look.
- There are also memes that can be bought to add into the background.


## Sounds

Downloaded from https://samplefocus.com/

## Project Structure

The project follows a modular architecture for better maintainability:

```
Halloween-Rock/
├── index.html              # Main HTML structure (minimal, clean)
├── sw.js                   # Service worker for offline support and caching
├── package.json            # Project metadata and scripts
├── styles/
│   └── main.css           # All visual styles and animations
├── scripts/
│   ├── state.js           # State management and localStorage persistence
│   ├── audio.js           # Audio context, sample loading, and playback
│   ├── ui.js              # DOM manipulation, rendering, and animations
│   └── main.js            # Application initialization and event coordination
└── public/
    ├── audio/             # Sound samples (.wav, .mp3, .ogg, .m4a)
    └── images/            # Character sprites, icons, and visual assets
```

### Module Descriptions

**`index.html`**
- Minimal HTML structure with semantic markup
- Links to external CSS and JavaScript modules
- Contains service worker registration for PWA support

**`styles/main.css`**
- All CSS styles extracted for better organization
- CSS custom properties for theming (colors, spacing)
- Responsive design for mobile-first experience
- Animations for coin fly, tap effects, and transitions

**`scripts/state.js`**
- State management with localStorage persistence
- Shop items configuration (drums, hats, memes)
- Business logic for buying and equipping items
- Coin management functions

**`scripts/audio.js`**
- AudioContext initialization and management
- Dynamic sample loading from multiple formats
- Fallback synthesized sounds when samples unavailable
- Playback functions for each instrument

**`scripts/ui.js`**
- DOM element references and initialization
- Rendering functions for coins, shop, and instruments
- Visual feedback animations (tap effects, coin fly)
- Idle hint timer to encourage user interaction
- Shop modal management

**`scripts/main.js`**
- Application entry point
- Module coordination and initialization
- Event listener setup for user interactions
- Exports debug helpers to window object

**`sw.js`**
- Service worker for offline functionality
- Precaches essential assets for instant loading
- Cache-first strategy with network fallback
- Automatic update detection and reload prompts

## Testing

To run locally, you need a local server due to the use of ES6 modules and the AudioContext API. You can use a simple Python server:

```bash
python -m http.server 8000
```

## Credits

Code: ChatGPT-5

Music samples: [SampleFocus.com](https://samplefocus.com/)

Doodles: Daniel Precioso