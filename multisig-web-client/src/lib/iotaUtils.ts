import { Ed25519PublicKey } from '@iota/iota-sdk/keypairs/ed25519';
import { Secp256k1PublicKey } from '@iota/iota-sdk/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@iota/iota-sdk/keypairs/secp256r1';
import { PublicKey } from '@iota/iota-sdk/cryptography'; // Base type might be here
import { MultiSigPublicKey } from '@iota/iota-sdk/multisig';
import { fromB64 } from '@iota/iota-sdk/utils';

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
function publicKeyFromBase64WithFlag(publicKeyWithFlag: string): PublicKey {
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