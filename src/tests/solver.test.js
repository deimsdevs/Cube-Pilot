import { describe, it, expect, beforeAll } from 'vitest';
import { initSolver, solveFacelets } from '../engine/solverCore.js';
import { createSolvedCube } from '../core/cubeState.js';
import { applyMoveSequence, applyMove, MOVES, invertMove } from '../core/cubeMoves.js';
import { toFaceletString } from '../core/cubeValidation.js';
import { stateAt, describeMove } from '../core/playback.js';

const solved = createSolvedCube();
function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed; }; }
const scramble = (len, r) => Array.from({ length: len }, () => MOVES[r() % 18]);

beforeAll(() => initSolver(), 120000);

describe('solver', () => {
  it('returns zero moves for a solved cube', () => expect(solveFacelets(toFaceletString(solved))).toEqual([]));
  it('solves a single R move', () => {
    const s = applyMove(solved, 'R');
    expect(applyMoveSequence(s, solveFacelets(s.join('')))).toEqual(solved);
  });
  it('solves 100 seeded legal scrambles of varying length', () => {
    const r = rng(2024);
    for (let n = 0; n < 100; n++) {
      const s = applyMoveSequence(solved, scramble(1 + (n % 30), r));
      const sol = solveFacelets(s.join(''));
      expect(applyMoveSequence(s, sol)).toEqual(solved);
    }
  }, 240000);
  it('rejects malformed input instead of inventing moves', () => expect(() => solveFacelets('abc')).toThrow());
});

describe('playback', () => {
  const moves = scramble(18, rng(9));
  it('stepping forward then back restores the exact previous state', () => {
    for (let i = 0; i < moves.length; i++) {
      const before = stateAt(solved, moves, i);
      const after = applyMove(before, moves[i]);
      expect(applyMove(after, invertMove(moves[i]))).toEqual(before);
    }
  });
  it('seeking to any index gives the matching state', () => {
    let s = solved;
    for (let i = 0; i <= moves.length; i++) {
      expect(stateAt(solved, moves, i)).toEqual(s);
      if (i < moves.length) s = applyMove(s, moves[i]);
    }
  });
  it('describes quarter, prime and double turns clearly', () => {
    expect(describeMove("R'").title).toContain('counterclockwise');
    expect(describeMove('R').title).toContain('clockwise');
    expect(describeMove('F2').title).toContain('180');
  });
});

import { createSolvedColorCube, SAMPLE_SCRAMBLE } from '../core/cubeState.js';
import { validateCubeState } from '../core/cubeValidation.js';
describe('end to end with color entries', () => {
  it('the sample cube is valid, solvable, and the solution solves it', () => {
    const colors = applyMoveSequence(createSolvedColorCube(), SAMPLE_SCRAMBLE);
    expect(validateCubeState(colors).valid).toBe(true);
    const sol = solveFacelets(toFaceletString(colors));
    expect(sol.length).toBeGreaterThan(0);
    const end = applyMoveSequence(colors, sol);
    expect(end).toEqual(createSolvedColorCube());
  });
});
