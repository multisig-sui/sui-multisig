#!/bin/bash
# Creates a multisig transaction

# Debug info
echo "Current directory: $(pwd)"
echo "Script directory: $SUI_MULTISIG_SCRIPTS_DIR"

# Source the helper script
SCRIPT_DIR="$SUI_MULTISIG_SCRIPTS_DIR"
echo "Full script directory: $SCRIPT_DIR"
echo "Helper script path: $SCRIPT_DIR/util/transaction_helpers.sh"

# Check if required environment variables are set
if [ -z "$SUI_MULTISIG_CONFIG_DIR" ] || [ -z "$SUI_MULTISIG_MULTISIGS_DIR" ] || [ -z "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please ensure SUI_MULTISIG_CONFIG_DIR, SUI_MULTISIG_MULTISIGS_DIR, and SUI_MULTISIG_TRANSACTIONS_DIR are set"
    exit 1
fi

# Ensure required directories exist
if [ ! -d "$SUI_MULTISIG_MULTISIGS_DIR" ]; then
    mkdir -p "$SUI_MULTISIG_MULTISIGS_DIR"
fi

if [ ! -d "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    mkdir -p "$SUI_MULTISIG_TRANSACTIONS_DIR"
fi

if [ ! -f "$SCRIPT_DIR/util/transaction_helpers.sh" ]; then
    echo "❌ Error: Helper script not found at $SCRIPT_DIR/util/transaction_helpers.sh"
    exit 1
fi

source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Define valid transaction types
VALID_TYPES=("publish" "upgrade" "call" "transfer")

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -t, --type TYPE        Transaction type (${VALID_TYPES[*]})"
    echo "  -b, --batch-file FILE  Create multiple transactions from JSON file"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Additional options will be passed to the transaction type script."
    echo "Run the specific transaction type script with --help to see its options."
    echo ""
    echo "Batch JSON file format:"
    echo '{
    "transactions": [
        {
            "type": "publish",
            "params": {
                "package": "path/to/package",
                "gas_budget": "100000000"
            }
        },
        {
            "type": "call",
            "params": {
                "package": "0x123...",
                "module": "example",
                "function": "do_something",
                "args": ["0x456...", "1000"],
                "gas_budget": "100000000"
            }
        }
    ]
}'
}

# Store original arguments
ORIGINAL_ARGS=("$@")

# Initialize variables
TRANSACTION_TYPE=""
BATCH_FILE=""

# Simple argument parsing for type and help
while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--type)
            TRANSACTION_TYPE="$2"
            shift 2
            ;;
        -b|--batch-file)
            BATCH_FILE="$2"
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

# Function to process batch file
process_batch_file() {
    local batch_file="$1"

    # Check if file exists
    if [ ! -f "$batch_file" ]; then
        echo "❌ Error: Batch file not found: $batch_file"
        exit 1
    fi

    # Validate JSON format
    if ! jq empty "$batch_file" 2>/dev/null; then
        echo "❌ Error: Invalid JSON format in batch file"
        exit 1
    fi

    # Check if transactions array exists
    if ! jq -e '.transactions' "$batch_file" >/dev/null 2>&1; then
        echo "❌ Error: Batch file must contain a 'transactions' array"
        exit 1
    fi

    # Process each transaction
    local tx_count=$(jq '.transactions | length' "$batch_file")
    echo "📦 Processing $tx_count transactions from batch file..."

    for ((i=0; i<tx_count; i++)); do
        local tx_type=$(jq -r ".transactions[$i].type" "$batch_file")
        local tx_params=$(jq -c ".transactions[$i].params" "$batch_file")

        # Validate transaction type
        if [[ ! " ${VALID_TYPES[@]} " =~ " ${tx_type} " ]]; then
            echo "❌ Invalid transaction type in batch file: $tx_type"
            continue
        fi

        echo -e "\n🔄 Processing transaction $((i+1))/$tx_count (type: $tx_type)..."

        # Convert JSON params to command line arguments
        local args=()
        while IFS= read -r line; do
            echo "--------------------------------"
            echo "line: $line"
            echo "--------------------------------"
            param_name=$(echo "$line" | jq -r '.key')
            param_value=$(echo "$line" | jq -r '.value')
            args+=("--$param_name" "$param_value")
        done < <(echo "$tx_params" | jq -c 'to_entries | map({key: .key, value: .value}) | .[]')

        # Debug output
        echo "--------------------------------"
        echo "AVH Arguments: ${args[*]}"
        echo "--------------------------------"

        # Execute the transaction
        export MULTISIG_ADDR
        "$SCRIPT_DIR/types/$tx_type.sh" "${args[@]}"

        if [ $? -eq 0 ]; then
            echo "✅ Transaction $((i+1)) completed successfully"
        else
            echo "❌ Transaction $((i+1)) failed"
        fi
    done
}

# If batch file is specified, process it
if [ -n "$BATCH_FILE" ]; then
    process_batch_file "$BATCH_FILE"
    exit 0
fi

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
    if [[ "${ORIGINAL_ARGS[$i]}" == "-t" || "${ORIGINAL_ARGS[$i]}" == "--type" ]] ||
       [[ "${ORIGINAL_ARGS[$i]}" == "-b" || "${ORIGINAL_ARGS[$i]}" == "--batch-file" ]]; then
        # Skip the argument and its value
        i=$((i + 2))
    else
        FILTERED_ARGS+=("${ORIGINAL_ARGS[$i]}")
        i=$((i + 1))
    fi
done

# Execute the appropriate transaction type script with filtered arguments and multisig address
echo -e "\n🔄 Executing $TRANSACTION_TYPE transaction..."
export MULTISIG_ADDR
"$SCRIPT_DIR/types/$TRANSACTION_TYPE.sh" "${FILTERED_ARGS[@]}"