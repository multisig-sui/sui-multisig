#!/bin/bash
# Common transaction handling functions

# Store the original directory
ORIGINAL_DIR="$(pwd)"

# Function to execute a command and handle errors
execute_command() {
    local cmd="$1"
    local error_msg="$2"

    echo "🔐 Generating transaction data..."
    echo "Executing: $cmd"
    local result
    result=$(eval "$cmd")

    if [ $? -ne 0 ]; then
        echo "❌ $error_msg"
        echo "$result"
        return 1
    fi

    echo "$result"
    return 0
}

# Function to save transaction data
save_transaction_data() {
    local transaction_data="$1"
    local transaction_type="$2"
    local additional_info="$3"

    # Create transactions directory if it doesn't exist
    mkdir -p transactions

    # Create filename with timestamp and optional additional info
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local filename="transactions/tx_${transaction_type}_${additional_info}_${timestamp}.json"

    # Save the transaction data
    echo "$transaction_data" > "$filename"
    echo "💾 Transaction data saved to: $filename"
}

# Function to show next steps
show_next_steps() {
    echo "🔍 Next steps:"
    echo "1. To approve this transaction, run: ./scripts/2_approve_tx.sh"
    echo "2. Once enough approvals are collected, execute with: ./scripts/3_execute_tx.sh"
}

# Function to validate hex address
validate_hex_address() {
    local address="$1"
    if [[ ! "$address" =~ ^0x[a-fA-F0-9]+$ ]]; then
        echo "❌ Invalid address format. Please enter a valid address starting with 0x."
        return 1
    fi
    return 0
}

# Function to validate directory exists
validate_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo "❌ Directory does not exist: $dir"
        return 1
    fi
    return 0
}

# Function to change directory with error handling
safe_cd() {
    local dir="$1"
    local error_msg="$2"

    echo "📁 Changing to directory: $dir"
    if ! cd "$dir"; then
        echo "❌ $error_msg"
        return 1
    fi
    return 0
}

# Function to return to original directory
return_to_original_dir() {
    if ! cd "$ORIGINAL_DIR"; then
        echo "❌ Failed to change back to original directory"
        return 1
    fi
    return 0
}