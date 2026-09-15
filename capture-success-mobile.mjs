import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 }
  });
  const page = await context.newPage();

  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Click nav to Create Ticket using testid
  await page.evaluate(() => {
    document.querySelector('[data-testid="nav-create-ticket"]').click();
  });
  await page.waitForTimeout(500);

  // Fill the form using direct DOM manipulation
  await page.evaluate(() => {
    // Fill requester
    const requesterSelect = document.querySelector('select[id*="requester"], select[name*="requester"]');
    if (requesterSelect) {
      requesterSelect.value = requesterSelect.options[1].value; // Select first real user
    }

    // Fill title
    const titleInput = document.querySelector('input[id*="title"], input[placeholder*="title"]');
    if (titleInput) {
      titleInput.value = 'Test Ticket for Screenshot';
    }

    // Fill description
    const descTextarea = document.querySelector('textarea[id*="description"], textarea[placeholder*="description"]');
    if (descTextarea) {
      descTextarea.value = 'This is a test ticket created for the mobile success screenshot.';
    }

    // Fill category
    const categorySelect = document.querySelector('select[id*="category"], select[name*="category"]');
    if (categorySelect) {
      categorySelect.value = categorySelect.options[1].value; // Select first category
    }

    // Fill priority
    const prioritySelect = document.querySelector('select[id*="priority"], select[name*="priority"]');
    if (prioritySelect) {
      prioritySelect.value = prioritySelect.options[2].value; // Select MEDIUM or similar
    }
  });

  await page.waitForTimeout(500);

  // Submit the form
  await page.evaluate(() => {
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.click();
    }
  });

  // Wait for success message to appear
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ 
    path: 'success-mobile.png',
    fullPage: false
  });

  await browser.close();
  console.log('Screenshot saved: success-mobile.png');
})();
