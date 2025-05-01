# IOTA Multisig Web Client (MVP)

This project provides a simple Minimum Viable Product (MVP) web frontend for managing IOTA Layer 1 multisignature wallets and creating transactions, built with React, TypeScript, Vite, Radix UI, and the `@iota/dapp-kit`.

## Features (MVP)

*   Connect to an IOTA L1 wallet (via `@iota/dapp-kit`).
*   Request testnet tokens from the faucet.
*   Create a new multisig wallet configuration (defining signers, weights, and threshold) and save it as a JSON file.
*   Load an existing multisig configuration from a JSON file.
*   View the details of the loaded multisig wallet.
*   Initiate a transaction *from* the loaded multisig wallet.
*   Prepare and sign a Base Token (IOTA) transfer transaction.
*   Collect external signatures.
*   Combine signatures and execute the transfer transaction on the IOTA testnet.
*   Basic UI for other transaction types (Call Function, Publish, Upgrade - execution logic may be incomplete).

## Setup

1.  **Navigate to the client directory:**
    ```bash
    cd multisig-web-client
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    # or npm install / yarn install
    ```
3.  **Run the development server:**
    ```bash
    pnpm dev
    # or npm run dev / yarn dev
    ```
    The application will typically be available at `http://localhost:5173`.

## Workflow

### 1. Connect Wallet

*   Click the "Connect Wallet" button in the top-right corner.
*   Select your preferred wallet provider (e.g., Nightly) and approve the connection.
*   Your connected wallet address will appear in the "Wallet Info" section.

### 2. Get Testnet Tokens

*   If your connected wallet or the multisig wallet needs funds on the testnet, click the "Get Testnet Tokens" button in the "Wallet Info" section.
*   Wait for the confirmation message.

### 3. Create a New Multisig Wallet

*   On the Dashboard, click "Create New Multisig Wallet".
*   **Fill in the form:**
    *   **Signers:** Add one or more signers.
        *   **Public Key:** This MUST be the Base64 encoded public key **including the signature scheme flag byte (usually `0` for Ed25519) at the beginning.**
            *   **For your connected wallet:** Go back to the Dashboard (using the top-left button), click the "Copy PK" button next to your address in the "Wallet Info" section, and paste the result here.
            *   **For other signers (not connected):** You need to obtain this specific Base64 format externally. If using `iota keytool generate`, the output labeled `publicBase64KeyWithFlag` is the correct value.
        *   **Weight:** Assign a weight to each signer (e.g., 1).
    *   **Threshold:** Set the minimum total weight of signatures required to approve a transaction.
*   Click "Generate Multisig Address & Save Config".
*   Your browser will prompt you to save a `multisig.json` file. **Save this file securely**, as it contains the definition of your multisig wallet.
*   You will be navigated to the "Manage Multisig" view for the newly created wallet.

### 4. Load Existing Multisig Wallet

*   On the Dashboard, click "Load Existing Multisig".
*   Select the `multisig.json` file you saved previously.
*   If the file is valid, you will be navigated to the "Manage Multisig" view.

### 5. Manage Multisig & Initiate Transaction

*   The "Manage Multisig" view displays the address, threshold, and signers from the loaded config.
*   Click "Create Transaction for this Wallet".

### 6. Create & Execute a Transfer Transaction

*   You are now on the "Create Transaction" page, likely on the "Transfer" tab.
*   The "Sender" address is prefilled with the multisig wallet address.
*   **Fill in the details:**
    *   **Recipient Address:** The IOTA L1 address to send funds to.
    *   **Amount (Miotas):** The amount in Miotas (1 IOTA = 1,000,000 Miotas).
    *   **Gas Budget:** The maximum gas units the transaction can consume (defaults to 10,000,000 - usually sufficient for simple transfers).
*   Click "**Prepare Transfer Transaction**".
    *   The input fields will become disabled.
    *   The unsigned transaction bytes will appear.
    *   If you need to change inputs, click the "Reset Form / Edit Inputs" button.
*   **Collect Signatures:**
    *   **If your connected wallet is a signer:** Click "Sign with Connected Wallet". Your signature will appear below.
        *   You can use the "Copy" button next to your signature to copy it for sharing or saving.
    *   **For other signers:** Share the "Unsigned Transaction Bytes" with them. They need to sign these bytes using their private key (e.g., via `iota keytool sign --data <UNSIGNED_TX_BYTES> --address <SIGNER_ADDRESS>`). Paste each resulting signature (Base64 format) on a new line in the "Paste signatures from other signers" text area.
*   Click "**Combine Signatures & Execute**".
    *   The app combines the unique signatures provided.
    *   It verifies if the combined weight meets the threshold.
    *   It submits the transaction to the IOTA testnet.
*   **Result:**
    *   If successful, a green message appears with the transaction digest, linked to the IOTAscan explorer.
    *   If an error occurs (e.g., insufficient funds, invalid signature, network error), a red error message appears.

### 7. Other Transaction Types

*   The tabs for "Call Function", "Publish", and "Upgrade" provide basic UI forms.
*   The preparation and execution logic, especially gas handling for "Call Function", may be incomplete in this MVP.
