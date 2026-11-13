const { chromium, devices } = require('playwright');
const fs = require('fs');
const [,, opt, out] = process.argv;
const css = opt === 'now' ? '' : fs.readFileSync(__dirname + '/' + opt + '.css', 'utf8');
(async () => {
  const b = await chromium.launch();
  const shots = [
    { name: 'rg4-1200', vp: { width: 1200, height: 900 }, touch: false, hash: '#postcode/RG4' },
    { name: 'rg4-390', vp: { width: 390, height: 844 }, touch: true, hash: '#postcode/RG4' },
    { name: 'berks-390', vp: { width: 390, height: 844 }, touch: true, hash: '#county/berkshire' },
  ];
  for (const s of shots) {
    const ctx = await b.newContext({ viewport: s.vp, deviceScaleFactor: 1, hasTouch: s.touch, isMobile: s.touch, colorScheme: 'dark' });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:4610/' + s.hash); await p.waitForTimeout(2500);
    if (css) await p.addStyleTag({ content: css });
    // open the first gauge so its details show
    const first = s.name.startsWith("berks") ? p.locator("details.all-gauges > summary, .all-gauges summary").first() : p.locator(".b-row, .r-table tbody tr:not(.joins):not(.detail-row), .end-item").first();
    if (await first.count()) { await first.click(); await p.waitForTimeout(1200); }
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: `${out}/${opt}-${s.name}.png`, fullPage: true });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    console.log(opt, s.name, 'errors', errs.length, 'sideways', sw);
    await ctx.close();
  }
  await b.close();
})();
