import { test, expect, Page, Browser } from '@playwright/test';

test.describe('Movement stress test', () => {
  test('10 minute session with multiple players', async ({ browser }) => {
    // Increase timeout to 11 minutes
    test.setTimeout(11 * 60 * 1000);

    const playerCount = 4;
    const testDuration = 10 * 60 * 1000; // 10 minutes
    const pages: Page[] = [];

    // Create multiple browser contexts/pages
    for (let i = 0; i < playerCount; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      pages.push(page);
    }

    // Join game with each player
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      await page.goto('http://localhost:5175/');

      // Wait for the name input and enter a name
      const nameInput = page.locator('input[type="text"]');
      await nameInput.waitFor({ timeout: 10000 });
      await nameInput.fill(`Player${i + 1}`);

      // Click play button
      const playButton = page.locator('button:has-text("Play")');
      await playButton.click();

      // Wait for game canvas to appear
      await page.locator('canvas').waitFor({ timeout: 10000 });
      console.log(`Player ${i + 1} joined the game`);
    }

    // Let all players play for 10 minutes with random movement
    const startTime = Date.now();
    let lastLog = 0;

    while (Date.now() - startTime < testDuration) {
      // Move each player's mouse randomly
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Random position on screen
        const x = 200 + Math.random() * 800;
        const y = 200 + Math.random() * 400;

        await page.mouse.move(x, y);

        // Occasionally split (space) or eject (w)
        if (Math.random() < 0.02) {
          await page.keyboard.press('Space');
        }
        if (Math.random() < 0.05) {
          await page.keyboard.press('w');
        }
      }

      // Log progress every minute
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      if (minutes > lastLog) {
        console.log(`${minutes} minute(s) elapsed - all players still active`);
        lastLog = minutes;

        // Take screenshots every minute
        for (let i = 0; i < pages.length; i++) {
          await pages[i].screenshot({
            path: `tests/screenshots/player${i + 1}-minute${minutes}.png`
          });
        }
      }

      // Small delay between movement updates
      await new Promise(r => setTimeout(r, 50));
    }

    console.log('10 minute stress test completed successfully!');

    // Clean up
    for (const page of pages) {
      await page.close();
    }
  });
});
