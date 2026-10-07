// Entry. Fonts first so they're declared before the app renders: the checkpoint's
// exact Google Fonts files, self-hosted (scripts/fetch_fonts.py).
import './styles/fonts.css';
// Order matches the checkpoint: app first, then Design's additive script.
import './app/lobby.js';
import './design/explore-desktop.js';
