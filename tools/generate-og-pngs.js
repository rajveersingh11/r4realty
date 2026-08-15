const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const ogDir = path.join(__dirname, '..', 'assets', 'og');
  if (!fs.existsSync(ogDir)) {
    console.error('assets/og directory not found, creating.');
    fs.mkdirSync(ogDir, { recursive: true });
  }

  const files = fs.readdirSync(ogDir).filter(f => f.endsWith('.svg'));
  if (files.length === 0) {
    console.warn('No SVG files found in assets/og to convert.');
    return;
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });

  for (const file of files) {
    const svgPath = path.join(ogDir, file);
    const svg = fs.readFileSync(svgPath, 'utf8');
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0">${svg}</body></html>`;
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const outPath = path.join(ogDir, file.replace('.svg', '.png'));
    await page.screenshot({ path: outPath, type: 'png' });
    console.log('Generated PNG:', outPath);
  }

  await browser.close();
})();
