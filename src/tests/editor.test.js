import { describe, it, expect, beforeEach } from 'vitest';
import { createHistory } from '../core/editorHistory.js';
import { createEditorState, updateSticker } from '../core/cubeState.js';
import { saveSession, loadSession } from '../services/storage.js';

describe('history', () => {
  it('undoes and redoes, and drops redo after a new edit', () => {
    const h = createHistory(1);
    h.push(2); h.push(3);
    expect(h.undo()).toBe(2); expect(h.undo()).toBe(1); expect(h.canUndo).toBe(false);
    expect(h.redo()).toBe(2);
    h.push(9);
    expect(h.canRedo).toBe(false); expect(h.state).toBe(9);
  });
});

describe('storage', () => {
  beforeEach(() => {
    const m = new Map();
    globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  });
  it('round-trips a saved session', () => {
    const s = updateSticker(createEditorState(), 0, 'R');
    saveSession({ stickers: s, face: 'F', theme: 'light' });
    expect(loadSession()).toEqual({ stickers: s, face: 'F', theme: 'light', solution: null, index: 0, speed: 1 });
  });
  it('discards corrupted data', () => {
    localStorage.setItem('cubepilot3d:session:v1', '{"stickers":[1,2,3]}');
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem('cubepilot3d:session:v1')).toBeNull();
  });
  it('rejects saved data with altered centers', () => {
    const s = createEditorState(); s[4] = 'R';
    saveSession({ stickers: s, face: 'U', theme: 'dark' });
    expect(loadSession()).toBeNull();
  });
});

import { applyMove } from '../core/cubeMoves.js';
describe('saved solution', () => {
  const colors = { U: 'W', R: 'R', F: 'G', D: 'Y', L: 'O', B: 'B' };
  const solvedColors = 'URFDLB'.split('').flatMap((f) => Array(9).fill(colors[f]));
  beforeEach(() => {
    const m = new Map();
    globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  });
  it('restores a solution that really solves the saved cube, with its position', () => {
    const start = applyMove(solvedColors, 'R');
    saveSession({ stickers: start, face: 'U', theme: 'dark', solution: ["R'"], index: 1, speed: 2 });
    const l = loadSession();
    expect(l.solution).toEqual(["R'"]); expect(l.index).toBe(1); expect(l.speed).toBe(2);
  });
  it('drops a saved solution that does not solve the cube', () => {
    const start = applyMove(solvedColors, 'R');
    saveSession({ stickers: start, face: 'U', theme: 'dark', solution: ['U'], index: 0, speed: 1 });
    expect(loadSession().solution).toBeNull();
  });
});
