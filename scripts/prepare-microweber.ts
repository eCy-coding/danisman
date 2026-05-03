 
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
// import https from 'https';

// Using GitHub source for reliability
const MW_URL = 'https://github.com/microweber/microweber/archive/refs/tags/v2.0.19.zip'; 
const TARGET_FILE = path.resolve(process.cwd(), 'microweber.zip');

async function downloadMicroweber() {
    console.log('⬇️  Downloading Microweber CMS...');
    console.log(`🔗 URL: ${MW_URL}`);

    const _file = fs.createWriteStream(TARGET_FILE);
    
    // We use curl for reliability if available, else node https
    try {
        execSync(`curl -L -o "${TARGET_FILE}" "${MW_URL}"`, { stdio: 'inherit' });
        console.log('✅ Download Complete: microweber.zip');
    } catch (_e) {
        console.error('❌ Download failed. Please download manually from microweber.com');
    }

    if (fs.existsSync(TARGET_FILE)) {
        const stats = fs.statSync(TARGET_FILE);
        console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }
}

downloadMicroweber();
