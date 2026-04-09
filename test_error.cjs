const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if(msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR STR:', error.message);
    console.log('PAGE ERROR STACK:', error.stack);
  });

  console.log("Navigating to localhost...");
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    // maybe 4173?
    try {
      await page.goto('http://localhost:4173', { waitUntil: 'networkidle', timeout: 10000 });
    } catch(err) {
      console.log("Both 5173 and 4173 failed. Please ensure a server is running.");
    }
  }

  // Wait a moment for React to mount and throw
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
