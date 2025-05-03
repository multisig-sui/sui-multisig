#!/bin/bash

# Check if transactions directory exists
if [ ! -d "transactions" ]; then
    echo "Error: No transactions directory found"
    exit 1
fi

# List all transaction directories
TX_DIRS=(transactions/tx_*)
if [ ${#TX_DIRS[@]} -eq 0 ] || [ ! -d "${TX_DIRS[0]}" ]; then
    echo "Error: No transactions found"
    exit 1
fi

# Display available transactions
echo "📋 Available transactions:"
echo "------------------------"
for i in "${!TX_DIRS[@]}"; do
    echo "[$i] $(basename "${TX_DIRS[$i]}")"
done
echo "------------------------"

# Prompt user to select a transaction
while true; do
    read -p "Select transaction number: " selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#TX_DIRS[@]}" ]; then
        TX_DIR="${TX_DIRS[$selection]}"
        break
    else
        echo "❌ Invalid selection. Please enter a number between 0 and $((${#TX_DIRS[@]}-1))"
    fi
done

# Get the transaction bytes
TX_BYTES_FILE="$TX_DIR/tx_bytes"
if [ ! -f "$TX_BYTES_FILE" ]; then
    echo "Error: Transaction bytes file not found: $TX_BYTES_FILE"
    exit 1
fi

TX_BYTES=$(cat "$TX_BYTES_FILE")
if [ -z "$TX_BYTES" ]; then
    echo "Error: No transaction bytes found"
    exit 1
fi

# Get addresses from iota client
ADDRESSES_JSON=$(iota client addresses --json)
ACTIVE_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r '.activeAddress')

# Show available addresses
echo "Available addresses:"
echo "------------------"
echo "$ADDRESSES_JSON" | jq -r '.addresses[] | "\(.[0]): \(.[1])"'
echo "------------------"
echo "Active address: $ACTIVE_ADDRESS"

# Show existing signatures if any
SIGS_DIR="$TX_DIR/signatures"
if [ -d "$SIGS_DIR" ] && [ "$(ls -A "$SIGS_DIR" 2>/dev/null)" ]; then
    echo -e "\nExisting signatures:"
    echo "------------------"
    for sig_file in "$SIGS_DIR"/*; do
        echo "✓ 0x$(basename "$sig_file")"
    done
    echo "------------------"
fi

# Prompt for address selection
read -p "Enter address name to use (or press enter for active address): " ADDR_NAME

if [ -z "$ADDR_NAME" ]; then
    SIGNER_ADDRESS="$ACTIVE_ADDRESS"
else
    # Find address by name
    SIGNER_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r --arg name "$ADDR_NAME" '.addresses[] | select(.[0] == $name) | .[1]')
    if [ -z "$SIGNER_ADDRESS" ] || [ "$SIGNER_ADDRESS" = "null" ]; then
        echo "Error: Address name not found"
        exit 1
    fi
fi

# Check if signature already exists
if [ -f "$SIGS_DIR/${SIGNER_ADDRESS#0x}" ]; then
    echo "⚠️  This address has already signed this transaction"
    read -p "Do you want to overwrite the existing signature? (y/N): " OVERWRITE
    if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Sign the transaction
echo "Signing with address: $SIGNER_ADDRESS"

# Execute signing and store full response
SIGNATURE_RESPONSE=$(iota keytool sign --address "$SIGNER_ADDRESS" --data "$TX_BYTES" --json)
if [ $? -ne 0 ]; then
    echo "Error: Failed to sign transaction"
    exit 1
fi

# Create signatures directory if it doesn't exist
mkdir -p "$SIGS_DIR"

# Store the signature response in a file named after the signer's address
echo "$SIGNATURE_RESPONSE" > "$SIGS_DIR/${SIGNER_ADDRESS#0x}"

echo "✅ Transaction successfully signed"
echo "📂 Transaction directory: $(basename "$TX_DIR")"
