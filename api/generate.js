// api/generate.js
const chromium = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  // Только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser = null;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML is required' });
    }

    console.log('Starting browser...');
    
    // Запускаем браузер с chrome-aws-lambda
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log('Browser started');

    const page = await browser.newPage();
    
    // Размер для Instagram Stories
    await page.setViewport({
      width: 1080,
      height: 1920,
      deviceScaleFactor: 1
    });

    console.log('Setting HTML content...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Taking screenshot...');
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false
    });

    await browser.close();
    browser = null;

    console.log('Screenshot taken, size:', screenshot.length);

    // Возвращаем PNG напрямую
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', screenshot.length);
    return res.status(200).send(screenshot);

  } catch (error) {
    console.error('Generation error:', error);
    
    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      error: 'Generation failed',
      details: error.message
    });
  }
};
