import { createSolvedCube } from '../core/cubeState.js';
import { applyMove, invertMove, MOVES } from '../core/cubeMoves.js';
import { toFaceletString } from '../core/cubeValidation.js';
import { createPlaybackController } from './playbackControls.js';
import { icon } from './icons.js';

/** Free Practice: a virtual cube driven only by legal face turns. */
export function createPractice({ root, playbackRoot, cube, animator, solver, reducedMotion }) {
  let state = createSolvedCube(), history = [], redo = [], busy = false;
  const playback = createPlaybackController({ root: playbackRoot, cube, animator, reducedMotion, onChange() {}, onNewCube: () => act(reset) });

  root.innerHTML = `<h2>Free Practice</h2>
    <p class="hint">Turn the virtual cube, scramble it, undo, or let the solver solve it. Nothing here touches your entered cube.</p>
    <div class="tools" aria-label="Face turns">${'URFDLB'.split('').map((f) => `<button data-m="${f}">${f}</button><button data-m="${f}'">${f}'</button>`).join('')}</div>
    <div class="tools">
      <button data-a="scramble">Scramble</button>
      <button data-a="undo">${icon('undo')} Undo</button>
      <button data-a="redo">${icon('redo')} Redo</button>
      <button data-a="reset">Reset</button>
      <button data-a="solve" class="primary">Solve this cube</button>
    </div>
    <p>Move history: <span id="prHist" class="mono">none</span></p>
    <p id="prMsg" role="status"></p>`;

  const q = (s) => root.querySelector(s);
  const msg = (t) => { q('#prMsg').textContent = t; };
  const ms = (fast) => (reducedMotion ? 0 : fast ? 90 : 280);

  function render() {
    q('#prHist').textContent = history.length ? history.slice(-40).join(' ') : 'none';
    root.querySelectorAll('button').forEach((b) => { b.disabled = busy; });
    if (!busy) { q('[data-a="undo"]').disabled = !history.length; q('[data-a="redo"]').disabled = !redo.length; }
  }
  const leavePlayback = () => { if (playback.has()) { playback.clear(); if (cube) cube.setState(state); } };
  const turn = async (m, fast) => { state = applyMove(state, m); if (animator) await animator.playMove(m, ms(fast)); };
  async function act(fn) {
    if (busy) return;
    busy = true; render();
    try { await fn(); } catch (e) { msg(e.message); } finally { busy = false; render(); }
  }
  async function reset() {
    if (animator) await animator.idle();
    playback.clear(); state = createSolvedCube(); history = []; redo = [];
    if (cube) cube.setState(state);
    msg('Cube reset.');
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-m],[data-a]');
    if (!b || busy) return;
    if (b.dataset.m) act(async () => { leavePlayback(); history.push(b.dataset.m); redo = []; await turn(b.dataset.m); });
    else {
      const a = b.dataset.a;
      if (a === 'undo') act(async () => { const m = history.pop(); if (!m) return; leavePlayback(); redo.push(m); await turn(invertMove(m)); });
      else if (a === 'redo') act(async () => { const m = redo.pop(); if (!m) return; leavePlayback(); history.push(m); await turn(m); });
      else if (a === 'reset') act(reset);
      else if (a === 'scramble') act(async () => {
        leavePlayback(); history = []; redo = [];
        let last = '';
        for (let i = 0; i < 20; i++) {
          let m; do { m = MOVES[Math.floor(Math.random() * 18)]; } while (m[0] === last);
          last = m[0]; history.push(m); await turn(m, true);
        }
      });
      else if (a === 'solve') act(async () => {
        playback.clear(); if (cube) cube.setState(state);
        msg('Solving...');
        const moves = await solver.solve(toFaceletString(state));
        if (!moves.length) { msg('The cube is already solved.'); return; }
        playback.load({ startState: state, solution: moves });
        msg(`Solution found: ${moves.length} moves. Use the controls below.`);
      });
    }
  });

  render();
  return {
    pause: () => playback.pause(),
    refresh() {
      if (playback.has()) playback.refresh();
      else if (cube) { cube.setState(state); cube.setHighlightFace(null); }
    }
  };
}
