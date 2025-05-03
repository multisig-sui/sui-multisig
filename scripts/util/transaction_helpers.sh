#!/bin/bash
# Common transaction handling functions

# Store the original directory
ORIGINAL_DIR="$(pwd)"

# Function to execute a command and handle errors
execute_command() {
    local cmd="$1"
    local error_msg="$2"

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

    # Create timestamp
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    # Create transaction directory
    local tx_dir="transactions/tx_${transaction_type}_${additional_info}_${timestamp}"
    mkdir -p "$tx_dir"

    # Save the transaction bytes
    echo "$transaction_data" > "$tx_dir/tx_bytes"

    echo "💾 Transaction data saved to: $tx_dir/tx_bytes"
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

# Function to select an address
# Returns: "<name>|<address>" or empty if cancelled
select_address() {
    local prompt_msg="${1:-Enter address name (or press enter for active address): }"

    # Get addresses from iota client
    local ADDRESSES_JSON
    ADDRESSES_JSON=$(iota client addresses --json)
    if [ $? -ne 0 ]; then
        echo "❌ Failed to get addresses" >&2
        return 1
    fi

    local ACTIVE_ADDRESS
    ACTIVE_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r '.activeAddress')

    # Show available addresses
    echo -e "\n📋 Available addresses:"
    echo "------------------------"
    while IFS= read -r line; do
        NAME=$(echo "$line" | cut -d'|' -f1)
        ADDR=$(echo "$line" | cut -d'|' -f2)
        if [ "$ADDR" = "$ACTIVE_ADDRESS" ]; then
            echo "* $NAME: $ADDR (active)"
        else
            echo "  $NAME: $ADDR"
        fi
    done < <(echo "$ADDRESSES_JSON" | jq -r '.addresses[] | "\(.[0])|\(.[1])"')
    echo "------------------------"

    # Prompt for address selection
    local ADDR_NAME
    read -p "$prompt_msg" ADDR_NAME

    # Get name of active address if no input
    if [ -z "$ADDR_NAME" ]; then
        local ACTIVE_NAME
        ACTIVE_NAME=$(echo "$ADDRESSES_JSON" | jq -r --arg addr "$ACTIVE_ADDRESS" '.addresses[] | select(.[1] == $addr) | .[0]')
        if [ -n "$ACTIVE_NAME" ]; then
            echo "${ACTIVE_NAME}|${ACTIVE_ADDRESS}"
            return 0
        fi
        echo "❌ Could not find active address name" >&2
        return 1
    fi

    # Find address by name
    local SELECTED_INFO
    SELECTED_INFO=$(echo "$ADDRESSES_JSON" | jq -r --arg name "$ADDR_NAME" '.addresses[] | select(.[0] == $name) | "\(.[0])|\(.[1])"')
    if [ -z "$SELECTED_INFO" ] || [ "$SELECTED_INFO" = "|" ]; then
        echo "❌ Address name not found" >&2
        return 1
    fi

    echo "$SELECTED_INFO"
    return 0
}