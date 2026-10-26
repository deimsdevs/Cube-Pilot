import { stateAt, describeMove, SPEEDS } from '../core/playback.js';
import { invertMove } from '../core/cubeMoves.js';
import { icon } from './icons.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createPlaybackController({ root, cube, animator, reducedMotion, onChange, onNewCube }) {
  let start = null, moves = [], index = 0, speed = 1, busy = false, playing = false;
  const q = (s) => root.querySelector(s);
  const ms = () => (reducedMotion ? 0 : Math.round(450 / speed));
  const status = () => (!moves.length ? 'idle' : playing ? 'playing' : index >= moves.length ? 'completed' : index === 0 ? 'ready' : 'paused');

  function build() {
    root.hidden = false;
    root.innerHTML = `
      <p id="pbCount" class="count-line"></p>
      <div id="pbInstr" class="instr" aria-live="polite"></div>
      <div id="pbNotation" class="notation" aria-label="Solution moves"></div>
      <div class="tools">
        <button data-pb="restart">${icon('restart')} Restart</button>
        <button data-pb="prev">${icon('prev')} Previous</button>
        <button data-pb="play" class="primary"></button>
        <button data-pb="next">Next ${icon('next')}</button>
      </div>
      <label class="rowlbl">Progress <input id="pbSlider" type="range" min="0" max="${moves.length}" value="0" aria-label="Solution progress" /></label>
      <label class="rowlbl">Speed <select id="pbSpeed" aria-label="Playback speed">${SPEEDS.map((s) => `<option value="${s}">${s}x</option>`).join('')}</select></label>
      <div id="pbDone" class="done" hidden>
        <p class="ok">Congratulations! Your Rubik's Cube is solved!</p>
        <div class="tools"><button data-pb="restart">${icon('restart')} Replay solution</button><button data-pb="new">Start new cube</button></div>
      </div>
      <p class="hint">This solution is efficient but not guaranteed to be the shortest possible. If your physical cube ever stops matching the screen, stop, open the Cube Editor, and enter your cube again to get a fresh solution.</p>`;
    q('#pbNotation').innerHTML = moves.map((m, i) => `<span data-i="${i}">${m}</span>`).join(' ');
    q('#pbSpeed').value = String(speed);
  }

  function update() {
    if (!moves.length) return;
    const n = moves.length, st = status();
    q('#pbCount').textContent = `Move ${Math.min(index + 1, n)} of ${n}  (${Math.round((index / n) * 100)}% done)`;
    if (index < n) {
      const d = describeMove(moves[index]);
      q('#pbInstr').innerHTML = `<div class="turn">${icon(d.direction === 'ccw' ? 'ccw' : 'cw')}<strong>${d.title}</strong></div><p class="hint">${d.text}</p>`;
    } else q('#pbInstr').innerHTML = '<strong>All moves done.</strong>';
    root.querySelectorAll('#pbNotation span').forEach((s) => { const i = Number(s.dataset.i); s.className = i < index ? 'past' : ''; if (i === index) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current'); });
    q('#pbSlider').value = String(index);
    q('#pbSlider').disabled = busy;
    const play = q('[data-pb="play"]');
    play.innerHTML = playing ? `${icon('pause')} Pause` : `${icon('play')} ${st === 'completed' ? 'Replay' : 'Play'}`;
    root.querySelectorAll('[data-pb="restart"],[data-pb="prev"],[data-pb="next"]').forEach((b) => { b.disabled = busy || playing; });
    q('[data-pb="prev"]').disabled = busy || playing || index === 0;
    q('[data-pb="next"]').disabled = busy || playing || index >= n;
    play.disabled = busy && !playing;
    q('#pbDone').hidden = st !== 'completed';
    root.dataset.state = st;
    if (cube) cube.setHighlightFace(index < n ? describeMove(moves[index]).face : null);
  }

  const emit = () => { update(); onChange && onChange({ index, speed }); };

  async function run(move, forward) {
    busy = true; update();
    try { if (animator) await animator.playMove(move, ms()); } catch { playing = false; busy = false; throw new Error('Animation failed'); }
    index += forward ? 1 : -1; busy = false; emit();
  }
  const stepForward = async () => { if (busy || index >= moves.length) return false; await run(moves[index], true); return true; };
  const stepBack = async () => { if (busy || index <= 0) return; await run(invertMove(moves[index - 1]), false); };

  function seek(i) {
    if (busy) return;
    playing = false;
    index = Math.max(0, Math.min(moves.length, i));
    if (cube) cube.setState(stateAt(start, moves, index));
    emit();
  }

  async function play() {
    if (playing) { playing = false; update(); return; }
    if (busy) return;
    if (index >= moves.length) seek(0);
    playing = true; update();
    try {
      while (playing && index < moves.length) {
        if (!(await stepForward())) break;
        if (playing) await wait(reducedMotion ? 150 : Math.round(250 / speed));
      }
    } catch { /* animation error: stop cleanly */ }
    playing = false; update();
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pb]');
    if (!b || !moves.length) return;
    const a = b.dataset.pb;
    if (a === 'play') play();
    else if (a === 'next') { playing = false; stepForward(); }
    else if (a === 'prev') { playing = false; stepBack(); }
    else if (a === 'restart') seek(0);
    else if (a === 'new') onNewCube();
  });
  root.addEventListener('input', (e) => { if (e.target.id === 'pbSlider') seek(Number(e.target.value)); });
  root.addEventListener('change', (e) => { if (e.target.id === 'pbSpeed') { speed = Number(e.target.value); emit(); } });

  return {
    has: () => moves.length > 0,
    pause() { playing = false; if (moves.length) update(); },
    load({ startState, solution, startIndex = 0, startSpeed = 1 }) {
      playing = false; start = startState.slice(); moves = solution.slice(); speed = SPEEDS.includes(startSpeed) ? startSpeed : 1;
      build(); seek(startIndex);
    },
    /** Re-draw the cube at the current move (used when returning to the Solve view). */
    refresh() { if (moves.length && !busy) { if (cube) cube.setState(stateAt(start, moves, index)); update(); } },
    clear() { playing = false; moves = []; start = null; index = 0; root.hidden = true; root.innerHTML = ''; if (cube) cube.setHighlightFace(null); }
  };
}
