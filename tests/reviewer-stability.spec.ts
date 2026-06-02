import { test, expect } from '@playwright/test';

test.describe('Product Reviewer Flow Stabilization', () => {
    const URL = process.env.STAGING_URL || 'http://localhost:5173';

    test('should navigate through all available games without selector timeouts', async ({ page }) => {
        await page.goto(URL);

        // Verify we are on the hub
        await expect(page.locator('h1')).toHaveText('Autonomous Arcade');

        const games = [
            { title: 'Reaction Rush', backSelector: '.reaction-rush__back-btn' },
            { title: 'Word Grid', backSelector: '.word-grid-game__back' },
            { title: 'Living Dungeon Mini', backSelector: '.dungeon-game__back' }
        ];

        for (const game of games) {
            // Find game card by title and click it
            const card = page.locator('.game-card', { hasText: game.title });
            await expect(card).toBeVisible();
            await card.click();

            // Verify navigation
            if (game.title === 'Reaction Rush') {
                await expect(page.locator('h1', { hasText: game.title })).toBeVisible({ timeout: 5000 });
            } else if (game.title === 'Word Grid') {
                await expect(page.locator('.word-grid-game__title', { hasText: game.title })).toBeVisible({ timeout: 5000 });
            } else {
                await expect(page.locator('.dungeon-game__title', { hasText: game.title })).toBeVisible({ timeout: 5000 });
            }

            // Ensure interactive buttons are accessible (Role: button)
            const actionButtons = page.locator('button');
            const count = await actionButtons.count();
            expect(count).toBeGreaterThan(0);

            // Navigate back to hub
            const backBtn = page.locator(game.backSelector);
            await expect(backBtn).toBeVisible();
            await backBtn.click();

            // Verify we are back on the hub
            await expect(page.locator('h1')).toHaveText('Autonomous Arcade');
        }
    });

    test('Reaction Rush should have stable controls', async ({ page }) => {
        await page.goto(URL);
        await page.locator('.game-card', { hasText: 'Reaction Rush' }).click();

        // Check for 'Start' button
        const startBtn = page.locator('button', { hasText: 'Start' });
        await expect(startBtn).toBeVisible();
        await startBtn.click();

        // Should transition to 'waiting'
        const gameButton = page.locator('.reaction-rush__action-btn');
        await expect(gameButton).toBeVisible();
    });
});
