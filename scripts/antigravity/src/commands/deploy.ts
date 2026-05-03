 
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { Client } from 'ssh2';
import dotenv from 'dotenv';
import ora from 'ora';

export async function deployCommand() {
    console.log(chalk.bold.blue('\n🚀  Antigravity Deploy: Microweber (SSH Edition)\n'));

    // 1. Load Config
    const envPath = path.resolve(process.cwd(), '.env.deploy');
    if (!fs.existsSync(envPath)) {
        console.log(chalk.red('❌ Missing Configuration! Run "antigravity setup" first.'));
        return;
    }
    
    // Parse .env manually or with dotenv
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    const { HOSTINGER_HOST, HOSTINGER_USER, HOSTINGER_PORT, HOSTINGER_PASS } = envConfig;

    if (!HOSTINGER_HOST) {
        console.log(chalk.red('❌ Invalid Config. Please re-run setup.'));
        return;
    }

    // 2. Check Artifact
    const ZIP_PATH = path.resolve(process.cwd(), 'microweber.zip');
    if (!fs.existsSync(ZIP_PATH)) {
        console.log(chalk.red('❌ microweber.zip not found! Run "prepare-microweber.ts" first (or I can do it).'));
        // Optional: Auto-run prepare?
        return;
    }
    const stats = fs.statSync(ZIP_PATH);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(chalk.gray(`📦 Artifact Check: ${sizeMB} MB`));

    // 3. Confirm
    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Upload to ${HOSTINGER_USER}@${HOSTINGER_HOST}?`,
        default: true
    }]);

    if (!confirm) return;

    // 4. SSH Connection
    const spinner = ora('Connecting to Hostinger via Native SSH...').start();
    const conn = new Client();
    
    // Remote path
    const REMOTE_DIR = `/home/${HOSTINGER_USER}/domains/ecypro.com/public_html`;
    const REMOTE_FILE = `${REMOTE_DIR}/microweber.zip`;

    conn.on('ready', () => {
        spinner.text = 'Authenticated! Starting SFTP Upload...';
        
        conn.sftp((err, sftp) => {
            if (err) {
                spinner.fail('SFTP Error: ' + err.message);
                conn.end();
                return;
            }

            // Fast Upload using stream
            const readStream = fs.createReadStream(ZIP_PATH);
            const writeStream = sftp.createWriteStream(REMOTE_FILE);
            
            // Progress tracking? Native writeStream doesn't emit progress easily without pipe tracking
            // For simplicity, we just wait
            spinner.text = `Uploading ${sizeMB} MB... (This might take a minute)`;
            
            writeStream.on('close', () => {
                spinner.succeed('Upload Complete!');
                
                // UNZIP
                spinner.start('Extracting Archive (Remote)...');
                conn.exec(`cd ${REMOTE_DIR} && unzip -o microweber.zip && rm microweber.zip`, (err, stream) => {
                    if (err) {
                        spinner.fail('Exec Error: ' + err.message);
                        conn.end();
                        return;
                    }
                    
                    stream.on('close', (_code: unknown, _signal: unknown) => {
                        spinner.succeed('Extraction & Cleanup Complete!');
                        console.log(chalk.green('\n🎉 SUCCESS! Microweber is live.'));
                        console.log(chalk.cyan('👉 Go to https://ecypro.com to finalize installation.'));
                        conn.end();
                    }).on('data', (_data: unknown) => {
                       // console.log('STDOUT: ' + _data);
                    }).stderr.on('data', (_data: unknown) => {
                       // console.log('STDERR: ' + _data);
                    });
                });
            });

            readStream.pipe(writeStream);
        });

    }).on('error', (err) => {
        spinner.fail('Connection Failed: ' + err.message);
        if (err.message.includes('authentication')) {
             console.log(chalk.yellow('💡 Check your password in .env.deploy'));
        }
    }).connect({
        host: HOSTINGER_HOST,
        port: parseInt(HOSTINGER_PORT || '65002'),
        username: HOSTINGER_USER,
        password: HOSTINGER_PASS,
        readyTimeout: 20000
    });
}
