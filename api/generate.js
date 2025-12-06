// api/generate.js - Vercel Serverless Function
const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { html, filename } = req.body;

    if (!html) {
        return res.status(400).json({ error: 'HTML content is required' });
    }

    let browser;

    try {
        browser = await puppeteer.launch({
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
        });

        const page = await browser.newPage();
        
        await page.setViewport({
            width: 1080,
            height: 1920,
            deviceScaleFactor: 1
        });

        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });

        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: false,
            clip: {
                x: 0,
                y: 0,
                width: 1080,
                height: 1920
            }
        });

        await browser.close();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'story.png'}"`);
        res.send(screenshot);

    } catch (error) {
        console.error('Error:', error);
        
        if (browser) {
            await browser.close();
        }
        
        res.status(500).json({ 
            error: 'Generation failed', 
            details: error.message 
        });
    }
};
