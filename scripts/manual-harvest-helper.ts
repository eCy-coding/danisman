 
import { chromium } from '@playwright/test';
// import inquirer from 'inquirer';
// import fs from 'fs';
import path from 'path';

export async function manualHelper() {
    console.log('👷‍♂️  Manual Override Protocol Initiated.');
    console.log('🤖  I will open the Hostinger page. You just tell me what you see.');

    const context = await chromium.launchPersistentContext(path.resolve(process.cwd(), 'browser-profile'), {
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: false,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    await page.goto('https://hpanel.hostinger.com/websites');
    
    // Inject Banner
     await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.backgroundColor = '#8e44ad';
        div.style.color = 'white';
        div.style.zIndex = '9999999';
        div.style.textAlign = 'center';
        div.style.fontSize = '24px';
        div.style.padding = '20px';
        div.style.fontWeight = 'bold';
        div.innerText = '👉 LÜTFEN "SSH ACCESS" EKRANINI AÇIN VE IP ADRESİNİ CHAT KISMINA YAZIN.';
        document.body.appendChild(div);
    });

    console.log('⏳ Waiting for user input via Chat...');
    // Keep alive for 5 minutes or until killed
    await new Promise(r => setTimeout(r, 300000));
}

// Check if main module via import.meta
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    manualHelper();
}
