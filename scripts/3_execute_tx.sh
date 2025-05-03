#!/bin/bash

# Check if multisigs directory exists
if [ ! -d "multisigs" ]; then
    echo "❌ Error: No multisigs directory found"
    echo "Please run 0_setup_multisig.sh first to create a multisig wallet"
    exit 1
fi

# Find all JSON files in multisigs directory
CONFIG_FILES=(multisigs/*.json)
if [ ! -f "${CONFIG_FILES[0]}" ]; then
    echo "❌ Error: No multisig wallets found in multisigs directory"
    echo "Please run 0_setup_multisig.sh first to create a multisig wallet"
    exit 1
fi

# Display available multisig wallets with details
echo "📋 Available multisig wallets:"
echo "------------------------"
for i in "${!CONFIG_FILES[@]}"; do
    if [ -f "${CONFIG_FILES[$i]}" ]; then
        # Clean and parse the JSON file
        WALLET_DATA=$(tr -d '\n' < "${CONFIG_FILES[$i]}" | jq -c '.' 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$WALLET_DATA" ]; then
            MULTISIG_ADDR=$(echo "$WALLET_DATA" | jq -r '.multisigAddress')
            THRESHOLD=$(echo "$WALLET_DATA" | jq -r '.threshold')
            SIGNER_COUNT=$(echo "$WALLET_DATA" | jq -r '.multisig | length')
            echo "[$i] $(basename "${CONFIG_FILES[$i]}")"
            echo "    └─ $MULTISIG_ADDR (threshold: $THRESHOLD, signers: $SIGNER_COUNT)"
        else
            echo "[$i] $(basename "${CONFIG_FILES[$i]}") (invalid config)"
        fi
    fi
done
echo "------------------------"

# Prompt user to select a multisig wallet
while true; do
    read -p "Select multisig wallet number: " selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#CONFIG_FILES[@]}" ]; then
        CONFIG_FILE="${CONFIG_FILES[$selection]}"
        if [ -f "$CONFIG_FILE" ]; then
            # Clean and validate JSON
            CONFIG_CONTENT=$(tr -d '\n' < "$CONFIG_FILE" | jq -c '.' 2>/dev/null)
            if [ $? -ne 0 ]; then
                echo "❌ Error: Invalid JSON in config file"
                exit 1
            fi
            break
        else
            echo "❌ Error: Selected config file not found"
        fi
    else
        echo "❌ Invalid selection. Please enter a number between 0 and $((${#CONFIG_FILES[@]}-1))"
    fi
done

echo -e "\n💼 Using multisig wallet: $(basename "$CONFIG_FILE")"
echo "📦 Address: $(echo "$CONFIG_CONTENT" | jq -r .multisig_address)"
echo "🔐 Threshold: $(echo "$CONFIG_CONTENT" | jq -r .threshold)"
echo "👥 Signers: $(echo "$CONFIG_CONTENT" | jq -r '.signers | length')"

# Check if transactions directory exists
if [ ! -d "transactions" ]; then
    echo -e "\n❌ Error: No transactions directory found"
    exit 1
fi

# List all transaction directories
TX_DIRS=(transactions/tx_*)
if [ ${#TX_DIRS[@]} -eq 0 ] || [ ! -d "${TX_DIRS[0]}" ]; then
    echo "Error: No transactions found"
    exit 1
fi

# Display available transactions
echo -e "\n📋 Available transactions:"
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

# Check for signatures
SIGS_DIR="$TX_DIR/signatures"
if [ ! -d "$SIGS_DIR" ] || [ -z "$(ls -A "$SIGS_DIR" 2>/dev/null)" ]; then
    echo "Error: No signatures found for this transaction"
    exit 1
fi

# Extract multisig config
THRESHOLD=$(echo "$CONFIG_CONTENT" | jq -r '.threshold')
TOTAL_WEIGHT=$(echo "$CONFIG_CONTENT" | jq -r '[.signers[].weight] | add')

# Build command to combine signatures
COMBINE_CMD="iota keytool multi-sig-combine-partial-sig --threshold $THRESHOLD"

# Add public keys and weights
while IFS= read -r line; do
    COMBINE_CMD="$COMBINE_CMD --pks $line"
done < <(echo "$CONFIG_CONTENT" | jq -r '.signers[].public_key')

while IFS= read -r line; do
    COMBINE_CMD="$COMBINE_CMD --weights $line"
done < <(echo "$CONFIG_CONTENT" | jq -r '.signers[].weight')

# Get list of valid signers
declare -A VALID_SIGNERS
declare -A SIGNER_WEIGHTS
while IFS= read -r signer; do
    addr=$(echo "$signer" | jq -r '.address')
    name=$(echo "$signer" | jq -r '.name')
    weight=$(echo "$signer" | jq -r '.weight')
    addr_no_prefix=${addr#0x}
    VALID_SIGNERS["$addr_no_prefix"]="$name"
    SIGNER_WEIGHTS["$addr_no_prefix"]="$weight"
done < <(echo "$CONFIG_CONTENT" | jq -r '.signers[]')

# Process signatures
echo -e "\n📋 Signature Status:"
echo "------------------------"
SIGNED_COUNT=0
SIGNED_WEIGHT=0
VALID_SIGS=""

for sig_file in "$SIGS_DIR"/*; do
    addr=$(basename "$sig_file")
    if [[ -n "${VALID_SIGNERS[$addr]}" ]]; then
        sig_data=$(jq -r '.iotaSignature' "$sig_file")
        echo "✓ ${VALID_SIGNERS[$addr]} (weight: ${SIGNER_WEIGHTS[$addr]})"
        VALID_SIGS="$VALID_SIGS --sigs $sig_data"
        ((SIGNED_COUNT++))
        SIGNED_WEIGHT=$((SIGNED_WEIGHT + SIGNER_WEIGHTS[$addr]))
    else
        echo "❌ Unknown signer: 0x$addr (ignored)"
    fi
done

# Add valid signatures to command
COMBINE_CMD="$COMBINE_CMD$VALID_SIGS"

echo "------------------------"
echo "📊 Signing Progress:"
echo "• Signers: $SIGNED_COUNT/${#VALID_SIGNERS[@]}"
echo "• Weight: $SIGNED_WEIGHT/$TOTAL_WEIGHT (threshold: $THRESHOLD)"

if [ "$SIGNED_WEIGHT" -lt "$THRESHOLD" ]; then
    echo "❌ Not enough signatures (weight $SIGNED_WEIGHT < threshold $THRESHOLD)"
    exit 1
fi

# Combine signatures
echo -e "\n🔄 Combining signatures..."
MULTISIG_RESPONSE=$(eval "$COMBINE_CMD")
if [ $? -ne 0 ]; then
    echo "❌ Failed to combine signatures"
    echo "$MULTISIG_RESPONSE"
    exit 1
fi

# Extract serialized multisig
SERIALIZED_MULTISIG=$(echo "$MULTISIG_RESPONSE" | grep "multisig serialized:" | cut -d':' -f2 | tr -d ' ')
if [ -z "$SERIALIZED_MULTISIG" ]; then
    echo "❌ Failed to extract serialized multisig"
    exit 1
fi

# Execute the transaction
echo "🔄 Submitting transaction..."
iota client execute-signed-tx --tx-bytes "$TX_BYTES" --signatures "$SERIALIZED_MULTISIG"

if [ $? -eq 0 ]; then
    echo "✅ Transaction successfully submitted to the network"
else
    echo "❌ Failed to submit transaction"
    exit 1
fi