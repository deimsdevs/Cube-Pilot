# CubePilot 3D

Your Cube. Your Moves. Your Solution.

An interactive 3D Rubik's Cube solver for the browser. Copy the colors of a real 3x3 cube into the virtual one, and CubePilot 3D validates it, solves it, and animates the solution move by move. Everything runs in the browser: no server, database or API key.

## Features
- 3D cube (26 cubies) with orbit, zoom, touch support and click-to-select faces
- Cube editor: tap stickers directly on the 3D cube or use the face grid; fixed centers; undo/redo; color counters; blank stickers are never treated as white
- Full validity check: sticker counts, impossible pieces, twist/flip/parity rules, with plain-language errors
- Kociemba two-phase solver (cubejs) running in a Web Worker
- Playback: play, pause, previous, next, restart, speed (0.25x-2x), progress slider, per-move instructions
- Free Practice: manual turns, random scramble, undo/redo, history, solve the practice cube
- Progress saved in localStorage; JSON export/import; light and dark themes; keyboard and screen-reader friendly controls

## Tech stack
HTML, CSS, JavaScript (ES modules), Three.js, cubejs, Vite, Vitest.

## Requirements
Node.js 18 or newer and npm.

## Run locally
```
npm install
npm run dev      # development server
npm test         # automated tests (includes 100 seeded scrambles)
npm run build    # production build in dist/
npm run preview  # preview the production build
```

## Deploy to GitHub Pages
1. Create a GitHub repository and push this project to the `main` branch (commit `package-lock.json`).
2. In the repository open Settings > Pages and set Source to "GitHub Actions".
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` installs, tests, builds and deploys.
4. Your app appears at `https://<user>.github.io/<repo>/`. Paths are relative, so repository subpaths work.

## Entering your cube
Hold the real cube with the white center on top, green center facing you and red on the right. In the Cube Editor, pick a color and tap stickers. The easiest method is to turn the 3D cube to the same view as your real cube and tap its stickers directly. On the face grid, read the Down face with the Front edge on top and the Back face with the Up edge on top. Centers are fixed.

## Solving
When the editor shows "Cube is valid", press Solve. The solution is efficient but not guaranteed to be the shortest. Follow each move on the real cube.

## Move notation
R, L, U, D, F, B turn that face a quarter turn clockwise, looking straight at the face. R' is counterclockwise. R2 is a half turn.

## Troubleshooting
- "Not physically possible": a real cube cannot be in that state. Re-check every sticker, especially corners and edges and the Down/Back faces. A cube that was taken apart and rebuilt can be genuinely unsolvable.
- Blank page or missing 3D cube: enable WebGL / hardware acceleration, or try another browser.
- First solve is slow: the solver builds its tables once (a few seconds).
- If your real cube stops matching the screen, enter it again and solve again. The app cannot see your cube.

## Known limitations
- No beginner layer-by-layer teaching mode. The Learn page is short reading material only.
- Solutions are not move-optimal.
- No camera scanning: colors are entered by hand.
- Automated tests cover the cube logic, solver, playback and animation geometry. Visual layout and touch behavior were not covered by automated browser tests.

## Future improvements
Layer-by-layer beginner mode, camera scanning, shorter solutions, browser end-to-end tests.
