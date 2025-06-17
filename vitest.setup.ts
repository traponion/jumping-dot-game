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

  // Mock Canvas API for testing
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = () => ({
      fillRect: () => {},
      clearRect: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      fillText: () => {},
      strokeRect: () => {},
      ellipse: () => {},
      closePath: () => {}
    });
  }

  // Mock performance.now for consistent testing
  if (typeof globalThis.performance === 'undefined') {
    globalThis.performance = {
      now: () => Date.now()
    } as any;
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

  // Mock window event listeners for game-inputs compatibility
  if (typeof window !== 'undefined') {
    if (!window.addEventListener) {
      window.addEventListener = () => {};
      window.removeEventListener = () => {};
    }
    
    // Ensure window has required properties for game-inputs
    if (!window.document) {
      window.document = document;
    }
  }
});

// DOM element creation is handled by individual test files for consistency