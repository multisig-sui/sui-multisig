#!/bin/bash
# Handles smart contract call transactions

# Source the helper script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../util/transaction_helpers.sh"

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -p, --package PACKAGE    Package address (required)"
    echo "  -m, --module MODULE      Module name (required)"
    echo "  -f, --function FUNCTION  Function name (required)"
    echo "  -a, --args ARGS          Function arguments (space separated)"
    echo "  -h, --help               Show this help message"
}

# Parse command line arguments
TEMP=$(getopt -o p:m:f:a:h --long package:,module:,function:,args:,help -n "$0" -- "$@")

if [ $? != 0 ]; then
    show_usage
    exit 1
fi

eval set -- "$TEMP"

# Initialize variables
PACKAGE_ADDRESS=""
MODULE_NAME=""
FUNCTION_NAME=""
MULTISIG_ADDR=""
ARGS=()

# Process options
while true; do
    case "$1" in
        -p|--package)
            PACKAGE_ADDRESS="$2"
            shift 2
            ;;
        -m|--module)
            MODULE_NAME="$2"
            shift 2
            ;;
        -f|--function)
            FUNCTION_NAME="$2"
            shift 2
            ;;
        -ms|--multisig)
            MULTISIG_ADDR="$2"
            shift 2
            ;;
        -a|--args)
            ARGS=($2)
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

# Function to prompt for package address
prompt_package_address() {
    while true; do
        read -p "Enter the package address (starting with 0x): " PACKAGE_ADDRESS
        if validate_hex_address "$PACKAGE_ADDRESS"; then
            break
        fi
    done
}

# Function to fetch package object
fetch_package_object() {
    echo "🔄 Fetching package object for address: $PACKAGE_ADDRESS"
    PACKAGE_OBJECT=$(iota client object "$PACKAGE_ADDRESS" --json)
    if [ $? -ne 0 ]; then
        exit 1
    fi
}

# Function to select module
select_module() {
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
            MODULE_NAME="${module_array[$selection]}"
            break
        else
            echo "❌ Invalid selection. Please enter a number between 0 and $((${#module_array[@]}-1))"
        fi
    done
}

# Function to select function
select_function() {
    # Extract functions from the selected module
    MODULE_CONTENT=$(echo "$PACKAGE_OBJECT" | jq -r ".content.disassembled.\"$MODULE_NAME\"")
    FUNCTIONS=$(echo "$MODULE_CONTENT" | grep -o "entry public [a-zA-Z0-9_]*" | sed 's/entry public //')

    # Print all available functions
    echo "📋 Available functions in module $MODULE_NAME:"
    function_array=($FUNCTIONS)
    for i in "${!function_array[@]}"; do
        echo "[$i] ${function_array[$i]}"
    done

    # Prompt user to select a function
    while true; do
        read -p "Select function number: " selection
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#function_array[@]}" ]; then
            FUNCTION_NAME="${function_array[$selection]}"
            break
        else
            echo "❌ Invalid selection. Please enter a number between 0 and $((${#function_array[@]}-1))"
        fi
    done
}

# Function to prompt for function arguments
prompt_arguments() {
    # Extract function parameters
    FUNCTION_DEF=$(echo "$MODULE_CONTENT" | grep -A 10 "entry public $FUNCTION_NAME")
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
                read -p "Enter value: " param_value
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
}

# Check if MULTISIG_ADDR is set
if [ -z "$MULTISIG_ADDR" ]; then
    select_multisig_wallet
fi
echo "MULTISIG_ADDR: $MULTISIG_ADDR"

# If package address not provided, prompt for it
if [ -z "$PACKAGE_ADDRESS" ]; then
    prompt_package_address
fi

# Fetch package object (needed for both module and function selection)
fetch_package_object

# If module not provided, select it
if [ -z "$MODULE_NAME" ]; then
    select_module
fi

# If function not provided, select it
if [ -z "$FUNCTION_NAME" ]; then
    select_function
fi

# If no arguments provided, prompt for them
if [ ${#ARGS[@]} -eq 0 ]; then
    prompt_arguments
fi

# Build the IOTA CLI command
CMD="iota client call --package $PACKAGE_ADDRESS --module $MODULE_NAME --function $FUNCTION_NAME --serialize-unsigned-transaction --custom-signer $MULTISIG_ADDR"
# Add arguments if any
if [ ${#ARGS[@]} -gt 0 ]; then
    CMD="$CMD --args"
    for arg in "${ARGS[@]}"; do
        CMD="$CMD $arg"
    done
fi

# Generate transaction data
TRANSACTION_DATA=$(execute_command "$CMD" "Failed to generate transaction data")
if [ $? -ne 0 ]; then
    exit 1
fi

# Store the transaction data
echo "✅ Transaction data generated successfully"
echo "📦 Package address: $PACKAGE_ADDRESS"
echo "🔑 Module: $MODULE_NAME"
echo "🔑 Function: $FUNCTION_NAME"

if [ ${#ARGS[@]} -gt 0 ]; then
    echo "📝 Function arguments:"
    for arg in "${ARGS[@]}"; do
        echo "  • $arg"
    done
fi


# Save the transaction data
save_transaction_data "$TRANSACTION_DATA" "call" "${MODULE_NAME}_${FUNCTION_NAME}"

# Show next steps
show_next_steps