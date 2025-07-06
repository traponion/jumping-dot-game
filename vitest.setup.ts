// Vitest setup file for Fabric.js testing (based on official pattern)
import { beforeAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

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
    
    // Mock CustomEvent for older test environments
    if (typeof globalThis.CustomEvent === 'undefined') {
      globalThis.CustomEvent = class CustomEvent extends Event {
        detail: any;
        constructor(type: string, eventInitDict?: CustomEventInit) {
          super(type, eventInitDict);
          this.detail = eventInitDict?.detail;
        }
      } as any;
    }
    
    // Mock window.confirm for game tests
    if (!window.confirm) {
      window.confirm = () => true; // Default to confirm for tests
    }
    
    // Mock window.alert for completeness
    if (!window.alert) {
      window.alert = () => {};
    }
    
    // Mock window.dispatchEvent for CustomEvent testing
    if (!window.dispatchEvent) {
      window.dispatchEvent = () => true;
    }
    
    // Ensure window has required properties for game-inputs
    if (!window.document) {
      window.document = document;
    }
  }

  // Mock fetch for stage data loading in test environment
  // Always mock fetch in vitest environment
    const stage1Data = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/stages/stage1.json'), 'utf-8'));
    const stage2Data = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/stages/stage2.json'), 'utf-8'));
    
    globalThis.fetch = vi.fn((url: string) => {
      const urlStr = url.toString();
      
      // Handle stage data requests - support various URL patterns
      if (urlStr.includes('stage1.json') || urlStr.includes('/stages/stage1.json') || urlStr.endsWith('stages/stage1.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve(stage1Data)
        } as Response);
      }
      
      if (urlStr.includes('stage2.json') || urlStr.includes('/stages/stage2.json') || urlStr.endsWith('stages/stage2.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: () => Promise.resolve(stage2Data)
        } as Response);
      }
      
      // Default: return 404 for other requests
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.reject(new Error('Not Found'))
      } as Response);
    }) as any;
});

// DOM element creation is handled by individual test files for consistency