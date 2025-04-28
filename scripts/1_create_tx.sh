#!/bin/bash
# Creates a multisig transaction

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# source "$SCRIPT_DIR/util/multisig_helpers.sh"

# initialize_environment

# # Select profile and multisig address (will check env vars internally)
# select_profile
# select_multisig

while true; do
    read -p "Enter the package address (starting with 0x): " PACKAGE_ADDRESS
    if [[ "$PACKAGE_ADDRESS" =~ ^0x[a-fA-F0-9]+$ ]]; then
        break
    else
        echo "❌ Invalid address format. Please enter a valid address starting with 0x."
    fi
done

# Fetch the package object
echo "🔄 Fetching package object for address: $PACKAGE_ADDRESS"
PACKAGE_OBJECT=$(iota client object "$PACKAGE_ADDRESS" --json)

# Check if the request was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch package object"
    exit 1
fi

# Extract modules from the disassembled content
MODULES=$(echo "$PACKAGE_OBJECT" | jq -r '.content.disassembled | keys[]')

# Print all available modules
echo "📋 Available modules:"
module_array=($MODULES)
for i in "${!module_array[@]}"; do
    echo "[$i] ${module_array[$i]}"
done

# Prompt user to select a module
while true; do
    read -p "Select module number: " selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#module_array[@]}" ]; then
        SELECTED_MODULE="${module_array[$selection]}"
        break
    else
        echo "❌ Invalid selection. Please enter a number between 0 and $((${#module_array[@]}-1))"
    fi
done

# Extract functions from the selected module
MODULE_CONTENT=$(echo "$PACKAGE_OBJECT" | jq -r ".content.disassembled.\"$SELECTED_MODULE\"")
FUNCTIONS=$(echo "$MODULE_CONTENT" | grep -o "entry public [a-zA-Z0-9_]*" | sed 's/entry public //')

# Print all available functions
echo "📋 Available functions in module $SELECTED_MODULE:"
function_array=($FUNCTIONS)
for i in "${!function_array[@]}"; do
    echo "[$i] ${function_array[$i]}"
done

# Prompt user to select a function
while true; do
    read -p "Select function number: " selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#function_array[@]}" ]; then
        SELECTED_FUNCTION="${function_array[$selection]}"
        break
    else
        echo "❌ Invalid selection. Please enter a number between 0 and $((${#function_array[@]}-1))"
    fi
done

echo "✅ Selected module: $SELECTED_MODULE"
echo "✅ Selected function: $SELECTED_FUNCTION"

# Extract function parameters
FUNCTION_DEF=$(echo "$MODULE_CONTENT" | grep -A 10 "entry public $SELECTED_FUNCTION")
# Extract parameters but ignore &mut TxContext
PARAMS=$(echo "$FUNCTION_DEF" | grep -o "Arg[0-9]*: [^,)]*" | sed 's/Arg[0-9]*: //' | grep -v "&mut TxContext")

# Initialize arguments array
ARGS=()

# Process each parameter
if [ -n "$PARAMS" ]; then
    echo "📝 Please provide arguments for the function:"
    param_num=1
    while IFS= read -r param_type; do
        # Skip empty lines and &signer parameter
        if [ -z "$param_type" ] || [ "$param_type" = "&signer" ]; then
            continue
        fi

        # Clean up the parameter type display
        display_type=$(echo "$param_type" | sed 's/&mut //' | sed 's/&//')
        echo "Parameter $param_num: $display_type"

        # Check if this is an Option type
        if [[ "$param_type" == *"option::Option<"* ]]; then
            read -p "Enter value (leave empty for None): " param_value

            # If empty, use [] to represent None
            if [ -z "$param_value" ]; then
                param_value="[]"
            fi
        else
            # For Counter type, we need the object ID
            if [[ "$param_type" == *"Counter"* ]]; then
                read -p "Enter Counter object ID (starting with 0x): " param_value
                # Validate it's a hex address
                if [[ ! "$param_value" =~ ^0x[a-fA-F0-9]+$ ]]; then
                    echo "❌ Invalid Counter object ID format. Please enter a valid address starting with 0x."
                    continue
                fi
            else
                read -p "Enter value: " param_value
            fi
        fi

        # Allow quitting
        if [ "$param_value" = "q" ]; then
            echo "❌ Aborting function selection"
            exit 1
        fi

        ARGS+=("$param_value")
        ((param_num++))
    done <<< "$PARAMS"
else
    echo "ℹ️  Function takes no parameters (excluding &mut TxContext)"
fi

# Build the IOTA CLI command
CMD="iota client call --package $PACKAGE_ADDRESS --module $SELECTED_MODULE --function $SELECTED_FUNCTION --serialize-unsigned-transaction"

# Add arguments if any
if [ ${#ARGS[@]} -gt 0 ]; then
    CMD="$CMD --args"
    for arg in "${ARGS[@]}"; do
        CMD="$CMD $arg"
    done
fi

# Generate transaction data
echo "🔐 Generating transaction data..."
echo "Executing: $CMD"
TRANSACTION_DATA=$(eval "$CMD")

# Check if transaction generation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate transaction data"
    echo "$TRANSACTION_DATA"
    exit 1
fi

# Store the transaction data
echo "✅ Transaction data generated successfully"
echo "📦 Package address: $PACKAGE_ADDRESS"
echo "🔑 Module: $SELECTED_MODULE"
echo "🔑 Function: $SELECTED_FUNCTION"

if [ ${#ARGS[@]} -gt 0 ]; then
    echo "📝 Function arguments:"
    for arg in "${ARGS[@]}"; do
        echo "  • $arg"
    done
fi

echo "🔍 Transaction data:"
echo "$TRANSACTION_DATA"

# Store the transaction data in a file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TRANSACTION_FILE="tx_${PACKAGE_ADDRESS}_${SELECTED_MODULE}_${SELECTED_FUNCTION}_${TIMESTAMP}.json"
echo "$TRANSACTION_DATA" > "$TRANSACTION_FILE"
echo "💾 Transaction data saved to: $TRANSACTION_FILE"

echo "🔍 Next steps:"
echo "1. To approve this transaction, run: ./scripts/2_approve_tx.sh"
echo "2. Once enough approvals are collected, execute with: ./scripts/3_execute_tx.sh"
