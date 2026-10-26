import { FACELETS, indexAt, rotateVec } from './cubeCoordinates.js';

// axis index and which side of that axis the face sits on
const FACE_AXIS = { U: [1, 1], D: [1, -1], R: [0, 1], L: [0, -1], F: [2, 1], B: [2, -1] };

export const MOVES = ['U', 'R', 'F', 'D', 'L', 'B'].flatMap((f) => [f, `${f}2`, `${f}'`]);

export function parseMove(move) {
  const face = move[0];
  const suffix = move.slice(1);
  if (!FACE_AXIS[face] || !['', '2', "'"].includes(suffix)) throw new Error(`Invalid move: ${move}`);
  return { face, turns: suffix === '' ? 1 : suffix === '2' ? 2 : 3 };
}

export function invertMove(move) {
  const { face, turns } = parseMove(move);
  return face + (turns === 1 ? "'" : turns === 2 ? '2' : '');
}

export function parseSequence(seq) {
  return Array.isArray(seq) ? seq : seq.trim().split(/\s+/).filter(Boolean);
}

export function invertSequence(seq) {
  return parseSequence(seq).slice().reverse().map(invertMove);
}

/**
 * Geometry for the animator. Clockwise seen from outside the face equals a NEGATIVE
 * right-hand rotation about the outward normal, so quarterTurns (about +axis) = -side * turns.
 */
export function layerRotation(move) {
  const { face, turns } = parseMove(move);
  const [axis, side] = FACE_AXIS[face];
  // Animate the shortest way: R' is exactly the reverse spin of R (-90 degrees), never a 270 degree spin.
  const visualTurns = turns === 3 ? -1 : turns;
  return { axis, side, quarterTurns: -side * visualTurns };
}

// Permutation of facelet indices for each single clockwise face turn, derived from geometry.
const PERM = {};
for (const face of Object.keys(FACE_AXIS)) {
  const [axis, side] = FACE_AXIS[face];
  PERM[face] = FACELETS.map((f) =>
    f.pos[axis] === side ? indexAt(rotateVec(f.pos, axis, -side), rotateVec(f.normal, axis, -side)) : f.index
  );
}

export function applyMove(state, move) {
  const { face, turns } = parseMove(move);
  let cur = state;
  for (let t = 0; t < turns; t++) {
    const next = new Array(54);
    for (let i = 0; i < 54; i++) next[PERM[face][i]] = cur[i];
    cur = next;
  }
  return cur === state ? state.slice() : cur;
}

export function applyMoveSequence(state, seq) {
  return parseSequence(seq).reduce((s, m) => applyMove(s, m), state);
}
