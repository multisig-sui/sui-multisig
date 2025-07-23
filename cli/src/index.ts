#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';

const program = new Command();

program
  .name('sui-multisig')
  .description('CLI tool for managing Sui multisig operations')
  .version('1.3.3');

// Helper function to get the config directory and ensure required subdirectories exist
function getConfigDir(): string {
  const configDir = join(homedir(), '.sui-multisig');
  const requiredDirs = ['multisigs', 'transactions'];

  // Create main config directory if it doesn't exist
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  // Create required subdirectories
  for (const dir of requiredDirs) {
    const fullPath = join(configDir, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  }

  return configDir;
}

// Helper function to run shell scripts
function runScript(scriptName: string, args: string[] = []): void {
  try {
    const scriptPath = join(__dirname, '..', 'scripts', scriptName);
    const configDir = getConfigDir();

    // Set environment variables for the scripts
    const env = {
      ...process.env,
      SUI_MULTISIG_CONFIG_DIR: configDir,
      SUI_MULTISIG_MULTISIGS_DIR: join(configDir, 'multisigs'),
      SUI_MULTISIG_TRANSACTIONS_DIR: join(configDir, 'transactions'),
      SUI_MULTISIG_SCRIPTS_DIR: join(__dirname, '..', 'scripts')
    };

    const command = `bash ${scriptPath} ${args.join(' ')}`;
    execSync(command, { stdio: 'inherit', env });
  } catch (error: any) {
    // Extract the actual error message from the script output
    const errorMessage = error.stderr?.toString() || error.message;

    // Check for common error patterns and provide user-friendly messages
    if (errorMessage.includes('Not enough signatures')) {
      console.error(chalk.yellow('\n⚠️  Not enough signatures to execute the transaction.'));
      console.error(chalk.yellow('   Please have more signers approve the transaction first.'));
    } else if (errorMessage.includes('No transactions found')) {
      console.error(chalk.yellow('\n⚠️  No pending transactions found.'));
      console.error(chalk.yellow('   Create a transaction first using: sui-multisig create'));
    } else if (errorMessage.includes('No transactions directory found')) {
      console.error(chalk.yellow('\n⚠️  No transactions directory found.'));
      console.error(chalk.yellow('   Create a transaction first using: sui-multisig create'));
    } else if (errorMessage.includes('Conflicting multisig addresses')) {
      console.error(chalk.red('\n❌ Conflicting multisig addresses found'));
    } else {
      // For other errors, show a generic error message
      console.error(chalk.red('\n❌ An error occurred:'));
      console.error(chalk.red(errorMessage));
    }

    // Exit with status code 1
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
  multisig?: string;
}

interface ApproveOptions {
  transaction?: string;
}

interface ExecuteOptions {
  transaction?: string;
  multisig?: string;
}

program
  .command('setup')
  .description('Set up a new multisig wallet')
  .action(() => runScript('0_setup_multisig.sh'));

program
  .command('create')
  .description('Create a new transaction')
  .option('-t, --type <type>', 'Transaction type (publish|upgrade|call|transfer)')
  .option('-b, --batch <file>', 'Create multiple transactions from JSON file')
  .option('-ms, --multisig <address>', 'Multisig wallet address')
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
  .option('-tx, --transaction <dir>', 'Transaction directory')
  .option('-ms, --multisig <address>', 'Multisig wallet address')
  .action((options: ApproveOptions) => {
    const args = options.transaction ? [`--transaction ${options.transaction}`] : [];
    runScript('2_approve_tx.sh', args);
  });

program
  .command('execute')
  .description('Execute an approved transaction')
  .option('-tx, --transaction <dir>', 'Transaction directory')
  .option('-ms, --multisig <address>', 'Multisig wallet address')
  .action((options: ExecuteOptions) => {
    const args = options.transaction ? [`--transaction ${options.transaction}`] : [];
    runScript('3_execute_tx.sh', args);
  });

program.parse();