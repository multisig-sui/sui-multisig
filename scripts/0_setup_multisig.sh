#!/bin/bash
# Sets up a multisig wallet with multiple public keys and weights

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Create required directories
echo "🔄 Setting up directories..."
mkdir -p multisigs
if [ $? -ne 0 ]; then
    echo "❌ Failed to create multisigs directory"
    exit 1
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "This script will guide you through setting up a multisig wallet."
    echo "You'll need to provide:"
    echo "1. Select which addresses to include"
    echo "2. Weights for each address"
    echo "3. Threshold for transaction approval"
}

# Parse command line arguments
TEMP=$(getopt -o h --long help -n "$0" -- "$@")

if [ $? != 0 ]; then
    show_usage
    exit 1
fi

eval set -- "$TEMP"

# Process options
while true; do
    case "$1" in
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

# Function to validate weight
validate_weight() {
    local weight="$1"
    if ! [[ "$weight" =~ ^[1-9][0-9]*$ ]]; then
        echo "❌ Invalid weight. Please enter a positive integer."
        return 1
    fi
    return 0
}

# Function to validate threshold
validate_threshold() {
    local threshold="$1"
    local total_weight="$2"

    if ! [[ "$threshold" =~ ^[1-9][0-9]*$ ]]; then
        echo "❌ Invalid threshold. Please enter a positive integer."
        return 1
    fi

    if [ "$threshold" -gt "$total_weight" ]; then
        echo "❌ Threshold cannot be greater than total weight ($total_weight)"
        return 1
    fi

    return 0
}

# Get addresses from sui client
ADDRESSES_JSON=$(sui client addresses --json)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get addresses"
    exit 1
fi

# Extract addresses and names into arrays
readarray -t ADDR_NAMES < <(echo "$ADDRESSES_JSON" | jq -r '.addresses[][0]')
readarray -t ADDRESSES < <(echo "$ADDRESSES_JSON" | jq -r '.addresses[][1]')
ACTIVE_ADDRESS=$(echo "$ADDRESSES_JSON" | jq -r '.activeAddress')

if [ ${#ADDRESSES[@]} -eq 0 ]; then
    echo "❌ No addresses found"
    exit 1
fi

# Show available addresses
echo "Available addresses:"
echo "------------------"
for i in "${!ADDRESSES[@]}"; do
    echo "[$i] ${ADDR_NAMES[$i]}: ${ADDRESSES[$i]}"
done
echo "------------------"
echo "Active address: $ACTIVE_ADDRESS"

# Initialize arrays for selected addresses and weights
SELECTED_NAMES=()
SELECTED_ADDRESSES=()
WEIGHTS=()

# Let user select addresses and assign weights
while true; do
    echo -e "\nSelect addresses to include in multisig (or press enter when done):"
    read -p "Enter address number: " selection

    if [ -z "$selection" ]; then
        if [ ${#SELECTED_ADDRESSES[@]} -eq 0 ]; then
            echo "❌ Please select at least one address"
            continue
        fi
        break
    fi

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -ge "${#ADDRESSES[@]}" ]; then
        echo "❌ Invalid selection"
        continue
    fi

    # Check if address already selected
    if [[ " ${SELECTED_ADDRESSES[@]} " =~ " ${ADDRESSES[$selection]} " ]]; then
        echo "❌ This address is already selected"
        continue
    fi

    # Get weight for this address
    while true; do
        read -p "Enter weight for ${ADDR_NAMES[$selection]}: " weight
        if validate_weight "$weight"; then
            SELECTED_NAMES+=("${ADDR_NAMES[$selection]}")
            SELECTED_ADDRESSES+=("${ADDRESSES[$selection]}")
            WEIGHTS+=("$weight")
            break
        fi
    done
done

# Calculate total weight
TOTAL_WEIGHT=0
for weight in "${WEIGHTS[@]}"; do
    TOTAL_WEIGHT=$((TOTAL_WEIGHT + weight))
done

# Get threshold
while true; do
    echo -e "\nTotal weight: $TOTAL_WEIGHT"
    read -p "Enter threshold (must be <= total weight): " THRESHOLD
    if validate_threshold "$THRESHOLD" "$TOTAL_WEIGHT"; then
        break
    fi
done

# Get public keys for selected addresses
echo -e "\n🔄 Getting public keys for selected addresses..."
KEYS_JSON=$(sui keytool list --json)
if [ $? -ne 0 ]; then
    echo "❌ Failed to get public keys"
    exit 1
fi

declare -A PUB_KEYS
for addr in "${SELECTED_ADDRESSES[@]}"; do
    PUB_KEY=$(echo "$KEYS_JSON" | jq -r --arg addr "$addr" '.[] | select(.suiAddress == $addr) | .publicBase64Key')
    if [ -z "$PUB_KEY" ]; then
        echo "❌ Failed to get public key for address: $addr"
        exit 1
    fi
    PUB_KEYS["$addr"]="$PUB_KEY"
done

# Build the command
CMD="sui keytool multi-sig-address --threshold $THRESHOLD"

# Add public keys and weights
for addr in "${SELECTED_ADDRESSES[@]}"; do
    CMD="$CMD --pks ${PUB_KEYS[$addr]}"
done

for weight in "${WEIGHTS[@]}"; do
    CMD="$CMD --weights $weight"
done

# Add JSON flag
CMD="$CMD --json"

# Execute the command
echo -e "\n🔄 Generating multisig address..."
echo "$CMD"
MULTISIG_RESPONSE=$(eval "$CMD")
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate multisig address"
    echo "$MULTISIG_RESPONSE"
    exit 1
fi

# Extract multisig address for the filename
MULTISIG_ADDRESS=$(echo "$MULTISIG_RESPONSE" | jq -r '.multisigAddress')
if [ -z "$MULTISIG_ADDRESS" ] || [ "$MULTISIG_ADDRESS" = "null" ]; then
    echo "❌ Failed to extract multisig address from response"
    exit 1
fi

# Create multisigs directory if it doesn't exist
mkdir -p multisigs

# Prompt for custom name
echo -e "\n📝 Enter a name for this multisig wallet"
echo "   (press enter to use the address as name)"
read -p "> " WALLET_NAME

# Determine filename
if [ -z "$WALLET_NAME" ]; then
    CONFIG_FILE="multisigs/${MULTISIG_ADDRESS#0x}.json"
else
    # Replace spaces with underscores and remove special characters
    WALLET_NAME=$(echo "$WALLET_NAME" | tr ' ' '_' | tr -cd '[:alnum:]_-')
    CONFIG_FILE="multisigs/${WALLET_NAME}.json"
fi

# Check if file already exists
if [ -f "$CONFIG_FILE" ]; then
    echo "❌ A wallet with this name already exists"
    exit 1
fi

# Add threshold to the JSON response
MULTISIG_RESPONSE=$(echo "$MULTISIG_RESPONSE" | jq --arg threshold "$THRESHOLD" '. + {threshold: ($threshold|tonumber)}')

echo "$MULTISIG_RESPONSE" > "$CONFIG_FILE"

# Fund the multisig address with Sui tokens
echo -e "\n🔄 Funding multisig address..."

# First try faucet
FAUCET_RESPONSE=$(sui client faucet --address $MULTISIG_ADDRESS 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Successfully funded multisig address from faucet"
else
    echo "⚠️ Faucet funding failed, attempting to fund directly from active wallet..."

    # Get current gas balance
    GAS_RESPONSE=$(sui client gas --json)
    if [ $? -ne 0 ]; then
        echo "❌ Failed to get gas balance"
        echo "⚠️ Original faucet error: $FAUCET_RESPONSE"
        echo "Continuing with setup..."
    else
        # Extract first gas coin ID and balance
        FIRST_GAS_COIN=$(echo "$GAS_RESPONSE" | jq -r '.[0].gasCoinId')
        BALANCE=$(echo "$GAS_RESPONSE" | jq -r '.[0].balance')

        if [ -z "$FIRST_GAS_COIN" ] || [ "$FIRST_GAS_COIN" = "null" ]; then
            echo "❌ No gas coins available"
            echo "⚠️ Original faucet error: $FAUCET_RESPONSE"
            echo "Continuing with setup..."
        else
            # Determine amount to send (minimum of 0.1 SUI or available balance)
            AMOUNT_TO_SEND=100000000  # 0.1 SUI in MIST
            if [ "$BALANCE" -lt "$AMOUNT_TO_SEND" ]; then
                AMOUNT_TO_SEND=$BALANCE
            fi

            # Send funds to multisig address
            echo "🔄 Sending $AMOUNT_TO_SEND MIST to multisig address..."
            PAYMENT_RESPONSE=$(sui client transfer-sui --sui-coin-object-id $FIRST_GAS_COIN --amount $AMOUNT_TO_SEND --to $MULTISIG_ADDRESS --gas-budget 50000000)
            if [ $? -eq 0 ]; then
                echo "✅ Successfully funded multisig address with $AMOUNT_TO_SEND MIST"
            else
                echo "❌ Failed to send funds to multisig address"
                echo "⚠️ Original faucet error: $FAUCET_RESPONSE"
                echo "Continuing with setup..."
            fi
        fi
    fi
fi

echo -e "\n✅ Multisig setup complete!"
echo "📦 Multisig address: $MULTISIG_ADDRESS"
echo "🔑 Configuration saved to: $CONFIG_FILE"
echo ""
echo "Next steps:"
echo "1. Fund the multisig address with SUI tokens"
echo "2. Use the multisig address in your transactions"