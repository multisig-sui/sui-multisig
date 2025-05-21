import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Separator, Callout } from "@radix-ui/themes";
import { PlusIcon } from '@radix-ui/react-icons';
import { SignerInputSui } from '../../components/SignerInputSui';
import { SuiSigner, SuiMultisigConfig, SuiKeyScheme } from '../../types';
import { MultiSigPublicKey } from '@mysten/sui/multisig';
import { PublicKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';

// Helper function to convert base64 string to Uint8Array
function b64ToUint8Array(b64: string): Uint8Array {
    const binary_string = atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

interface CreateMultisigFormSuiProps {
  onComplete: (config: SuiMultisigConfig) => void;
}

export function CreateMultisigFormSui({ onComplete }: CreateMultisigFormSuiProps) {
  const initialSignerId = crypto.randomUUID();
  const [signers, setSigners] = useState<SuiSigner[]>([
    { id: initialSignerId, publicKey: '', weight: 1, keyScheme: 'ed25519' },
  ]);
  const [threshold, setThreshold] = useState<number>(1);
  const [generatedConfig, setGeneratedConfig] = useState<SuiMultisigConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addSigner = () => {
    if (signers.length >= 10) {
        setError("A maximum of 10 signers are allowed for Sui Multisig.");
        return;
    }
    setSigners([...signers, { id: crypto.randomUUID(), publicKey: '', weight: 1, keyScheme: 'ed25519' }]);
  };

  const removeSigner = (idToRemove: string) => {
    setSigners(signers.filter((signer) => signer.id !== idToRemove));
  };

  const handleSignerChange = <K extends keyof Omit<SuiSigner, 'id'>>(
    id: string,
    field: K,
    value: SuiSigner[K]
  ) => {
    setSigners(
      signers.map((signer) =>
        signer.id === id ? { ...signer, [field]: value } : signer
      )
    );
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setThreshold(value >= 1 ? value : 1);
  };

  const calculateTotalWeight = () => {
    return signers.reduce((total, signer) => total + (signer.weight || 0), 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setGeneratedConfig(null);
    setIsLoading(true);

    const totalWeight = calculateTotalWeight();
    if (threshold > totalWeight) {
      setError(`Threshold (${threshold}) cannot be greater than total weight (${totalWeight}).`);
      setIsLoading(false);
      return;
    }
    if (signers.some(s => !s.publicKey.trim())) {
        setError('All public keys must be filled.');
        setIsLoading(false);
        return;
    }
    if (signers.length === 0) {
        setError('At least one signer is required.');
        setIsLoading(false);
        return;
    }
    if (threshold <=0 || threshold > 65535) { // Sui threshold is u16
        setError('Threshold must be between 1 and 65535.');
        setIsLoading(false);
        return;
    }

    const parsedSuiPublicKeys: Array<{ publicKey: PublicKey; weight: number }> = [];

    for (const signer of signers) {
        if (signer.weight <= 0 || signer.weight > 255) { // Sui weight is u8
            setError(`Invalid weight for a signer: ${signer.weight}. Must be between 1 and 255.`);
            setIsLoading(false);
            return;
        }
        try {
            const decodedBytes = b64ToUint8Array(signer.publicKey); // Use helper function
            if (decodedBytes.length === 0) {
                throw new Error('Public key is empty or invalid base64.');
            }

            const flag = decodedBytes[0];
            const rawKeyBytes = decodedBytes.subarray(1);
            
            let suiPublicKey: PublicKey;
            let actualScheme: SuiKeyScheme;

            const ED25519_PUBLIC_KEY_LENGTH = 32;
            const SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;
            const SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;

            switch (flag) {
                case 0x00: // Ed25519
                    if (rawKeyBytes.length !== ED25519_PUBLIC_KEY_LENGTH) {
                        throw new Error(`Invalid Ed25519 public key length. Expected ${ED25519_PUBLIC_KEY_LENGTH}, got ${rawKeyBytes.length}`);
                    }
                    suiPublicKey = new Ed25519PublicKey(rawKeyBytes);
                    actualScheme = 'ed25519';
                    break;
                case 0x01: // Secp256k1
                    if (rawKeyBytes.length !== SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH) {
                        throw new Error(`Invalid Secp256k1 public key length. Expected ${SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH}, got ${rawKeyBytes.length}`);
                    }
                    suiPublicKey = new Secp256k1PublicKey(rawKeyBytes);
                    actualScheme = 'secp256k1';
                    break;
                case 0x02: // Secp256r1
                     if (rawKeyBytes.length !== SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH) {
                        throw new Error(`Invalid Secp256r1 public key length. Expected ${SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH}, got ${rawKeyBytes.length}`);
                    }
                    suiPublicKey = new Secp256r1PublicKey(rawKeyBytes);
                    actualScheme = 'secp256r1';
                    break;
                default:
                    throw new Error(`Unknown or unsupported public key flag: 0x${flag.toString(16)}`);
            }

            if (actualScheme !== signer.keyScheme) {
                throw new Error(
                    `The selected key scheme '${signer.keyScheme}' for public key '${signer.publicKey.substring(0,10)}...' ` +
                    `does not match the actual key scheme '${actualScheme}' derived from the public key's flag byte (0x${flag.toString(16)}). ` +
                    `Please ensure the public key string and the selected scheme are consistent.`
                );
            }
            
            parsedSuiPublicKeys.push({ publicKey: suiPublicKey, weight: signer.weight });
        } catch (e: any) {
            setError(`Error parsing public key for scheme ${signer.keyScheme} (${signer.publicKey.substring(0,10)}...): ${e.message}. Ensure it is a valid base64 public key string (including its leading flag byte) and the selected scheme matches the key type.`);
            setIsLoading(false);
            return;
        }
    }

    try {
      const multiSigPublicKeyInstance = MultiSigPublicKey.fromPublicKeys({
        threshold: threshold,
        publicKeys: parsedSuiPublicKeys,
      });
      
      const address = multiSigPublicKeyInstance.toSuiAddress();
      
      const configToSave: SuiMultisigConfig = {
          multisigAddress: address,
          threshold: threshold,
          signers: signers.map(s => ({ publicKey: s.publicKey, weight: s.weight, keyScheme: s.keyScheme }))
      };
      setGeneratedConfig(configToSave);
      setError(null);

    } catch (err) {
      console.error("Error creating Sui multisig address:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during Sui multisig address generation');
      setGeneratedConfig(null);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveConfig = () => {
    if (!generatedConfig) return;

    const jsonString = JSON.stringify(generatedConfig, null, 4);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Generate a more Sui-like filename
    const shortAddress = generatedConfig.multisigAddress.slice(0, 8);
    link.download = `sui_multisig_config_${shortAddress}_${Date.now()}.json`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onComplete(generatedConfig);
  };

  return (
    <Card size="3" style={{maxWidth: '700px', margin: '20px auto'}}>
      <Heading mb="4">Create New Sui Multisig Wallet</Heading>
      {generatedConfig && (
         <Callout.Root color="green" size="2" mb="4">
            <Callout.Text>
                Sui Multisig Address Generated Successfully! <br/>Address: <Text weight="bold">{generatedConfig.multisigAddress}</Text>
            </Callout.Text>
         </Callout.Root>
      )}

      <form onSubmit={handleSubmit}>
        <Box mb="3">
          <Heading size="3" mb="2">Signers ({signers.length}/10)</Heading>
          {signers.map((signer, index) => (
            <SignerInputSui 
              key={signer.id} 
              index={index} 
              publicKey={signer.publicKey}
              weight={signer.weight}
              keyScheme={signer.keyScheme}
              onPublicKeyChange={(_idx, val) => handleSignerChange(signer.id, 'publicKey', val)}
              onWeightChange={(_idx, val) => handleSignerChange(signer.id, 'weight', val)}
              onKeySchemeChange={(_idx, val) => handleSignerChange(signer.id, 'keyScheme', val)}
              onRemove={() => removeSigner(signer.id)}
              showRemoveButton={signers.length > 1}
            />
          ))}
          <Button 
            type="button" 
            variant="soft" 
            onClick={addSigner} 
            disabled={isLoading || !!generatedConfig || signers.length >= 10}
          >
             <PlusIcon/> Add Signer
          </Button>
        </Box>

        <Separator my="4" size="4" />

        <Box mb="4">
            <Heading size="3" mb="2">Threshold</Heading>
            <Flex align="center" gap="3">
                <TextField.Root 
                    type="number" 
                    placeholder="Required weight sum (1-65535)" 
                    min={1}
                    max={65535}
                    value={threshold.toString()} 
                    onChange={handleThresholdChange} 
                    style={{ width: '250px' }} 
                    disabled={isLoading || !!generatedConfig}
                />
                <Text size="2" color="gray">Total Weight of Signers: {calculateTotalWeight()}</Text>
            </Flex>
            {threshold > calculateTotalWeight() && !generatedConfig && (
              <Text size="1" color="red" mt="1" as="div">Threshold exceeds total weight!</Text>
            )}
        </Box>

        <Flex direction="column" gap="3">
            {error && (
                <Callout.Root color="red" size="1">
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            )}
            {!generatedConfig ? (
                <Button type="submit" disabled={isLoading} size="3">
                    {isLoading ? 'Generating Address...' : 'Create Sui Multisig Address'}
                </Button>
            ) : (
                <Button type="button" onClick={handleSaveConfig} color="green" size="3">
                    Save Configuration & Continue
                </Button>
            )}
        </Flex>
      </form>
    </Card>
  );
} 