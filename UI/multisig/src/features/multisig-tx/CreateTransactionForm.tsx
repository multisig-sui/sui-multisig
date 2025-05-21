import React, { useState } from 'react';
import { Box, Button, Card, Flex, Heading, Text, TextField, Callout, Strong } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { SuiMultisigConfig } from '../../types';

interface CreateTransactionFormProps {
  multisigConfig: SuiMultisigConfig;
  onTransactionCreated?: (txDigest: string) => void; // Placeholder for now
  onCancel?: () => void;
}

export function CreateTransactionForm({ multisigConfig, onTransactionCreated, onCancel }: CreateTransactionFormProps) {
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!recipientAddress || !amount) {
      setError('Recipient address and amount are required.');
      setIsLoading(false);
      return;
    }

    const amountMist = BigInt(parseFloat(amount) * 1_000_000_000);
    if (amountMist <= 0) {
      setError('Amount must be greater than 0.');
      setIsLoading(false);
      return;
    }

    console.log('Creating transaction with:', {
      sender: multisigConfig.multisigAddress,
      recipient: recipientAddress,
      amount: amountMist.toString(),
      threshold: multisigConfig.threshold,
      signers: multisigConfig.signers.map(s => s.publicKey),
    });

    // TODO: Implement actual transaction creation logic using Sui SDK
    // This will involve:
    // 1. Constructing a PaySui transaction block.
    // 2. Building the multisig transaction payload.
    // 3. Storing this payload or providing it to the user for signing.
    
    try {
      // Placeholder for actual transaction submission
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      // const txDigest = "dummy_tx_digest"; 
      // if (onTransactionCreated) onTransactionCreated(txDigest);
      setError("Transaction creation logic not yet implemented.");

    } catch (e: any) {
      console.error("Error creating transaction:", e);
      setError(`Failed to create transaction: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card size="3">
      <Heading size="4" mb="3">Create New Transaction</Heading>
      <form onSubmit={handleCreateTransaction}>
        <Flex direction="column" gap="3">
          <Box>
            <Text as="label" htmlFor="recipientAddress" size="2" weight="bold" mb="1">
              Recipient Sui Address
            </Text>
            <TextField.Root
              id="recipientAddress"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              disabled={isLoading}
            />
          </Box>

          <Box>
            <Text as="label" htmlFor="amount" size="2" weight="bold" mb="1">
              Amount (SUI)
            </Text>
            <TextField.Root
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              min="0"
              step="any"
            />
          </Box>

          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Icon><InfoCircledIcon /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          <Flex gap="3" mt="3" justify="end">
            {onCancel && (
              <Button type="button" variant="soft" color="gray" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Prepare Transaction'}
            </Button>
          </Flex>
        </Flex>
      </form>
       <Box mt="4" p="3" style={{border: '1px dashed var(--gray-a7)', borderRadius: 'var(--radius-2)'}}>
        <Text color="gray" size="2">
            <Strong>Next Steps:</Strong> After preparing the transaction, it needs to be signed by the required number of signers (threshold: {multisigConfig.threshold}) and then executed on the Sui network. This UI will guide you through storing the transaction payload and collecting signatures.
        </Text>
      </Box>
    </Card>
  );
} 