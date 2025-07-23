#!/bin/bash

# Source the helper script
SCRIPT_DIR="$SUI_MULTISIG_SCRIPTS_DIR"
source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Initialize variables
MULTISIG_ADDR=""
TX_DIR=""
ORIGINAL_ARGS=("$@")
ASSUME_YES=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -ms|--multisig)
            MULTISIG_ADDR="$2"
            export MULTISIG_ADDR
            shift 2
            ;;
        -tx|--transaction)
            TX_DIR="$2"
            shift 2
            ;;
        -y|--assume-yes)
            ASSUME_YES=1
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Check if required environment variables are set
if [ -z "$SUI_MULTISIG_CONFIG_DIR" ] || [ -z "$SUI_MULTISIG_MULTISIGS_DIR" ] || [ -z "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please ensure SUI_MULTISIG_CONFIG_DIR, SUI_MULTISIG_MULTISIGS_DIR, and SUI_MULTISIG_TRANSACTIONS_DIR are set"
    exit 1
fi

# Use select_multisig_wallet to select the wallet (sets CONFIG_FILE, CONFIG_CONTENT, MULTISIG_ADDR)
select_multisig_wallet

# Check if transactions directory exists
if [ ! -d "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo -e "\n❌ Error: No transactions directory found in ~/.sui-multisig"
    exit 1
fi

# List all transaction directories
TX_DIRS=("$SUI_MULTISIG_TRANSACTIONS_DIR"/tx_*)

# Filter TX_DIRS to only those where the sender matches MULTISIG_ADDR
if [ -n "$MULTISIG_ADDR" ]; then
    FILTERED_TX_DIRS=()
    for tx_dir in "${TX_DIRS[@]}"; do
        TX_BYTES_FILE="$tx_dir/tx_bytes"
        if [ -f "$TX_BYTES_FILE" ]; then
            SENDER=$(sui keytool decode-or-verify-tx --tx-bytes "$(cat "$TX_BYTES_FILE")" --json 2>/dev/null | jq -r '.tx.V1.sender // empty')
            if [ "$SENDER" = "$MULTISIG_ADDR" ]; then
                FILTERED_TX_DIRS+=("$tx_dir")
            fi
        fi
    done
    TX_DIRS=("${FILTERED_TX_DIRS[@]}")
fi

# If TX_DIR is provided, resolve to full path if needed
if [ -n "$TX_DIR" ]; then
    if [ -d "$TX_DIR" ]; then
        :
    elif [ -d "$SUI_MULTISIG_TRANSACTIONS_DIR/$TX_DIR" ]; then
        TX_DIR="$SUI_MULTISIG_TRANSACTIONS_DIR/$TX_DIR"
    else
        echo "Error: Transaction directory not found: $TX_DIR"
        exit 1
    fi
    TX_BYTES_FILE="$TX_DIR/tx_bytes"
    if [ ! -f "$TX_BYTES_FILE" ]; then
        echo "Error: Transaction bytes file not found: $TX_BYTES_FILE"
        exit 1
    fi
else
    if [ ${#TX_DIRS[@]} -eq 0 ] || [ ! -d "${TX_DIRS[0]}" ]; then
        echo "Error: No transactions found in ~/.sui-multisig/transactions"
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
    TX_BYTES_FILE="$TX_DIR/tx_bytes"
    if [ ! -f "$TX_BYTES_FILE" ]; then
        echo "Error: Transaction bytes file not found: $TX_BYTES_FILE"
        exit 1
    fi
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
TOTAL_WEIGHT=$(echo "$CONFIG_CONTENT" | jq -r '[.multisig[].weight] | add')

# Build command to combine signatures
COMBINE_CMD="sui keytool multi-sig-combine-partial-sig --threshold $THRESHOLD --json"

# Add public keys and weights
PK_LIST=""
WEIGHT_LIST=""
while IFS= read -r line; do
    PK_LIST="$PK_LIST $line"
done < <(echo "$CONFIG_CONTENT" | jq -r '.multisig[].publicBase64Key')
COMBINE_CMD="$COMBINE_CMD --pks$PK_LIST"

while IFS= read -r line; do
    WEIGHT_LIST="$WEIGHT_LIST $line"
done < <(echo "$CONFIG_CONTENT" | jq -r '.multisig[].weight')
COMBINE_CMD="$COMBINE_CMD --weights$WEIGHT_LIST"

# Get list of valid signers
declare -A VALID_SIGNERS
declare -A SIGNER_WEIGHTS

while IFS= read -r signer; do
    addr=$(echo "$signer" | jq -r '.address')
    weight=$(echo "$signer" | jq -r '.weight')
    addr_no_prefix=${addr#0x}
    VALID_SIGNERS["$addr_no_prefix"]="Signer $addr_no_prefix"
    SIGNER_WEIGHTS["$addr_no_prefix"]="$weight"
done < <(echo "$CONFIG_CONTENT" | jq -c '.multisig[]')

# Process signatures
echo -e "\n📋 Signature Status:"
echo "------------------------"
SIGNED_COUNT=0
SIGNED_WEIGHT=0
SIG_LIST=""

for sig_file in "$SIGS_DIR"/*; do
    addr=$(basename "$sig_file")
    if [[ -n "${VALID_SIGNERS[$addr]}" ]]; then
        sig_data=$(jq -r '.suiSignature' "$sig_file")
        echo "✓ ${VALID_SIGNERS[$addr]} (weight: ${SIGNER_WEIGHTS[$addr]})"
        SIG_LIST="$SIG_LIST $sig_data"
        ((SIGNED_COUNT++))
        SIGNED_WEIGHT=$((SIGNED_WEIGHT + SIGNER_WEIGHTS[$addr]))
    else
        echo "❌ Unknown signer: 0x$addr (ignored)"
    fi
done

# Add valid signatures to command
COMBINE_CMD="$COMBINE_CMD --sigs$SIG_LIST"

echo "------------------------"
echo "📊 Signing Progress:"
echo "• Signers: $SIGNED_COUNT/${#VALID_SIGNERS[@]}"
echo "• Weight: $SIGNED_WEIGHT/$TOTAL_WEIGHT (threshold: $THRESHOLD)"

if [ "$SIGNED_WEIGHT" -lt "$THRESHOLD" ]; then
    echo "❌ Not enough signatures (weight $SIGNED_WEIGHT < threshold $THRESHOLD)"
    exit 1
fi

# Confirm transaction
if [ "$ASSUME_YES" -eq 1 ]; then
    EXECUTE="y"
    echo "Executing transaction"
else
    read -p "Do you want to execute this transaction? (y/N): " EXECUTE
fi
if [[ ! "$EXECUTE" =~ ^[Yy]$ ]]; then
    echo "Transaction execution cancelled."
    exit 0
fi

# Combine signatures
echo -e "\n🔄 Combining signatures..."
MULTISIG_RESPONSE=$(eval "$COMBINE_CMD")
if [ $? -ne 0 ]; then
    echo "❌ Failed to combine signatures"
    echo "$MULTISIG_RESPONSE"
    exit 1
fi

# Extract serialized multisig from JSON response
SERIALIZED_MULTISIG=$(echo "$MULTISIG_RESPONSE" | jq -r '.multisigSerialized')
if [ -z "$SERIALIZED_MULTISIG" ] || [ "$SERIALIZED_MULTISIG" = "null" ]; then
    echo "❌ Failed to extract serialized multisig"
    exit 1
fi

# Execute the transaction
echo "🔄 Submitting transaction..."
EXECUTE_CMD="sui client execute-signed-tx --tx-bytes \"$TX_BYTES\" --signatures \"$SERIALIZED_MULTISIG\" --json"
RESPONSE=$(eval "$EXECUTE_CMD")

if [ $? -eq 0 ]; then
    TX_HASH=$(echo "$RESPONSE" | jq -r '.digest')
    echo "✅ Transaction successfully submitted"
    echo "📝 Transaction hash: $TX_HASH"

    # Clean up transaction directory
    echo "🧹 Cleaning up transaction files..."
    rm -rf "$TX_DIR"
    if [ $? -ne 0 ]; then
        echo "⚠️ Warning: Failed to clean up transaction directory"
    fi
else
    echo "❌ Failed to submit transaction"
    echo "❌ $RESPONSE"
    exit 1
fi