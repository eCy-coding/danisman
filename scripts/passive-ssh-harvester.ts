 
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
const PASS = 'S3nsu4l.'; // User provided

async function passiveHarvester() {
  console.log('🤝 Interactive Mode: We work together.');

  const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    executablePath,
    headless: false,
    viewport: null,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log('🔗 Opening Hostinger...');
  await page.goto('https://hpanel.hostinger.com/websites');

  // Inject Instructions
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.backgroundColor = '#d35400';
    div.style.color = 'white';
    div.style.zIndex = '9999999';
    div.style.textAlign = 'center';
    div.style.fontSize = '24px';
    div.style.padding = '20px';
    div.style.fontWeight = 'bold';
    div.textContent = '👉 LÜTFEN "SSH ACCESS" (SSH Erişimi) SAYFASINI AÇIN. BEN BEKLİYORUM.';
    document.body.appendChild(div);
  });

  console.log('⏳ Waiting for you to navigate to SSH Access page...');

  let sshDetails = null;

  // POLL LOOP
  while (!sshDetails) {
      const text = await page.innerText('body').catch(() => '');
      
      const ipRegex = /IP(?: Address| Adresi)?:?\s*([\d.]+)/i;
      const userRegex = /(?:Username|Kullanıcı Adı):?\s*([a-zA-Z0-9_\-.]+)/i;
      
      const ipMatch = text.match(ipRegex);
      const userMatch = text.match(userRegex);

      // Check if we are actually on the right page context to avoid false positives
      if (ipMatch && userMatch && (text.includes('SSH') || text.includes('FTP'))) {
          // Additional check: exclude common IPs if needed (localhost etc)
          if (ipMatch[1] !== '127.0.0.1') {
              sshDetails = { host: ipMatch[1], user: userMatch[1] };
              break;
          }
      }
      
      // Update Banner if needed?
      if (!text.includes('SSH Access') && !text.includes('SSH Erişimi')) {
           // Maybe remind user?
      }

      await new Promise(r => setTimeout(r, 1000));
  }

  console.log('✅ SSH DETAILS DETECTED!');
  console.log(`🌍 HOST: ${sshDetails.host}`);
  console.log(`👤 USER: ${sshDetails.user}`);

  // Create .env.deploy
  const PORT = '65002';
  const envContent = `HOSTINGER_HOST=${sshDetails.host}\nHOSTINGER_USER=${sshDetails.user}\nHOSTINGER_PORT=${PORT}`;
  fs.writeFileSync(path.resolve(process.cwd(), '.env.deploy'), envContent);

  // START UPLOAD
  console.log('🚀 INITIALIZING UPLOAD...');
  
  await page.evaluate(() => {
       const banner = document.querySelector('div[style*="fixed"]');
       if (banner) {
           banner.textContent = '🚀 BİLGİLER ALINDI! YÜKLEME BAŞLIYOR... TARAYICIYI KAPATMAYIN.';
           banner.style.backgroundColor = '#27ae60';
       }
  });

   // CHECK IF ZIP EXISTS
   const ZIP_PATH = 'microweber.zip';
   if (!fs.existsSync(path.resolve(process.cwd(), ZIP_PATH))) {
       console.error('❌ microweber.zip missing!');
       return;
   }

   const user = sshDetails.user;
   const host = sshDetails.host;
   const remotePath = `/home/${user}/domains/ecypro.com/public_html/microweber.zip`;

   // Upload Command
   // Use CSSH/SSHPass
   const cmd = `sshpass -p "${PASS}" scp -P ${PORT} -o StrictHostKeyChecking=no ${ZIP_PATH} ${user}@${host}:${remotePath}`;

   console.log('📦 UPLOADING (This may take 1-2 minutes)...');
   try {
       execSync(cmd, { stdio: 'inherit' });
       console.log('✅ UPLOAD COMPLETE!');
       
       // OPTIONAL: UNZIP via SSH
       console.log('🔧 EXTRACTING...');
       const unzipCmd = `sshpass -p "${PASS}" ssh -p ${PORT} -o StrictHostKeyChecking=no ${user}@${host} "cd domains/ecypro.com/public_html && unzip -o microweber.zip && rm microweber.zip"`;
       execSync(unzipCmd, { stdio: 'inherit' });
       console.log('🎉 DEPLOYMENT FINISHED! Go to https://ecypro.com to install.');
       
       await page.evaluate(() => {
            const banner = document.querySelector('div[style*="fixed"]');
            if (banner) {
                banner.textContent = '🎉 TAMAMLANDI! https://ecypro.com ADRESİNE GİDİN.';
                banner.style.backgroundColor = '#2980b9';
            }
       });

   } catch (_e) {
       console.error('❌ Upload/Extract Failed.', e);
       console.log('👉 Manual Command:');
       console.log(cmd);
   }

}

passiveHarvester().catch(console.error);
