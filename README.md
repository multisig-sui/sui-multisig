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
bash ./scripts/1_create_tx.sh
```
Creates a multisig transaction based on either the deployment/upgrade payload or a smart contract interaction.
The script will either prompt you to select to use payload or smart contract. Or you can call the script with the `--payload <location of payload .json file>` flag.

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