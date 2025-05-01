import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Separator } from "@radix-ui/themes";
import { PlusIcon } from '@radix-ui/react-icons';
import { SignerInput } from '../../components/SignerInput';
import { createMultisigAddress } from '../../lib/iotaUtils';

interface Signer {
  id: number; // For React key prop
  publicKey: string;
  weight: number;
}

export function MultisigSetupForm() {
  const [signers, setSigners] = useState<Signer[]>([{ id: Date.now(), publicKey: '', weight: 1 }]);
  const [threshold, setThreshold] = useState<number>(1);
  const [multisigAddress, setMultisigAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    newSigners[index].weight = value >= 1 ? value : 1; // Ensure weight is at least 1
    setSigners(newSigners);
  };

  const handleThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setThreshold(value >= 1 ? value : 1); // Ensure threshold is at least 1
  };

  const calculateTotalWeight = () => {
    return signers.reduce((total, signer) => total + signer.weight, 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMultisigAddress(null);

    const totalWeight = calculateTotalWeight();
    if (threshold > totalWeight) {
      setError(`Threshold (${threshold}) cannot be greater than total weight (${totalWeight}).`);
      return;
    }
    if (signers.some(s => !s.publicKey.trim())) {
        setError('All public keys must be filled.');
        return;
    }
    if (signers.length === 0) {
        setError('At least one signer is required.');
        return;
    }

    console.log("Attempting to create multisig with:");
    const pks = signers.map(s => s.publicKey);
    const weights = signers.map(s => s.weight);
    console.log("Signer PKs:", pks);
    console.log("Weights:", weights);
    console.log("Threshold:", threshold);

    try {
      // Call the actual SDK utility function
      const address = createMultisigAddress(pks, weights, threshold);
      setMultisigAddress(address); // Set the real address
      setError(null); // Clear any previous errors

    } catch (err) {
      console.error("Error creating multisig address:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setMultisigAddress(null); // Clear address on error
    }
  };

  return (
    <Card size="3">
      <Heading mb="4">Create New Multisig Wallet</Heading>
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
          <Button type="button" variant="soft" onClick={addSigner}>
            <PlusIcon /> Add Signer
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
            />
            {threshold > calculateTotalWeight() && (
              <Text size="1" color="red" ml="2">Threshold exceeds total weight!</Text>
            )}
        </Box>

        <Flex direction="column" gap="2">
            {error && (
                <Text color="red">Error: {error}</Text>
            )}
            {multisigAddress && (
                <Text color="green">Generated Multisig Address: {multisigAddress}</Text>
            )}
            <Button type="submit">Create Multisig Address</Button>
        </Flex>
      </form>
    </Card>
  );
} 