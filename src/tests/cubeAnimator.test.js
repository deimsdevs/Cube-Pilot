import { describe, it, expect } from 'vitest';
import { createCubeRenderer } from '../three/cubeRenderer.js';
import { createCubeAnimator } from '../three/cubeAnimator.js';
import { createSolvedCube } from '../core/cubeState.js';
import { applyMove, MOVES, parseSequence } from '../core/cubeMoves.js';

async function check(seq) {
  const cube = createCubeRenderer();
  const anim = createCubeAnimator(cube);
  let logical = createSolvedCube();
  cube.setState(logical);
  for (const m of parseSequence(seq)) {
    await anim.playMove(m, 0);
    logical = applyMove(logical, m);
    expect(cube.readState()).toEqual(logical);
  }
  cube.cubies.forEach((c) => {
    for (const v of c.position.toArray()) expect(Number.isInteger(v)).toBe(true);
  });
  return cube;
}

describe('animator keeps rendered geometry in sync with logic', () => {
  it('has 26 cubies and 54 stickers', async () => {
    const cube = await check('');
    expect(cube.cubies.length).toBe(26);
    expect(cube.stickers.length).toBe(54);
  });
  it('every one of the 18 moves matches the logical state', async () => { await check(MOVES.join(' ')); });
  it("handles inverses and double turns: R U R' U' F2 B' L2 D", async () => { await check("R U R' U' F2 B' L2 D"); });
  it('stays exact after 300 random moves (no drift)', async () => {
    let s = 7; const seq = [];
    for (let i = 0; i < 300; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; seq.push(MOVES[s % 18]); }
    await check(seq);
  });
  it('queues overlapping requests without corrupting state', async () => {
    const cube = createCubeRenderer(); const anim = createCubeAnimator(cube);
    let logical = createSolvedCube(); cube.setState(logical);
    const ps = ['R', 'U', "F'", 'D2'].map((m) => { logical = applyMove(logical, m); return anim.playMove(m, 0); });
    await Promise.all(ps);
    expect(cube.readState()).toEqual(logical);
  });
});
