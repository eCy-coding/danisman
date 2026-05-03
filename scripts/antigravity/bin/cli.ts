#!/usr/bin/env node
 
import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../../../package.json';
import { setupCommand } from '../src/commands/setup';
import { deployCommand } from '../src/commands/deploy';

const program = new Command();

program
  .name('antigravity')
  .description('eCy-antigravity: Ultimate Automation CLI')
  .version(version);

program.command('setup')
  .description('Configure SSH credentials for deployment')
  .action(setupCommand);

program.command('deploy')
  .description('Automated deployment via SSH (Microweber/App)')
  .action(deployCommand);

program.command('audit')
  .description('System diagnostics and audit')
  .action(() => {
    console.log(chalk.green('🕵️  Starting System Audit...'));
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
