# Repository Guidelines

## Project Structure & Module Organization

Crash Chicken is a dependency-free static web game. The repository is intentionally flat:

- `index.html` defines the Spanish-language game shell and UI.
- `style.css` contains layout, responsive styling, animations, and visual effects.
- `game.js` contains keyboard input, game state, collision detection, scoring, and local-storage persistence.
- Root-level PNG files are the game artwork (`chicken-*.png`, `car*.png`, and `corn*.png`); `*-source.png` files are source artwork.

Keep new gameplay logic in `game.js`, presentation changes in `style.css`, and markup changes in `index.html`. Preserve the existing root-level asset convention unless the asset references and directory are updated together.

## Build, Test, and Development Commands

There is no package manager, build step, or automated test suite. Run the game from a local web server so browser asset loading and `localStorage` behave normally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. For a quick static check, inspect the page in a browser and exercise arrow/WASD movement, `R` restart, collisions, corn collection, winning, and the high-score flow. Stop the server with `Ctrl-C`.

## Coding Style & Naming Conventions

Match the existing compact vanilla JavaScript and CSS style: two-space indentation when expanding code, semicolons in JavaScript, single quotes for JavaScript strings, and kebab-case CSS classes/IDs. Use descriptive camelCase names for JavaScript variables and functions (for example, `makeCars` and `scoreEl`). Keep user-facing text consistent with the existing Spanish UI. Avoid adding frameworks or external dependencies without a clear need.

## Testing Guidelines

Testing is manual browser testing. Verify both desktop keyboard controls and the responsive layout at a narrow viewport. When changing collision or movement behavior, check road boundaries, car wraparound, score updates, and `localStorage` best-score persistence.

## Commit & Pull Request Guidelines

The existing history uses short imperative summaries (for example, `Add files via upload`). Follow that style, keep commits focused, and explain notable gameplay or UI behavior in the body when needed. Pull requests should describe the change, list manual checks performed, link a relevant issue when one exists, and include screenshots or a short recording for visual changes.
