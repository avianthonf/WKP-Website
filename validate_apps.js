const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('--- Validating Storefront (Port 3005) ---');
  try {
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log('Page Title:', title);

    // Check for React Scan (it usually injects a script or has a global)
    const hasReactScan = await page.evaluate(() => {
      return !!window.__REACT_SCAN__ || !!document.querySelector('script[src*="react-scan"]');
    });
    console.log('React Scan detected in DOM/Window:', hasReactScan);

    // Check for common error boundary indicators if any (Next.js default or custom)
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('Application error') ||
             document.body.innerText.includes('Something went wrong');
    });
    console.log('UI Error detected:', hasError);

    await page.screenshot({ path: 'storefront_validation.png' });
  } catch (e) {
    console.error('Storefront failed to load:', e.message);
  }

  console.log('\n--- Validating Admin (Port 3006) ---');
  try {
    await page.goto('http://localhost:3006', { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log('Admin Title:', title);

    const hasReactScanAdmin = await page.evaluate(() => {
      return !!window.__REACT_SCAN__ || !!document.querySelector('script[src*="react-scan"]');
    });
    console.log('React Scan detected in Admin:', hasReactScanAdmin);

    // Check for login page (expected if not authed)
    const isLoginPage = await page.evaluate(() => {
      return document.body.innerText.includes('Login') || !!document.querySelector('input[type="email"]');
    });
    console.log('Is on Login page:', isLoginPage);

    await page.screenshot({ path: 'admin_validation.png' });
  } catch (e) {
    console.error('Admin failed to load:', e.message);
  }

  await browser.close();
})();
