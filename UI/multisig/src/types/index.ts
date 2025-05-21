export type SuiKeyScheme = 'ed25519' | 'secp256k1' | 'secp256r1';

export interface SuiSigner {
  id: string; // For React key prop
  publicKey: string; // Base64 public key string
  weight: number;
  keyScheme: SuiKeyScheme;
}

export interface SuiMultisigConfig {
  multisigAddress: string;
  threshold: number;
  signers: Array<Omit<SuiSigner, 'id'>>; // Don't need id in the saved config
  // We might want to add the network later (e.g., 'testnet', 'mainnet')
} 