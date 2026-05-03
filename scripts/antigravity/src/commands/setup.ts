 

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import ora, { Ora } from 'ora';

export async function setupCommand() {
    console.log(chalk.bold.cyan('\n🛠️  Antigravity Setup: SSH Configuration\n'));

    // 1. Check existing config
    const envPath = path.resolve(process.cwd(), '.env.deploy');
    if (fs.existsSync(envPath)) {
        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: 'Existing configuration found. Overwrite?',
            default: false
        }]);
        if (!overwrite) return;
    }

    const { strategy } = await inquirer.prompt([{
        type: 'list',
        name: 'strategy',
        message: 'How do you want to configure SSH?',
        choices: [
            { name: '🕵️  Auto-Discovery (Interactive Browser)', value: 'auto' },
            { name: '⌨️  Manual Entry', value: 'manual' }
        ]
    }]);

    let config = { host: '', user: '', port: '65002', pass: '' };

    if (strategy === 'manual') {
        const answers = await inquirer.prompt([
            { type: 'input', name: 'host', message: 'Host IP:' },
            { type: 'input', name: 'user', message: 'Username:' },
            { type: 'input', name: 'port', message: 'Port:', default: '65002' },
            { type: 'password', name: 'pass', message: 'Password (Hidden):' }
        ]);
        config = answers;
    } else {
        // Auto Discovery Logic (Ported from passive-ssh-harvester)
        const spinner = ora('Launching Browser Agent...').start();
        try {
            config = await runBrowserHarvester(spinner);
        } catch (e) {
            spinner.fail('Browser Agent Failed');
            console.error(e);
            return;
        }
    }

    // Save
    const content = `HOSTINGER_HOST=${config.host}\nHOSTINGER_USER=${config.user}\nHOSTINGER_PORT=${config.port}\nHOSTINGER_PASS=${config.pass}`;
    fs.writeFileSync(envPath, content);
    console.log(chalk.green(`\n✅ Configuration saved to ${envPath}`));
}

// Browser Agent Logic
async function runBrowserHarvester(spinner: Ora): Promise<Record<string, string>> {
    const USER_DATA_DIR = path.resolve(process.cwd(), 'browser-profile');
    const executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    
    spinner.text = 'Opening Hostinger in Chrome...';
    
    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        executablePath,
        headless: false,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    await page.goto('https://hpanel.hostinger.com/websites');

    spinner.info('👉 Navigate to "SSH Access" page in the browser window.');

    return new Promise((resolve) => {
        const checkInterval = setInterval(async () => {
            try {
                const text = await page.innerText('body').catch(() => '');
                const ipMatch = text.match(/IP(?: Address| Adresi)?:?\s*([\d.]+)/i);
                const userMatch = text.match(/(?:Username|Kullanıcı Adı):?\s*([a-zA-Z0-9_.-]+)/i);

                if (ipMatch && userMatch && (text.includes('SSH') || text.includes('FTP'))) {
                    if (ipMatch[1] !== '127.0.0.1') {
                        clearInterval(checkInterval);
                        spinner.succeed('Credentials Detected!');
                        
                        // Ask for password in terminal since we can't scrape it
                        await context.close();
                        
                        const { pass } = await inquirer.prompt([{
                             type: 'password', 
                             name: 'pass', 
                             message: 'Enter SSH Password (from Hostinger dashboard):' 
                        }]);
                        
                        resolve({
                            host: ipMatch[1],
                            user: userMatch[1],
                            port: '65002',
                            pass
                        });
                    }
                }
            } catch (_e) {
                // Ignore page access errors during navigation
            }
        }, 1000);
    });
}
