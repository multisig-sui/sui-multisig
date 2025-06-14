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

    # Check if required environment variables are set
    if [ -z "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
        echo "❌ Error: SUI_MULTISIG_TRANSACTIONS_DIR environment variable not set"
        return 1
    fi

    # Create transactions directory if it doesn't exist
    mkdir -p "$SUI_MULTISIG_TRANSACTIONS_DIR"

    # Create timestamp
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    # Create transaction directory
    local tx_dir="$SUI_MULTISIG_TRANSACTIONS_DIR/tx_${timestamp}_${transaction_type}_${additional_info}"
    mkdir -p "$tx_dir"

    # Save the transaction bytes
    echo "$transaction_data" > "$tx_dir/tx_bytes"

    echo "💾 Transaction data saved to: $tx_dir/tx_bytes"
}

# Function to show next steps
show_next_steps() {
    echo "🔍 Next steps:"
    echo "1. To approve this transaction, run: sui-multisig approve"
    echo "2. Once enough approvals are collected, execute with: sui-multisig execute"
}

show_final_steps() {
    echo "🔍 Next step: Once enough approvals are collected, execute with: sui-multisig execute"
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

    # Get addresses from Sui client
    local ADDRESSES_JSON
    ADDRESSES_JSON=$(sui client addresses --json)
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

# Function to decode and display transaction details
decode_and_display_tx() {
    local tx_bytes="$1"

    echo -e "\n📄 Transaction Details:"
    echo "------------------------"
    local tx_info
    tx_info=$(sui keytool decode-or-verify-tx --tx-bytes "$tx_bytes" --json)
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to decode transaction"
        return 1
    fi

    # Extract and display relevant transaction info
    echo "$tx_info" | jq -r '
        .tx.V1 |
        "Type: \(.kind | keys[0])",
        "Sender: \(.sender)",
        "Gas Budget: \(.gas_data.budget)",
        if .kind.ProgrammableTransaction then
            "Commands:",
            (.kind.ProgrammableTransaction.commands[] |
                if .MoveCall then
                    "  • Call \(.MoveCall.package):\(.MoveCall.module)::\(.MoveCall.function)()"
                else
                    "  • \(. | keys[0])"
                end)
        else
            "Commands: None"
        end
    '
    echo "------------------------"
    return 0
}

# Function to select multisig wallet
select_multisig_wallet() {
    # Check if multisigs directory exists
    if [ ! -d "$SUI_MULTISIG_MULTISIGS_DIR" ]; then
        echo "❌ Error: No multisigs directory found in ~/.sui-multisig"
        echo "Please run sui-multisig setup first to create a multisig wallet"
        exit 1
    fi

    # Find all JSON files in multisigs directory
    CONFIG_FILES=("$SUI_MULTISIG_MULTISIGS_DIR"/*.json)
    if [ ! -f "${CONFIG_FILES[0]}" ]; then
        echo "❌ Error: No multisig wallets found in ~/.sui-multisig/multisigs"
        echo "Please run sui-multisig setup first to create a multisig wallet"
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

                MULTISIG_ADDR=$(echo "$CONFIG_CONTENT" | jq -r '.multisigAddress')
                break
            else
                echo "❌ Error: Selected config file not found"
            fi
        else
            echo "❌ Invalid selection. Please enter a number between 0 and $((${#CONFIG_FILES[@]}-1))"
        fi
    done

    echo -e "\n💼 Using multisig wallet: $(basename "$CONFIG_FILE")"
    echo "📦 Address: $MULTISIG_ADDR"
    echo "🔐 Threshold: $(echo "$CONFIG_CONTENT" | jq -r '.threshold')"
    echo "👥 Signers: $(echo "$CONFIG_CONTENT" | jq -r '.multisig | length')"
}