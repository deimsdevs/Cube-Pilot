import { FACES } from '../core/cubeCoordinates.js';
import { COLORS, COLOR_NAMES, updateSticker, isCenterIndex, createSolvedColorCube, SAMPLE_SCRAMBLE } from '../core/cubeState.js';
import { applyMoveSequence } from '../core/cubeMoves.js';
import { validateCubeState } from '../core/cubeValidation.js';
import { createHistory } from '../core/editorHistory.js';
import { icon } from './icons.js';

const FACE_NAMES = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' };
const TOP_EDGE = { U: 'Back', D: 'Front', R: 'Up', F: 'Up', L: 'Up', B: 'Up' };
export const SWATCH = { W: '#f4f4f4', Y: '#ffd500', R: '#c41e3a', O: '#ff6a00', B: '#0051ba', G: '#009b48' };
export const cubeTextOf = (s) => FACES.map((f, i) => s.slice(i * 9, i * 9 + 9).map((c) => c || '-').join('')).join(' ');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const faceRange = (f) => { const o = FACES.indexOf(f) * 9; return Array.from({ length: 9 }, (_, i) => o + i); };

export function createFaceEditor({ palette, panel, initialState, initialFace = 'U', onChange, onSolve }) {
  const history = createHistory(initialState);
  let face = initialFace, color = 'R', cell = null;

  const state = () => history.state;
  const changed = () => { render(); onChange(state(), face); };

  function paint(index) {
    face = FACES[Math.floor(index / 9)];
    if (isCenterIndex(index) || state()[index] === color) { cell = index; return render(); }
    history.push(updateSticker(state(), index, color));
    const next = faceRange(FACES[Math.floor(index / 9)]).find((i) => i > index && !isCenterIndex(i));
    cell = next ?? index;
    changed();
  }

  function render() {
    const s = state();
    const count = Object.fromEntries(COLORS.map((k) => [k, 0]));
    s.forEach((c) => { if (c) count[c]++; });
    palette.innerHTML = COLORS.map((k) => `<button class="swatch" data-color="${k}" aria-pressed="${k === color}" aria-label="${COLOR_NAMES[k]}, ${count[k]} of 9 placed"><span class="chip" style="background:${SWATCH[k]}"></span><span>${cap(COLOR_NAMES[k])}</span><span class="count">${count[k]}/9</span></button>`).join('');

    const check = validateCubeState(s);
    const flagged = new Set(check.errors.flatMap((e) => e.indices || []));
    const remaining = s.filter((c) => !c).length;
    const tabs = FACES.map((f) => `<button data-face="${f}" aria-pressed="${f === face}">${FACE_NAMES[f]}${faceRange(f).every((i) => s[i]) ? ' ' + icon('check') : ''}</button>`).join('');
    const cells = faceRange(face).map((i, n) => {
      const c = s[i], center = isCenterIndex(i);
      const label = `Row ${Math.floor(n / 3) + 1}, column ${(n % 3) + 1}: ${c ? COLOR_NAMES[c] : 'not entered'}${center ? ' (center, fixed)' : ''}`;
      return `<button class="cell${c ? '' : ' empty'}${i === cell ? ' sel' : ''}${flagged.has(i) ? ' flag' : ''}" data-cell="${i}" ${center ? 'disabled' : ''} aria-label="${label}" style="${c ? `background:${SWATCH[c]};color:${c === 'B' || c === 'R' || c === 'G' ? '#fff' : '#111'}` : ''}">${c || '?'}</button>`;
    }).join('');
    const cubeText = cubeTextOf(s);
    const tricky = check.errors.some((e) => ['corner-twist', 'edge-flip', 'parity'].includes(e.code));
    const tip = tricky ? '<p class="hint">Tip: the easiest way is to turn the 3D cube to the same view as your real cube and tap its stickers directly. Otherwise read the Down face with the Front edge on top and the Back face with the Up edge on top, and compare the 3D cube with your real cube from every side. If your real cube was ever taken apart and rebuilt, it may genuinely be unsolvable.</p>' : '';
    const msgs = check.valid ? '<p class="ok">Cube is valid and ready to solve.</p>' : `<ul class="errs">${check.errors.slice(0, 4).map((e) => `<li>${e.message}</li>`).join('')}</ul>${tip}<label class="rowlbl">Your cube as text (to copy and share) <input class="cubetext" readonly value="${cubeText}" aria-label="Your cube as text" /></label>`;

    panel.innerHTML = `
      <h2>Cube editor</h2>
      <p class="hint">Hold your cube with the <b>white</b> center on top and the <b>green</b> center facing you (red on the right). Look straight at each face to read it.</p>
      <div class="tabs" role="group" aria-label="Choose face">${tabs}</div>
      <div class="orient">${icon('arrowUp')}<span>Top edge of the ${FACE_NAMES[face]} face: <b>${TOP_EDGE[face]}</b></span></div>
      <div class="grid" role="group" aria-label="${FACE_NAMES[face]} face stickers">${cells}</div>
      <p>Pick a color on the left, then tap stickers. Stickers left to enter: <b>${remaining}</b></p>
      <div class="tools">
        <button data-act="undo" ${history.canUndo ? '' : 'disabled'}>${icon('undo')} Undo</button>
        <button data-act="redo" ${history.canRedo ? '' : 'disabled'}>${icon('redo')} Redo</button>
        <button data-act="clear">${icon('trash')} Clear face</button>
        <button data-act="prev">${icon('prev')} Previous face</button>
        <button data-act="next">Next face ${icon('next')}</button>
        <button data-act="sample">Load sample cube</button>
        <button data-act="solve" class="primary">Solve this cube</button>
      </div>
      <div class="validation" aria-live="polite">${msgs}</div>`;
  }

  function selectFace(f) { face = f; cell = faceRange(f).find((i) => !isCenterIndex(i) && !state()[i]) ?? null; changed(); }
  function setState(s) { history.reset(s); cell = null; changed(); }

  palette.addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (b) { color = b.dataset.color; render(); } });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-face],[data-cell],[data-act]');
    if (!b) return;
    if (b.dataset.face) selectFace(b.dataset.face);
    else if (b.dataset.cell) paint(Number(b.dataset.cell));
    else {
      const a = b.dataset.act, k = FACES.indexOf(face);
      if (a === 'undo') { history.undo(); changed(); }
      else if (a === 'redo') { history.redo(); changed(); }
      else if (a === 'clear') { let s = state(); faceRange(face).forEach((i) => { if (!isCenterIndex(i)) s = updateSticker(s, i, null); }); history.push(s); cell = null; changed(); }
      else if (a === 'solve') { if (onSolve) onSolve(); }
      else if (a === 'sample') { history.push(applyMoveSequence(createSolvedColorCube(), SAMPLE_SCRAMBLE)); cell = null; changed(); }
      else if (a === 'prev') selectFace(FACES[(k + 5) % 6]);
      else if (a === 'next') selectFace(FACES[(k + 1) % 6]);
    }
  });

  render();
  return {
    getState: state, getFace: () => face, selectFace, setState,
    paintSticker: (index) => paint(index),
    validate: () => validateCubeState(state()),
    refresh: render
  };
}
