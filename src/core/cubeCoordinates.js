/*
 * COORDINATE SYSTEM (single source of truth for editor, renderer, solver, animator)
 *   +x = Right, +y = Up, +z = Front (toward the viewer). Cubie positions are in {-1,0,1}^3.
 * Facelet order: U R F D L B, 9 stickers each, row-major (Kociemba layout).
 * Each face is read as if looking straight at it, with the "up" direction below:
 *   U: back edge on top      D: front edge on top
 *   R, F, L, B: Up face on top
 */
export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];

export const FACE_NORMAL = {
  U: [0, 1, 0], R: [1, 0, 0], F: [0, 0, 1],
  D: [0, -1, 0], L: [-1, 0, 0], B: [0, 0, -1]
};

export function faceletPosition(face, row, col) {
  switch (face) {
    case 'U': return [col - 1, 1, row - 1];
    case 'R': return [1, 1 - row, 1 - col];
    case 'F': return [col - 1, 1 - row, 1];
    case 'D': return [col - 1, -1, 1 - row];
    case 'L': return [-1, 1 - row, col - 1];
    case 'B': return [1 - col, 1 - row, -1];
    default: throw new Error(`Unknown face: ${face}`);
  }
}

export const faceletIndex = (face, row, col) => FACES.indexOf(face) * 9 + row * 3 + col;

export const FACELETS = Array.from({ length: 54 }, (_, i) => {
  const face = FACES[Math.floor(i / 9)];
  const row = Math.floor((i % 9) / 3);
  const col = i % 3;
  return { index: i, face, row, col, pos: faceletPosition(face, row, col), normal: FACE_NORMAL[face] };
});

const key = (p, n) => `${p.join(',')}|${n.join(',')}`;
const INDEX_BY_KEY = new Map(FACELETS.map((f) => [key(f.pos, f.normal), f.index]));

export function indexAt(pos, normal) {
  return INDEX_BY_KEY.get(key(pos, normal));
}

/** Rotate integer vector by q quarter turns about +axis (0=x, 1=y, 2=z), right-hand rule. */
export function rotateVec(v, axis, q) {
  let [x, y, z] = v;
  const n = ((q % 4) + 4) % 4;
  for (let i = 0; i < n; i++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [x, z] = [z, -x];
    else [x, y] = [-y, x];
  }
  return [x, y, z].map((c) => (c === 0 ? 0 : c));
}
