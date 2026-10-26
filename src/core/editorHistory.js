/** Undo/redo stack of immutable states. */
export function createHistory(initial, limit = 300) {
  let stack = [initial];
  let i = 0;
  return {
    get state() { return stack[i]; },
    get canUndo() { return i > 0; },
    get canRedo() { return i < stack.length - 1; },
    push(s) {
      stack = stack.slice(0, i + 1);
      stack.push(s);
      if (stack.length > limit) stack.shift();
      i = stack.length - 1;
    },
    undo() { if (i > 0) i--; return stack[i]; },
    redo() { if (i < stack.length - 1) i++; return stack[i]; },
    reset(s) { stack = [s]; i = 0; }
  };
}
