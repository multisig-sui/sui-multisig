#!/bin/bash

# Check if transactions directory exists and create if not
mkdir -p transactions

# Get the latest transaction file
TX_FILE="transactions/latest_tx.json"
if [ ! -f "$TX_FILE" ]; then
    echo "Error: No pending transaction found"
    exit 1
fi

# Read transaction data
TX_BYTES=$(jq -r '.tx_bytes' "$TX_FILE")
if [ -z "$TX_BYTES" ] || [ "$TX_BYTES" == "null" ]; then
    echo "Error: No tx_bytes found in transaction file"
    exit 1
fi

# Show transaction details
echo "Transaction details:"
echo "------------------"
jq . "$TX_FILE"
echo "------------------"

# Ask for approval decision
read -p "Do you want to approve this transaction? (y/n): " APPROVE
if [[ ! "$APPROVE" =~ ^[Yy]$ ]]; then
    echo "Transaction rejected"
    exit 0
fi

# Sign the transaction
echo "Signing transaction..."
SIGNATURE=$(iota keytool sign --data "$TX_BYTES" | grep "Serialized signature" | cut -d':' -f2 | tr -d ' ')

if [ -z "$SIGNATURE" ]; then
    echo "Error: Failed to sign transaction"
    exit 1
fi

# Store the signature
SIGS_FILE="transactions/latest_signatures.json"
if [ ! -f "$SIGS_FILE" ]; then
    echo '{"signatures":[]}' > "$SIGS_FILE"
fi

# Add new signature to array
echo "Storing signature..."
jq --arg sig "$SIGNATURE" '.signatures += [$sig]' "$SIGS_FILE" > "${SIGS_FILE}.tmp" && mv "${SIGS_FILE}.tmp" "$SIGS_FILE"

echo "Transaction successfully signed and signature stored"
echo "You can now execute the transaction once enough signatures are collected"
