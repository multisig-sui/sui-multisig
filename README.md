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
The web frontend provides an intuitive, 100% client-side interface for managing Sui multisig wallets. It runs entirely in your browser with no backend server, enhancing security by ensuring your keys and transaction data are not exposed to external servers. It's designed to complement the CLI tool, offering a visual approach for users who prefer a graphical interface.

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

## Installation

### CLI Tool

Install the CLI tool globally using npm or pnpm:

```bash
# Using npm
npm install -g @sui-multisig/cli

# Using pnpm
pnpm add -g @sui-multisig/cli
```

For detailed CLI usage instructions, see the [CLI documentation](cli/README.md).

### Web Frontend

The web frontend is available as a hosted application at [sui-multisig.vercel.app](https://sui-multisig.vercel.app/).

To run it locally:

1. Clone this repository
2. Navigate to the frontend directory:
   ```bash
   cd UI/multisig
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Prerequisites

- [Sui CLI](https://docs.sui.io/references/cli/client) - *Required: Install this custom fork that matches your target network [ (mainnet)](https://github.com/arjanjohan/sui/tree/custom-signer) - [(testnet-v1.48.2)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet) - [(testnet-v1.48.1)](https://github.com/arjanjohan/sui/tree/custom-signer-testnet-v1.48.1)*
- Bash shell environment
- jq (for JSON processing)

__NOTE: To use this tool you must use the [custom fork](https://github.com/arjanjohan/sui/tree/custom-signer) of the Sui CLI. This custom fork allows to create a transaction with a custom signer (i.e. the multisig wallet). We created a PR (https://github.com/MystenLabs/sui/pull/22158) to add this new feature to the next version of the Sui CLI.__

## Learn More

- [Demo video](https://youtu.be/GX_vhvUv8ks)
- [Pitchdeck](https://docs.google.com/presentation/d/1h-x2YUOr8FiCrCc1weWM6xX1A-5ekZF8Z5Fn9xboOUE/edit?usp=sharing)
- [PR to add `--custom-signer` flag to Sui CLI](https://github.com/MystenLabs/sui/pull/22158)