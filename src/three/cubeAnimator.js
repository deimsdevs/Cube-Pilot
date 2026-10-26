import * as THREE from 'three';
import { layerRotation, parseSequence } from '../core/cubeMoves.js';

const AXES = ['x', 'y', 'z'];

function snap(o) {
  o.position.set(Math.round(o.position.x), Math.round(o.position.y), Math.round(o.position.z));
  const m = new THREE.Matrix4().makeRotationFromQuaternion(o.quaternion);
  for (let i = 0; i < 16; i++) m.elements[i] = Math.round(m.elements[i]) + 0;
  o.quaternion.setFromRotationMatrix(m);
}

/** Animates real layer turns. Moves are queued, so animations can never overlap. */
export function createCubeAnimator(cube) {
  let chain = Promise.resolve();
  let pending = 0;

  function run(move, ms) {
    const { axis, side, quarterTurns } = layerRotation(move);
    const members = cube.cubies.filter((c) => Math.round(c.position.getComponent(axis)) === side);
    const pivot = new THREE.Group();
    cube.group.add(pivot);
    members.forEach((c) => pivot.attach(c));
    const target = (quarterTurns * Math.PI) / 2;
    const setAngle = (a) => { pivot.rotation.set(0, 0, 0); pivot.rotation[AXES[axis]] = a; };

    return new Promise((resolve) => {
      const finish = () => {
        setAngle(target);
        pivot.updateMatrixWorld(true);
        members.forEach((c) => { cube.group.attach(c); snap(c); });
        cube.group.remove(pivot);
        resolve();
      };
      if (ms <= 0) return finish();
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setAngle(target * e);
        if (t < 1) requestAnimationFrame(step); else finish();
      };
      requestAnimationFrame(step);
    });
  }

  return {
    get busy() { return pending > 0; },
    idle: () => chain,
    /** ms <= 0 applies the turn instantly (used for seeking and tests). */
    playMove(move, ms = 300) {
      pending++;
      const p = chain.then(() => run(move, ms)).finally(() => { pending--; });
      chain = p.catch(() => {});
      return p;
    },
    playSequence(seq, ms = 300) {
      return parseSequence(seq).reduce((p, m) => p.then(() => this.playMove(m, ms)), Promise.resolve());
    }
  };
}
