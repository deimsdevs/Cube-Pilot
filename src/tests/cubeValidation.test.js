import { describe, it, expect } from 'vitest';
import { createSolvedCube } from '../core/cubeState.js';
import { applyMove } from '../core/cubeMoves.js';
import { validateCubeState } from '../core/cubeValidation.js';
import { MOVES } from '../core/cubeMoves.js';

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const swap = (s, a, b) => { const n = s.slice(); [n[a], n[b]] = [n[b], n[a]]; return n; };
const codes = (s) => validateCubeState(s).errors.map((e) => e.code);

describe('validation', () => {
  it('accepts a solved cube', () => expect(validateCubeState(createSolvedCube()).valid).toBe(true));
  it('accepts 200 seeded legal scrambles of varying length', () => {
    const r = rng(42);
    for (let n = 0; n < 200; n++) {
      let s = createSolvedCube();
      for (let i = 0; i < 1 + (n % 30); i++) s = applyMove(s, MOVES[Math.floor(r() * 18)]);
      expect(validateCubeState(s).valid).toBe(true);
    }
  });
  it('rejects a single flipped edge', () => expect(codes(swap(createSolvedCube(), 7, 19))).toContain('edge-flip'));
  it('rejects a single twisted corner', () => {
    const s = createSolvedCube(); const [a, b, c] = [s[8], s[9], s[20]];
    s[8] = b; s[9] = c; s[20] = a;
    expect(codes(s)).toContain('corner-twist');
  });
  it('rejects two swapped edges', () => expect(codes(swap(swap(createSolvedCube(), 7, 5), 19, 10))).toContain('parity'));
  it('rejects impossible pieces', () => expect(validateCubeState(swap(createSolvedCube(), 7, 10)).valid).toBe(false));
  it('rejects wrong color counts with a helpful message', () => {
    const s = createSolvedCube(); s[0] = 'R';
    const e = validateCubeState(s).errors;
    expect(e.some((x) => x.message.includes('10 R') || x.message.includes('10 red'))).toBe(true);
  });
  it('rejects missing stickers', () => {
    const s = createSolvedCube(); s[0] = null;
    expect(codes(s)).toEqual(['missing']);
  });
});

describe('twist and flip messages', () => {
  it('explain a flipped edge', () => {
    expect(validateCubeState(swap(createSolvedCube(), 7, 19)).errors[0].message).toContain('edge flips');
  });
  it('explain a twisted corner', () => {
    const s = createSolvedCube(); const [a, b, c] = [s[8], s[9], s[20]];
    s[8] = b; s[9] = c; s[20] = a;
    expect(validateCubeState(s).errors[0].message).toContain('corner twists');
  });
});
