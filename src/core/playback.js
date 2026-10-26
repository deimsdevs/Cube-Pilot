import { applyMoveSequence, parseMove } from './cubeMoves.js';

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
export const FACE_LABEL = { U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back' };

/** Exact cube state after the first i moves of a solution. */
export const stateAt = (start, moves, i) => applyMoveSequence(start, moves.slice(0, i));

export function describeMove(move) {
  const { face, turns } = parseMove(move);
  const name = FACE_LABEL[face];
  if (turns === 2) return { face, direction: 'half', title: `${move} - Turn the ${name} face 180 degrees.`, text: 'A half turn. Either direction gives the same result.' };
  const cw = turns === 1;
  return {
    face, direction: cw ? 'cw' : 'ccw',
    title: `${move} - Turn the ${name} face ${cw ? 'clockwise' : 'counterclockwise'}.`,
    text: `Look straight at the ${name} face. ${cw ? 'Clockwise' : 'Counterclockwise'} is as it appears from that view.`
  };
}
