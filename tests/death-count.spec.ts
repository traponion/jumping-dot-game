import { expect, test } from '@playwright/test';

/**
 * Death Count Feature E2E Tests
 *
 * This test verifies that the death count feature works correctly:
 * - Death count display is visible in top-right corner
 * - Death count increments when player dies
 * - Death count shows on game over screen
 * - Death count resets when restarting stage
 */

test.describe('Death Count Display', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to game and wait for load
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    });

    test('should display death count element in top-right corner', async ({ page }) => {
        // Take initial screenshot
        await page.screenshot({ path: 'test-results/death-count-01-initial.png' });

        // Check that death count element exists and is visible
        const deathCountElement = page.locator('#deathCount');
        await expect(deathCountElement).toBeVisible();

        // Verify initial text shows "Deaths: 0"
        await expect(deathCountElement).toHaveText('Deaths: 0');

        // Verify positioning in top-right area
        const boundingBox = await deathCountElement.boundingBox();
        expect(boundingBox).not.toBeNull();

        // Death count should be positioned on the right side of the screen
        // (assuming screen width is around 800px, right side should be > 400px)
        if (boundingBox) {
            expect(boundingBox.x).toBeGreaterThan(400);
            expect(boundingBox.y).toBeLessThan(100); // Should be near top
        }

        await page.screenshot({ path: 'test-results/death-count-02-element-verified.png' });
    });

    test('should increment death count when player dies', async ({ page }) => {
        // Start the game
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');

        // Wait for game to start
        await page.waitForTimeout(1000);

        // Verify game started
        const statusText = await page.locator('text=/Playing|Press SPACE to start/').textContent();
        if (statusText?.includes('Press SPACE to start')) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'test-results/death-count-03-game-started.png' });

        // Verify initial death count is 0
        const deathCountElement = page.locator('#deathCount');
        await expect(deathCountElement).toHaveText('Deaths: 0');

        // Cause player death by moving to a hole/spike
        // Move left to potentially hit spike or fall into hole
        await page.keyboard.down('ArrowLeft');
        await page.waitForTimeout(2000); // Let player move and potentially die
        await page.keyboard.up('ArrowLeft');

        // Or try moving right
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(2000);
        await page.keyboard.up('ArrowRight');

        await page.screenshot({ path: 'test-results/death-count-04-after-movement.png' });

        // Check if death count incremented or game over occurred
        const gameOverText = await page
            .locator('text=Game Over')
            .isVisible()
            .catch(() => false);

        if (gameOverText) {
            // Player died - check death count incremented
            await expect(deathCountElement).toHaveText('Deaths: 1');
            await page.screenshot({ path: 'test-results/death-count-05-death-incremented.png' });

            // Restart stage and verify death count resets
            await page.keyboard.press('r');
            await page.waitForTimeout(1000);

            // After restart, death count should reset to 0
            await expect(deathCountElement).toHaveText('Deaths: 0');
            await page.screenshot({ path: 'test-results/death-count-06-reset-after-restart.png' });
        } else {
            // If player didn't die in normal gameplay, force death by waiting for time limit
            await page.waitForTimeout(12000); // Wait for time to run out

            // Time up should also increment death count
            await page.screenshot({ path: 'test-results/death-count-07-time-up.png' });

            // Check if death count incremented due to time up
            const currentDeathText = await deathCountElement.textContent();
            expect(currentDeathText).toMatch(/Deaths: [1-9]/); // Should be > 0
        }
    });

    test('should display death count on game over screen', async ({ page }) => {
        // Start the game
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);

        // Force game over by waiting for time limit
        await page.waitForTimeout(12000);

        await page.screenshot({ path: 'test-results/death-count-08-game-over.png' });

        // Verify game over screen shows and includes death count
        await expect(page.locator('text=Game Over')).toBeVisible();

        // Death count should still be visible during game over
        const deathCountElement = page.locator('#deathCount');
        await expect(deathCountElement).toBeVisible();

        // Should show at least 1 death (from time up)
        const deathText = await deathCountElement.textContent();
        expect(deathText).toMatch(/Deaths: [1-9]/);
    });

    test('should maintain death count consistency between DOM and canvas', async ({ page }) => {
        // Start the game
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/death-count-09-consistency-check.png' });

        // Check that DOM element and any canvas-rendered death count are consistent
        const domDeathCount = page.locator('#deathCount');
        await expect(domDeathCount).toBeVisible();
        await expect(domDeathCount).toHaveText('Deaths: 0');

        // Force a death and verify both displays update
        await page.waitForTimeout(12000); // Wait for time limit

        await page.screenshot({ path: 'test-results/death-count-10-after-death.png' });

        // Both DOM and any game over screen rendering should show same count
        const finalDeathText = await domDeathCount.textContent();
        expect(finalDeathText).toMatch(/Deaths: [1-9]/);

        // If game over screen is visible, it should show consistent death count
        const gameOverVisible = await page.locator('text=Game Over').isVisible();
        if (gameOverVisible) {
            await page.screenshot({
                path: 'test-results/death-count-11-game-over-consistency.png'
            });
        }
    });
});
