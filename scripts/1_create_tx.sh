#!/bin/bash
# Creates a multisig transaction

# Debug info
echo "Current directory: $(pwd)"
echo "Script directory: $(dirname "${BASH_SOURCE[0]}")"

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Full script directory: $SCRIPT_DIR"
echo "Helper script path: $SCRIPT_DIR/util/transaction_helpers.sh"

# Ensure we're in the workspace root (parent of scripts directory)
WORKSPACE_ROOT="$(dirname "$SCRIPT_DIR")"
echo "Workspace root: $WORKSPACE_ROOT"

if [ ! -d "$WORKSPACE_ROOT/scripts" ] || [ ! -d "$WORKSPACE_ROOT/multisigs" ]; then
    echo "❌ Error: Not in workspace root or missing required directories"
    echo "Please run this script from the workspace root directory"
    exit 1
fi

cd "$WORKSPACE_ROOT"
echo "Changed to workspace root: $(pwd)"

if [ ! -f "$SCRIPT_DIR/util/transaction_helpers.sh" ]; then
    echo "❌ Error: Helper script not found at $SCRIPT_DIR/util/transaction_helpers.sh"
    exit 1
fi

source "$SCRIPT_DIR/util/transaction_helpers.sh"

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
echo "📦 Address: $(echo "$CONFIG_CONTENT" | jq -r .multisigAddress)"
echo "🔐 Threshold: $(echo "$CONFIG_CONTENT" | jq -r .threshold)"
echo "👥 Signers: $(echo "$CONFIG_CONTENT" | jq -r '.multisig | length')"

# Define valid transaction types
VALID_TYPES=("publish" "upgrade" "call" "transfer")

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -t, --type TYPE    Transaction type (${VALID_TYPES[*]})"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Additional options will be passed to the transaction type script."
    echo "Run the specific transaction type script with --help to see its options."
}

# Store original arguments
ORIGINAL_ARGS=("$@")

# Initialize variables
TRANSACTION_TYPE=""

# Simple argument parsing for type and help
while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--type)
            TRANSACTION_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            # Skip other arguments
            shift
            ;;
    esac
done

# Function to select transaction type
select_transaction_type() {
    echo -e "\n📋 Select transaction type:"
    for i in "${!VALID_TYPES[@]}"; do
        echo "[$i] ${VALID_TYPES[$i]}"
    done

    while true; do
        read -p "Select type number: " selection
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#VALID_TYPES[@]}" ]; then
            TRANSACTION_TYPE="${VALID_TYPES[$selection]}"
            break
        else
            echo "❌ Invalid selection. Please enter a number between 0 and $((${#VALID_TYPES[@]}-1))"
        fi
    done
}

# If no type specified, prompt user
if [ -z "$TRANSACTION_TYPE" ]; then
    select_transaction_type
fi

# Validate transaction type
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TRANSACTION_TYPE} " ]]; then
    echo "❌ Invalid transaction type: $TRANSACTION_TYPE"
    echo "Valid types are: ${VALID_TYPES[*]}"
    exit 1
fi

# Filter out type-related arguments from ORIGINAL_ARGS
FILTERED_ARGS=()
i=0
while [ $i -lt ${#ORIGINAL_ARGS[@]} ]; do
    if [[ "${ORIGINAL_ARGS[$i]}" == "-t" || "${ORIGINAL_ARGS[$i]}" == "--type" ]]; then
        # Skip the type argument and its value
        i=$((i + 2))
    else
        FILTERED_ARGS+=("${ORIGINAL_ARGS[$i]}")
        i=$((i + 1))
    fi
done

# Add multisig address to filtered args (once we know how to pass it)
# TODO: Add proper flag for sender address once we know how

# Execute the appropriate transaction type script with filtered arguments
echo -e "\n🔄 Executing $TRANSACTION_TYPE transaction..."
"$SCRIPT_DIR/types/$TRANSACTION_TYPE.sh" "${FILTERED_ARGS[@]}"

# Save transaction data with multisig info
save_transaction_data() {
    local tx_data="$1"
    local tx_type="$2"
    local tx_name="$3"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    # Create directory name
    local tx_dir="transactions/tx_${tx_type}_${tx_name}_${timestamp}"
    mkdir -p "$tx_dir"

    # Save transaction bytes
    echo "$tx_data" > "$tx_dir/tx_bytes"

    # Save multisig config for reference
    echo "$CONFIG_CONTENT" > "$tx_dir/multisig_config.json"

    echo "💾 Transaction data saved to: $tx_dir/tx_bytes"
    echo "💾 Multisig config saved to: $tx_dir/multisig_config.json"
}
