import { test, expect } from '@playwright/test';

test('login', async ({ page }) => {
  await page.goto('http://localhost:15173/login');
  await page.fill('input[type="email"]', 'customer1@abc.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:15173/portal');
  await expect(page).toHaveURL('http://localhost:15173/portal');
});
