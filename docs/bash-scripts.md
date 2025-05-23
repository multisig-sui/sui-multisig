# Using Bash Scripts Directly

This document contains the original instructions for using the bash scripts directly. These instructions were used in the [demo video](https://youtu.be/GX_vhvUv8ks). After this video we upgraded the CLI tool to a newer version that can be installed with npm.

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) - *Required: Install this custom fork that matches your target network [ (mainnet)](https://github.com/arjanjohan/sui/tree/custom-signer) - [(testnet-v1.48.2)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet) - [(testnet-v1.48.1)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet-v1.48.1)*
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/custom-signer) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__

## Initial setup

Before you start you must initialize the Sui CLI, connected to a Sui Full node (`sui client new-env`) and create some accounts (`sui client new-address <KEY_SCHEME>`). Instructions and more details can be found [here](https://docs.sui.io/references/cli/client).

## Scripts

### 0. Setup Multisig Wallet

```bash
bash ./scripts/0_setup_multisig.sh
```

Sets up a multisig wallet with multiple signers. The script will guide you through:
- Adding public keys of all signers
- Setting weights for each key
- Setting the threshold for transaction approval

The configuration is saved to a JSON file in the `transactions` directory for future reference.

### 1. Create transaction

```bash
bash ./scripts/1_create_tx.sh [options]
```

Creates a multisig transaction. The script supports four types of transactions:

1. **Publish** - Deploy a new smart contract
   ```bash
   bash ./scripts/1_create_tx.sh -t publish -d <package_directory>
   ```
   Example:
   ```bash
   bash ./scripts/1_create_tx.sh -t publish -d ./my-contract
   ```

2. **Upgrade** - Upgrade an existing smart contract
   ```bash
   bash ./scripts/1_create_tx.sh -t upgrade
   ```

3. **Call** - Call a function on a smart contract
   ```bash
   bash ./scripts/1_create_tx.sh -t call -p <package_address> -m <module_name> -f <function_name> [-a <args>]
   ```
   Example:
   ```bash
   bash ./scripts/1_create_tx.sh -t call -p 0x123... -m counter -f create
   ```

4. **Transfer** - Transfer an object to another account
   ```bash
   bash ./scripts/1_create_tx.sh -t transfer -r <recipient_address> -o <object_id>
   ```
   Example:
   ```bash
   bash ./scripts/1_create_tx.sh -t transfer -r 0x456... -o 0x789...
   ```

If no type is specified, the script will prompt you to select one interactively.

### 2. Approve transaction

```bash
bash ./scripts/2_approve_tx.sh
```

Call this script with the `--sequence-number <n>` flag to approve/reject a specific transaction. Otherwise it will print an overview of transactions and prompt you to input the sequence number of the one to approve/reject.

### 3. Execute transaction

```bash
bash ./scripts/3_execute_tx.sh
```

Executes the next transaction in the multisig queue, given that is has sufficient approvals.