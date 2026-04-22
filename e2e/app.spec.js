import { test, expect } from '@playwright/test';

test.describe('Realty CRM End-to-End Suite', () => {

  test('Landing Page loads correctly', async ({ page, isMobile }) => {
    await page.goto('/');
    
    // Verify title is set
    await expect(page).toHaveTitle(/Realty CRM/i);
    
    // Verify main brand logo/text is visible
    const brandText = page.locator('text=Realty').first();
    await expect(brandText).toBeVisible();

    // Specific mobile view check: Hamburger menu
    if (isMobile) {
      // Find hamburger menu button and click it to open mobile menu
      const menuBtn = page.locator('button', { has: page.locator('svg') }).first();
      // Only testing interaction if it's visible depending on the responsive classes
      if (await menuBtn.isVisible()) {
         await menuBtn.click();
         // Wait for the mobile menu 'Book a Demo' which is clearly rendered last or after animation
         await expect(page.locator('button').filter({ hasText: 'Book a Demo' }).last()).toBeVisible();
      }
    } else {
      // Desktop nav check
      await expect(page.locator('.md\\:flex a[href="#problem"]').first()).toBeVisible();
    }
  });

  test('Authentication Routing (Agent / Dashboard)', async ({ page }) => {
    // Navigate straight to dashboard
    await page.goto('/dashboard');

    // Given we are unauthenticated in this context, it should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // Wait for the login page to fully render
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Authentication Routing (Admin)', async ({ page }) => {
    // Navigate straight to admin panel
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    
    // verifying that the app correctly protects the Admin Layout is a core test.
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
