#!/bin/bash
# Creates a multisig transaction

# Debug info
echo "Current directory: $(pwd)"
echo "Script directory: $SUI_MULTISIG_SCRIPTS_DIR"

# Source the helper script
SCRIPT_DIR="$SUI_MULTISIG_SCRIPTS_DIR"
echo "Full script directory: $SCRIPT_DIR"
echo "Helper script path: $SCRIPT_DIR/util/transaction_helpers.sh"

# Check if required environment variables are set
if [ -z "$SUI_MULTISIG_CONFIG_DIR" ] || [ -z "$SUI_MULTISIG_MULTISIGS_DIR" ] || [ -z "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please ensure SUI_MULTISIG_CONFIG_DIR, SUI_MULTISIG_MULTISIGS_DIR, and SUI_MULTISIG_TRANSACTIONS_DIR are set"
    exit 1
fi

# Ensure required directories exist
if [ ! -d "$SUI_MULTISIG_MULTISIGS_DIR" ]; then
    mkdir -p "$SUI_MULTISIG_MULTISIGS_DIR"
fi

if [ ! -d "$SUI_MULTISIG_TRANSACTIONS_DIR" ]; then
    mkdir -p "$SUI_MULTISIG_TRANSACTIONS_DIR"
fi

if [ ! -f "$SCRIPT_DIR/util/transaction_helpers.sh" ]; then
    echo "❌ Error: Helper script not found at $SCRIPT_DIR/util/transaction_helpers.sh"
    exit 1
fi

source "$SCRIPT_DIR/util/transaction_helpers.sh"

# Define valid transaction types
VALID_TYPES=("publish" "upgrade" "call" "transfer")

# Function to show usage
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -t, --type TYPE        Transaction type (${VALID_TYPES[*]})"
    echo "  -b, --batch-file FILE  Create multiple transactions from JSON file"
    echo "  -m, --multisig ADDR    Multisig wallet address"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Additional options will be passed to the transaction type script."
    echo "Run the specific transaction type script with --help to see its options."
}

# Store original arguments
ORIGINAL_ARGS=("$@")

# Initialize variables
TRANSACTION_TYPE=""
BATCH_FILE=""
MULTISIG_ADDR=""

# Simple argument parsing for type and help
while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--type)
            TRANSACTION_TYPE="$2"
            shift 2
            ;;
        -b|--batch-file)
            BATCH_FILE="$2"
            shift 2
            ;;
        -m|--multisig)
            MULTISIG_ADDR="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            # Skip other arguments
            shift
            ;;
    esac
done

# Function to select transaction type
select_transaction_type() {
    echo -e "\n📋 Select transaction type:"
    for i in "${!VALID_TYPES[@]}"; do
        echo "[$i] ${VALID_TYPES[$i]}"
    done

    while true; do
        read -p "Select type number: " selection
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -lt "${#VALID_TYPES[@]}" ]; then
            TRANSACTION_TYPE="${VALID_TYPES[$selection]}"
            break
        else
            echo "❌ Invalid selection. Please enter a number between 0 and $((${#VALID_TYPES[@]}-1))"
        fi
    done
}

# Function to validate required parameters for each transaction type
validate_required_params() {
    local tx_type="$1"
    local tx_params="$2"
    local missing_params=()

    case "$tx_type" in
        "publish")
            if ! echo "$tx_params" | jq -e '.directory' >/dev/null 2>&1; then
                missing_params+=("directory")
            fi
            ;;
        "call")
            if ! echo "$tx_params" | jq -e '.package' >/dev/null 2>&1; then
                missing_params+=("package")
            fi
            if ! echo "$tx_params" | jq -e '.module' >/dev/null 2>&1; then
                missing_params+=("module")
            fi
            if ! echo "$tx_params" | jq -e '.function' >/dev/null 2>&1; then
                missing_params+=("function")
            fi
            # TODO: args is optional, but maybe we should require an array that can be empty?
            # if ! echo "$tx_params" | jq -e '.args' >/dev/null 2>&1; then
            #     missing_params+=("args")
            # fi
            # TODO: type-args is not implemented yet. also its optional
            # fi
            # if ! echo "$tx_params" | jq -e '.type-args' >/dev/null 2>&1; then
            #     missing_params+=("type-args")
            # fi
            ;;
        "transfer")
            if ! echo "$tx_params" | jq -e '.recipient' >/dev/null 2>&1; then
                missing_params+=("recipient")
            fi
            if ! echo "$tx_params" | jq -e '.object' >/dev/null 2>&1; then
                missing_params+=("object")
            fi
            ;;
        "upgrade")
            if ! echo "$tx_params" | jq -e '.package' >/dev/null 2>&1; then
                missing_params+=("package")
            fi
            if ! echo "$tx_params" | jq -e '.directory' >/dev/null 2>&1; then
                missing_params+=("directory")
            fi
            ;;
    esac

    if [ ${#missing_params[@]} -gt 0 ]; then
        echo "❌ Missing required parameters for $tx_type transaction:"
        echo "   Required parameters: ${missing_params[*]}"
        return 1
    fi
    return 0
}

# Function to process batch file
process_batch_file() {
    local batch_file="$1"
    local cli_multisig="$2"  # Multisig address from command line, if any

    # Check if file exists
    if [ ! -f "$batch_file" ]; then
        echo "❌ Error: Batch file not found: $batch_file"
        exit 1
    fi

    # Validate JSON format
    if ! jq empty "$batch_file" 2>/dev/null; then
        echo "❌ Error: Invalid JSON format in batch file"
        exit 1
    fi

    # Check if transactions array exists
    if ! jq -e '.transactions' "$batch_file" >/dev/null 2>&1; then
        echo "❌ Error: Batch file must contain a 'transactions' array"
        exit 1
    fi

    # Get multisig from JSON if present
    local json_multisig
    json_multisig=$(jq -r '.multisig // empty' "$batch_file")

    # Handle multisig precedence
    if [ -n "$cli_multisig" ] && [ -n "$json_multisig" ]; then
        if [ "$cli_multisig" != "$json_multisig" ]; then
            echo "❌ Error: Conflicting multisig addresses specified:"
            echo "    CLI value:  $cli_multisig"
            echo "    JSON value: $json_multisig"
            echo "This likely indicates an error in either the CLI argument or the JSON file."
            echo "Please ensure both values match or specify the multisig address in only one place."
            exit 1
        fi
        export MULTISIG_ADDR="$cli_multisig"
    elif [ -n "$cli_multisig" ]; then
        export MULTISIG_ADDR="$cli_multisig"
    elif [ -n "$json_multisig" ]; then
        if ! validate_hex_address "$json_multisig"; then
            echo "❌ Error: Invalid multisig address in JSON file: $json_multisig"
            exit 1
        fi
        export MULTISIG_ADDR="$json_multisig"
        echo "📦 Using multisig address from JSON: $json_multisig"
    else
        # No multisig specified anywhere, prompt for selection
        select_multisig_wallet
    fi

    # Process each transaction
    local tx_count=$(jq '.transactions | length' "$batch_file")
    echo "📦 Processing $tx_count transactions from batch file..."

    # Array to store transaction results
    declare -a results

    for ((i=0; i<tx_count; i++)); do
        local tx_type=$(jq -r ".transactions[$i].type" "$batch_file")
        local tx_params=$(jq -c ".transactions[$i].params" "$batch_file")

        # Validate transaction type
        if [[ ! " ${VALID_TYPES[@]} " =~ " ${tx_type} " ]]; then
            echo "❌ Invalid transaction type in batch file: $tx_type"
            results+=("❌ $tx_type (invalid type)")
            continue
        fi

        echo "🔄 Processing transaction $((i+1))/$tx_count (type: $tx_type)..."

        # Validate required parameters
        if ! validate_required_params "$tx_type" "$tx_params"; then
            results+=("❌ $tx_type (missing required parameters)")
            continue
        fi

        # Convert JSON params to command line arguments
        local args=()
        while IFS= read -r line; do
            param_name=$(echo "$line" | jq -r '.key')
            param_value=$(echo "$line" | jq -r '.value')
            args+=("--$param_name" "$param_value")
        done < <(echo "$tx_params" | jq -c 'to_entries | map({key: .key, value: .value}) | .[]')

        # Execute the transaction and capture output
        local tx_output
        if ! tx_output=$("$SCRIPT_DIR/types/$tx_type.sh" "${args[@]}" 2>&1); then
            echo "❌ Transaction $((i+1)) failed"
            results+=("❌ $tx_type")
        else
            echo "✅ Transaction $((i+1)) created successfully"
            results+=("✅ $tx_type $tx_params")
        fi
    done

    # Print summary
    echo -e "\n📊 Batch Processing Summary:"
    echo "----------------------------------------"
    for ((i=0; i<${#results[@]}; i++)); do
        echo "$((i+1)). ${results[$i]}"
    done
    echo "----------------------------------------"

    # Count successes and failures
    local success_count=0
    local failure_count=0
    for result in "${results[@]}"; do
        if [[ $result == ✅* ]]; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done

    echo "Total: $tx_count transactions"
    echo "✅ Success: $success_count"
    echo "❌ Failed: $failure_count"
    echo "----------------------------------------"

    # Return non-zero if any transaction failed
    if [ $failure_count -gt 0 ]; then
        return 1
    fi
    return 0
}

# If batch file is specified, process it
if [ -n "$BATCH_FILE" ]; then
    process_batch_file "$BATCH_FILE" "$MULTISIG_ADDR"
    exit 0
fi

# If no type specified, prompt user
if [ -z "$TRANSACTION_TYPE" ]; then
    select_transaction_type
fi

# Validate transaction type
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TRANSACTION_TYPE} " ]]; then
    echo "❌ Invalid transaction type: $TRANSACTION_TYPE"
    echo "Valid types are: ${VALID_TYPES[*]}"
    exit 1
fi

# If no multisig address specified, prompt for selection
if [ -z "$MULTISIG_ADDR" ]; then
    select_multisig_wallet
fi

# Filter out type, batch, and multisig related arguments from ORIGINAL_ARGS
FILTERED_ARGS=()
i=0
while [ $i -lt ${#ORIGINAL_ARGS[@]} ]; do
    if [[ "${ORIGINAL_ARGS[$i]}" == "-t" || "${ORIGINAL_ARGS[$i]}" == "--type" ]] ||
       [[ "${ORIGINAL_ARGS[$i]}" == "-b" || "${ORIGINAL_ARGS[$i]}" == "--batch-file" ]] ||
       [[ "${ORIGINAL_ARGS[$i]}" == "-m" || "${ORIGINAL_ARGS[$i]}" == "--multisig" ]]; then
        # Skip the argument and its value
        i=$((i + 2))
    else
        FILTERED_ARGS+=("${ORIGINAL_ARGS[$i]}")
        i=$((i + 1))
    fi
done

# Execute the appropriate transaction type script with filtered arguments and multisig address
echo -e "\n🔄 Executing $TRANSACTION_TYPE transaction..."
export MULTISIG_ADDR
"$SCRIPT_DIR/types/$TRANSACTION_TYPE.sh" "${FILTERED_ARGS[@]}"