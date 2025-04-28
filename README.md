# IOTA Multisig CLI

![logo](/assets/logo.png)

This repository contains scripts for managing multisig transactions on the IOTA blockchain, including creating, approving, and executing transactions.

In the wake of recent security incidents (like the [SafeWallet frontend compromise](https://x.com/safe/status/1894768522720350673)), it's become clear that web-based multisig interfaces pose additional risks. Web frontends can be modified by attackers, making transaction verification difficult or impossible for users. The IOTA Multisig CLI Tool aims to be a more safe and robust alternative:
- CLI-first: No web frontend means no risk of compromised interfaces
- Verifiable: All transactions are transparent and can be inspected directly
- Local execution: Your keys stay on your machine

## Prerequisites

- [IOTA CLI](https://docs.iota.org/developer/getting-started/install-iota)
- Bash shell environment
- jq (for JSON processing)

## Initial setup

Before you start you must initialze some accounts and a multisig.

## Scripts

### 0. Create deployment or upgrade payload

```bash
bash ./scripts/0_create_deployment_payload.sh
```
Creates a deployment payload to publish a smart contract to the IOTA network

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

### 2. Execute transaction

```bash
bash ./scripts/3_execute_tx.sh
```

Executes the next transaction in the multisig queue, given that is has sufficient approvals.


## Learn more

To learn more about how multisigs work on IOTA check out there resources:
- [IOTA Developer docs](https://docs.iota.org/developer/cryptography/transaction-auth/multisig)

## TODO
- Include an example smart contract file to deploy/upgrade
- Add scripts
- Helper scripts to setup tests account
- Multisig management scripts (change number of signers etc.)