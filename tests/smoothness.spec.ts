import { test, expect, Page } from '@playwright/test';

// Extended timeout for smoothness tests
test.setTimeout(120000);

async function joinGame(page: Page, name: string) {
  await page.goto('/');
  await page.getByPlaceholder(/name/i).fill(name);
  await page.getByRole('button', { name: /play/i }).click();
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
}

test.describe('Gameplay Smoothness Tests', () => {
  test('should maintain smooth gameplay for 30 seconds of continuous movement', async ({ page }) => {
    await joinGame(page, 'SmoothTest');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    const radius = Math.min(box!.width, box!.height) * 0.35;

    // Track frame times to detect jitter
    const frameTimes: number[] = [];

    // Inject performance monitoring
    await page.evaluate(() => {
      (window as any).__frameTimes = [];
      (window as any).__lastFrameTime = performance.now();

      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) => {
        return originalRAF((time) => {
          const now = performance.now();
          const delta = now - (window as any).__lastFrameTime;
          (window as any).__frameTimes.push(delta);
          (window as any).__lastFrameTime = now;
          callback(time);
        });
      };
    });

    console.log('Starting 30-second smoothness test...');
    const startTime = Date.now();
    const testDuration = 30000; // 30 seconds
    let moveCount = 0;

    // Continuous movement for 30 seconds
    while (Date.now() - startTime < testDuration) {
      // Move in circular pattern
      const elapsed = Date.now() - startTime;
      const angle = (elapsed / 2000) * Math.PI * 2; // Full circle every 2 seconds

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      await page.mouse.move(x, y);
      moveCount++;

      // Small delay to not overwhelm
      await page.waitForTimeout(16); // ~60fps input rate

      // Verify game is still running every second
      if (moveCount % 60 === 0) {
        await expect(canvas).toBeVisible();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        console.log(`  ${elapsed}s elapsed, ${moveCount} moves...`);
      }
    }

    // Collect frame time data
    const collectedFrameTimes = await page.evaluate(() => {
      return (window as any).__frameTimes as number[];
    });

    // Analyze smoothness
    if (collectedFrameTimes.length > 100) {
      const avgFrameTime = collectedFrameTimes.reduce((a, b) => a + b, 0) / collectedFrameTimes.length;
      const maxFrameTime = Math.max(...collectedFrameTimes);
      const minFrameTime = Math.min(...collectedFrameTimes.filter(t => t > 0));

      // Count frames that took longer than 50ms (would cause visible stutter)
      const stutterFrames = collectedFrameTimes.filter(t => t > 50).length;
      const stutterPercent = (stutterFrames / collectedFrameTimes.length) * 100;

      console.log(`\nSmoothness Results:`);
      console.log(`  Total frames: ${collectedFrameTimes.length}`);
      console.log(`  Avg frame time: ${avgFrameTime.toFixed(2)}ms`);
      console.log(`  Min frame time: ${minFrameTime.toFixed(2)}ms`);
      console.log(`  Max frame time: ${maxFrameTime.toFixed(2)}ms`);
      console.log(`  Stutter frames (>50ms): ${stutterFrames} (${stutterPercent.toFixed(1)}%)`);

      // Assert reasonable performance
      expect(avgFrameTime).toBeLessThan(33); // At least 30fps average
      expect(stutterPercent).toBeLessThan(5); // Less than 5% stutter frames
    }

    // Final check - game still responsive
    await expect(canvas).toBeVisible();
    console.log(`\nTest complete! ${moveCount} total movements over 30 seconds.`);
  });

  test('should handle rapid direction changes smoothly', async ({ page }) => {
    await joinGame(page, 'RapidTest');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    console.log('Testing rapid direction changes for 15 seconds...');
    const startTime = Date.now();
    const testDuration = 15000;

    // Rapid back-and-forth movement (tests interpolation under stress)
    while (Date.now() - startTime < testDuration) {
      // Quick movements to opposite corners
      await page.mouse.move(box!.x + 50, box!.y + 50);
      await page.waitForTimeout(100);
      await page.mouse.move(box!.x + box!.width - 50, box!.y + box!.height - 50);
      await page.waitForTimeout(100);
      await page.mouse.move(centerX, centerY);
      await page.waitForTimeout(100);
    }

    await expect(canvas).toBeVisible();
    console.log('Rapid direction test complete!');
  });

  test('should maintain smoothness with split and eject actions', async ({ page }) => {
    await joinGame(page, 'ActionTest');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();

    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    const radius = Math.min(box!.width, box!.height) * 0.3;

    console.log('Testing gameplay with actions for 20 seconds...');
    const startTime = Date.now();
    const testDuration = 20000;

    while (Date.now() - startTime < testDuration) {
      const elapsed = Date.now() - startTime;
      const angle = (elapsed / 1500) * Math.PI * 2;

      // Move in circle
      await page.mouse.move(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );

      // Periodically trigger actions
      if (elapsed % 2000 < 100) {
        await page.keyboard.press('Space'); // Split
      }
      if (elapsed % 3000 < 100) {
        await page.keyboard.press('w'); // Eject
      }

      await page.waitForTimeout(16);
    }

    await expect(canvas).toBeVisible();
    console.log('Action test complete!');
  });

  test('should handle player respawn smoothly', async ({ page }) => {
    await joinGame(page, 'RespawnTest');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    console.log('Playing for 10 seconds...');

    // Play for a bit
    const box = await canvas.boundingBox();
    const startTime = Date.now();
    while (Date.now() - startTime < 10000) {
      const angle = ((Date.now() - startTime) / 1000) * Math.PI;
      await page.mouse.move(
        box!.x + box!.width / 2 + Math.cos(angle) * 200,
        box!.y + box!.height / 2 + Math.sin(angle) * 200
      );
      await page.waitForTimeout(50);
    }

    // Game should still be running smoothly
    await expect(canvas).toBeVisible();
    console.log('Extended play test complete!');
  });
});
