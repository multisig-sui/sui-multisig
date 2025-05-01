import { useCurrentAccount } from "@iota/dapp-kit";
import { Container, Flex, Heading, Text, Button, Callout, Box } from "@radix-ui/themes";
import React, { useState } from 'react';
import { getFaucetHost, requestIotaFromFaucetV0 } from '@iota/iota-sdk/faucet';

export function WalletInfo() {
  const account = useCurrentAccount();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<{ type: 'info' | 'error', text: string } | null>(null);

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

  return (
    <Container my="2">
      <Flex justify="between" align="start">
        <Box>
            <Heading size="3" mb="2">Wallet Info</Heading> 
            {account ? (
              <Flex direction="column">
                <Text>Status: Connected</Text>
                <Text>Address: {account.address}</Text>
                {/* We might add Network info here later */}
              </Flex>
            ) : (
              <Text>Status: Not Connected</Text>
            )}
        </Box>
        {/* Add Faucet Button only if connected */}
        {account && (
             <Button onClick={handleFaucetRequest} disabled={faucetLoading}>
                 {faucetLoading ? 'Requesting...' : 'Get Testnet Tokens'}
             </Button>
        )}
      </Flex>
      {/* Display Faucet Messages */} 
      {faucetMessage && (
        <Callout.Root color={faucetMessage.type === 'error' ? 'red' : 'blue'} size="1" mt="2">
           <Callout.Text>{faucetMessage.text}</Callout.Text>
        </Callout.Root>
      )}
    </Container>
  );
} 