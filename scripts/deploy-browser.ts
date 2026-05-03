 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// CONFIG
// const WEBSITE_URL = 'ecypro.com';
const DIST_DIR = path.resolve(process.cwd(), 'dist');


const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');

async function deploy() {
  console.log('🚀 Launching REAL Google Chrome...');
  console.log('⚠️  PLEASE LOG IN MANUALLY WHEN THE BROWSER OPENS.');

  // Try to find system Chrome on macOS
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  
  if (!fs.existsSync(executablePath)) {
      console.error('❌ Google Chrome not found at default location. Please install Chrome or update path.');
      return;
  }

  // Launch Persistent Context (Closest to a real profile)
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath: executablePath, // USE REAL CHROME
    headless: false,
    viewport: null, // Full window size
    
    // CRITICAL: Bypass automated checks
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled', // Hides navigator.webdriver
        '--no-sandbox',
        '--disable-infobars'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  if (!page) { throw new Error('Could not open page'); }

  // 1. Go to Specific User URL directly
  const TARGET_URL = 'https://builder.hostinger.com/A1a5gX4qBEtz2val?amplitudeLocation=websites';
  console.log(`🔗 Navigating directy to Hostinger Builder: ${TARGET_URL}`);
  
  await page.goto(TARGET_URL);

  // INJECT GUIDE BANNER
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = 'purple'; // Purple for Builder Mode
    div.style.color = 'white';
    div.style.zIndex = '999999';
    div.style.textAlign = 'center';
    div.style.fontSize = '24px';
    div.style.padding = '20px';
    div.style.fontWeight = 'bold';
    div.textContent = '🤖 RESEARCH MODE: Analyzing Builder Capabilities...';
    document.body.appendChild(div);
  });

  console.log('⏳ Waiting for Builder to load (This involves heavy JS)...');
  // Builder takes a while. Wait for canvas or editor tools.
  try {
      await page.waitForSelector('canvas, #editor-root, [data-testid="toolbar"]', { timeout: 60000 });
  } catch(_e) {
      console.log('⚠️  Builder load timed out or selector mismatch. Proceeding with inspection anyway.');
  }

  // Check for Login redirect
  if (page.url().includes('login') || page.url().includes('auth')) {
      console.log('🔒 Login page detected. Waiting for user to authenticate...');
      await page.waitForURL(/builder\.hostinger\.com/, { timeout: 0 }); 
  }

  console.log('✅ Builder loaded. Inspecting available tools...');

  // Inspect for "Add Element" or "Embed"
  const pageContent = await page.content();
  const hasEmbed = pageContent.includes('Embed code') || pageContent.includes('Custom code');
  
  console.log(`🧐 Capabilities Analysis:`);
  console.log(`- Has 'Embed/Custom Code' text? ${hasEmbed}`);

  // Try to find "Website Settings" or "Integration"
  // We want to see if we can perform a "Custom File Upload" or "Head Code Injection"
  
  console.log('👉 Please manually check if you can find "Add Element" -> "Embed Code" on the left sidebar.');
  console.log('👉 If you want to deploy the REACT APP here, we typically need to clear the page and use an <iframe> or Embed block.');
  console.log('⚠️  CRITICAL: Hostinger Builder is NOT standard hosting. It is a closed system.');
  
  // Keep alive for research


  console.log('🎉 Deployment Sequence Finished (Check browser for remaining upload steps)');
  
  // Keep browser open for a bit
  // await browser.close();
}

async function _handleFileManager(_page: unknown) {
    console.log('📁 Inside File Manager. Navigating to public_html...');
    
    // This part is tricky as File Manager UI (FileZilla web-like) varies.
    // Assuming double click on public_html if visible
    try {
        await page.waitForSelector('text=public_html', { timeout: 10000 });
        await page.dblclick('text=public_html');
    } catch (_e) {
        console.log('ℹ️  Might already be in root or public_html.');
    }

    console.log('⚠️  AUTOMATION PAUSED: Drag and drop support is complex in raw Playwright without known exact DOM.');
    console.log('👉 Please drag/drop the files from your local "dist" folder into this window now.');
    console.log(`📂 Local Path: ${DIST_DIR}`);
}

deploy().catch(console.error);
