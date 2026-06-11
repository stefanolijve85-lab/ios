import { test, expect } from '@playwright/test';

/** A unique username per run so the smoke test is repeatable against a live DB. */
const username = `e2e_${Date.now().toString(36)}`;

test('register, place a bet, jump, and see the bridge respond', async ({ page }) => {
  await page.goto('/');

  // The auth modal is shown for guests — register a fresh account.
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'CREATE ACCOUNT' }).click();

  // Balance appears once logged in.
  await expect(page.getByText('BALANCE')).toBeVisible({ timeout: 10_000 });

  // Place a bet.
  await page.getByRole('button', { name: /^BET/ }).click();

  // The "choose your path" controls become enabled.
  const leftButton = page.getByRole('button', { name: /LEFT/ });
  await expect(leftButton).toBeEnabled({ timeout: 10_000 });

  // Jump once — the round either advances or busts; either way the UI updates.
  await leftButton.click();
  await expect(page.getByText(/Choose your path|Place a bet/)).toBeVisible();
});

test('verify page recomputes a layout from seeds', async ({ page }) => {
  await page.goto('/verify?serverSeed=abc123&clientSeed=player1&nonce=1');
  await page.getByRole('button', { name: 'RECOMPUTE' }).click();
  // The computed hash and a per-row table appear.
  await expect(page.getByText('Computed SHA-256(serverSeed):')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'LEFT' }).first().or(page.getByRole('cell', { name: 'RIGHT' }).first())).toBeVisible();
});
