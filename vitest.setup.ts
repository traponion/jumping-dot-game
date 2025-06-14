// Vitest setup file for Fabric.js testing (based on official pattern)
import { beforeAll, beforeEach } from 'vitest';

// Environment detection utility
export function isJSDOM(): boolean {
  return typeof window !== 'undefined' && 'jsdom' in globalThis;
}

beforeAll(() => {
  // Set up Fabric.js environment for JSDOM
  if (isJSDOM()) {
    // Fabric.js needs these global references
    if (typeof globalThis.fabric === 'undefined') {
      globalThis.fabric = { env: { window, document } };
    }
  }

  // CI environment specific logging
  if (typeof process !== 'undefined' && (process.env.CI || process.env.GITHUB_ACTIONS)) {
    console.log('Vitest setup: CI environment detected');
    console.log('JSDOM environment:', isJSDOM());
    console.log('Global fabric setup:', typeof globalThis.fabric);
  }

  // Polyfill for missing browser APIs in test environment
  if (typeof globalThis.Touch === 'undefined') {
    globalThis.Touch = class Touch {
      clientX: number;
      clientY: number;
      identifier: number;
      target: EventTarget;
      constructor(init: Partial<Touch>) {
        Object.assign(this, init);
      }
    } as any;
  }

  // Mock requestAnimationFrame for tests
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 16);
    };
    globalThis.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }
});

// Ensure DOM elements are always available before each test
beforeEach(() => {
  // Create essential DOM elements if they don't exist
  if (typeof document !== 'undefined' && !document.getElementById('gameCanvas')) {
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);

    const gameStatus = document.createElement('div');
    gameStatus.id = 'gameStatus';
    document.body.appendChild(gameStatus);

    const timer = document.createElement('div');
    timer.id = 'timer';
    document.body.appendChild(timer);

    const score = document.createElement('div');
    score.id = 'score';
    document.body.appendChild(score);

    if (typeof process !== 'undefined' && (process.env.CI || process.env.GITHUB_ACTIONS)) {
      console.log('DOM elements created in beforeEach for CI environment');
    }
  }
});