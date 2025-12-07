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

    console.log('=== START GENERATION ===');
    console.log('HTML length:', html.length);
    console.log('chromium version:', chromium.version);
    console.log('chromium.args:', chromium.args);
    
    const execPath = await chromium.executablePath;
    console.log('executablePath:', execPath);
    
    console.log('Launching browser...');
    
    // Запускаем браузер с chrome-aws-lambda
    browser = await chromium.puppeteer.launch({
      args: [...chromium.args, '--disable-dev-shm-usage'],
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    console.log('✅ Browser started successfully');

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

    console.log('✅ Screenshot taken, size:', screenshot.length);

    // Возвращаем PNG напрямую
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', screenshot.length);
    return res.status(200).send(screenshot);

  } catch (error) {
    console.error('❌ Generation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }

    return res.status(500).json({
      error: 'Generation failed',
      details: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
