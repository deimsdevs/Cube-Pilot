import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createCubeRenderer } from '../three/cubeRenderer.js';
import { pickFacelet } from '../three/faceSelection.js';
import { createSolvedCube } from '../core/cubeState.js';
import { faceletIndex } from '../core/cubeCoordinates.js';

function cube() { const c = createCubeRenderer(); c.setState(createSolvedCube()); c.group.updateMatrixWorld(true); return c; }
const ray = (o, d) => new THREE.Raycaster(new THREE.Vector3(...o), new THREE.Vector3(...d).normalize());

describe('picking', () => {
  it('a ray into the middle of the Front face picks the Front center sticker', () => {
    const f = pickFacelet(ray([0, 0, 10], [0, 0, -1]), cube());
    expect(f.index).toBe(faceletIndex('F', 1, 1));
  });
  it('a tap on the gap between stickers picks nothing, not a hidden far-side sticker', () => {
    // the cube surface is at z=1.5: this ray crosses it at x=-0.55 (a gap) and would exit through a back sticker
    expect(pickFacelet(ray([-1.825, 0, 10], [0.15, 0, -1]), cube())).toBeNull();
  });
});
