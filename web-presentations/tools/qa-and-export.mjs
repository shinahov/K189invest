import { chromium } from 'file:///C:/Users/ibrahim%20shinahov/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('web-presentations');
const qaRoot = path.join(root, 'qa', 'renders');
const pdfRoot = path.join(root, 'downloads');
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-first-run', '--no-default-browser-check']
});

const results = [];

const landingContext = await browser.newContext({viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'reduce'});
const landing = await landingContext.newPage();
const landingErrors = [];
landing.on('console', msg => { if (msg.type() === 'error') landingErrors.push(msg.text()); });
landing.on('pageerror', err => landingErrors.push(err.message));
await landing.goto('http://127.0.0.1:4173/', {waitUntil:'networkidle'});
await landing.waitForSelector('.version-card');
const landingLinks = await landing.locator('.version-card').count();
if (landingLinks !== 2) throw new Error(`landing: expected 2 presentation choices, found ${landingLinks}`);
await fs.mkdir(path.join(root,'qa','landing'),{recursive:true});
await landing.screenshot({path:path.join(root,'qa','landing','desktop.png'),fullPage:true});
const landingBrokenImages = await landing.evaluate(() => [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im => im.src));
if (landingBrokenImages.length) throw new Error(`landing: broken images: ${landingBrokenImages.join(', ')}`);
const landingMobile = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:1, reducedMotion:'reduce'});
const landingMobilePage = await landingMobile.newPage();
await landingMobilePage.goto('http://127.0.0.1:4173/', {waitUntil:'networkidle'});
await landingMobilePage.screenshot({path:path.join(root,'qa','landing','mobile.png'),fullPage:true});
await landingMobile.close();
await landingContext.close();
results.push({slug:'landing',count:1,errors:landingErrors,brokenImages:landingBrokenImages});
for (const spec of [
  {slug:'short', minCount:16, pdf:'K189_Korotkaya_web_prezentaciya_RU.pdf'},
  {slug:'long', minCount:30, pdf:'K189_Investicionny_katalog_web_RU.pdf'}
]) {
  const context = await browser.newContext({viewport:{width:1440,height:900}, deviceScaleFactor:1, reducedMotion:'no-preference'});
  const page = await context.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(`http://127.0.0.1:4173/${spec.slug}/`, {waitUntil:'networkidle'});
  await page.waitForSelector('.slide');
  const count = await page.locator('.slide').count();
  if (count < spec.minCount) throw new Error(`${spec.slug}: expected at least ${spec.minCount} pages, found ${count}`);
  const desktopSlideWidth = await page.locator('.slide').first().evaluate(el => el.getBoundingClientRect().width);
  if (desktopSlideWidth < 1440 * .88) throw new Error(`${spec.slug}: desktop slide is too narrow (${desktopSlideWidth}px)`);
  const scrollAudit = await page.evaluate(async () => {
    const maxScroll = document.documentElement.scrollHeight-innerHeight;
    const samples = [];
    for (let step = 0; step <= 24; step++) {
      scrollTo({top:maxScroll*(step/24),behavior:'instant'});
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      samples.push({
        progress:Number(document.querySelector('.progress span').style.transform.match(/[\d.]+/)?.[0] || 0),
        page:Number(document.querySelector('.counter').textContent.slice(0,2))
      });
    }
    scrollTo({top:0,behavior:'instant'});
    return samples;
  });
  const scrollRegression = scrollAudit.some((sample,index) => index && (sample.progress+0.0001 < scrollAudit[index-1].progress || sample.page < scrollAudit[index-1].page));
  if (scrollRegression) throw new Error(`${spec.slug}: scroll progress or active page moves backwards while scrolling down`);
  const deckDir = path.join(qaRoot, spec.slug);
  await fs.mkdir(deckDir, {recursive:true});
  const overflows = [];
  for (let i = 0; i < count; i++) {
    const slide = page.locator('.slide').nth(i);
    await slide.scrollIntoViewIfNeeded();
    await page.waitForTimeout(760);
    const audit = await slide.evaluate(el => {
      const inner = el.querySelector('.slide__inner');
      const offenders = [...el.querySelectorAll('.title,.body,.item,.metric,.role,.doc-columns')]
        .filter(node => node.scrollWidth > node.clientWidth + 12 || node.scrollHeight > node.clientHeight + 12)
        .map(node => ({className:node.className,scrollWidth:node.scrollWidth,clientWidth:node.clientWidth,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight}));
      const hiddenReveals = [...el.querySelectorAll('.reveal')].filter(node => {
        const style = getComputedStyle(node);
        return Number.parseFloat(style.opacity) < .95 || style.visibility === 'hidden';
      }).length;
      const galleryBoxes = [...el.querySelectorAll('.gallery__image')].map((node,index) => {
        const box = node.getBoundingClientRect();
        return {index,left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height};
      });
      const galleryOverlaps = [];
      for (let a = 0; a < galleryBoxes.length; a++) {
        for (let b = a + 1; b < galleryBoxes.length; b++) {
          const first = galleryBoxes[a];
          const second = galleryBoxes[b];
          const overlapWidth = Math.min(first.right,second.right) - Math.max(first.left,second.left);
          const overlapHeight = Math.min(first.bottom,second.bottom) - Math.max(first.top,second.top);
          if (overlapWidth > 2 && overlapHeight > 2) galleryOverlaps.push([first.index,second.index]);
        }
      }
      return {slideOverflow:el.scrollWidth > el.clientWidth + 2, innerOverflow:inner.scrollHeight > inner.clientHeight + 2, hiddenReveals, offenders, galleryOverlaps};
    });
    if (audit.slideOverflow || audit.innerOverflow || audit.hiddenReveals || audit.offenders.length || audit.galleryOverlaps.length) overflows.push({slide:i+1,...audit});
    await slide.screenshot({path:path.join(deckDir,`slide-${String(i+1).padStart(2,'0')}.png`)});
  }
  const brokenImages = await page.evaluate(() => [...document.images].filter(im => !im.complete || !im.naturalWidth).map(im => im.src));
  if (brokenImages.length) throw new Error(`${spec.slug}: broken images: ${brokenImages.join(', ')}`);

  const mobile = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:1, reducedMotion:'no-preference'});
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`http://127.0.0.1:4173/${spec.slug}/`, {waitUntil:'networkidle'});
  await mobilePage.waitForSelector('.slide');
  const mobileSamples = (spec.slug === 'short' ? [0,1,6,7,12,count-1] : [0,2,13,15,17,26,34,count-1])
    .filter((index,pos,list) => index >= 0 && index < count && list.indexOf(index) === pos);
  const mobileDir = path.join(qaRoot,`${spec.slug}-mobile`);
  await fs.mkdir(mobileDir,{recursive:true});
  for (const index of mobileSamples) {
    const slide = mobilePage.locator('.slide').nth(index);
    await slide.scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(760);
    const mobileHiddenReveals = await slide.evaluate(el => [...el.querySelectorAll('.reveal')].filter(node => {
      const style = getComputedStyle(node);
      return Number.parseFloat(style.opacity) < .95 || style.visibility === 'hidden';
    }).length);
    if (mobileHiddenReveals) throw new Error(`${spec.slug} slide ${index+1}: ${mobileHiddenReveals} hidden content blocks on mobile`);
    await slide.screenshot({path:path.join(mobileDir,`slide-${String(index+1).padStart(2,'0')}.png`)});
  }
  await mobile.close();

  await fs.mkdir(pdfRoot,{recursive:true});
  await page.emulateMedia({media:'print'});
  await page.pdf({
    path:path.join(pdfRoot,spec.pdf),
    width:'16in',height:'9in',
    printBackground:true,
    margin:{top:'0',right:'0',bottom:'0',left:'0'},
    preferCSSPageSize:true
  });
  results.push({slug:spec.slug,count,errors,overflows,pdf:path.join(pdfRoot,spec.pdf)});
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(qaRoot,'qa-results.json'),JSON.stringify(results,null,2),'utf8');
console.log(JSON.stringify(results,null,2));
