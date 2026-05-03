 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// CONFIG
const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const HOSTINGER_URL = 'https://hpanel.hostinger.com/websites';

async function fetchSSHConfig() {
  console.log('🕵️ Started Credential Harvester Agent...');

  // 1. Launch Browser (Headed to use existing session)
  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false, // Must be visible to debug and ensure login
    viewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
  
  console.log('🔗 Navigating to Hostinger Websites...');
  await page.goto(HOSTINGER_URL);

  console.log('⏳ Waiting for Login & List...');
  await page.waitForURL(/hpanel\.hostinger\.com/, { timeout: 0 });
  
  // 2. Find "Manage" button for ecypro.com
  // We need to be reliable here.
  console.log('🔍 Scanning for "ecypro.com" Dashboard...');
  
  // Wait for list
  try {
      await page.waitForSelector('text=ecypro.com', { timeout: 15000 });
  } catch(_e) {
      console.log('⚠️ Could not find "ecypro.com" text immediately. Please navigate to Dashboard manually if needed.');
  }

  // Click Manage. Strategy: Find card with ecypro.com, then find Manage button within it?
  // Or just find any "Manage" button if it's the only site.
  // We'll try to find the specific one.
  
  const manageBtn = page.locator('button:has-text("Manage"), a:has-text("Manage"), button:has-text("Yönet"), a:has-text("Yönet")').first();
  
  if (await manageBtn.count() > 0) {
      console.log('🖱️ Clicking Manage...');
      await manageBtn.click();
      await page.waitForLoadState();
  } else {
      console.log('⚠️ "Manage" button not found. Assuming we might be already in dashboard?');
  }

  // 3. Navigate to SSH Access page
  // URL pattern: /hosting/ecypro.com/advanced/ssh
  // Or click "Advanced" -> "SSH Access" sidebar
  
  console.log('🧭 Locating SSH/FTP Details...');
  
  // Try direct URL construction if we can grab the domain ID, but sidebar is safer.
  // Search sidebar?
  
  // Hostinger Sidebar Search "SSH"
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Ara"]').first();
  if (await searchInput.isVisible()) {
      console.log('⌨️  Using Sidebar Search for "SSH"...');
      await searchInput.fill('SSH');
      await page.waitForTimeout(1000);
      const sshLink = page.locator('a[href*="ssh"]').first();
      if (await sshLink.isVisible()) {
          await sshLink.click();
      } else {
          console.log('⚠️ Search result for SSH not clickable.');
      }
  } else {
      // Manual sidebar navigation
      // "Advanced" is usually near bottom.
      // Let's try direct URL hack check.
      const url = page.url();
      if (url.includes('dashboard')) {
           // We are in dashboard. 
           // Try to find "Accounts" -> "SSH Access" or "Advanced"
           console.log('🔍 Looking for SSH Access link...');
           const sshLink = page.locator('text=SSH Access').or(page.locator('text=SSH Erişimi')).first();
           if (await sshLink.count() > 0) {
               await sshLink.click();
           } else {
               // Try "Files" -> "FTP Accounts" as backup?
               console.log('⚠️ SSH Link not found. Trying FTP Accounts...');
               const ftpLink = page.locator('text=FTP Accounts').or(page.locator('text=FTP Hesapları')).first();
               if (await ftpLink.count() > 0) await ftpLink.click();
           }
      }
  }

  await page.waitForLoadState();
  console.log('👀 analyzing Page Content for Credentials...');
  await page.waitForTimeout(2000);

  // SCRAPE DETAILS
  // Selectors depend heavily on the specific page (SSH vs FTP)
  // We dump body text and extract via Regex for robustness
  const bodyText = await page.innerText('body');
  
  // Regex Patterns
  const ipRegex = /IP(?: Address| Adresi)?:?\s*([\d.]+)/i;
  const userRegex = /(?:Username|Kullanıcı Adı):?\s*([a-zA-Z0-9_\-.]+)/i;
  const portRegex = /(?:Port):?\s*(\d+)/i;

  const ipMatch = bodyText.match(ipRegex);
  const userMatch = bodyText.match(userRegex);
  const portMatch = bodyText.match(portRegex);

  console.log('\n--- 🔓 AUTOMATIC DISCOVERY REPORT ---');
  if (ipMatch) console.log(`🌍 HOST (IP): ${ipMatch[1]}`);
  else console.log('❌ Host IP not found');

  if (userMatch) console.log(`Dn USERNAME: ${userMatch[1]}`);
  else console.log('❌ Username not found');

  if (portMatch) console.log(`🔌 PORT: ${portMatch[1]}`);
  else console.log('❌ Port not found (Default: 22 for SSH, 21 for FTP)');
  
  console.log('------------------------------------');
  console.log('🔑 PASSWORD: [HIDDEN BY HOSTINGER]');
  console.log('------------------------------------');

  // Save to .env.deploy if found
  if (ipMatch && userMatch) {
      const envContent = `HOSTINGER_HOST=${ipMatch[1]}\nHOSTINGER_USER=${userMatch[1]}\nHOSTINGER_PORT=${portMatch ? portMatch[1] : '65002'}\nHOSTINGER_PATH=/home/${userMatch[1]}/domains/ecypro.com/public_html`;
      fs.writeFileSync(path.resolve(process.cwd(), '.env.deploy'), envContent);
      console.log('✅ Configuration Saved to .env.deploy!');
      console.log('👉 ACTION: Please set the SSH Password in Hostinger if you don\'t know it, then verify inside the terminal.');
  } else {
      console.log('⚠️  Could not auto-scrape. Please navigate manually to "SSH Access" page and copy details.');
  }

}

fetchSSHConfig().catch(console.error);
