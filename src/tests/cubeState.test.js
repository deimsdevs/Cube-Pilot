import { describe, it, expect } from 'vitest';
import { FACELETS, indexAt, faceletIndex, FACES } from '../core/cubeCoordinates.js';
import { createEditorState, updateSticker, getFaceStickers, serializeCubeState, deserializeCubeState } from '../core/cubeState.js';

describe('face mapping', () => {
  it('every facelet has a unique 3D location and round-trips', () => {
    const keys = new Set(FACELETS.map((f) => `${f.pos}|${f.normal}`));
    expect(keys.size).toBe(54);
    for (const f of FACELETS) expect(indexAt(f.pos, f.normal)).toBe(f.index);
  });
  it('facelets lie on their face plane and centers sit at the middle', () => {
    for (const f of FACELETS) {
      const axis = f.normal.findIndex((c) => c !== 0);
      expect(f.pos[axis]).toBe(f.normal[axis]);
    }
    for (const face of FACES) {
      const c = FACELETS[faceletIndex(face, 1, 1)];
      expect(c.pos.filter((v) => v === 0).length).toBe(2);
    }
  });
});

describe('editor state', () => {
  it('starts with fixed centers and blank stickers (not white)', () => {
    const s = createEditorState();
    expect(s.filter((c) => c === null).length).toBe(48);
    expect(getFaceStickers(s, 'U')[4]).toBe('W');
  });
  it('blocks edits to centers and unknown colors', () => {
    const s = createEditorState();
    expect(() => updateSticker(s, 4, 'R')).toThrow();
    expect(() => updateSticker(s, 0, 'X')).toThrow();
    expect(updateSticker(s, 0, 'R')[0]).toBe('R');
  });
  it('serializes and rejects corrupted data', () => {
    const s = updateSticker(createEditorState(), 0, 'R');
    expect(deserializeCubeState(serializeCubeState(s))).toEqual(s);
    expect(() => deserializeCubeState('{"stickers":[1]}')).toThrow();
    expect(() => deserializeCubeState('nope')).toThrow();
  });
});
