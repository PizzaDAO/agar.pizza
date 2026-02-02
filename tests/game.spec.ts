import { test, expect } from '@playwright/test';

test.describe('Agar Pizza Game', () => {
  test('should load the lobby screen', async ({ page }) => {
    await page.goto('/');

    // Should see the play button
    await expect(page.getByRole('button', { name: /play/i })).toBeVisible();

    // Should see name input
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
  });

  test('should join the game with a name', async ({ page }) => {
    await page.goto('/');

    // Enter a name
    await page.getByPlaceholder(/name/i).fill('TestPizza');

    // Click play
    await page.getByRole('button', { name: /play/i }).click();

    // Should see the game canvas
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Should see the HUD with score
    await expect(page.getByText(/score/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display leaderboard', async ({ page }) => {
    await page.goto('/');

    // Join the game
    await page.getByPlaceholder(/name/i).fill('LeaderTest');
    await page.getByRole('button', { name: /play/i }).click();

    // Wait for game to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Should see leaderboard
    await expect(page.getByText(/leaderboard/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow mouse movement for direction', async ({ page }) => {
    await page.goto('/');

    // Join the game
    await page.getByPlaceholder(/name/i).fill('MouseTest');
    await page.getByRole('button', { name: /play/i }).click();

    // Wait for canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Move mouse around the canvas
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
    }

    // Game should still be running (canvas visible)
    await expect(canvas).toBeVisible();
  });

  test('should handle spacebar for split', async ({ page }) => {
    await page.goto('/');

    // Join the game
    await page.getByPlaceholder(/name/i).fill('SplitTest');
    await page.getByRole('button', { name: /play/i }).click();

    // Wait for canvas
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Press spacebar (split action)
    await page.keyboard.press('Space');

    // Game should still be running
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should handle W key for eject', async ({ page }) => {
    await page.goto('/');

    // Join the game
    await page.getByPlaceholder(/name/i).fill('EjectTest');
    await page.getByRole('button', { name: /play/i }).click();

    // Wait for canvas
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Press W (eject action)
    await page.keyboard.press('w');

    // Game should still be running
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should render game elements on canvas', async ({ page }) => {
    await page.goto('/');

    // Join the game
    await page.getByPlaceholder(/name/i).fill('RenderTest');
    await page.getByRole('button', { name: /play/i }).click();

    // Wait for canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Wait a moment for game state to sync
    await page.waitForTimeout(2000);

    // Verify canvas has dimensions (game is rendering)
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Verify player name appears in leaderboard (player joined successfully)
    await expect(page.getByText('RenderTest')).toBeVisible({ timeout: 5000 });
  });
});
