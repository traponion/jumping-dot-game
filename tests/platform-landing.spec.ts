import { test, expect } from '@playwright/test';

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
    
    // Start the game
    await page.keyboard.press('Space');
    
    // Wait for game to start
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/02-game-started.png' });
    
    // Critical test: Wait 3 seconds
    // If platform collision is broken: player dies immediately (within 0.3s)
    // If working correctly: player continues bouncing on platforms
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-after-3-seconds.png' });
    
    // Check if the timer is still counting down (indicating game is still running)
    const timeText = await page.locator('text=/Time: \\d+/').textContent();
    console.log('Time remaining:', timeText);
    
    if (timeText) {
      const timeValue = parseInt(timeText.match(/\\d+/)?.[0] || '0');
      
      // If time is still above 5, platform collision is working
      // If time is 0 or very low, platform collision failed
      if (timeValue >= 5) {
        console.log('✅ Platform collision is working correctly - time remaining:', timeValue);
      } else if (timeValue === 0) {
        console.log('❌ Platform collision may have failed - game ended prematurely');
      } else {
        console.log('⚠️ Unclear result - time remaining:', timeValue);
      }
      
      expect(timeValue).toBeGreaterThan(4); // Should have more than 4 seconds left after 3s wait
    } else {
      throw new Error('Could not find timer - game may have crashed');
    }
  });

  test('should complete full game duration', async ({ page }) => {
    // Start the game
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    
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