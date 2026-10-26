import { FACES } from './cubeCoordinates.js';

export const COLORS = ['W', 'Y', 'R', 'O', 'B', 'G'];
export const COLOR_NAMES = { W: 'white', Y: 'yellow', R: 'red', O: 'orange', B: 'blue', G: 'green' };
// Reference orientation: white on Up, green on Front, red on Right.
export const DEFAULT_CENTERS = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };

/** Solved cube in solver notation: 54 face letters, order U R F D L B. */
export function createSolvedCube() {
  return FACES.flatMap((f) => Array(9).fill(f));
}

/** Solved cube using color keys (what the editor stores). */
export function createSolvedColorCube() {
  return createSolvedCube().map((f) => DEFAULT_CENTERS[f]);
}

/** A known-valid scramble used by the editor's "Load sample cube" button. */
export const SAMPLE_SCRAMBLE = "R U2 F' D L2 B R' U' F2 D' L B2 U R2";

/** Editor state: centers fixed, every other sticker null (not yet entered). */
export function createEditorState(centers = DEFAULT_CENTERS) {
  const s = Array(54).fill(null);
  FACES.forEach((f, i) => { s[i * 9 + 4] = centers[f]; });
  return s;
}

export const isCenterIndex = (i) => i % 9 === 4;

export function updateSticker(state, index, color) {
  if (!Number.isInteger(index) || index < 0 || index > 53) throw new Error('Sticker index out of range');
  if (isCenterIndex(index)) throw new Error('Center stickers are fixed');
  if (color !== null && !COLORS.includes(color)) throw new Error(`Unknown color: ${color}`);
  const next = state.slice();
  next[index] = color;
  return next;
}

export function getFaceStickers(state, face) {
  const o = FACES.indexOf(face) * 9;
  return state.slice(o, o + 9);
}

export function serializeCubeState(state) {
  return JSON.stringify({ version: 1, stickers: state });
}

export function deserializeCubeState(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Saved cube is not valid JSON'); }
  const st = data && data.stickers;
  if (!Array.isArray(st) || st.length !== 54 || !st.every((c) => c === null || COLORS.includes(c))) {
    throw new Error('Saved cube data is corrupted');
  }
  return st;
}

let current = createEditorState();
export const getCubeState = () => current.slice();
export const setCubeState = (state) => { current = state.slice(); };
export const resetCube = () => { current = createEditorState(); return getCubeState(); };
