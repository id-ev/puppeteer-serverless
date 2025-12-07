// api/version.js
module.exports = async (req, res) => {
  return res.status(200).json({
    version: '2.0-chrome-aws-lambda',
    timestamp: new Date().toISOString(),
    dependencies: {
      'chrome-aws-lambda': require('chrome-aws-lambda') ? 'installed' : 'missing',
      'puppeteer-core': require('puppeteer-core') ? 'installed' : 'missing'
    }
  });
};
