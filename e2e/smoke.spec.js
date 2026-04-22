import { test, expect } from '@playwright/test';

const routes = ['/', '/login', '/signup', '/dashboard', '/admin'];

for (const route of routes) {
  test(`No console errors on ${route}`, async ({ page }) => {
    const errors = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const filtered = errors.filter(
      (e) => !/favicon|Failed to load resource.*404/i.test(e)
    );
    expect(pageErrors, `Page errors on ${route}:\n${pageErrors.join('\n')}`).toHaveLength(0);
    expect(filtered, `Console errors on ${route}:\n${filtered.join('\n')}`).toHaveLength(0);
  });
}
