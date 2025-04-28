#!/bin/bash
# Sets up a multisig wallet with multiple public keys and weights

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "This script will guide you through setting up a multisig wallet."
    echo "You'll need to provide:"
    echo "1. Public keys of all signers"
    echo "2. Weights for each key"
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

# Function to validate public key format
validate_public_key() {
    local key="$1"
    # Basic validation - check if it's a valid base64 string
    if ! echo "$key" | base64 -d &>/dev/null; then
        echo "❌ Invalid public key format. Please enter a valid base64 encoded key."
        return 1
    fi
    return 0
}

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

# Initialize arrays for public keys and weights
PUBLIC_KEYS=()
WEIGHTS=()

# Get number of signers
while true; do
    read -p "Enter number of signers: " NUM_SIGNERS
    if [[ "$NUM_SIGNERS" =~ ^[1-9][0-9]*$ ]]; then
        break
    else
        echo "❌ Please enter a positive integer"
    fi
done

# Collect public keys and weights
for ((i=1; i<=NUM_SIGNERS; i++)); do
    echo ""
    echo "Signer $i:"

    # Get public key
    while true; do
        read -p "Enter public key (base64): " PUBLIC_KEY
        if validate_public_key "$PUBLIC_KEY"; then
            PUBLIC_KEYS+=("$PUBLIC_KEY")
            break
        fi
    done

    # Get weight
    while true; do
        read -p "Enter weight for this key: " WEIGHT
        if validate_weight "$WEIGHT"; then
            WEIGHTS+=("$WEIGHT")
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
    echo ""
    echo "Total weight: $TOTAL_WEIGHT"
    read -p "Enter threshold (must be <= total weight): " THRESHOLD
    if validate_threshold "$THRESHOLD" "$TOTAL_WEIGHT"; then
        break
    fi
done

# Build the command
CMD="iota keytool multi-sig-address --threshold $THRESHOLD"

# Add public keys
for key in "${PUBLIC_KEYS[@]}"; do
    CMD="$CMD --pks $key"
done

# Add weights
for weight in "${WEIGHTS[@]}"; do
    CMD="$CMD --weights $weight"
done

# Execute the command
echo ""
echo "🔄 Generating multisig address..."
MULTISIG_ADDRESS=$(execute_command "$CMD" "Failed to generate multisig address")
if [ $? -ne 0 ]; then
    exit 1
fi

# Save the configuration
CONFIG_FILE="transactions/multisig_config_$(date +%Y%m%d_%H%M%S).json"
cat > "$CONFIG_FILE" << EOF
{
    "multisig_address": "$MULTISIG_ADDRESS",
    "threshold": $THRESHOLD,
    "signers": [
EOF

for ((i=0; i<NUM_SIGNERS; i++)); do
    cat >> "$CONFIG_FILE" << EOF
        {
            "public_key": "${PUBLIC_KEYS[$i]}",
            "weight": ${WEIGHTS[$i]}
        }$( [ $i -lt $((NUM_SIGNERS-1)) ] && echo "," )
EOF
done

cat >> "$CONFIG_FILE" << EOF
    ]
}
EOF

echo ""
echo "✅ Multisig setup complete!"
echo "📦 Multisig address: $MULTISIG_ADDRESS"
echo "🔑 Configuration saved to: $CONFIG_FILE"
echo ""
echo "Next steps:"
echo "1. Fund the multisig address with IOTA tokens"
echo "2. Use the multisig address in your transactions"