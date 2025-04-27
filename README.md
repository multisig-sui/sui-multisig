# IOTA Multisig CLI

![logo](/assets/logo.png)

This repository contains scripts for managing multisig transactions on the IOTA blockchain, including creating, approving, and executing transactions.

## Prerequisites

- [IOTA CLI](https://docs.iota.org/developer/getting-started/install-iota)
- Bash shell environment
- jq (for JSON processing)

## Initial setup

Before you start you must initialze some accounts and a multisig.

## Learn more

To learn more about how multisigs work on IOTA check out there resources:
- [IOTA Developer docs](https://docs.iota.org/developer/cryptography/transaction-auth/multisig)
- [IOTA Wiki](https://wiki.iota.org/build/safe/)
- [Medium article by ABmushi](https://medium.com/@abmushi/iota-multisig-explained-bca334d250a2)

## TODO
- Include an example smart contract file to deploy/upgrade
- Scripts to:
    - create deployment tx for multisig
    - create upgrade tx for multisig
    - create multisig tx to interact with smart contract
    - view multisig txs
    - approve/reject multisig txs
    - execute multisig tx