import Cube from 'cubejs';

const SOLVED = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
let ready = false;

/** Builds the Kociemba two-phase lookup tables (a few seconds, once). */
export function initSolver() {
  if (!ready) { Cube.initSolver(); ready = true; }
}

/** Facelet string (U R F D L B order) -> array of moves. Never invents a solution. */
export function solveFacelets(facelets) {
  if (typeof facelets !== 'string' || facelets.length !== 54) throw new Error('Invalid cube string');
  if (facelets === SOLVED) return [];
  initSolver();
  const out = Cube.fromString(facelets).solve();
  if (typeof out !== 'string') throw new Error('The solver could not find a solution for this cube.');
  return out.trim() ? out.trim().split(/\s+/) : [];
}
