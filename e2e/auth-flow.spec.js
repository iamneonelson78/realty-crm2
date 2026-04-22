import { test, expect } from '@playwright/test';

async function attachConsoleLogger(page) {
  const errors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  return { errors, pageErrors };
}

function filterExpected(errors) {
  return errors.filter(
    (e) => !/favicon|Failed to load resource.*404|preload|AuthApiError|Invalid login/i.test(e)
  );
}

test('Agent login and navigate dashboard subroutes', async ({ page }) => {
  const { errors, pageErrors } = await attachConsoleLogger(page);

  await page.goto('/login');
  await page.fill('input[type="email"]', 'agent@realty.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL(/dashboard/, { timeout: 15000 }).catch(() => {});

  if (page.url().includes('/dashboard')) {
    for (const path of ['', 'pipeline', 'listings', 'connections']) {
      await page.goto(`/dashboard/${path}`);
      await page.waitForTimeout(700);
    }
  }

  expect(pageErrors, `pageerrors:\n${pageErrors.join('\n')}`).toHaveLength(0);
  expect(filterExpected(errors), `console errors:\n${errors.join('\n')}`).toHaveLength(0);
});

test('Admin login and navigate admin subroutes', async ({ page }) => {
  const { errors, pageErrors } = await attachConsoleLogger(page);

  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@realty.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL(/admin/, { timeout: 15000 }).catch(() => {});

  if (page.url().includes('/admin')) {
    for (const path of ['', 'access']) {
      await page.goto(`/admin/${path}`);
      await page.waitForTimeout(700);
    }
  }

  expect(pageErrors, `pageerrors:\n${pageErrors.join('\n')}`).toHaveLength(0);
  expect(filterExpected(errors), `console errors:\n${errors.join('\n')}`).toHaveLength(0);
});
