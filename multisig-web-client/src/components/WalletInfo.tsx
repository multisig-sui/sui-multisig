import { useCurrentAccount } from "@iota/dapp-kit";
import { Container, Flex, Heading, Text, Button, Callout, Box } from "@radix-ui/themes";
import React, { useState } from 'react';
import { getFaucetHost, requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';
import { toB64 } from '@iota/iota-sdk/utils';

// Define ED25519 flag (as per iotaUtils.ts)
const ED25519_FLAG = 0;

export function WalletInfo() {
  const account = useCurrentAccount();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<{ type: 'info' | 'error', text: string } | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleFaucetRequest = async () => {
    if (!account) {
      setFaucetMessage({ type: 'error', text: 'Connect wallet first!' });
      return;
    }

    setFaucetLoading(true);
    setFaucetMessage(null);

    try {
      console.log(`Requesting faucet funds for ${account.address} on testnet...`);
      // Use 'testnet' as the app defaults to it (see main.tsx)
      const result = await requestIotaFromFaucetV0({
        host: getFaucetHost('testnet'),
        recipient: account.address,
      });
      console.log("Faucet Result:", result);
      setFaucetMessage({ type: 'info', text: 'Faucet request successful! Funds should arrive shortly.' });
    } catch (error) {
      console.error("Faucet request failed:", error);
      const errorText = error instanceof Error ? error.message : 'Unknown faucet error';
      // Check for common rate limit error
      if (errorText.includes('Try again later')) {
           setFaucetMessage({ type: 'error', text: 'Faucet rate limit hit. Please try again later.' });
      } else {
          setFaucetMessage({ type: 'error', text: `Faucet request failed: ${errorText}` });
      }
    } finally {
      setFaucetLoading(false);
    }
  };

  // Function to copy public key
  const handleCopyPublicKey = () => {
    if (account && account.publicKey) {
      try {
        // Assume Ed25519 (flag 0)
        const rawKeyBytes = account.publicKey;
        if (rawKeyBytes.length !== 32) {
          throw new Error(`Expected Ed25519 key length 32, got ${rawKeyBytes.length}`);
        }
        
        // Create buffer with flag byte + key bytes
        const keyWithFlag = new Uint8Array(1 + rawKeyBytes.length);
        keyWithFlag[0] = ED25519_FLAG; // Set flag byte
        keyWithFlag.set(rawKeyBytes, 1); // Copy raw key bytes after the flag

        // Convert to Base64
        const publicKeyBase64WithFlag = toB64(keyWithFlag);

        // Copy to clipboard
        navigator.clipboard.writeText(publicKeyBase64WithFlag)
          .then(() => {
            console.log('Public key copied:', publicKeyBase64WithFlag);
            setCopyMessage('Public key copied!');
            setTimeout(() => setCopyMessage(null), 2000); // Clear message after 2s
          })
          .catch(err => {
            console.error('Failed to copy public key: ', err);
            setCopyMessage('Failed to copy key.');
            setTimeout(() => setCopyMessage(null), 2000);
          });
      } catch (err) {
          console.error("Error formatting public key:", err);
          setCopyMessage('Error formatting key.');
          setTimeout(() => setCopyMessage(null), 2000);
      }
    } else {
      setCopyMessage('No public key available.');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  return (
    <Container my="2">
      <Flex justify="between" align="start" gap="3">
        <Box flexGrow="1">
            <Heading size="3" mb="2">Wallet Info</Heading> 
            {account ? (
              <Flex direction="column" gap="1">
                <Text>Status: Connected</Text>
                <Flex align="center" gap="2">
                    <Text>Address: {account.address}</Text>
                    <Button size="1" variant="ghost" onClick={handleCopyPublicKey} title="Copy Public Key (Base64 w/ Flag)">
                        Copy PK
                    </Button>
                </Flex>
                {copyMessage && <Text size="1" color="gray">{copyMessage}</Text>}
              </Flex>
            ) : (
              <Text>Status: Not Connected</Text>
            )}
        </Box>
        
        {account && (
            <Flex direction="column" align="end" gap="2">
                 <Button onClick={handleFaucetRequest} disabled={faucetLoading}>
                     {faucetLoading ? 'Requesting...' : 'Get Testnet Tokens'}
                 </Button>
                {faucetMessage && (
                    <Callout.Root color={faucetMessage.type === 'error' ? 'red' : 'blue'} size="1" mt="1">
                       <Callout.Text>{faucetMessage.text}</Callout.Text>
                    </Callout.Root>
                )}
            </Flex>
        )}
      </Flex>
    </Container>
  );
} 