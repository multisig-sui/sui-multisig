import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { Secp256k1PublicKey } from '@iota/iota-sdk/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@iota/iota-sdk/keypairs/secp256r1';
import { PublicKey } from '@iota/iota-sdk/cryptography'; // Base type might be here
import { MultiSigPublicKey } from '@iota/iota-sdk/multisig';
import { fromB64 } from '@iota/iota-sdk/utils';
import { IotaClient } from '@iota/iota-sdk/client'; // Try importing from client
import { Transaction, TransactionArgument } from '@iota/iota-sdk/transactions'; // Try importing from transactions

// Signature Scheme Flags
const ED25519_FLAG = 0;
const SECP256K1_FLAG = 1;
const SECP256R1_FLAG = 2;

/**
 * Creates a PublicKey object from a base64 encoded string containing the scheme flag.
 * @param publicKeyWithFlag - Base64 encoded public key with signature scheme flag prefix.
 * @returns The corresponding PublicKey object.
 * @throws Error if the flag is invalid or decoding fails.
 */
export function publicKeyFromBase64WithFlag(publicKeyWithFlag: string): PublicKey {
    try {
        const bytesWithFlag = fromB64(publicKeyWithFlag);
        if (bytesWithFlag.length < 1) {
            throw new Error('Decoded public key is empty.');
        }

        const flag = bytesWithFlag[0];
        const rawBytes = bytesWithFlag.slice(1);

        switch (flag) {
            case ED25519_FLAG:
                // Ed25519 flag is often omitted in addresses, but key itself includes it.
                // The constructor expects the raw 32 bytes.
                // Let's re-check based on expected lengths.
                if (bytesWithFlag.length === 33 && flag === ED25519_FLAG) {
                     return new Ed25519PublicKey(rawBytes); // Use bytes *without* flag
                }
                // If length is 32, assume it's raw Ed25519 bytes without flag
                if (bytesWithFlag.length === 32) {
                     console.warn("Received Ed25519 key possibly missing flag byte, assuming raw key.");
                     return new Ed25519PublicKey(bytesWithFlag);
                }
                 throw new Error(`Invalid length for Ed25519 key: ${bytesWithFlag.length}`);
            case SECP256K1_FLAG:
                // Secp256k1PublicKey constructor likely expects raw 33 bytes (compressed).
                if (rawBytes.length !== 33) throw new Error(`Invalid length for Secp256k1 key: ${rawBytes.length}`);
                return new Secp256k1PublicKey(rawBytes);
            case SECP256R1_FLAG:
                 // Secp256r1PublicKey constructor likely expects raw 33 bytes (compressed).
                if (rawBytes.length !== 33) throw new Error(`Invalid length for Secp256r1 key: ${rawBytes.length}`);
                return new Secp256r1PublicKey(rawBytes);
            default:
                throw new Error(`Invalid signature scheme flag: ${flag}`);
        }
    } catch (error) {
        console.error("Error creating PublicKey from Base64:", error);
        throw new Error(`Failed to process public key string "${publicKeyWithFlag}": ${error instanceof Error ? error.message : error}`);
    }
}

/**
 * Generates an IOTA multisig address from public keys, weights, and a threshold.
 *
 * @param publicKeysWithFlags - Array of Base64 encoded public keys, each prefixed with its signature scheme flag.
 * @param weights - Array of weights corresponding to each public key.
 * @param threshold - The minimum combined weight required for a valid signature.
 * @returns The generated multisig IOTA address string.
 * @throws Error if input arrays have different lengths or if any public key is invalid.
 */
export function createMultisigAddress(
    publicKeysWithFlags: string[],
    weights: number[],
    threshold: number
): string {
    if (publicKeysWithFlags.length !== weights.length) {
        throw new Error('Public keys and weights arrays must have the same length.');
    }
    if (publicKeysWithFlags.length === 0) {
        throw new Error('At least one public key is required.');
    }

    const publicKeyObjects = publicKeysWithFlags.map((pkStr, index) => ({
        publicKey: publicKeyFromBase64WithFlag(pkStr), // Convert string to PublicKey object
        weight: weights[index],
    }));

    const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: threshold,
        publicKeys: publicKeyObjects,
    });

    return multiSigPublicKey.toIotaAddress();
}

// Example usage (for testing):
// try {
//   const pkEd = 'ACIDIJA78i4zhtG//mFik2lsRaDb7HcnVvjHjGzxaQ+z'; // Example Ed25519 with flag 0
//   const pkK1 = 'AQOuFy3X0K1+u4pSPn3H5gqXv3J7G6uWIiF/9u/J5XwE'; // Example Secp256k1 with flag 1
//   const addr = createMultisigAddress([pkEd, pkK1], [1, 1], 2);
//   console.log('Generated Multisig Address:', addr);
// } catch (e) {
//   console.error('Multisig generation failed:', e);
// } 

export async function prepareCallTransactionBytes(
    client: IotaClient,
    senderAddress: string, 
    packageId: string,
    moduleName: string,
    functionName: string,
    functionArgs: TransactionArgument[],
    gasBudgetInput: number | string // Renamed for clarity
): Promise<string> {
    try {
        const tx = new Transaction();

        tx.moveCall({
            package: packageId,
            module: moduleName,
            function: functionName,
            arguments: functionArgs,
        });

        tx.setSender(senderAddress);
        
        // Ensure gas budget is a number/bigint
        const gasBudget = typeof gasBudgetInput === 'string' ? BigInt(gasBudgetInput) : gasBudgetInput;
        tx.setGasBudget(gasBudget);
        
        console.warn("Gas payment object selection is not implemented...");

        // Build the transaction data for signing without a signer
        const unsignedTxBytes = await tx.build({ client }); // Pass client in an object

        // Convert Uint8Array to base64 string using Buffer
        // Ensure Buffer is available (Vite usually polyfills it)
        const base64String = Buffer.from(unsignedTxBytes).toString('base64');
        return base64String;

    } catch (error) {
        console.error("Error preparing call transaction bytes:", error);
        throw new Error(`Failed to prepare call transaction: ${error instanceof Error ? error.message : error}`);
    }
} 

/**
 * Prepares the unsigned transaction bytes for a simple base IOTA token transfer.
 * This version explicitly fetches the sender's coins and sets them for gas payment.
 *
 * @param client - The IotaClient instance.
 * @param senderAddress - The IOTA address of the multisig sender.
 * @param recipientAddress - The IOTA address of the recipient.
 * @param amount - The amount of base IOTA tokens (Miotas) to transfer (as a string or number).
 * @param gasBudgetInput - A suggested gas budget.
 * @returns A promise resolving to the Base64 encoded unsigned transaction essence bytes.
 */
export async function prepareTransferTransactionBytes(
    client: IotaClient,
    senderAddress: string, 
    recipientAddress: string,
    amount: string | number, 
    gasBudgetInput: number | string
): Promise<string> {
    try {
        console.log(`Preparing transfer: ${amount} base tokens to ${recipientAddress} from ${senderAddress}`);
        
        const tx = new Transaction();

        // Set the sender (multisig address)
        tx.setSender(senderAddress);

        // --- Gas Configuration ---
        // Fetch the sender's coins
        console.log(`Fetching coins for sender: ${senderAddress}...`);
        const gasCoinsResult = await client.getCoins({ owner: senderAddress });
        console.log(`Found ${gasCoinsResult.data.length} coins for sender.`);

        if (gasCoinsResult.data.length === 0) {
            throw new Error('Sender has no IOTA coins for gas payment. Please use the faucet.');
        }
        
        // Map CoinObject to ObjectRef format { objectId, version, digest }
        const gasPaymentObjects = gasCoinsResult.data.map(coin => ({
            objectId: coin.coinObjectId,
            version: coin.version,
            digest: coin.digest
        }));
        
        // Set the gas payment objects. The builder will select the necessary ones.
        tx.setGasPayment(gasPaymentObjects);
        
        const gasBudget = typeof gasBudgetInput === 'string' ? BigInt(gasBudgetInput) : gasBudgetInput;
        tx.setGasBudget(gasBudget);
        // tx.setGasPrice(...) // Optional: Can be set if needed
        // ----------------------

        // --- Transfer Logic ---
        // Instead of splitting from tx.gas, we need to create the payment coin
        // The SDK will handle using the gas payment objects to fund this.
        const amountToSend = BigInt(amount); 
        const transferCoin = tx.splitCoins(tx.gas, [amountToSend])[0]; // This *should* now work as tx.gas refers to the coin(s) selected from gasPaymentObjects
        // OR alternatively, maybe makeTransferIotaTxn? Let's try splitCoins first as it's simpler.

        // Transfer the split coin to the recipient
        tx.transferObjects([transferCoin], recipientAddress);
        // --------------------
        
        console.log("Transaction commands prepared:", tx.getData().commands);

        // Build the transaction essence bytes, providing the client for context (e.g., reference gas price)
        const unsignedTxBytes = await tx.build({ client }); 

        // Convert Uint8Array to base64 string
        const base64String = Buffer.from(unsignedTxBytes).toString('base64');
        
        console.log("Unsigned Tx Base64:", base64String);
        return base64String;

    } catch (error) {
        console.error("Error preparing transfer transaction bytes:", error);
        throw new Error(`Failed to prepare transfer transaction: ${error instanceof Error ? error.message : error}`);
    }
} 