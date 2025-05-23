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

# Execute the appropriate transaction type script with filtered arguments and multisig address
echo -e "\n🔄 Executing $TRANSACTION_TYPE transaction..."
export MULTISIG_ADDR
"$SCRIPT_DIR/types/$TRANSACTION_TYPE.sh" "${FILTERED_ARGS[@]}"