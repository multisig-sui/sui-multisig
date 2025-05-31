#!/bin/bash

# Source the helper script
SCRIPT_DIR="$SUI_MULTISIG_SCRIPTS_DIR"
source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Check if required environment variables are set
if [ -z "$SUI_MULTISIG_CONFIG_DIR" ] || [ -z "$SUI_MULTISIG_MULTISIGS_DIR" ] || [ -z "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please ensure SUI_MULTISIG_CONFIG_DIR, SUI_MULTISIG_MULTISIGS_DIR, and SUI_MULTISIG_TRANSACTIONS_DIR are set"
    exit 1
fi

# Check if transactions directory exists
if [ ! -d "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo "Error: No transactions directory found in ~/.sui-multisig"
    exit 1
fi

# List all transaction directories
TX_DIRS=("$SUI_MULTISIG_TRANSACTIONS_DIR"/tx_*)
if [ ${#TX_DIRS[@]} -eq 0 ] || [ ! -d "${TX_DIRS[0]}" ]; then
    echo "Error: No transactions found in ~/.sui-multisig/transactions"
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

# Decode and display transaction info
if ! decode_and_display_tx "$TX_BYTES"; then
    exit 1
fi

# Confirm transaction
read -p "Do you want to approve this transaction? (y/N): " APPROVE
if [[ ! "$APPROVE" =~ ^[Yy]$ ]]; then
    echo "Transaction approval cancelled."
    exit 0
fi

# Get addresses from Sui client
ADDRESSES_JSON=$(sui client addresses --json)
ACTIVE_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r '.activeAddress')

# Create signatures directory if it doesn't exist
SIGS_DIR="$TX_DIR/signatures"
mkdir -p "$SIGS_DIR"

# Show available addresses with signature status
echo -e "\n📋 Available addresses:"
echo "------------------------"
while IFS= read -r line; do
    NAME=$(echo "$line" | cut -d'|' -f1)
    ADDR=$(echo "$line" | cut -d'|' -f2)
    STATUS=""
    if [ -f "$SIGS_DIR/${ADDR#0x}" ]; then
        STATUS=" (✓ already signed)"
    fi
    if [ "$ADDR" = "$ACTIVE_ADDRESS" ]; then
        echo "* $NAME: $ADDR$STATUS (active)"
    else
        echo "  $NAME: $ADDR$STATUS"
    fi
done < <(echo "$ADDRESSES_JSON" | jq -r '.addresses[] | "\(.[0])|\(.[1])"')
echo "------------------------"

# Prompt for address selection with retry loop
while true; do
    read -p "Enter address name to use (or press enter for active address): " ADDR_NAME

    if [ -z "$ADDR_NAME" ]; then
        SIGNER_ADDRESS="$ACTIVE_ADDRESS"
        break
    fi

    # Find address by name
    SIGNER_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r --arg name "$ADDR_NAME" '.addresses[] | select(.[0] == $name) | .[1]')
    if [ -z "$SIGNER_ADDRESS" ] || [ "$SIGNER_ADDRESS" = "null" ]; then
        echo "❌ Error: Address name not found. Please enter the exact address name (e.g. 'upbeat-alexandrite')"
        continue
    fi
    break
done

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
SIGNATURE_RESPONSE=$(sui keytool sign --address "$SIGNER_ADDRESS" --data "$TX_BYTES" --json)
if [ $? -ne 0 ]; then
    echo "Error: Failed to sign transaction"
    exit 1
fi

# Store the signature response in a file named after the signer's address
echo "$SIGNATURE_RESPONSE" > "$SIGS_DIR/${SIGNER_ADDRESS#0x}"

echo "✅ Transaction successfully signed"
show_final_steps()