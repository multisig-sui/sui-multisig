# Sui Multisig CLI 🛡️

This CLI tool provides a secure way to manage multisig operations on the Sui blockchain. It's designed to be used alongside the [web frontend](https://sui-multisig.vercel.app/) for a complete multisig solution.

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) (REQUIRED: install [this custom fork](https://github.com/arjanjohan/sui/tree/override-sender))
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/override-sender) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__

## Installation

You can install the Sui Multisig CLI tool globally using npm:

```bash
npm install -g sui-multisig-cli
```

If you want to run the scripts without installing the tool, see the adjusted instructions [here](docs/bash-scripts.md).

## Initial setup

Before you start you must initialize the Sui CLI, connected to a Sui Full node (`sui client new-env`) and create some accounts (`sui client new-address <KEY_SCHEME>`). Instructions and more details can be found [here](https://docs.sui.io/references/cli/client).

## Scripts

### 0. Setup Multisig Wallet

```bash
sui-multisig setup
```

Sets up a multisig wallet with multiple signers. The script will guide you through:
- Adding public keys of all signers
- Setting weights for each key
- Setting the threshold for transaction approval

The configuration is saved to a JSON file in the `transactions` directory for future reference.

### 1. Create transaction

```bash
sui-multisig create [options]
```

**Options:**

- `-t, --type <type>`: Transaction type (`publish`, `upgrade`, `call`, or `transfer`)
- `-b, --batch <file>`: Create multiple transactions from a JSON batch file
- `-ms, --multisig <address>`: Multisig wallet address to use as sender
- `-d, --directory <dir>`: Package directory for publish/upgrade
- `-c, --capability <address>`: Address of the UpgradeCap Object for upgrade
- `-p, --package <address>`: Package address for call
- `-m, --module <name>`: Module name for call
- `-f, --function <name>`: Function name for call
- `-a, --args <args>`: Arguments for call (space-separated string)
- `-r, --recipient <address>`: Recipient address for transfer
- `-o, --object <id>`: Object ID for transfer

Creates a multisig transaction. The script supports four types of transactions:

1. **Publish** - Deploy a new smart contract
   ```bash
   sui-multisig create -t publish -d <package_directory>
   ```
   Example:
   ```bash
   sui-multisig create -t publish -d ./my-contract
   ```

2. **Upgrade** - Upgrade an existing smart contract
   ```bash
   sui-multisig create -t upgrade -d <package_directory>
   ```
   Example:
   ```bash
   sui-multisig create -t upgrade -d ./my-contract
   ```

3. **Call** - Call a function on a smart contract
   ```bash
   sui-multisig create -t call -p <package_address> -m <module_name> -f <function_name> [-a <args>]
   ```
   Example:
   ```bash
   sui-multisig create -t call -p 0x123... -m counter -f create
   ```

4. **Transfer** - Transfer an object to another account
   ```bash
   sui-multisig create -t transfer -r <recipient_address> -o <object_id>
   ```
   Example:
   ```bash
   sui-multisig create -t transfer -r 0x456... -o 0x789...
   ```

If no type is specified, the script will prompt you to select one interactively.

### 2. Approve transaction

```bash
sui-multisig approve [options]
```

**Options:**

- `-tx, --transaction <dir>`: Specify the transaction directory (either just the name or full path)
- `-ms, --multisig <address>`: Specify the multisig wallet address
- `-s, --signer <address>`: Specify the signer address to use for approval
- `-y, --assume-yes`: Automatically answer 'yes' to all prompts (non-interactive mode)

**Examples:**

Approve a transaction interactively:
```bash
sui-multisig approve
```

Approve a specific transaction non-interactively:
```bash
sui-multisig approve -tx tx_20250723_211214_call_counter_create -ms 0x... -s 0x... -y
```

### 3. Execute transaction

```bash
sui-multisig execute [options]
```

**Options:**

- `-tx, --transaction <dir>`: Specify the transaction directory (either just the name or full path)
- `-ms, --multisig <address>`: Specify the multisig wallet address
- `-y, --assume-yes`: Automatically answer 'yes' to all prompts (non-interactive mode)

**Examples:**

Execute a transaction interactively:
```bash
sui-multisig execute
```

Execute a specific transaction non-interactively:
```bash
sui-multisig execute -tx tx_20250723_211214_call_counter_create -ms 0x... -y
```

## Configuration

The CLI tool stores its configuration in the `~/.sui-multisig` directory. This includes:
- Multisig wallet configuration
- Transaction history
- Signer information

## Development

To work on the CLI tool:

1. Install dependencies:
```bash
pnpm install
```

2. Build the TypeScript code:
```bash
pnpm build
```

3. Run in development mode:
```bash
pnpm dev
```

## License

MIT

## Learn more

To learn more about how multisigs work on Sui check out these resources:
- [Sui Developer docs](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig)