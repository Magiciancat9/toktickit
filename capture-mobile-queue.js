const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'emma.rodriguez@example.com');
  await page.fill('#password', 'TempPass123!');
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('text=Change Your Password', { timeout: 20000 });
  await page.fill('#currentPassword', 'TempPass123!');
  await page.fill('#newPassword', 'NewPass123!');
  await page.fill('#confirmPassword', 'NewPass123!');
  await page.locator('button[type="submit"]').click();

  await page.waitForSelector('text=Ticket Queue', { timeout: 25000 });
  await page.screenshot({ path: 'artifacts/mobile-ticket-queue.png', fullPage: false });
  console.log('SCREENSHOT_OK');
  await browser.close();
})();
