#!/bin/bash
# Handles smart contract upgrade transactions

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../util/transaction_helpers.sh"

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -d, --directory DIRECTORY    Package directory path (required)"
    echo "  -c, --capability CAPABILITY  Upgrade capability object ID (required)"
    echo "  -h, --help                   Show this help message"
}

# Parse command line arguments
TEMP=$(getopt -o d:c:h --long directory:,capability:,help -n "$0" -- "$@")

if [ $? != 0 ]; then
    show_usage
    exit 1
fi

eval set -- "$TEMP"

# Initialize variables
PACKAGE_DIR=""
UPGRADE_CAPABILITY=""
MULTISIG_ADDR=""

# Process options
while true; do
    case "$1" in
        -d|--directory)
            PACKAGE_DIR="$2"
            shift 2
            ;;
        -c|--capability)
            UPGRADE_CAPABILITY="$2"
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

# Function to prompt for package directory
prompt_package_dir() {
    while true; do
        read -p "Enter the package directory path: " PACKAGE_DIR
        if validate_directory "$PACKAGE_DIR"; then
            break
        fi
    done
}

# Function to prompt for upgrade capability
prompt_upgrade_capability() {
    while true; do
        read -p "Enter the upgrade capability object ID (starting with 0x): " UPGRADE_CAPABILITY
        if validate_hex_address "$UPGRADE_CAPABILITY"; then
            break
        fi
    done
}

# Check if MULTISIG_ADDR is set
if [ -z "$MULTISIG_ADDR" ]; then
    select_multisig_wallet
fi

# If package directory not provided, prompt for it
if [ -z "$PACKAGE_DIR" ]; then
    prompt_package_dir
fi

# If upgrade capability not provided, prompt for it
if [ -z "$UPGRADE_CAPABILITY" ]; then
    prompt_upgrade_capability
fi

# Build and execute the Sui CLI command
CMD="sui client upgrade --upgrade-capability $UPGRADE_CAPABILITY \"$PACKAGE_DIR\" --serialize-unsigned-transaction --override-sender $MULTISIG_ADDR"
TRANSACTION_DATA=$(execute_command "$CMD" "Failed to generate transaction data")
if [ $? -ne 0 ]; then
    exit 1
fi

# Store the transaction data
echo "✅ Transaction data generated successfully"
echo "📦 Package directory: $PACKAGE_DIR"
echo "🔑 Upgrade capability: $UPGRADE_CAPABILITY"
echo "🔑 Multisig address: $MULTISIG_ADDR"

# Save the transaction data
save_transaction_data "$TRANSACTION_DATA" "upgrade" "$(basename "$PACKAGE_DIR")"

# Show next steps
show_next_steps