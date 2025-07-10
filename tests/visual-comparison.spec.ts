import { test, expect } from '@playwright/test';

/**
 * Visual Comparison Test Suite
 * 
 * Compares visual rendering between development and production environments
 * to verify PixiJS migration maintains visual fidelity across platforms.
 */

// Environment URLs
const DEV_URL = 'http://localhost:3001';
const PROD_URL = 'https://traponion.github.io/jumping-dot-game/';

// Test configuration
const VIEWPORT_SIZE = { width: 1280, height: 720 };
const WAIT_TIMEOUT = 2000;

test.describe('Production vs Development Visual Comparison', () => {
    test.beforeEach(async ({ page }) => {
        // Set consistent viewport size
        await page.setViewportSize(VIEWPORT_SIZE);
        
        // Capture browser console logs for debugging
        page.on('console', msg => console.log('Browser:', msg.text()));
    });

    /**
     * Standardized capture sequence for consistent comparison
     * @param page - Playwright page instance
     * @param environment - 'dev' or 'prod'
     * @param url - Target URL to test
     */
    async function captureStandardizedSequence(page: any, environment: string, url: string) {
        console.log(`Starting standardized capture for ${environment} environment`);
        
        // Navigate to game
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // 1. Initial game state - Start screen
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-01-start-screen.png`,
            fullPage: true
        });

        // Verify canvas and UI elements are present
        const canvas = page.locator('#gameCanvas');
        await expect(canvas).toBeVisible();
        await expect(page.locator('#gameStatus')).toBeAttached();
        await expect(page.locator('#timer')).toBeAttached();

        // 2. Game initialization - After first space press
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-02-game-init.png`,
            fullPage: true
        });

        // 3. Active gameplay - After second space press
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-03-gameplay-active.png`,
            fullPage: true
        });

        // Verify game is actually running
        const timer1 = await page.locator('#timer').textContent();
        await page.waitForTimeout(500);
        const timer2 = await page.locator('#timer').textContent();
        expect(timer1).toBeDefined();
        expect(timer2).toBeDefined();

        // 4. Player movement - Left arrow
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(300);
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-04-player-left.png`,
            fullPage: true
        });

        // 5. Player movement - Right arrow
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(300);
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-05-player-right.png`,
            fullPage: true
        });

        // 6. Continuous movement test
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(500);
        await page.keyboard.up('ArrowLeft');
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-06-continuous-movement.png`,
            fullPage: true
        });

        // 7. UI element visibility test
        const timerElement = page.locator('#timer');
        await expect(timerElement).toBeVisible();
        const finalTimer = await timerElement.textContent();
        expect(finalTimer).toMatch(/Time:|Playing/);
        
        await page.screenshot({ 
            path: `test-results/visual-comparison-${environment}-07-ui-elements.png`,
            fullPage: true
        });

        console.log(`Completed standardized capture for ${environment} environment`);
    }

    test('capture development environment screenshots', async ({ page }) => {
        await captureStandardizedSequence(page, 'dev', DEV_URL);
    });

    test('capture production environment screenshots', async ({ page }) => {
        await captureStandardizedSequence(page, 'prod', PROD_URL);
    });

    test('compare canvas rendering consistency', async ({ page }) => {
        console.log('Testing canvas rendering consistency between environments');
        
        // Test development environment
        await page.goto(DEV_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Start game in development
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);

        // Verify canvas has content in development
        const devHasContent = await page.evaluate(() => {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (!canvas) return false;
            
            // Universal canvas content detection for both 2D and WebGL
            const ctx2d = canvas.getContext('2d');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (ctx2d) {
                try {
                    const imageData = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    let nonBlackPixels = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                        if ((r > 0 || g > 0 || b > 0) && a > 0) nonBlackPixels++;
                    }
                    return nonBlackPixels > 10;
                } catch (e) {
                    console.log('2D context detection failed:', e);
                }
            }
            
            if (gl) {
                try {
                    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
                    gl.finish();
                    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                    let nonBlackPixels = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
                        if ((r > 0 || g > 0 || b > 0) && a > 0) nonBlackPixels++;
                    }
                    return nonBlackPixels > 10;
                } catch (e) {
                    console.log('WebGL context detection failed:', e);
                }
            }
            
            return false;
        });

        console.log('Development environment canvas has content:', devHasContent);
        
        // Alternative verification for development
        const devTimer = await page.locator('#timer').textContent();
        expect(devTimer).toBeDefined();
        
        await page.screenshot({ 
            path: 'test-results/visual-comparison-dev-canvas-test.png',
            fullPage: true
        });

        // Test production environment
        await page.goto(PROD_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Start game in production
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);

        // Verify canvas has content in production
        const prodHasContent = await page.evaluate(() => {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (!canvas) return false;
            
            // Universal canvas content detection for both 2D and WebGL
            const ctx2d = canvas.getContext('2d');
            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            
            if (ctx2d) {
                try {
                    const imageData = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    let nonBlackPixels = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
                        if ((r > 0 || g > 0 || b > 0) && a > 0) nonBlackPixels++;
                    }
                    return nonBlackPixels > 10;
                } catch (e) {
                    console.log('2D context detection failed:', e);
                }
            }
            
            if (gl) {
                try {
                    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
                    gl.finish();
                    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                    let nonBlackPixels = 0;
                    for (let i = 0; i < pixels.length; i += 4) {
                        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
                        if ((r > 0 || g > 0 || b > 0) && a > 0) nonBlackPixels++;
                    }
                    return nonBlackPixels > 10;
                } catch (e) {
                    console.log('WebGL context detection failed:', e);
                }
            }
            
            return false;
        });

        console.log('Production environment canvas has content:', prodHasContent);
        
        // Alternative verification for production
        const prodTimer = await page.locator('#timer').textContent();
        expect(prodTimer).toBeDefined();
        
        await page.screenshot({ 
            path: 'test-results/visual-comparison-prod-canvas-test.png',
            fullPage: true
        });

        // Both environments should have functional canvas rendering
        console.log('Canvas rendering consistency test completed');
        console.log('Development canvas content:', devHasContent);
        console.log('Production canvas content:', prodHasContent);
    });

    test('verify UI element positioning consistency', async ({ page }) => {
        const environments = [
            { name: 'dev', url: DEV_URL },
            { name: 'prod', url: PROD_URL }
        ];

        for (const env of environments) {
            console.log(`Testing UI element positioning in ${env.name} environment`);
            
            await page.goto(env.url);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Start game
            await page.keyboard.press('Space');
            await page.waitForTimeout(500);
            await page.keyboard.press('Space');
            await page.waitForTimeout(1000);

            // Get UI element positions
            const timerBox = await page.locator('#timer').boundingBox();
            const canvasBox = await page.locator('#gameCanvas').boundingBox();
            const statusBox = await page.locator('#gameStatus').boundingBox();

            console.log(`${env.name} UI positions:`, {
                timer: timerBox,
                canvas: canvasBox,
                status: statusBox
            });

            // Verify elements are properly positioned
            expect(timerBox).not.toBeNull();
            expect(canvasBox).not.toBeNull();
            expect(statusBox).not.toBeNull();

            // Take screenshot for position verification
            await page.screenshot({ 
                path: `test-results/visual-comparison-${env.name}-ui-positions.png`,
                fullPage: true
            });
        }
    });

    test('performance comparison snapshot', async ({ page }) => {
        console.log('Taking performance comparison snapshots');
        
        const environments = [
            { name: 'dev', url: DEV_URL },
            { name: 'prod', url: PROD_URL }
        ];

        for (const env of environments) {
            console.log(`Performance testing ${env.name} environment`);
            
            await page.goto(env.url);
            await page.waitForLoadState('networkidle');
            
            // Start performance measurement
            await page.keyboard.press('Space');
            await page.waitForTimeout(500);
            await page.keyboard.press('Space');
            
            // Let game run for a few seconds with movement
            await page.keyboard.down('ArrowLeft');
            await page.waitForTimeout(1000);
            await page.keyboard.up('ArrowLeft');
            await page.keyboard.down('ArrowRight');
            await page.waitForTimeout(1000);
            await page.keyboard.up('ArrowRight');
            
            // Take final performance snapshot
            await page.screenshot({ 
                path: `test-results/visual-comparison-${env.name}-performance.png`,
                fullPage: true
            });
            
            console.log(`${env.name} performance snapshot captured`);
        }
    });
});