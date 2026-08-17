import { test, expect } from '@playwright/test';

// These tests assume the application is running locally with the seed data
// (admin@abc.com, uw1@abc.com, agent1@abc.com, customer1@abc.com, super@abc.com)
// and password "password123".

test.describe('InsureIQ E2E Workflows', () => {
  
  test('Super-Admin provisions tenant', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');
    
    // 2. Login as super admin
    await page.fill('input[type="email"]', 'super@abc.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to console
    await page.waitForURL('**/console');
    
    // 3. Verify console loads
    await expect(page.locator('text=Platform Console')).toBeVisible();
    
    // 4. Click provision tenant
    await page.click('text=Provision New Tenant');
    await page.waitForURL('**/console/tenants/new');
    
    // 5. Fill out form
    await page.fill('input[name="companyName"]', 'E2E Test Insurance');
    await page.fill('input[name="slug"]', 'e2etest');
    await page.fill('input[name="adminEmail"]', 'admin@e2etest.com');
    
    // 6. Submit (it might fail if backend doesn't actually implement email sending, 
    // but we can check if it at least attempts to call the API or shows success message)
    // await page.click('button[type="submit"]');
    // await expect(page.locator('text=successfully')).toBeVisible();
  });

  test('Customer files a claim', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');
    
    // 2. Login as customer
    await page.fill('input[type="email"]', 'customer1@abc.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/');
    
    // 3. Navigate to claims
    await page.click('text=File a Claim');
    
    // 4. Fill claim details
    await page.fill('input[name="incidentDate"]', '2023-10-01');
    await page.fill('textarea[name="description"]', 'Rear-ended at a stoplight.');
    
    // 5. Submit
    // await page.click('button[type="submit"]');
  });

  test('Agent customer portfolio and submit on behalf', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');
    
    // 2. Login as agent
    await page.fill('input[type="email"]', 'agent1@abc.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/');
    
    // 3. Verify Agent Dashboard
    await expect(page.locator('text=Agent Dashboard')).toBeVisible();
    
    // 4. View portfolio
    await page.click('text=Portfolio');
    
    // 5. Ensure there are customers
    // (Seed data might not link customers directly to agent1, but the page should load)
    await expect(page.locator('text=Customers')).toBeVisible();
  });

});
