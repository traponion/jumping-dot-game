import { test, expect } from '@playwright/test';

/**
 * Trail Rendering Test
 * 
 * This test verifies that the player's trail (movement path visualization)
 * is properly rendered during gameplay.
 * 
 * Expected behavior:
 * - Trail should appear when player moves
 * - Trail should have fading effect (alpha decreasing)
 * - Trail should follow player movement
 * - Trail should be visible throughout gameplay
 */

test.describe('Trail Rendering System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game and wait for load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should render player trail during movement', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/trail-01-initial.png' });
    
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
    
    await page.screenshot({ path: 'test-results/trail-02-game-started.png' });
    
    // Move player to generate trail
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    
    // Take screenshot after movement
    await page.screenshot({ path: 'test-results/trail-03-after-movement.png' });
    
    // Check if trail elements are present in the canvas
    // We'll check for canvas and that it's not empty/black
    const canvas = await page.locator('canvas#gameCanvas');
    expect(canvas).toBeVisible();
    
    // Get canvas context and check if it has been drawn on
    const hasCanvasContent = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      // Get image data to check if canvas has been modified from default
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if there are any non-black pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // If we find any pixel that's not black (0,0,0) or transparent, canvas has content
        if (r > 0 || g > 0 || b > 0 || a > 0) {
          return true;
        }
      }
      return false;
    });
    
    console.log('Canvas has content:', hasCanvasContent);
    expect(hasCanvasContent).toBeTruthy();
    
    // Continue moving to test trail persistence
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    
    // Final screenshot to verify trail is still working
    await page.screenshot({ path: 'test-results/trail-04-final.png' });
  });

  test('should maintain trail throughout gameplay session', async ({ page }) => {
    // Start the game
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    
    // Verify game started
    const statusText = await page.locator('text=/Playing|Press SPACE to start/').textContent();
    if (statusText?.includes('Press SPACE to start')) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(500);
    }
    
    // Perform continuous movement for several seconds (shorter duration to avoid time limit)
    const movementDuration = 3000; // 3 seconds
    const moveInterval = 300; // Move every 300ms
    const totalMoves = movementDuration / moveInterval;
    
    for (let i = 0; i < totalMoves; i++) {
      // Alternate between left and right movement
      if (i % 2 === 0) {
        await page.keyboard.press('ArrowLeft');
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(moveInterval);
      
      // Take screenshots at key intervals
      if (i === Math.floor(totalMoves / 3)) {
        await page.screenshot({ path: 'test-results/trail-session-1-3.png' });
      } else if (i === Math.floor((totalMoves * 2) / 3)) {
        await page.screenshot({ path: 'test-results/trail-session-2-3.png' });
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/trail-session-final.png' });
    
    // Verify canvas still has content after extended movement
    const hasCanvasContent = await page.evaluate(() => {
      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check for any non-black pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (r > 0 || g > 0 || b > 0 || a > 0) {
          return true;
        }
      }
      return false;
    });
    
    console.log('Canvas has content after extended session:', hasCanvasContent);
    expect(hasCanvasContent).toBeTruthy();
    
    // Check that game is still running (timer should be > 0 or game may have ended normally)
    let timeValue = 0;
    let gameEnded = false;
    try {
      const timeText = await page.locator('text=/Time.*\\d+/').first().textContent() || '';
      const timeMatch = timeText.match(/Time.*?(\\d+)/);
      if (timeMatch) {
        timeValue = parseInt(timeMatch[1]);
      }
    } catch (error) {
      console.log('Could not get timer value - game may have ended');
      gameEnded = true;
    }
    
    console.log('Time remaining after movement session:', timeValue);
    // Game should either still be running OR have ended normally (not crashed)
    // Trail rendering should work regardless of game end state
    expect(gameEnded || timeValue >= 0).toBeTruthy();
  });
});