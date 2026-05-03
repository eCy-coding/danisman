 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
const ZIP_PATH = path.resolve(process.cwd(), 'microweber.zip');
const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const HOSTINGER_URL = 'https://hpanel.hostinger.com/websites';

async function deployMicroweber() {
  console.log('🚀 Starting Microweber Deployment...');

  if (!fs.existsSync(ZIP_PATH)) {
      console.error('❌ microweber.zip missing. Please run prepare-microweber.ts first.');
      return;
  }

  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  
  console.log('🔗 Navigating to Hostinger...');
  await page.goto(HOSTINGER_URL);

  // Inject Banner
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = '#2c3e50'; 
    div.style.color = '#ffffff';
    div.style.zIndex = '9999999';
    div.style.textAlign = 'center';
    div.style.fontSize = '18px';
    div.style.padding = '15px';
    div.style.fontWeight = 'bold';
    div.textContent = '🚀 Microweber Yükleniyor... Lütfen Dosya Yöneticisi Açıldığında Müdahale Etmeyin.';
    document.body.appendChild(div);
  });

  console.log('⏳ Waiting for generic Hostinger page...');
  await page.waitForTimeout(3000);

  // Click File Manager - PASSIVE MODE
  console.log('👀 Passive Mode: Waiting for YOU to open File Manager...');
  
  // We will loop and check contexts for a page that looks like File Manager
  let fmPage = null;

  while (!fmPage) {
      const pages = context.pages();
      for (const p of pages) {
          const title = await p.title();
          const url = p.url();
          // Hostinger FM usually has "File Manager" in title or url includes "file-manager"
          if (title.includes('File Manager') || title.includes('Dosya Yöneticisi') || url.includes('file-manager') || url.includes('files')) {
              fmPage = p;
              break;
          }
      }
      
      if (fmPage) break;
      await new Promise(r => setTimeout(r, 1000)); // Poll every second
  }

  console.log('✅ File Manager Detected!');
  const fmp = fmPage!;
  await fmp.waitForLoadState();

   // Inject Helper Overlay
   await fmp.evaluate(() => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.backgroundColor = '#e74c3c';
        div.style.color = 'white';
        div.style.padding = '15px 30px';
        div.style.zIndex = '9999999';
        div.style.fontSize = '20px';
        div.style.borderRadius = '10px';
        div.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        div.style.fontWeight = 'bold';
        div.innerText = '📂 1. "microweber.zip" DOSYASINI BURAYA SÜRÜKLEYİN. \n 2. SAĞ TIK -> EXTRACT YAPIN.';
        document.body.appendChild(div);
   });

   console.log('📂 Opening Finder for you...');
   // exec import is at the top
   exec(`open -R "${ZIP_PATH}"`);

}

deployMicroweber().catch(console.error);
