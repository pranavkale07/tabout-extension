/**
 * Global type declarations for the TabOut extension.
 *
 * `browser` is provided at build time by @rollup/plugin-inject (mapping the
 * free identifier to the `webextension-polyfill` default export) and mocked as
 * a global in tests — so it is declared as an ambient global here.
 */

export {};

declare global {
  // The WebExtension API, injected as a global at build time.
  const browser: typeof import('webextension-polyfill').default;

  interface Window {
    monaco?: MonacoNamespace;
    ace?: AceNamespace;
    __TABOUT_EXTENSION_LOADED?: boolean;
    __TABOUT_HANDLER_INSTANCE?: TaboutHandler | null;
    __TABOUT_GLOBAL_HANDLER_BOUND?: boolean;
    __TABOUT_GLOBAL_TAB_HANDLER?: ((event: KeyboardEvent) => void) | null;
  }
}

/** Minimal shape of a site handler used across the page script. */
export interface TaboutHandler {
  enabled: boolean;
  debugMode: boolean;
  initialize(): Promise<void>;
  isReady(): boolean;
  setEnabled(enabled: boolean): void;
  setDebugMode(debug: boolean): void;
  cleanup(): void;
}

/* ------------------------------------------------------------------ *
 * Minimal editor API typings (only what this extension touches).
 * ------------------------------------------------------------------ */

export interface MonacoPosition {
  lineNumber: number;
  column: number;
}

export interface MonacoSelection {
  isEmpty(): boolean;
  getPosition(): MonacoPosition;
}

export interface MonacoModel {
  getLineContent(lineNumber: number): string;
}

export interface MonacoEditor {
  getId?(): string;
  getModel(): MonacoModel | null;
  getSelections(): MonacoSelection[] | null;
  setSelections(selections: unknown[]): void;
  hasTextFocus?(): boolean;
  getDomNode?(): HTMLElement | null;
}

export interface MonacoNamespace {
  editor: {
    getEditors(): MonacoEditor[];
  };
  Position: new (lineNumber: number, column: number) => MonacoPosition;
  Selection: new (
    startLine: number,
    startColumn: number,
    endLine: number,
    endColumn: number,
  ) => unknown;
  KeyCode?: { Tab?: number };
}

export interface AceCursor {
  row: number;
  column: number;
}

export interface AceSelection {
  isEmpty(): boolean;
  clearSelection(): void;
}

export interface AceSession {
  getLine(row: number): string;
}

export interface AceEditor {
  getSession(): AceSession;
  getSelection(): AceSelection;
  getCursorPosition(): AceCursor;
  isFocused(): boolean;
  moveCursorTo(row: number, column: number): void;
}

export interface AceNamespace {
  edit(el: Element): AceEditor;
}
