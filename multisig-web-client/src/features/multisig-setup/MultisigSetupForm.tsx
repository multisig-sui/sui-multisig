import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Separator, Callout } from "@radix-ui/themes";
// import { CheckCircledIcon } from '@radix-ui/react-icons'; // Removed unused import
import { SignerInput } from '../../components/SignerInput';
import { createMultisigAddress } from '../../lib/iotaUtils';

interface Signer {
  id: number;
  publicKey: string;
  weight: number;
}

export interface MultisigConfig {
    multisig_address: string;
    threshold: number;
    signers: { public_key: string; weight: number }[];
}

interface MultisigSetupFormProps {
  onComplete: (config: MultisigConfig) => void;
}

export function MultisigSetupForm({ onComplete }: MultisigSetupFormProps) {
  const [signers, setSigners] = useState<Signer[]>([{ id: Date.now(), publicKey: '', weight: 1 }]);
  const [threshold, setThreshold] = useState<number>(1);
  const [generatedConfig, setGeneratedConfig] = useState<MultisigConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addSigner = () => {
    setSigners([...signers, { id: Date.now(), publicKey: '', weight: 1 }]);
  };

  const removeSigner = (indexToRemove: number) => {
    setSigners(signers.filter((_, index) => index !== indexToRemove));
  };

  const handlePublicKeyChange = (index: number, value: string) => {
    const newSigners = [...signers];
    newSigners[index].publicKey = value;
    setSigners(newSigners);
  };

  const handleWeightChange = (index: number, value: number) => {
    const newSigners = [...signers];
    newSigners[index].weight = value >= 1 ? value : 1;
    setSigners(newSigners);
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setThreshold(value >= 1 ? value : 1);
  };

  const calculateTotalWeight = () => {
    return signers.reduce((total, signer) => total + signer.weight, 0);
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

    console.log("Attempting to create multisig with:");
    const pks = signers.map(s => s.publicKey);
    const weights = signers.map(s => s.weight);
    console.log("Signer PKs:", pks);
    console.log("Weights:", weights);
    console.log("Threshold:", threshold);

    try {
      const address = createMultisigAddress(pks, weights, threshold);
      
      const config: MultisigConfig = {
          multisig_address: address,
          threshold: threshold,
          signers: signers.map(s => ({ public_key: s.publicKey, weight: s.weight }))
      };
      setGeneratedConfig(config);
      setError(null);

    } catch (err) {
      console.error("Error creating multisig address:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15);
    link.download = `multisig_config_${timestamp}.json`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onComplete(generatedConfig);
  };

  return (
    <Card size="3">
      <Heading mb="4">Create New Multisig Wallet</Heading>
      {generatedConfig && (
         <Callout.Root color="green" size="2" mb="4">
            {/* <Callout.Icon>
                <CheckCircledIcon /> 
            </Callout.Icon> */}
            <Callout.Text>
                Multisig Address Generated Successfully! Address: {generatedConfig.multisig_address}
            </Callout.Text>
         </Callout.Root>
      )}

      <form onSubmit={handleSubmit}>
        <Box mb="3">
          <Heading size="3" mb="2">Signers</Heading>
          {signers.map((signer, index) => (
            <SignerInput 
              key={signer.id} 
              index={index} 
              publicKey={signer.publicKey}
              weight={signer.weight}
              onPublicKeyChange={handlePublicKeyChange}
              onWeightChange={handleWeightChange}
              onRemove={removeSigner}
            />
          ))}
          <Button 
            type="button" 
            variant="soft" 
            onClick={addSigner} 
            disabled={isLoading || !!generatedConfig}
          >
             Add Signer
          </Button>
        </Box>

        <Separator my="4" size="4" />

        <Box mb="4">
            <Heading size="3" mb="2">Threshold</Heading>
            <Text size="2" color="gray" mr="3">Total Weight: {calculateTotalWeight()}</Text>
            <TextField.Root 
                type="number" 
                placeholder="Required weight sum" 
                min={1}
                value={threshold.toString()} 
                onChange={handleThresholdChange} 
                style={{ width: '200px' }} 
                disabled={isLoading || !!generatedConfig}
            />
            {threshold > calculateTotalWeight() && !generatedConfig && (
              <Text size="1" color="red" ml="2">Threshold exceeds total weight!</Text>
            )}
        </Box>

        <Flex direction="column" gap="3">
            {error && (
                <Callout.Root color="red" size="1">
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            )}
            {!generatedConfig ? (
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Create Multisig Address'}
                </Button>
            ) : (
                <Button type="button" onClick={handleSaveConfig} color="green">
                    Save Configuration & Finish
                </Button>
            )}
        </Flex>
      </form>
    </Card>
  );
} 