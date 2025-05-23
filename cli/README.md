# Sui Multisig CLI 🛡️

This CLI tool provides a secure way to manage multisig operations on the Sui blockchain. It's designed to be used alongside the [web frontend](https://sui-multisig.vercel.app/) for a complete multisig solution.

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) - *Required: Install this custom fork that matches your target network [ (mainnet)](https://github.com/arjanjohan/sui/tree/custom-signer) - [(testnet-v1.48.2)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet) - [(testnet-v1.48.1)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet-v1.48.1)*
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/custom-signer) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__

## Installation

You can install the Sui Multisig CLI tool globally using npm:

```bash
npm install -g sui-multisig-cli
```

Or use it directly with pnpm:

```bash
pnpm start
```

In the instructions below we assume you are usint the installed `sui-multisig-cli`.

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
   sui-multisig create -t upgrade
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
sui-multisig approve
```

Call this command with the `--sequence <n>` flag to approve/reject a specific transaction. Otherwise it will print an overview of transactions and prompt you to input the sequence number of the one to approve/reject.

### 3. Execute transaction

```bash
sui-multisig execute
```

Executes the next transaction in the multisig queue, given that is has sufficient approvals.

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