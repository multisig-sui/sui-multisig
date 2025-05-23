# Sui Multisig Tools 🛡️

![logo](/assets/logo.png)

This repository contains a comprehensive suite of tools for managing multisig operations on the Sui blockchain using a **security-by-design** approach. The project consists of two main components:

1. **CLI Tool** - For command-line multisig operations (aimed at developers)
2. **Web Frontend** - For visual transaction management (aimed at non-technical users)

In the wake of recent incidents like the [SafeWallet frontend compromise](https://x.com/safe/status/1894768522720350673), it's become clear that many multisig platforms expose users to unnecessary risk. External frontends and tools can be tampered with, and users often can't verify what they're signing. This project aims to fix that by introducing open-source solutions that can be run locally.

## 🔐 Security Features

- **No Web Risks:** Both tools run locally with no reliance on external servers = no spoofing, injection, or DNS attacks.
- **Full Verifiability:** You can inspect every transaction before it's signed or sent.
- **Local Execution:** Your private keys stay with you. Nothing sensitive leaves your machine.

## 🛠️ Tools Overview

### CLI Tool
- Deploy and upgrade packages with ease
- Ideal for power users and developers
- Full control over transaction creation and signing

### Web Frontend
- Intuitive interface for transaction management
- 100% client-side - runs in your browser, no backend server
- Built to work alongside the CLI, not replace it
- Delegates signing to trusted Sui browser extension wallets
- Great for preparing, reviewing, and coordinating transactions visually

👉 **[Try the frontend now](https://sui-multisig.vercel.app/)**

---

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) - *Required: Install this custom fork that matches your target network [ (mainnet)](https://github.com/arjanjohan/sui/tree/custom-signer) - [(testnet-v1.48.2)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet) - [(testnet-v1.48.1)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet-v1.48.1)*
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/custom-signer) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__


## Initial setup

Before you start you must initialze some accounts and a multisig.

## Scripts

### 0. Setup Multisig Wallet

First, ensure you have initialized the Sui CLI and connected to a Sui Full node. Instructions and more details can be found [here](https://docs.sui.io/references/cli/client).

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

Call this script with the `-- sequence-number <n>` flag to approve/reject a specific transaction. Otherwise it will print an overview of transactions and prompt you to input the sequence number of the one to approve/reject.

### 3. Execute transaction

```bash
bash ./scripts/3_execute_tx.sh
```

Executes the next transaction in the multisig queue, given that is has sufficient approvals.

## Learn more

To learn more about how multisigs work on Sui check out these resources:
- [Sui Developer docs](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig)


## Next steps

- [CLI] Filter transactions by multisig in step 2 (approval)
- [CLI] Add a function to batch execute approved transactions

## Links
- [Vercel deployment](https://sui-multisig.vercel.app/)
- [Demo video](https://youtu.be/GX_vhvUv8ks)
- [Pitchdeck](https://docs.google.com/presentation/d/1h-x2YUOr8FiCrCc1weWM6xX1A-5ekZF8Z5Fn9xboOUE/edit?usp=sharing)
- [PR to add `--custom-signer` flag to Sui CLI](https://github.com/MystenLabs/sui/pull/22158)