 
import { chromium, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// ARTIFACTS
const WP_THEME_ZIP = path.resolve(process.cwd(), 'ecypro-theme.zip');
// const DIST_DIR = path.resolve(process.cwd(), 'dist');
const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');

// URLS
const HOSTINGER_URL = 'https://hpanel.hostinger.com/websites';

async function smartDeploy() {
  console.log('🧠 Starting Smart Deployment Agent...');

  // 1. Setup Browser
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(executablePath)) {
      console.error('❌ Chrome not found.');
      return;
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  if (!page) throw new Error('No page opened');

  console.log('🔗 Navigating to Hostinger Panel...');
  await page.goto(HOSTINGER_URL);

  // 2. Inject "Research Mode" Banner
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = '#00b090'; // Research Teal
    div.style.color = 'white';
    div.style.zIndex = '9999999';
    div.style.textAlign = 'center';
    div.style.fontSize = '20px';
    div.style.padding = '15px';
    div.style.fontWeight = 'bold';
    div.textContent = '🕵️ AGENT ACTIVE: Giriş Yapın ve Bekleyin. Hesabınızı Analiz Ediyorum...';
    document.body.appendChild(div);
  });

  // 3. Wait for Login
  console.log('⏳ Waiting for user login...');
  await page.waitForURL(/hpanel\.hostinger\.com\/(dashboard|websites|home)/, { timeout: 0 });
  console.log('✅ Login detected! Starting Analysis...');

  // 4. ANALYZE CAPABILITIES
  console.log('🧭 Verifying location...');
  
  const currentUrl = page.url();
  // If we are on addons, home, or generic dashboard, FORCE navigation to specific websites list
  if (!currentUrl.includes('/websites') || currentUrl.includes('addons')) {
      console.log(`⚠️ Detected off-target URL: ${currentUrl}`);
      console.log(`↪️  Redirecting to: ${HOSTINGER_URL}`);
      await page.goto(HOSTINGER_URL);
      await page.waitForLoadState('networkidle');
  } else {
      console.log('✅ We are on the Websites list.');
  }

  // Reload just in case to clear any modals
  if (await page.isVisible('.modal-backdrop')) {
      await page.reload();
  }

  // Look for "ecypro.com"
  console.log('🔍 Scanning for "ecypro.com"...');
  try {
      await page.waitForSelector('text=ecypro.com', { timeout: 30000 });
      console.log('✅ Site "ecypro.com" found in list!');
  } catch (_e) {
      console.warn('⚠️ "ecypro.com" not immediately found in text. Might be "Premium Hosting" card.');
  }

  // Check available buttons/links
  const capabilities = {
      hasAdminPanel: false,
      hasFileManager: false,
      hasWordPress: false,
      hasManage: false
  };

  // Wait for list to settle
  await page.waitForTimeout(3000); 

  // Selectors to check
  if (await page.isVisible('button:has-text("Admin Panel")') || await page.isVisible('a:has-text("Admin Panel")')) capabilities.hasAdminPanel = true;
  if (await page.isVisible('text=File Manager') || await page.isVisible('text=Dosya Yöneticisi')) capabilities.hasFileManager = true;
  if (await page.isVisible('text=WordPress')) capabilities.hasWordPress = true;
  if (await page.isVisible('button:has-text("Manage")') || await page.isVisible('button:has-text("Yönet")')) capabilities.hasManage = true;

  console.log('📊 Analysis Results:', capabilities);

  // DECISION MATRIX
  if (capabilities.hasAdminPanel || capabilities.hasWordPress) {
      console.log('💡 STRATEGY: WordPress Detected. Attempting Theme Deployment.');
      await deployToWordPress(page, context);
  } else if (capabilities.hasManage) {
      console.log('💡 STRATEGY: Found "Manage". Clicking to investigate further...');
      // Click Manage and re-evaluate
      const manageBtn = page.locator('button:has-text("Manage"), button:has-text("Yönet")').first();
      await manageBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Re-scan inside dashboard
      if (await page.isVisible('text=Admin Panel')) {
          console.log('✅ Found Admin Panel inside Dashboard.');
          await deployToWordPress(page, context);
      } else if (await page.isVisible('text=File Manager') || await page.isVisible('text=Dosya Yöneticisi')) {
          console.log('✅ Found File Manager inside Dashboard.');
          await deployViaFileManager(page, context);
      } else {
          console.error('❌ Could not find reliable deployment path inside Dashboard.');
      }

  } else {
      console.error('❓ Unknown State. Dumping page text for manual review.');
      const text = await page.innerText('body');
      console.log('--- DUMP ---');
      console.log(text.substring(0, 1000));
      console.log('--- END DUMP ---');
  }
}

async function deployToWordPress(page: Page, context: BrowserContext) {
    console.log('🚀 Executing WordPress Strategy...');
    
    const adminBtn = page.locator('button, a', { hasText: 'Admin Panel' }).or(page.locator('button, a', { hasText: 'WordPress' })).first();
    
    // Fallback if we are just guessing selector
    if (await adminBtn.count() === 0) {
        console.log('⚠️ Button selector ambiguity. Asking user to click "Admin Panel"');
        const wpPage = await context.waitForEvent('page', { timeout: 0 }); // Wait for user
        await handleWPPage(wpPage);
        return;
    }

    // Try auto-click
    console.log('🖱️ Clicking Admin Panel...');
    const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        adminBtn.click()
    ]);

    if (newPage) {
        await handleWPPage(newPage);
    } else {
        // Maybe same tab?
        if (page.url().includes('wp-admin')) {
            await handleWPPage(page);
        } else {
            console.log('⚠️ New tab not detected. Please manually open WordPress Admin.');
             const wpPage = await context.waitForEvent('page', { timeout: 0 });
             await handleWPPage(wpPage);
        }
    }
}

async function handleWPPage(page: Page) {
    console.log('✅ Connected to WordPress Admin');
    await page.waitForLoadState();
    
    // Go to upload
    await page.goto('https://ecypro.com/wp-admin/themes.php?browse=upload');
    
    // Upload logic
      try {
      if (await page.isVisible('.upload-view-toggle')) {
          await page.click('.upload-view-toggle');
      }
  } catch(_e) { /* ignore */ }

  const fileInput = page.locator('input[type="file"][name="themezip"]');
  await fileInput.waitFor({ state: 'attached', timeout: 10000 }).catch(() => console.log('⚠️ Input not found immediately'));

  if (await fileInput.count() > 0) {
      console.log('🚀 Uploading ecypro-theme.zip ...');
      await fileInput.setInputFiles(WP_THEME_ZIP);
      
      console.log('🖱️ Clicking "Install Now"...');
      const installBtn = page.locator('input[type="submit"].button.button-primary', { hasText: 'Install Now' });
      await installBtn.click();
      
      console.log('⏳ Installing...');
      await page.waitForSelector('text=Theme installed successfully', { timeout: 60000 });
      console.log('✅ Installed. Activating...');
      
      const activateLink = page.locator('a.button-primary', { hasText: 'Activate' }).first(); 
      if (await activateLink.count() === 0) {
           const trLink = page.locator('text=Etkinleştir');
           if (await trLink.count() > 0) await trLink.click();
      } else {
          await activateLink.click();
      }
      console.log('🎉 SUCCESS: Theme Activated via Automation!');
  }
}

async function deployViaFileManager(page: Page, context: BrowserContext) {
    console.log('💡 STRATEGY: File Manager (Direct Upload) - Manual Assist Required for DnD');
    
    const fmBtn = page.locator('text=File Manager').or(page.locator('text=Dosya Yöneticisi')).first();
    await fmBtn.click();
    
    console.log('⏳ Waiting for File Manager to open...');
    // Usually new tab
    const newPage = await context.waitForEvent('page'); // Must open new tab
    await newPage.waitForLoadState();
    
    console.log('📂 Please drag and drop the "dist" folder contents into public_html manually.');
    // We can't easily script generic File Manager drag-n-drop without knowing the specific FM software (Hostinger uses a custom one).
}

smartDeploy().catch(console.error);
