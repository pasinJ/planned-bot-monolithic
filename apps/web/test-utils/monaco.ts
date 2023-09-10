import { loader } from '@monaco-editor/react';
import path from 'path';
import { performance } from 'perf_hooks';
import { assoc, isEmpty } from 'ramda';
import { TextDecoder } from 'util';

const originalConsole: Console = global.console;
const originalWindow: Window & typeof globalThis = global.window;
const originalDocument: Document = global.document;

export function mockForMonaco() {
  const appPath = path.join(__dirname, '../');

  global.document.queryCommandSupported = () => true;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      return {
        matches: query === '(pointer: fine)' ? true : false, // Condition for DatePicker case
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      };
    }),
  });
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class ResizeObserver {
      /* eslint-disable @typescript-eslint/no-empty-function */
      observe() {}
      unobserve() {}
      disconnect() {}
      /* eslint-disable @typescript-eslint/no-empty-function */
    },
  });
  Object.defineProperty(window, 'TextDecoder', { writable: true, value: TextDecoder });
  Object.defineProperty(window, 'performance', { writable: true, value: performance });
  global.console = {
    ...originalConsole,
    warn: () => {},
  };
  loader.config({ paths: { vs: uriFromPath(path.resolve(appPath, 'node_modules/monaco-editor/min/vs')) } });
}

export function createScriptsObserver() {
  let scripts: Record<string, boolean> = {};

  const observer = new window.MutationObserver((mutationRecords) => {
    const addedScripts = mutationRecords.filter(
      (record) =>
        !isEmpty(Array.from(record.addedNodes.values()).filter((node) => node.nodeName === 'SCRIPT')),
    );
    addedScripts.map((addedScript) =>
      Array.from(addedScript.addedNodes.values()).map((node) => {
        const src = (node as Element).getAttribute('src');
        if (src) {
          scripts = assoc(src, false, scripts);
          node.addEventListener('load', () => {
            scripts = assoc(src, true, scripts);
          });
        }
      }),
    );
  });
  observer.observe(window.document.body, { childList: true }); // loader.js
  observer.observe(window.document.head, { childList: true }); // others

  return {
    disconnect: () => {
      observer.disconnect();
    },
    getScriptStatus: () => scripts,
  };
}

export function revertMockForMonaco() {
  global.document = originalDocument;
  global.window = originalWindow;
  global.console = originalConsole;
}

function ensureFirstBackSlash(str: string) {
  return str.length > 0 && !str.startsWith('/') ? '/' + str : str;
}

function uriFromPath(_path: string) {
  const pathName = path.resolve(_path).replace(/\\/g, '/');
  return encodeURI('file://' + ensureFirstBackSlash(pathName));
}
