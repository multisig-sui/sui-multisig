import { PublicKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { SuiKeyScheme } from './types/sui';

// Helper function to convert base64 string to Uint8Array
export function b64ToUint8Array(b64: string): Uint8Array {
  const binary_string = atob(b64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Helper to get the flag byte for a given public key signature scheme
export function getFlagForKeyScheme(scheme: 'ED25519' | 'Secp256k1' | 'Secp256r1' | string): number {
  switch (scheme) {
    case 'ED25519': return 0x00;
    case 'Secp256k1': return 0x01;
    case 'Secp256r1': return 0x02;
    default: throw new Error(`Unknown key scheme: ${scheme}`);
  }
}

// Helper to parse Base64 public key with flag into SDK PublicKey object
export function parseSuiPublicKey(base64Pk: string, scheme: SuiKeyScheme): PublicKey {
  const decodedBytes = b64ToUint8Array(base64Pk);
  if (decodedBytes.length === 0) throw new Error('Public key is empty after base64 decoding.');
  
  const flag = decodedBytes[0];
  const rawKeyBytes = decodedBytes.subarray(1);

  const ED25519_PUBLIC_KEY_LENGTH = 32;
  const SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;
  const SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;

  let expectedFlag: number;
  let expectedLength: number;

  switch (scheme) {
    case 'ed25519':
      expectedFlag = 0x00;
      expectedLength = ED25519_PUBLIC_KEY_LENGTH;
      if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) {
        throw new Error(`Invalid Ed25519 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
      }
      return new Ed25519PublicKey(rawKeyBytes);
    case 'secp256k1':
      expectedFlag = 0x01;
      expectedLength = SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH;
      if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) {
        throw new Error(`Invalid Secp256k1 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
      }
      return new Secp256k1PublicKey(rawKeyBytes);
    case 'secp256r1':
      expectedFlag = 0x02;
      expectedLength = SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH;
      if (flag !== expectedFlag || rawKeyBytes.length !== expectedLength) {
        throw new Error(`Invalid Secp256r1 PK format or length. Flag: ${flag}, Length: ${rawKeyBytes.length}`);
      }
      return new Secp256r1PublicKey(rawKeyBytes);
    default:
      throw new Error(`Unknown key scheme: ${scheme}`);
  }
}