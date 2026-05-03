 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const THEME_ZIP_PATH = path.resolve(process.cwd(), 'ecypro-theme.zip');
// const WP_ADMIN_URL = 'https://ecypro.com/wp-admin/themes.php?browse=upload'; // Direct link to upload
const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');

async function deployWP() {
  console.log('🚀 Launching Chrome for WordPress Deployment...');
  
  if (!fs.existsSync(THEME_ZIP_PATH)) {
      console.error(`❌ Theme file not found at: ${THEME_ZIP_PATH}`);
      console.error('👉 Please run "npm run build:wp" first.');
      return;
  }

  // Find Chrome
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(executablePath)) {
      console.error('❌ Google Chrome not found.');
      return;
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-infobars']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  if (!page) throw new Error('No page opened');

  // STRATEGY CHANGE: Go via Hostinger Panel for SSO (Auto-Login)
  const HOSTINGER_SITES_URL = 'https://hpanel.hostinger.com/websites';
  console.log(`🔗 Navigating to Hostinger Panel (for SSO): ${HOSTINGER_SITES_URL}`);
  
  await page.goto(HOSTINGER_SITES_URL);

  // INJECT GUIDE BANNER
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = '#673de6'; // Hostinger Purple
    div.style.color = 'white';
    div.style.zIndex = '9999999';
    div.style.textAlign = 'center';
    div.style.fontSize = '20px';
    div.style.padding = '15px';
    div.style.fontWeight = 'bold';
    div.textContent = '🤖 BOT: Lütfen Hostinger Hesabınıza Giriş Yapın (WordPress Otomatik Açılacak)';
    document.body.appendChild(div);
  });

  // 1. Wait for Hostinger Login
  console.log('⏳ Waiting for Hostinger Login...');
  await page.waitForURL(/hpanel\.hostinger\.com\/(dashboard|websites)/, { timeout: 0 });
  console.log('✅ Hostinger Logged In!');

  // 2. Find the "Admin Panel" button for ecypro.com
  console.log('🔍 Searching for ecypro.com Admin Panel button...');
  
  // Wait for the list to load
  try {
    await page.waitForSelector('div[class*="card"], div[class*="row"]', { timeout: 15000 });
  } catch(_e) { 
      console.log('⚠️ List might not have loaded standard cards.');
  }

  // Try multiple selectors for the "Hostinger Admin Panel" button
  const adminSelectors = [
      'button:has-text("Admin Panel")',
      'a:has-text("Admin Panel")',
      'a[href*="sso"][href*="wordpress"]', // Generic SSO link
      'button:has-text("Yönet")', // TR "Manage"
      'a:has-text("Yönet")', 
      'button:has-text("Manage")',
      'div[role="button"]:has-text("Admin Panel")'
  ];

  let adminBtn = null;
  for (const sel of adminSelectors) {
      if (await page.isVisible(sel)) {
          console.log(`✅ Found Admin Button with selector: ${sel}`);
          adminBtn = page.locator(sel).first();
          break;
      }
  }

  let targetPage = page; 

  if (adminBtn) {
      console.log('🖱️ Clicking Admin/Manage Button...');
      // It might open a new tab OR go to dashboard
      // We listen for new page just in case
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
        adminBtn.click()
      ]);
      
      if (newPage) {
          console.log('✅ New tab opened!');
          targetPage = newPage;
      } else {
          console.log('ℹ️  Navigated in same tab (or popup). Checking URL...');
          await page.waitForLoadState();
          // If we are in Dashboard but not yet WP Admin, look for "WordPress" or "Edit Website"
          if (page.url().includes('dashboard')) {
             console.log('➡️  Inside Dashboard. Looking for "Edit Website" / "WordPress"...');
             const editSelectors = ['text=Edit Website', 'text=Web Sitesini Düzenle', 'text=WordPress', 'button:has-text("Admin Panel")'];
             for (const subSel of editSelectors) {
                 if (await page.isVisible(subSel)) {
                     console.log(`✅ Found Sub-Button: ${subSel}`);
                     const [subPage] = await Promise.all([
                        context.waitForEvent('page', { timeout: 0 }), // WP usually opens in new tab from dashboard
                        page.click(subSel)
                     ]);
                     targetPage = subPage;
                     break;
                 }
             }
          }
      }
  } else {
       console.log('❌ Auto-find FAILED.');
       console.log('📜 DEBUG: Page Text Dump (first 500 chars):');
       try {
           const text = await page.innerText('body');
           console.log(text.substring(0, 500));
       } catch(_e) { /* ignore */ }
       
       console.log('👉 ACTION REQUIRED: Please Click "Admin Panel" or "Wordpress" manually.');
       console.log('⏳ Waiting for you to open the WordPress Admin tab...');
       targetPage = await context.waitForEvent('page', { timeout: 0 });
  }

  console.log('✅ WordPress Admin Tab Detected!');
  await targetPage.waitForLoadState();

  // 3. Now we are in WordPress (SSO). Go to Themes.
  console.log('🔗 Navigating to Theme Upload...');
  await targetPage.goto('https://ecypro.com/wp-admin/themes.php?browse=upload');

  // Continues with upload logic... use targetPage instead of page
  const pageToUse = targetPage;

  console.log('📂 Preparing to upload theme...');

  // Wait for the file input. 
  try {
      if (await pageToUse.isVisible('.upload-view-toggle')) {
          await pageToUse.click('.upload-view-toggle');
      }
  } catch(_e) { /* ignore */ }

  const fileInput = pageToUse.locator('input[type="file"][name="themezip"]');
  await fileInput.waitFor({ state: 'attached', timeout: 10000 }).catch(() => console.log('⚠️ Input not found immediately'));

  if (await fileInput.count() > 0) {
      console.log('🚀 Uploading ecypro-theme.zip ...');
      await fileInput.setInputFiles(THEME_ZIP_PATH);
      
      console.log('🖱️ Clicking "Install Now"...');
      const installBtn = pageToUse.locator('input[type="submit"].button.button-primary', { hasText: 'Install Now' });
      await installBtn.click();
      
      console.log('⏳ Installing... (This may take a minute)');
      
      // Wait for "Theme installed successfully" or "Activate" link
      await pageToUse.waitForSelector('text=Theme installed successfully', { timeout: 60000 });
      console.log('✅ Theme Installed!');

      console.log('🔌 Activating...');
      const activateLink = pageToUse.locator('a.button-primary', { hasText: 'Activate' }).first(); 
      
      if (await activateLink.count() === 0) {
          // Try Turkish
          const trLink = pageToUse.locator('text=Etkinleştir');
          if (await trLink.count() > 0) {
             await trLink.click();
          } else {
             console.log('⚠️ Could not find Activate button automatically. Please click it manually.');
          }
      } else {
          await activateLink.click();
      }
      
      console.log('🎉 MISSION ACCOMPLISHED: Theme Active!');
      
  } else {
      console.error('❌ Could not find the File Upload input. Please upload manually.');
  }

}

deployWP().catch(console.error);
