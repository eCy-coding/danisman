 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const DUMP_DIR = path.resolve(process.cwd(), 'dumps');
if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);

async function diagnose() {
    console.log('🩺 Starting Hostinger Diagnostics...');
    
    // Launch Options
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: false,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    // 1. Websites List
    console.log('📸 Step 1: Websites List');
    await page.goto('https://hpanel.hostinger.com/websites');
    await page.waitForTimeout(5000); // Wait for load
    
    fs.writeFileSync(path.join(DUMP_DIR, 'websites.html'), await page.content());
    console.log('✅ Dumped websites.html');

    // 2. Finding the Manage Button
    // Inspect via text because text is usually stable
    const manageBtns = page.locator('text=Manage').or(page.locator('text=Yönet'));
    const count = await manageBtns.count();
    console.log(`🔎 Found ${count} 'Manage' buttons`);
    
    if (count > 0) {
        await manageBtns.first().click();
        console.log('🖱️ Clicked Manage');
        await page.waitForTimeout(5000);
        
        // 3. Overview Page
        console.log('📸 Step 2: Overview Page');
        fs.writeFileSync(path.join(DUMP_DIR, 'overview.html'), await page.content());
        console.log('✅ Dumped overview.html');
        
        // 4. Look for SSH
        const sshLinks = page.locator('a[href*="ssh"]');
        console.log(`🔎 Found ${await sshLinks.count()} SSH links`);
        
    } else {
        console.log('❌ Could not find Manage button. Check websites.html');
    }

    await context.close();
}

// Self-run ESM
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    diagnose();
}
