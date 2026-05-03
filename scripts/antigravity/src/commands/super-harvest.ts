 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const CRED_EMAIL = 'emrecnyn@gmail.com';
const CRED_PASS = 'S3nsu4l.';

export async function superHarvest() {
    console.log('🕵️‍♂️  Super Harvest: Initializing Zero-Touch Agent...');

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: false,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    try {
        // 1. Login Phase
        await page.goto('https://hpanel.hostinger.com/login');
        try {
            await page.waitForSelector('input[name="email"]', { timeout: 5000 });
            console.log('🔑 Logging in...');
            await page.fill('input[name="email"]', CRED_EMAIL);
            await page.fill('input[name="password"]', CRED_PASS);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 15000 });
        } catch {
            console.log('✅ Already logged in (or login skipped)');
        }

        // 2. ID Discovery Phase
        console.log('🔍 Discovering Service ID...');
        await page.goto('https://hpanel.hostinger.com/websites', { timeout: 60000 });
        // Networkidle is too strict for modern SPAs with polling
        await page.waitForLoadState('domcontentloaded'); 
        await page.waitForTimeout(5000); // Gentle manual wait
        
        // Find any link containing 'hosting/' which usually leads to the panel
        // Selector for "Manage" button usually has href="/hosting/123456"
        const manageLink = page.locator('a[href*="/hosting/"]').first();
        const href = await manageLink.getAttribute('href');
        
        if (!href) throw new Error('Could not find Hosting ID link.');
        
        console.log(`🎯 Found Hosting Link: ${href}`);
        // href is usually like /hosting/12345678 or /hosting/ecypro.com
        // We can append /advanced/ssh to it
        
        const sshUrl = `https://hpanel.hostinger.com${href}/advanced/ssh-access`;
        console.log(`🔗 Jumping to: ${sshUrl}`);
        
        await page.goto(sshUrl);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000); // Wait for Vue/React to hydrate

        // 3. Extraction Phase
        console.log('👀 Extracting Data...');
        const text = await page.innerText('body');
        
        const ipRegex = /IP(?: Address| Adresi)?:?\s*([\d.]+)/i;
        const userRegex = /(?:Username|Kullanıcı Adı):?\s*([a-zA-Z0-9_\-.]+)/i;
        
        const ipMatch = text.match(ipRegex);
        const userMatch = text.match(userRegex);

        if (!ipMatch || !userMatch) {
            // Backup: Try clicking "SSH Permissions" or tabs?
            throw new Error('Text extraction failed. Page content might be different.');
        }

        const config = {
            host: ipMatch[1],
            user: userMatch[1],
            port: '65002',
            pass: CRED_PASS
        };

        console.log(`✅ CAPTURED: ${config.user}@${config.host}`);

        // 4. Save
        const envPath = path.resolve(process.cwd(), '.env.deploy');
        const content = `HOSTINGER_HOST=${config.host}\nHOSTINGER_USER=${config.user}\nHOSTINGER_PORT=${config.port}\nHOSTINGER_PASS=${config.pass}`;
        fs.writeFileSync(envPath, content);
        
        console.log('💾 Credentials Secured.');
        await context.close();
        process.exit(0);

    } catch (e) {
        console.error('❌ Super Harvest Failed:', e);
        process.exit(1);
    }
}

// Self-run if called directly (ESM compatible)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    superHarvest();
}
