import { useState, useCallback, useEffect } from 'react';
import { Button, Text, Callout, Box } from '@radix-ui/themes';
import { ReloadIcon, InfoCircledIcon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { useCurrentAccount, useSuiClientContext } from '@mysten/dapp-kit';
import { getFaucetHost, requestSuiFromFaucetV0 } from '@mysten/sui/faucet';

interface FaucetButtonProps {
  targetAddress?: string;
  onSuccess?: (address: string) => void; // Callback on successful request
  buttonText?: string;
  buttonVariant?: 'solid' | 'soft' | 'outline' | 'ghost';
  buttonSize?: '1' | '2' | '3' | '4';
}

export function FaucetButton({
  targetAddress,
  onSuccess,
  buttonText = 'Get SUI from Faucet',
  buttonVariant = 'soft',
  buttonSize = '2',
}: FaucetButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const suiContext = useSuiClientContext();

  const effectiveAddress = targetAddress || currentAccount?.address;

  const getNetworkForFaucet = (): 'devnet' | 'testnet' | 'localnet' | null => {
    const currentNetwork = suiContext.network?.toLowerCase();
    if (!currentNetwork) return null;
    if (currentNetwork.includes('devnet')) return 'devnet';
    if (currentNetwork.includes('testnet')) return 'testnet';
    if (currentNetwork.includes('localnet')) return 'localnet';
    return null;
  };

  const networkForFaucet = getNetworkForFaucet();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Hide error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleFaucetRequest = useCallback(async () => {
    if (!effectiveAddress || !networkForFaucet) {
      setError('Cannot request faucet: No valid address or unsupported network.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    let attemptedFaucetHost: string | null = null;

    // Log the network being targeted by the faucet
    if (networkForFaucet) {
      console.log(`FaucetButton: Attempting to request tokens from ${networkForFaucet} faucet for address ${effectiveAddress}`);
    }

    try {
      attemptedFaucetHost = getFaucetHost(networkForFaucet);
      await requestSuiFromFaucetV0({ host: attemptedFaucetHost, recipient: effectiveAddress });
      const shortAddress = `${effectiveAddress.slice(0, 6)}...${effectiveAddress.slice(-4)}`;
      setSuccessMessage(`Faucet request to ${networkForFaucet} network successful for ${shortAddress}. Tokens may take a moment to arrive.`);
      if (onSuccess) {
        onSuccess(effectiveAddress);
      }
    } catch (e: any) {
      console.error('Faucet request error:', e);
      let detailedError = `Faucet error: ${e.message || 'Unknown error'}`;
      if (e.message && (e.message.toLowerCase().includes('failed to fetch') || e.message.toLowerCase().includes('networkerror'))) {
        detailedError = 
          `Failed to connect to the faucet server (${attemptedFaucetHost || 'Unknown host'}). ` +
          `Please check your internet connection, ensure the ${networkForFaucet || 'selected'} network faucet is operational, ` +
          `and try again later. You might also be rate-limited.`;
      } else if (attemptedFaucetHost) {
        detailedError += ` (Attempted host: ${attemptedFaucetHost})`;
      }
      setError(detailedError);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveAddress, networkForFaucet, onSuccess, suiContext.network]);

  const canRequest = !!effectiveAddress && !!networkForFaucet;

  return (
    <Box>
      <Button 
        onClick={handleFaucetRequest} 
        disabled={isLoading || !canRequest}
        variant={buttonVariant}
        size={buttonSize}
      >
        {isLoading ? <ReloadIcon className="animate-spin" /> : <PaperPlaneIcon />}
        <Text ml={isLoading || !canRequest ? "0" : "2"}>{isLoading ? 'Requesting...' : buttonText}</Text>
      </Button>
      {successMessage && (
        <Callout.Root color="green" size="1" mt="2">
          <Callout.Text>{successMessage}</Callout.Text>
        </Callout.Root>
      )}
      {error && (
        <Callout.Root color="red" size="1" mt="2">
          <Callout.Icon><InfoCircledIcon /></Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {!canRequest && !targetAddress && !currentAccount?.address && (
         <Text size="1" color="gray" as="p" mt="1">Connect wallet to request faucet for your address.</Text>
      )}
       {!canRequest && networkForFaucet === null && suiContext.network && (
         <Text size="1" color="gray" as="p" mt="1">Faucet is not available for the current network ({suiContext.network}).</Text>
      )}
    </Box>
  );
} 