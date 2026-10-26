import { FACES } from '../core/cubeCoordinates.js';
import { DEFAULT_CENTERS, deserializeCubeState } from '../core/cubeState.js';
import { applyMoveSequence, parseMove } from '../core/cubeMoves.js';
import { SPEEDS } from '../core/playback.js';

const KEY = 'cubepilot3d:session:v1';

export function saveSession({ stickers, face, theme, solution = null, index = 0, speed = 1 }) {
  try { localStorage.setItem(KEY, JSON.stringify({ stickers, face, theme, solution, index, speed })); } catch { /* storage unavailable */ }
}

/** Returns validated saved data or null. Corrupted data is discarded, never trusted. */
export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const stickers = deserializeCubeState(JSON.stringify({ stickers: d.stickers }));
    if (!FACES.every((f, i) => stickers[i * 9 + 4] === DEFAULT_CENTERS[f])) throw new Error('bad centers');
    let solution = null, index = 0;
    try {
      if (Array.isArray(d.solution) && d.solution.length) {
        d.solution.forEach(parseMove);
        const end = applyMoveSequence(stickers, d.solution); // a saved solution must really solve the saved cube
        if (!end.every((c, i) => c === end[Math.floor(i / 9) * 9 + 4])) throw new Error('bad solution');
        solution = d.solution;
        index = Number.isInteger(d.index) && d.index >= 0 && d.index <= solution.length ? d.index : 0;
      }
    } catch { solution = null; index = 0; }
    return { stickers, face: FACES.includes(d.face) ? d.face : 'U', theme: d.theme === 'light' ? 'light' : 'dark', solution, index, speed: SPEEDS.includes(d.speed) ? d.speed : 1 };
  } catch {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return null;
  }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
