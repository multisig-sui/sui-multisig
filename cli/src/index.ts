#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { join } from 'path';

const program = new Command();

program
  .name('sui-multisig')
  .description('CLI tool for managing Sui multisig operations')
  .version('1.0.0');

// Helper function to run shell scripts
function runScript(scriptName: string, args: string[] = []): void {
  try {
    // Get the path to the scripts directory relative to the current file
    const scriptPath = join(__dirname, '..', 'scripts', scriptName);
    const command = `bash ${scriptPath} ${args.join(' ')}`;
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`Error running ${scriptName}:`), error);
    process.exit(1);
  }
}

interface CreateOptions {
  type?: string;
  directory?: string;
  package?: string;
  module?: string;
  function?: string;
  args?: string;
  recipient?: string;
  object?: string;
}

interface ApproveOptions {
  sequence?: string;
}

program
  .command('setup')
  .description('Set up a new multisig wallet')
  .action(() => runScript('0_setup_multisig.sh'));

program
  .command('create')
  .description('Create a new transaction')
  .option('-t, --type <type>', 'Transaction type (publish|upgrade|call|transfer)')
  .option('-d, --directory <dir>', 'Package directory for publish')
  .option('-p, --package <address>', 'Package address for call')
  .option('-m, --module <name>', 'Module name for call')
  .option('-f, --function <name>', 'Function name for call')
  .option('-a, --args <args>', 'Arguments for call')
  .option('-r, --recipient <address>', 'Recipient address for transfer')
  .option('-o, --object <id>', 'Object ID for transfer')
  .action((options: CreateOptions) => {
    const args = Object.entries(options)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `--${key} ${value}`);
    runScript('1_create_tx.sh', args);
  });

program
  .command('approve')
  .description('Approve or reject a transaction')
  .option('-s, --sequence <number>', 'Transaction sequence number')
  .action((options: ApproveOptions) => {
    const args = options.sequence ? [`--sequence-number ${options.sequence}`] : [];
    runScript('2_approve_tx.sh', args);
  });

program
  .command('execute')
  .description('Execute an approved transaction')
  .action(() => runScript('3_execute_tx.sh'));

program.parse();