import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LeetCodeHandler } from '../../src/content/sites/leetcode';

/** Build a minimal fake Monaco editor around a single line of text. */
function makeMonacoEditor(line: string, column: number) {
  const setSelections = vi.fn();
  const editor = {
    getId: () => 'editor-1',
    getModel: () => ({ getLineContent: () => line }),
    getSelections: () => [
      {
        isEmpty: () => true,
        getPosition: () => ({ lineNumber: 1, column }),
      },
    ],
    setSelections,
    hasTextFocus: () => true,
    getDomNode: () => null,
  };
  return { editor, setSelections };
}

function installMonaco() {
  const Selection = vi.fn(function (this: Record<string, number>, sl: number, sc: number) {
    this.startLineNumber = sl;
    this.startColumn = sc;
  });
  window.monaco = {
    editor: { getEditors: () => [] },
    Position: vi.fn() as never,
    Selection: Selection as never,
  } as never;
}

describe('LeetCodeHandler', () => {
  beforeEach(() => {
    window.__TABOUT_GLOBAL_HANDLER_BOUND = false;
    window.__TABOUT_HANDLER_INSTANCE = null;
    window.__TABOUT_GLOBAL_TAB_HANDLER = null;
    installMonaco();
  });

  test('applies tabout when cursor is before a closing bracket', () => {
    const handler = new LeetCodeHandler();
    (handler as unknown as { monaco: typeof window.monaco }).monaco = window.monaco;

    const { editor, setSelections } = makeMonacoEditor('foo()', 5); // cursor before ')'
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;

    handler.handleTabKey(editor as never, event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(setSelections).toHaveBeenCalledTimes(1);
  });

  test('does nothing when no tabout applies', () => {
    const handler = new LeetCodeHandler();
    (handler as unknown as { monaco: typeof window.monaco }).monaco = window.monaco;

    const { editor, setSelections } = makeMonacoEditor('foo', 4); // no special char ahead
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;

    handler.handleTabKey(editor as never, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(setSelections).not.toHaveBeenCalled();
  });

  test('ignores tab when disabled', () => {
    const handler = new LeetCodeHandler();
    (handler as unknown as { monaco: typeof window.monaco }).monaco = window.monaco;
    handler.setEnabled(false);

    const { editor, setSelections } = makeMonacoEditor('foo()', 5);
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;

    handler.handleTabKey(editor as never, event);

    expect(setSelections).not.toHaveBeenCalled();
  });
});
