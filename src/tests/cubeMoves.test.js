import { describe, it, expect } from 'vitest';
import { createSolvedCube } from '../core/cubeState.js';
import { applyMove, applyMoveSequence, invertSequence, invertMove, MOVES } from '../core/cubeMoves.js';
import { faceletIndex } from '../core/cubeCoordinates.js';

const solved = createSolvedCube();
const eq = (a, b) => expect(a).toEqual(b);

describe('moves', () => {
  it('R then R\' restores the cube', () => eq(applyMoveSequence(solved, "R R'"), solved));
  it('U then U\' restores the cube', () => eq(applyMoveSequence(solved, "U U'"), solved));
  it('F2 F2 restores the cube', () => eq(applyMoveSequence(solved, 'F2 F2'), solved));
  it('four quarter turns of every face restore the cube', () => {
    for (const f of 'URFDLB') eq(applyMoveSequence(solved, `${f} ${f} ${f} ${f}`), solved);
  });
  it('invertMove covers all 18 moves', () => {
    for (const m of MOVES) eq(applyMoveSequence(solved, [m, invertMove(m)]), solved);
  });
  it('clockwise convention: R sends F to U, U sends F to L, F sends U to R', () => {
    expect(applyMove(solved, 'R')[faceletIndex('U', 2, 2)]).toBe('F');
    expect(applyMove(solved, 'U')[faceletIndex('L', 0, 0)]).toBe('F');
    expect(applyMove(solved, 'F')[faceletIndex('R', 0, 0)]).toBe('U');
  });
  it('(R U R\' U\') has order 6', () => {
    eq(applyMoveSequence(solved, Array(6).fill("R U R' U'").join(' ')), solved);
    expect(applyMoveSequence(solved, "R U R' U'")).not.toEqual(solved);
  });
  it('a scramble followed by its inverse restores the cube', () => {
    const s = "R U2 F' D L2 B R' U' F2 D' L B2";
    eq(applyMoveSequence(applyMoveSequence(solved, s), invertSequence(s)), solved);
  });
  it('rejects invalid moves', () => expect(() => applyMove(solved, 'X')).toThrow());
});

import { layerRotation } from '../core/cubeMoves.js';
describe('animation direction', () => {
  it("X' is the exact reverse spin of X, and no turn exceeds 180 degrees", () => {
    for (const f of 'URFDLB') {
      expect(layerRotation(`${f}'`).quarterTurns).toBe(-layerRotation(f).quarterTurns);
    }
    for (const m of MOVES) expect(Math.abs(layerRotation(m).quarterTurns)).toBeLessThanOrEqual(2);
  });
});
