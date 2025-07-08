import fs from 'node:fs';
import path from 'node:path';
// Vitest setup file for Fabric.js testing (based on official pattern)
import { beforeAll, vi } from 'vitest';

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
        
        // DEFENSIVE: Check JSDOM capabilities without breaking tests
        // In CI environments, JSDOM may be partially initialized
        const isJSCoreAvailable = typeof document !== 'undefined' && 
                                 typeof document.createElement === 'function' &&
                                 document.documentElement;
        
        if (!isJSCoreAvailable) {
            console.warn('⚠️ JSDOM core features not fully available - some DOM tests may be skipped');
            // Don't throw error - allow tests to run with limited DOM functionality
        } else {
            // Only proceed with body creation if JSDOM fundamentals are working
            if (!document.body) {
                console.log('🔧 Creating missing document.body in CI environment');
                try {
                    const body = document.createElement('body');
                    if (typeof document.documentElement.appendChild === 'function') {
                        document.documentElement.appendChild(body);
                        console.log('✅ Successfully created document.body');
                    } else {
                        console.warn('⚠️ document.documentElement.appendChild not available');
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to create document.body: ${error.message}`);
                }
            }
        }
    }

    // CI environment specific logging (AFTER DOM setup)
    if (typeof process !== 'undefined' && (process.env.CI || process.env.GITHUB_ACTIONS)) {
        console.log('Vitest setup: CI environment detected');
        console.log('JSDOM environment:', isJSDOM());
        console.log('Global fabric setup:', typeof globalThis.fabric);
        
        // 🔍 Deep JSDOM Debug Info (as recommended in handover)
        console.log('🔍 JSDOM Debug Info (AFTER setup):');
        console.log('document type:', typeof document);
        console.log('createElement available:', typeof document.createElement);
        console.log('body exists:', !!document.body);
        console.log('body innerHTML settable:', typeof document.body?.innerHTML);
        console.log('body appendChild available:', typeof document.body?.appendChild);
        
        // Test element creation and query capability with defensive checks
        try {
            // CI-safe element creation: Check function availability first
            if (typeof document.createElement === 'function') {
                const testEl = document.createElement('div');
                testEl.id = 'test-element-ci-debug';
                testEl.textContent = 'CI Debug Test';
                
                if (document.body && typeof document.body.appendChild === 'function') {
                    document.body.appendChild(testEl);
                    
                    // Safe element querying with fallbacks
                    const found = typeof document.getElementById === 'function' 
                        ? document.getElementById('test-element-ci-debug')
                        : null;
                    
                    console.log('✅ Element creation/query test - Found:', !!found);
                    console.log('✅ Element textContent readable:', found?.textContent);
                    
                    // Safe querySelector check
                    if (typeof document.querySelector === 'function') {
                        console.log('✅ querySelector works:', !!document.querySelector('#test-element-ci-debug'));
                    } else {
                        console.log('⚠️ querySelector not available in CI environment');
                    }
                    
                    // Clean up test element with defensive check
                    if (found && typeof document.body.removeChild === 'function') {
                        document.body.removeChild(found);
                    }
                } else {
                    console.log('❌ document.body STILL not available after setup');
                }
            } else {
                console.log('⚠️ document.createElement not available - CI environment limitation');
            }
        } catch (error) {
            console.log('❌ DOM element creation/query test failed after setup:', error);
            // Continue execution - don't let CI debug code break the tests
        }
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
    const stage1Data = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'public/stages/stage1.json'), 'utf-8')
    );
    const stage2Data = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'public/stages/stage2.json'), 'utf-8')
    );

    globalThis.fetch = vi.fn((url: string) => {
        const urlStr = url.toString();

        // Handle stage data requests - support various URL patterns
        if (
            urlStr.includes('stage1.json') ||
            urlStr.includes('/stages/stage1.json') ||
            urlStr.endsWith('stages/stage1.json')
        ) {
            return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: () => Promise.resolve(stage1Data)
            } as Response);
        }

        if (
            urlStr.includes('stage2.json') ||
            urlStr.includes('/stages/stage2.json') ||
            urlStr.endsWith('stages/stage2.json')
        ) {
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
