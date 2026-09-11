const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button[aria-label^="Use "]')].map(el => el.getAttribute('aria-label'));
    const selects = [...document.querySelectorAll('#language-selector')].length;
    const optionCount = [...document.querySelectorAll('#language-selector option')].length;
    const bodyText = document.body.innerText || '';
    return {
      buttons,
      selects,
      optionCount,
      bodyTextSnippet: bodyText.slice(0, 200)
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
