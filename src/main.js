import { createEditorState } from './core/cubeState.js';
import { toFaceletString } from './core/cubeValidation.js';
import { createScene, webglAvailable } from './three/scene.js';
import { createCubeRenderer } from './three/cubeRenderer.js';
import { createCubeAnimator } from './three/cubeAnimator.js';
import { createCameraControls } from './three/cameraControls.js';
import { createFaceSelector } from './three/faceSelection.js';
import { createFaceEditor, cubeTextOf } from './ui/faceEditor.js';
import { createNavigation } from './ui/navigation.js';
import { createPractice } from './ui/practice.js';
import { createPlaybackController } from './ui/playbackControls.js';
import { createSolver } from './engine/solver.js';
import { icon } from './ui/icons.js';
import { saveSession, loadSession, clearSession } from './services/storage.js';
import { exportState, importState } from './services/stateImportExport.js';

const $ = (id) => document.getElementById(id);
const saved = loadSession();
let theme = saved ? saved.theme : 'dark';
let cube = null, animator = null, playback = null, practice = null;
let solution = null, solutionFor = null, curIndex = 0, curSpeed = saved ? saved.speed : 1, solving = false;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const solver = createSolver();

const say = (t) => { $('status').textContent = t; };
function applyTheme() { document.documentElement.dataset.theme = theme; $('themeBtn').innerHTML = icon('sun'); }
const toggleTheme = () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(); persist(); };
$('menuBtn').innerHTML = icon('menu');
applyTheme();

function persist() {
  saveSession({ stickers: editor.getState(), face: editor.getFace(), theme, solution: solutionFor ? solution : null, index: curIndex, speed: curSpeed });
}
async function syncCube() {
  if (!cube) return;
  if (animator) await animator.idle(); // never reset geometry in the middle of a layer turn
  const v = document.body.dataset.view;
  if (v === 'practice' && practice) practice.refresh();
  else if (v === 'solve' && playback && playback.has()) playback.refresh();
  else { cube.setState(editor.getState()); cube.setHighlightFace(v === 'editor' ? editor.getFace() : null); }
}
function showInfo(html) { $('solveInfo').innerHTML = html; }
function updateSolve() {
  const r = editor.validate();
  showInfo(r.valid ? '<p class="ok">Your cube is valid.</p>' : `<ul class="errs">${r.errors.slice(0, 4).map((e) => `<li>${e.message}</li>`).join('')}</ul><label class="rowlbl">Your cube as text (copy and share) <input class="cubetext" readonly value="${cubeTextOf(editor.getState())}" aria-label="Your cube as text" /></label>`);
  $('solveNow').disabled = solving;
}

const editor = createFaceEditor({
  palette: $('palette'), panel: $('editorPanel'),
  initialState: saved ? saved.stickers : createEditorState(),
  initialFace: saved ? saved.face : 'U',
  onChange: (state) => {
    if (solutionFor && JSON.stringify(state) !== solutionFor) { solutionFor = null; solution = null; curIndex = 0; if (playback) playback.clear(); }
    syncCube(); persist(); updateSolve();
  }
});

const nav = createNavigation({
  nav: $('nav'), menuBtn: $('menuBtn'),
  onChange: () => { if (playback) playback.pause(); if (practice) practice.pause(); syncCube(); updateSolve(); }
});

function newCube() { clearSession(); editor.setState(createEditorState()); nav.show('editor'); say('Started a new cube.'); }

async function doSolve() {
  if (solving) return;
  nav.show('solve');
  const r = editor.validate();
  if (!r.valid) { say(r.errors[0].message); return; }
  solving = true; $('solveNow').disabled = true;
  say('Solving... the first solve prepares the solver and can take a few seconds.');
  try {
    const moves = await solver.solve(toFaceletString(editor.getState()));
    if (!moves.length) {
      solution = null; solutionFor = null; if (playback) playback.clear();
      showInfo('<p class="ok">Your cube is already solved. Nothing to do.</p>'); say('Cube already solved.');
    } else {
      solution = moves; solutionFor = JSON.stringify(editor.getState()); curIndex = 0;
      playback.load({ solution: moves, startState: editor.getState(), startIndex: 0, startSpeed: curSpeed });
      showInfo(`<p class="ok">Solution found: ${moves.length} moves.</p>`); say(`Solution found: ${moves.length} moves.`);
    }
  } catch (err) {
    showInfo(`<p class="errs">${err.message}</p>`); say(`Could not solve: ${err.message}`);
  } finally { solving = false; $('solveNow').disabled = false; persist(); }
}

$('solveBtn').addEventListener('click', doSolve);
$('solveNow').addEventListener('click', doSolve);
$('themeBtn').addEventListener('click', toggleTheme);
$('themeBtn2').addEventListener('click', toggleTheme);
$('newBtn').addEventListener('click', () => { if (confirm('Start a new cube? Your entered colors and solution will be cleared.')) newCube(); });
$('exportBtn').addEventListener('click', () => exportState(editor.getState()));
$('importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { editor.setState(await importState(f)); $('settingsMsg').textContent = 'Cube imported.'; }
  catch (err) { $('settingsMsg').textContent = `Import failed: ${err.message}`; }
  e.target.value = '';
});

if (!webglAvailable()) {
  $('stage').innerHTML = '<p role="alert" style="padding:24px">WebGL is not available, so the 3D cube cannot be shown. You can still enter and validate colors, and read the solution as text. Try a recent Chrome, Firefox, Safari or Edge with hardware acceleration on.</p>';
} else {
  try {
    const view = createScene($('stage'));
    cube = createCubeRenderer();
    view.scene.add(cube.group);
    animator = createCubeAnimator(cube);
    const cam = createCameraControls(view.camera, view.renderer.domElement);
    view.onFrame(cam.update);
    createFaceSelector(view.renderer.domElement, view.camera, cube, (f) => {
      if (!f) return;
      const v = document.body.dataset.view;
      if (v === 'editor') { if (f.row === 1 && f.col === 1) editor.selectFace(f.face); else editor.paintSticker(f.index); }
      else if (v === 'home') { nav.show('editor'); editor.selectFace(f.face); }
    });
  } catch (err) {
    cube = null; animator = null;
    $('stage').innerHTML = `<p role="alert" style="padding:24px">The 3D view failed to start (${err.message}). The Cube Editor and solver still work.</p>`;
  }
}

playback = createPlaybackController({
  root: $('playback'), cube, animator, reducedMotion: reduced,
  onChange: ({ index, speed }) => { curIndex = index; curSpeed = speed; persist(); },
  onNewCube: newCube
});
practice = createPractice({ root: $('practicePanel'), playbackRoot: $('practicePlayback'), cube, animator, solver, reducedMotion: reduced });
if (saved && saved.solution) {
  solution = saved.solution; solutionFor = JSON.stringify(saved.stickers); curIndex = saved.index;
  playback.load({ solution, startState: saved.stickers, startIndex: saved.index, startSpeed: saved.speed });
}

nav.show('home');
updateSolve();
solver.warmUp(); // build solver tables in the background while the user enters their cube
