#!/bin/bash
# Handles smart contract publish transactions

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../util/transaction_helpers.sh"

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -d, --directory DIRECTORY    Package directory path (required)"
    echo "  -h, --help                   Show this help message"
}

# Parse command line arguments
TEMP=$(getopt -o d:h --long directory:,help -n "$0" -- "$@")

if [ $? != 0 ]; then
    show_usage
    exit 1
fi

eval set -- "$TEMP"

# Initialize variables
PACKAGE_DIR=""

# Process options
while true; do
    case "$1" in
        -d|--directory)
            PACKAGE_DIR="$2"
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

# If package directory not provided, prompt for it
if [ -z "$PACKAGE_DIR" ]; then
    prompt_package_dir
fi

# Build and execute the IOTA CLI command
CMD="iota client publish \"$PACKAGE_DIR\" --serialize-unsigned-transaction"
TRANSACTION_DATA=$(execute_command "$CMD" "Failed to generate transaction data")
if [ $? -ne 0 ]; then
    exit 1
fi

# Save the transaction data
save_transaction_data "$TRANSACTION_DATA" "publish" "$(basename "$PACKAGE_DIR")"

# Show next steps
show_next_steps