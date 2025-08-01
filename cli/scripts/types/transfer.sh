#!/bin/bash
# Handles token transfer transactions

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../util/transaction_helpers.sh"

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -r, --recipient RECIPIENT    Recipient address (required)"
    echo "  -o, --object OBJECT          Object ID to transfer (required)"
    echo "  -ms, --multisig ADDRESS      Multisig wallet address (optional)"
    echo "  -h, --help                   Show this help message"
}

# Parse command line arguments
TEMP=$(getopt -o r:o:ms:h --long recipient:,object:,multisig:,help -n "$0" -- "$@")

if [ $? != 0 ]; then
    show_usage
    exit 1
fi

eval set -- "$TEMP"

# Initialize variables
RECIPIENT=""
OBJECT_ID=""

# Process options
while true; do
    case "$1" in
        -r|--recipient)
            RECIPIENT="$2"
            shift 2
            ;;
        -o|--object)
            OBJECT_ID="$2"
            shift 2
            ;;
        -ms|--multisig)
            MULTISIG_ADDR="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        --)
            shift
            break
            ;;
        *)
            echo "Internal error!"
            exit 1
            ;;
    esac
done

# Function to prompt for recipient address
prompt_recipient() {
    while true; do
        read -p "Enter the recipient address (starting with 0x): " RECIPIENT
        if validate_hex_address "$RECIPIENT"; then
            break
        fi
    done
}

# Function to prompt for object ID
prompt_object() {
    while true; do
        read -p "Enter the object ID to transfer (starting with 0x): " OBJECT_ID
        if validate_hex_address "$OBJECT_ID"; then
            break
        fi
    done
}

# If recipient not provided, prompt for it
if [ -z "$RECIPIENT" ]; then
    prompt_recipient
fi

# If object ID not provided, prompt for it
if [ -z "$OBJECT_ID" ]; then
    prompt_object
fi

# Check if MULTISIG_ADDR is set (should be set by parent script)
if [ -z "$MULTISIG_ADDR" ]; then
    echo "❌ Error: MULTISIG_ADDR environment variable not set"
    exit 1
fi

# Build and execute the Sui CLI command
CMD="sui client transfer --to $RECIPIENT --object-id $OBJECT_ID --serialize-unsigned-transaction --sender $MULTISIG_ADDR"
TRANSACTION_DATA=$(execute_command "$CMD" "Failed to generate transaction data" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "$TRANSACTION_DATA"
    exit 1
fi

# Store the transaction data
echo "✅ Transaction data generated successfully"

# Save the transaction data
save_transaction_data "$TRANSACTION_DATA" "transfer" "$RECIPIENT"

# Show next steps
show_next_steps