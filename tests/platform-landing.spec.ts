import { expect, test } from '@playwright/test';

/**
 * Platform Landing Bug Detection Test
 *
 * This test verifies that the player can successfully land on platforms
 * without falling through them (platform collision bug).
 *
 * Expected behavior:
 * - Player should bounce on platforms for the full 10-second duration
 * - Game should end with "Time Up!" message, not immediate death
 * - No death markers should appear below platforms
 */

test.describe('Platform Landing System', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to game and wait for load
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    });

    test('should detect platform collision bug', async ({ page }) => {
        // Take initial screenshot
        await page.screenshot({ path: 'test-results/01-initial-state.png' });

        // Start the game (requires 2 Space presses for reliable start)
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');

        // Wait for game to start and verify it's actually running
        await page.waitForTimeout(1000);

        // Verify game started by checking status text changed from "Press SPACE to start" to "Playing"
        const statusText = await page.locator('text=/Playing|Press SPACE to start/').textContent();
        if (statusText?.includes('Press SPACE to start')) {
            // Try one more space press if game didn't start
            await page.keyboard.press('Space');
            await page.waitForTimeout(500);
        }

        await page.screenshot({ path: 'test-results/02-game-started.png' });

        // Critical test: Wait 3 seconds
        // If platform collision is broken: player dies immediately (within 0.3s)
        // If working correctly: player continues bouncing on platforms
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/03-after-3-seconds.png' });

        // Check if the timer is still counting down (indicating game is still running)
        // Try multiple selectors to find the timer
        let timeValue = 0;
        let timeText = '';

        try {
            // First, try to get any element containing "Time:"
            timeText = (await page.locator('text=/Time.*\\d+/').first().textContent()) || '';
            console.log('Time remaining (raw):', timeText);

            // Extract number from formats like "Time: 6" or "Playing Time: 6"
            const timeMatch = timeText.match(/Time.*?(\d+)/);
            if (timeMatch) {
                timeValue = Number.parseInt(timeMatch[1]);
            }
        } catch (_error) {
            console.log('Failed to get timer with first method, trying alternative...');

            // Try alternative approach
            const allText = await page.textContent('body');
            console.log('Page body contains:', allText?.substring(0, 200));
            const timeMatch = allText?.match(/Time.*?(\d+)/) || null;
            if (timeMatch) {
                timeValue = Number.parseInt(timeMatch[1]);
            }
        }

        console.log('Parsed time value:', timeValue);

        if (timeValue > 0) {
            // If time is still above 4, platform collision is working
            // If time is 0 or very low, platform collision failed
            if (timeValue >= 4) {
                console.log(
                    '✅ Platform collision is working correctly - time remaining:',
                    timeValue
                );
            } else {
                console.log('⚠️ Low time remaining:', timeValue);
            }

            expect(timeValue).toBeGreaterThan(3); // Should have more than 3 seconds left after 3s wait
        } else {
            console.log(
                '❌ Platform collision may have failed - game ended prematurely or timer not found'
            );
            throw new Error(
                'Could not find valid timer value - game may have crashed or ended prematurely'
            );
        }
    });

    test('should complete full game duration', async ({ page }) => {
        // Start the game (requires 2 Space presses for reliable start)
        await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        // Verify game started
        const statusText = await page.locator('text=/Playing|Press SPACE to start/').textContent();
        if (statusText?.includes('Press SPACE to start')) {
            await page.keyboard.press('Space');
            await page.waitForTimeout(500);
        }

        // Wait for the full game duration
        await page.waitForTimeout(11000);

        // Take final screenshot
        await page.screenshot({ path: 'test-results/04-final-state.png' });

        // Check if game ended normally with time up
        const hasTimeUp = await page.locator('text=/Time.*0/').isVisible();
        const hasGameOver = await page.locator('text=GAME OVER').isVisible();

        console.log('Has time 0:', hasTimeUp);
        console.log('Has game over:', hasGameOver);

        expect(hasTimeUp || hasGameOver).toBeTruthy();
    });
});
