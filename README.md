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