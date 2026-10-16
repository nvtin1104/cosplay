import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { seoPages } from '../src/data/seo.ts';

const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const font = path => readFileSync(`node_modules/@fontsource/${path}`).toString('base64');
const fonts = {
  serif: font('noto-serif/files/noto-serif-vietnamese-400-normal.woff2'),
  serifLatin: font('noto-serif/files/noto-serif-latin-400-normal.woff2'),
  sans: font('be-vietnam-pro/files/be-vietnam-pro-vietnamese-400-normal.woff2'),
  sansLatin: font('be-vietnam-pro/files/be-vietnam-pro-latin-400-normal.woff2'),
};
mkdirSync('src/assets/social', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const item of seoPages) {
    const image = item.image ? `data:image/jpeg;base64,${readFileSync(item.image).toString('base64')}` : '';
    await page.setContent(`<!doctype html><html lang="vi"><meta charset="utf-8"><style>
      @font-face{font-family:Serif;src:url(data:font/woff2;base64,${fonts.serif})} @font-face{font-family:Serif;src:url(data:font/woff2;base64,${fonts.serifLatin});unicode-range:U+0000-00FF}
      @font-face{font-family:Sans;src:url(data:font/woff2;base64,${fonts.sans})} @font-face{font-family:Sans;src:url(data:font/woff2;base64,${fonts.sansLatin});unicode-range:U+0000-00FF}
      *{box-sizing:border-box}body{margin:0;background:#f2ebdd;color:#354638;padding:54px 60px;font-family:Sans;width:1200px;height:630px;border-bottom:14px solid #354638}
      header{font-size:17px;letter-spacing:3px;border-bottom:1px solid #c3c6b2;padding-bottom:24px}main{display:grid;grid-template-columns:1.45fr 1fr;align-items:center;gap:45px;height:415px}
      h1{font:400 50px/1.3 Serif;white-space:pre-line;letter-spacing:-1.5px;margin:0 0 26px}p{font-size:19px;line-height:1.7;margin:0;color:#626453}img{width:390px;height:350px;object-fit:contain;background:#faf7ef;padding:8px;border:1px solid #d6cdbb}
      .mark{width:350px;height:300px;display:grid;place-items:center;background:#e2e5d6;border:1px solid #bec4ac;color:#69704d;font:130px Serif;border-radius:50%}footer{display:flex;justify-content:space-between;font-size:16px;color:#69704d}
      </style><header>TTP COSPLAY OFFLINE</header><main><div><h1>${escape(item.heading)}</h1><p>${escape(item.detail)}</p></div>${image ? `<img src="${image}"/>` : '<div class="mark">ttp.</div>'}</main><footer><span>${escape(item.label)}</span><span>ttp.likecactus.com</span></footer></html>`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
    await page.screenshot({ path: `src/assets/social/${item.key}.png` });
  }
  console.log(`Generated ${seoPages.length} social cards (1200×630 PNG).`);
} finally { await browser.close(); }
