 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const HOSTINGER_LOGIN_URL = 'https://hpanel.hostinger.com/login';

// CREDENTIALS PROVIDED BY USER
const EMAIL = 'emrecnyn@gmail.com';
const PASS = 'S3nsu4l.';

async function autoLoginAndDeploy() {
  console.log('🔐 Starting Authenticated Session...');

  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false,
    viewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // 1. LOGIN
  console.log('➡️  Going to Login Page...');
  await page.goto(HOSTINGER_LOGIN_URL);
  await page.waitForTimeout(3000);

  // Check if already logged in
  if (page.url().includes('dashboard') || page.url().includes('websites')) {
      console.log('✅ Already Logged In.');
  } else {
      console.log('⌨️  Filling Credentials...');
      
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      if (await emailInput.count() > 0) {
          await emailInput.fill(EMAIL);
          
          const passInput = page.locator('input[type="password"], input[name="password"]');
          await passInput.fill(PASS);
          
          console.log('🖱️ Clicking Login...');
          const submitBtn = page.locator('button[type="submit"]').first();
          await submitBtn.click();
          
          console.log('⏳ Waiting for Dashboard...');
          await page.waitForURL(/hpanel\.hostinger\.com\/(dashboard|websites)/, { timeout: 60000 });
          console.log('✅ Login Successful!');
      } else {
          console.log('⚠️ Could not find login inputs. Initial state ambiguous.');
      }
  }

  // 2. NAVIGATE TO SSH
  console.log('🧭 Finding SSH Details...');
  // Force navigate if possible to ecypro.com specific management
  // Find ecypro ID? Hard. 
  // Let's go to list -> manage
  
  if (!page.url().includes('websites')) await page.goto('https://hpanel.hostinger.com/websites');
  await page.waitForSelector('text=ecypro.com', { timeout: 30000 });
  
  // Click Manage
  const manageBtn = page.locator('button:has-text("Manage"), button:has-text("Yönet")').first();
  await manageBtn.click();
  await page.waitForLoadState('networkidle');

  // Go to Advanced -> SSH Access
  // Try searching sidebar again
  await page.waitForTimeout(2000);
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Ara"]').first();
  if (await searchInput.isVisible()) {
      await searchInput.fill('SSH');
      await page.waitForTimeout(1000);
      await page.locator('a[href*="advanced/ssh"]').first().click();
  } else {
      // Direct URL fallback?
      // No ID known. 
      // Manual scroll
      console.log('⚠️ Search bar not found. Please click "SSH Access" manually!');
      await page.waitForTimeout(10000); // Give user time
  }
  
  // 3. SCRAPE
  // Wait for the SSH page content
  await page.waitForSelector('text=IP Address', { timeout: 30000 }).catch(() => null);
  
  console.log('👀 Reading Page...');
  const text = await page.innerText('body');
  
  const ipRegex = /IP(?: Address| Adresi)?:?\s*([\d.]+)/i;
  const userRegex = /(?:Username|Kullanıcı Adı):?\s*([a-zA-Z0-9_\-.]+)/i;
  
  const ipMatch = text.match(ipRegex);
  const userMatch = text.match(userRegex);

  if (ipMatch && userMatch) {
      const HOST = ipMatch[1];
      const USER = userMatch[1];
      const PORT = '65002'; // Default Hostinger SSH Port
      
      console.log(`✅ FOUND: ${USER}@${HOST}:${PORT}`);
      
      // 4. EXECUTE UPLOAD VIA SSHPASS (if installed) or SCP
      // We will create the .env.deploy file
      const envContent = `HOSTINGER_HOST=${HOST}\nHOSTINGER_USER=${USER}\nHOSTINGER_PORT=${PORT}`;
      fs.writeFileSync(path.resolve(process.cwd(), '.env.deploy'), envContent);
      
      console.log('🚀 DEPLOYING MICROWEBER VIA SCP...');
      // We need 'sshpass' to automate password. 
      // On macOS, it might not be installed. 
      // So we will try to use 'expect' script or just console log the command for user.
      
      const sshPassCmd = `sshpass -p "${PASS}" scp -P ${PORT} -o StrictHostKeyChecking=no microweber.zip ${USER}@${HOST}:/home/${USER}/domains/ecypro.com/public_html/microweber.zip`;
      
      console.log('---------------------------------------------------');
      console.log('👇 COPY AND PASTE THIS COMMAND TO UPLOAD INSTANTLY:');
      console.log('---------------------------------------------------');
      console.log(sshPassCmd);
      console.log('---------------------------------------------------');
      
      // Try executing if sshpass exists
      try {
          execSync(sshPassCmd, { stdio: 'inherit' });
          console.log('✅ UPLOAD SUCCESSFUL!');
      } catch (_e) {
          console.log('⚠️ Automated upload failed (sshpass missing?). Please run the command above manually.');
          console.log('💡 TIP: Install sshpass via "brew install sshpass" for full automation.');
      }
      
  } else {
      console.error('❌ Failed to scrape SSH details.');
  }

}

autoLoginAndDeploy().catch(console.error);
