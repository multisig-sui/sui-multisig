# Sui Multisig Tools 🛡️

![logo](/assets/logo.png)

In the wake of recent incidents like the [SafeWallet frontend compromise](https://x.com/safe/status/1894768522720350673), it's become clear that many multisig platforms expose users to unnecessary risk. External frontends and tools can be tampered with, and users often can't verify what they're signing. This project aims to fix that by introducing open-source solutions that can be run locally.

This repository contains a comprehensive suite of tools for managing multisig operations on the Sui blockchain using a **security-by-design** approach. The project consists of two main components:

1. **CLI Tool** - For command-line multisig operations (aimed at developers)
2. **Web Frontend** - For visual transaction management (aimed at non-technical users)

## 🔐 Security Features

- **No Web Risks:** Both tools run locally with no reliance on external servers = no spoofing, injection, or DNS attacks.
- **Full Verifiability:** You can inspect every transaction before it's signed or sent.
- **Local Execution:** Your private keys stay with you. Nothing sensitive leaves your machine.

## 🛠️ Tools Overview

### CLI Tool
The CLI tool provides a powerful command-line interface for managing Sui multisig operations. It's designed for developers and power users who prefer working in the terminal.

**Key Features:**
- **Create Multisig Wallets:** Set up new multisig wallets with custom weights and thresholds
- **Transaction Management:**
  - Create and manage transactions (publish, upgrade, call, transfer)
  - View transaction details before signing
  - Collect signatures from multiple signers
  - Execute approved transactions
- **Local Configuration:** All configurations and transactions are stored locally
- **Developer-Friendly:** Full control over transaction creation and signing

👉 **[Try the CLI tool](https://www.npmjs.com/package/sui-multisig-cli)**

#### Installation
Install the CLI tool globally using npm or pnpm:

```bash
# Using npm
npm run build
npm install -g sui-multisig-cli

# Using pnpm
pnpm build
pnpm add -g sui-multisig-cli
```

For detailed CLI usage instructions, see the [CLI documentation](cli/README.md).

> **Note:** If you prefer using the original bash scripts directly (as shown in the [demo video](https://youtu.be/GX_vhvUv8ks)), see the [Bash Scripts documentation](docs/bash-scripts.md).


### Web Frontend
The web frontend provides an intuitive, 100% client-side interface for managing Sui multisig wallets. It runs entirely in your browser with no backend server, enhancing security by ensuring your keys and transaction data are not exposed to external servers.

**Key Features:**
- **Create Multisig Wallets:** Easily set up new multisig wallets by defining signers (with their public keys and key schemes), their respective weights, and the signature threshold required for transaction approval.
- **Load Existing Configurations:** Import previously saved multisig wallet configurations from a JSON file.
- **Dashboard View:** Get a clear overview of your loaded multisig wallet, including its address, SUI balance, threshold, and the list of signers with their details.
- **Faucet Integration:** Conveniently request SUI tokens from the faucet for your multisig wallet address (primarily for Testnet/Devnet usage).
- **Transaction Creation & Management:**
    - Initiate common transactions, such as SUI transfers, directly from the multisig wallet.
    - View the transaction payload (serialized transaction data) before signing, ensuring transparency.
- **Signature Collection:**
    - **Connected Wallet Signing:** If your connected browser wallet is one of the authorized signers, you can sign the transaction directly.
    - **Offline Signature Aggregation:** Paste signatures (in the required format: `flag || signature_bytes || public_key_bytes`, base64 encoded) obtained from other signers who have signed the transaction payload offline.
- **Execute Transactions:** Once enough signatures are collected to meet the threshold, combine them and execute the transaction on the Sui network.
- **Wallet Agnostic:** Leverages `@mysten/dapp-kit` to delegate signing operations to compatible Sui browser extension wallets, keeping your private keys secure within your trusted wallet environment.

👉 **[Try the live demo](https://sui-multisig.vercel.app/)**

#### Running the Frontend Locally
The web frontend is a React application built using Vite, TypeScript, and Radix UI for components. It uses `@mysten/dapp-kit` for interacting with the Sui blockchain and wallets.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/) (Follow installation guide on their website if not already installed)

**Setup and Running:**
1. Navigate to the frontend's directory:
    ```bash
    cd UI/multisig
    ```
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Start the local development server:
    ```bash
    pnpm dev
    ```
    The application will typically be available at `http://localhost:5173` (or the port shown in your terminal).

**Building for Production:**
To create an optimized production build of the frontend:
1. Ensure you are in the `UI/multisig` directory.
2. Run the build command:
    ```bash
    pnpm build
    ```
    The static files for deployment will be generated in the `UI/multisig/dist` directory.

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) (REQUIRED: install [this custom fork](https://github.com/arjanjohan/sui/tree/override-sender))
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/override-sender) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__

> **Note:** If you prefer using the original bash scripts directly (as shown in the [demo video](https://youtu.be/GX_vhvUv8ks)), see the [Bash Scripts documentation](docs/bash-scripts.md).

## Next steps

- [CLI] Filter transactions by multisig in step 2 (approval)
- [CLI] Add a function to batch execute approved transactions
- [CLI] Batch create transactions from json

## Learn More

To learn more about how multisigs work on Sui check out these resources:
- [Sui Developer docs](https://docs.sui.io/concepts/cryptography/transaction-auth/multisig)

## Links
- [Frontend Vercel deployment](https://sui-multisig.vercel.app/)
- [NPM package for CLI tool](https://www.npmjs.com/package/sui-multisig-cli)
- [Demo video](https://youtu.be/GX_vhvUv8ks)
- [Pitchdeck](https://docs.google.com/presentation/d/1h-x2YUOr8FiCrCc1weWM6xX1A-5ekZF8Z5Fn9xboOUE/edit?usp=sharing)
- [PR to add `--sender` flag to Sui CLI](https://github.com/MystenLabs/sui/pull/22158)
