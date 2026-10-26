import { FACES } from './cubeCoordinates.js';
import { COLOR_NAMES } from './cubeState.js';

const fl = (s) => FACES.indexOf(s[0]) * 9 + Number(s[1]) - 1;
const CORNERS = [['U9','R1','F3'],['U7','F1','L3'],['U1','L1','B3'],['U3','B1','R3'],
                 ['D3','F9','R7'],['D1','L9','F7'],['D7','B9','L7'],['D9','R9','B7']];
const EDGES = [['U6','R2'],['U8','F2'],['U4','L2'],['U2','B2'],['D6','R8'],['D2','F8'],
               ['D4','L8'],['D8','B8'],['F6','R4'],['F4','L6'],['B6','L4'],['B4','R6']];
const CORNER_IDX = CORNERS.map((c) => c.map(fl));
const EDGE_IDX = EDGES.map((e) => e.map(fl));
const CORNER_HOME = CORNERS.map((c) => c.map((s) => s[0]));
const EDGE_HOME = EDGES.map((e) => e.map((s) => s[0]));

const name = (sym) => COLOR_NAMES[sym] || sym;
const parity = (p) => { let n = 0; for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) n++; return n % 2; };
const result = (errors) => ({ valid: errors.length === 0, errors });

/** Validate a 54-entry state (face letters or color keys; null = not entered). */
export function validateCubeState(state) {
  if (!Array.isArray(state) || state.length !== 54) return result([{ code: 'shape', message: 'Cube state must contain 54 stickers.' }]);

  const missing = [];
  state.forEach((s, i) => { if (!s) missing.push(i); });
  if (missing.length) {
    return result([{ code: 'missing', indices: missing, message: `${missing.length} sticker${missing.length === 1 ? ' has' : 's have'} not been entered yet.` }]);
  }

  const counts = {};
  state.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  const errors = [];
  const symbols = Object.keys(counts);
  if (symbols.length !== 6) errors.push({ code: 'colors', message: `A cube uses exactly 6 colors, but ${symbols.length} were entered.` });
  for (const sym of symbols) {
    if (counts[sym] !== 9) {
      errors.push({ code: 'count', color: sym, indices: state.map((s, i) => (s === sym ? i : -1)).filter((i) => i >= 0),
        message: `Your cube has ${counts[sym]} ${name(sym)} stickers. A valid cube must contain exactly 9.` });
    }
  }
  if (errors.length) return result(errors);

  const faceOf = {};
  FACES.forEach((f, i) => { faceOf[state[i * 9 + 4]] = f; });
  if (Object.keys(faceOf).length !== 6) return result([{ code: 'centers', message: 'The six center stickers must all be different colors.' }]);
  const L = state.map((s) => faceOf[s]);

  const cp = [], co = [], ep = [], eo = [];
  for (let i = 0; i < 8; i++) {
    const cols = CORNER_IDX[i].map((j) => L[j]);
    let o = 0;
    while (o < 3 && cols[o] !== 'U' && cols[o] !== 'D') o++;
    const k = o === 3 ? -1 : CORNER_HOME.findIndex((h) => h[0] === cols[o] && h[1] === cols[(o + 1) % 3] && h[2] === cols[(o + 2) % 3]);
    if (k < 0) errors.push({ code: 'corner', indices: CORNER_IDX[i], message: 'A corner has a color combination that does not exist on a real cube. Check the highlighted stickers.' });
    cp.push(k); co.push(o);
  }
  for (let i = 0; i < 12; i++) {
    const [a, b] = EDGE_IDX[i].map((j) => L[j]);
    let k = EDGE_HOME.findIndex((h) => h[0] === a && h[1] === b), o = 0;
    if (k < 0) { k = EDGE_HOME.findIndex((h) => h[0] === b && h[1] === a); o = 1; }
    if (k < 0) errors.push({ code: 'edge', indices: EDGE_IDX[i], message: 'An edge has a color combination that does not exist on a real cube. Check the highlighted stickers.' });
    ep.push(k); eo.push(o);
  }
  if (errors.length) return result(errors);

  if (new Set(cp).size !== 8) errors.push({ code: 'corner-duplicate', message: 'A corner piece appears twice and another is missing. Check your corner stickers.' });
  if (new Set(ep).size !== 12) errors.push({ code: 'edge-duplicate', message: 'An edge piece appears twice and another is missing. Check your edge stickers.' });
  if (errors.length) return result(errors);

  const tail = 'A real cube cannot be in this state, so one or more stickers were probably entered wrongly or read from the wrong orientation.';
  if (co.reduce((a, b) => a + b, 0) % 3 !== 0) errors.push({ code: 'corner-twist', message: `This configuration is not physically possible: the corner twists do not add up. Usually one corner has its three colors entered in the wrong order. Re-check every corner. ${tail}` });
  if (eo.reduce((a, b) => a + b, 0) % 2 !== 0) errors.push({ code: 'edge-flip', message: `This configuration is not physically possible: the edge flips do not add up. Usually one edge has its two colors entered the wrong way round. Re-check every edge. ${tail}` });
  if (parity(cp) !== parity(ep)) errors.push({ code: 'parity', message: 'This configuration is not physically possible: two pieces look swapped. Please check your entered colors and sticker positions.' });
  return result(errors);
}

/** Convert a fully entered, valid state to the solver's face-letter string. */
export function toFaceletString(state) {
  const check = validateCubeState(state);
  if (!check.valid) throw new Error(check.errors[0].message);
  const faceOf = {};
  FACES.forEach((f, i) => { faceOf[state[i * 9 + 4]] = f; });
  return state.map((s) => faceOf[s]).join('');
}
