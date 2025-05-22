import { useState, useEffect, useCallback } from 'react';
import { ConnectButton, useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Separator, Text, Code, Button, Callout, Strong } from "@radix-ui/themes";
import { WalletStatus } from "./WalletStatus";
import { CreateMultisigFormSui } from "./features/multisig-setup/CreateMultisigFormSui";
import { LoadMultisigConfig } from './features/multisig-manage/LoadMultisigConfig';
import { MultisigDashboard } from './features/multisig-manage/MultisigDashboard';
import { SuiMultisigConfig } from './types';
import { FaucetButton } from './components/FaucetButton';
import { toB64 } from '@mysten/sui/utils';
import { CopyIcon, CheckCircledIcon, ReloadIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { CoinBalance } from '@mysten/sui/client';

const SUI_COIN_TYPE = '0x2::sui::SUI';
const MIST_PER_SUI = 1_000_000_000;

// Helper to get the flag byte for a given public key signature scheme
function getFlagForKeyScheme(scheme: 'ED25519' | 'Secp256k1' | 'Secp256r1' | string): number {
    switch (scheme) {
        case 'ED25519': return 0x00;
        case 'Secp256k1': return 0x01;
        case 'Secp256r1': return 0x02;
        default: throw new Error(`Unknown key scheme: ${scheme}`);
    }
}

function App() {
  const [activeMultisigConfig, setActiveMultisigConfig] = useState<SuiMultisigConfig | null>(null);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [formattedPublicKey, setFormattedPublicKey] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<CoinBalance | null>(null);
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = useState<boolean>(false);
  const [walletBalanceError, setWalletBalanceError] = useState<string | null>(null);

  const formatBalance = (totalBalance: string) => {
    const balanceInMist = BigInt(totalBalance);
    return (Number(balanceInMist) / MIST_PER_SUI).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 9 });
  };

  const fetchWalletBalance = useCallback(async () => {
    if (!currentAccount?.address) {
      setWalletBalance(null);
      setWalletBalanceError(null);
      return;
    }
    setIsLoadingWalletBalance(true);
    setWalletBalanceError(null);
    try {
      const coinBalance = await suiClient.getBalance({
        owner: currentAccount.address,
        coinType: SUI_COIN_TYPE,
      });
      setWalletBalance(coinBalance);
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      setWalletBalanceError(`Failed to fetch balance: ${error.message}`);
      setWalletBalance(null);
    } finally {
      setIsLoadingWalletBalance(false);
    }
  }, [suiClient, currentAccount?.address]);

  useEffect(() => {
    if (currentAccount?.address) {
      fetchWalletBalance();
    } else {
      // Clear balance if account disconnects
      setWalletBalance(null);
      setIsLoadingWalletBalance(false);
      setWalletBalanceError(null);
    }
  }, [currentAccount?.address, fetchWalletBalance]);

  useEffect(() => {
    if (currentAccount && currentAccount.publicKey) {
        try {
            let schemeString: string | undefined = undefined;
            const rawPublicKeyBytes = currentAccount.publicKey; // This is Uint8Array of the raw key, no flag

            // Attempt to infer from public key length
            if (rawPublicKeyBytes.length === 32) {
                schemeString = 'ED25519';
                console.log("Inferred ED25519 scheme based on public key length (32 bytes).");
            } else if (rawPublicKeyBytes.length === 33) {
                // Cannot definitively distinguish between Secp256k1 and Secp256r1 by length alone.
                // Defaulting to Secp256k1 as a common choice, but this might be incorrect for some Secp256r1 keys.
                // A more robust solution would involve the wallet adapter providing the scheme explicitly.
                schemeString = 'SECP256K1'; 
                console.warn("Inferred SECP256K1 scheme based on public key length (33 bytes). Could also be SECP256R1.");
            }

            // Fallback: check chains array if length inference didn't work or for confirmation (though less reliable for scheme)
            if (!schemeString && currentAccount.chains) {
                console.log("Public key length did not yield a definitive scheme, checking chains array as a fallback...");
                for (const chain of currentAccount.chains) {
                    if (chain.startsWith('sui:')) {
                        const potentialScheme = chain.substring(4).toUpperCase();
                        if (potentialScheme === 'ED25519' || potentialScheme === 'SECP256K1' || potentialScheme === 'SECP256R1') {
                            schemeString = potentialScheme;
                            console.log(`Scheme found in chains array: ${schemeString}`);
                            break;
                        }
                    }
                }
            }

            if (!schemeString) {
                throw new Error(
                    `Could not determine key scheme. Public key length: ${rawPublicKeyBytes.length}. ` +
                    "Checked publicKey length and chains array. Expected a chain like 'sui:ed25519' or a distinguishable PK length."
                );
            }
            
            let keySchemeForFlag: 'ED25519' | 'Secp256k1' | 'Secp256r1';
            if (schemeString === 'ED25519') keySchemeForFlag = 'ED25519';
            else if (schemeString === 'SECP256K1') keySchemeForFlag = 'Secp256k1';
            else if (schemeString === 'SECP256R1') keySchemeForFlag = 'Secp256r1';
            else throw new Error(`Unsupported key scheme string: ${schemeString}`);

            const flag = getFlagForKeyScheme(keySchemeForFlag);
            const pkWithFlag = new Uint8Array(1 + rawPublicKeyBytes.length);
            pkWithFlag[0] = flag;
            pkWithFlag.set(rawPublicKeyBytes, 1);
            setFormattedPublicKey(toB64(pkWithFlag));
        } catch (error: any) {
            console.error("Error formatting public key:", error);
            setFormattedPublicKey(`Error formatting key: ${error.message}`);
        }
    } else {
        setFormattedPublicKey(null);
    }
  }, [currentAccount]);

  const handleMultisigCreationComplete = (config: SuiMultisigConfig) => {
    console.log("Sui Multisig Config Created:", config);
    setActiveMultisigConfig(config);
  };

  const handleConfigLoaded = (config: SuiMultisigConfig) => {
    console.log("Sui Multisig Config Loaded:", config);
    setActiveMultisigConfig(config);
  };

  const handleUnloadConfig = () => {
    setActiveMultisigConfig(null);
  };

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>Sui Multisig Manager</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <WalletStatus />
          
          {currentAccount && (
            <Box my="3" p="3" style={{border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)'}}>
                <Heading size="2" mb="2">Connected Wallet Utilities</Heading>
                <Flex direction="column" gap="2" align="start">
                    {formattedPublicKey && formattedPublicKey !== 'Error formatting key' && (
                        <Flex direction="column" gap="1" align="start" mb="1">
                            <Text size="2">Formatted Public Key (for Multisig Setup):</Text>
                            <Code variant="ghost" style={{wordBreak: 'break-all'}}>{formattedPublicKey}</Code>
                            <Button 
                                variant="soft" 
                                size="1" 
                                mt="1"
                                onClick={() => {
                                    navigator.clipboard.writeText(formattedPublicKey);
                                    setCopySuccess(true);
                                    setTimeout(() => setCopySuccess(false), 2000);
                                }}
                            >
                                <CopyIcon/> Copy Formatted PK
                            </Button>
                            {copySuccess && <Text size="1" color="green"><CheckCircledIcon/> Copied!</Text>}
                        </Flex>
                    )}
                    {formattedPublicKey === 'Error formatting key' && (
                        <Callout.Root color="orange" size="1">
                            <Callout.Text>{formattedPublicKey}</Callout.Text>
                        </Callout.Root>
                    )}
                    <Separator my="2" size="4" />

                    <Flex direction="column" gap="1" align="start" mb="1">
                        <Flex justify="between" align="center" style={{width: '100%'}}>
                            <Text size="2" weight="bold">SUI Balance:</Text>
                            <Flex align="center" gap="2">
                                {isLoadingWalletBalance ? (
                                    <Text size="2" color="gray">Loading...</Text>
                                ) : walletBalanceError ? (
                                    <Text size="2" color="red" title={walletBalanceError}>Error</Text>
                                ) : walletBalance ? (
                                    <Strong>{formatBalance(walletBalance.totalBalance)} SUI</Strong>
                                ) : (
                                    <Text size="2" color="gray">N/A</Text>
                                )}
                                <Button size="1" variant="soft" onClick={fetchWalletBalance} disabled={isLoadingWalletBalance || !currentAccount?.address} title="Refresh Balance">
                                    <ReloadIcon />
                                </Button>
                            </Flex>
                        </Flex>
                        {walletBalanceError && (
                            <Callout.Root color="red" size="1" mt="1">
                                <Callout.Icon><InfoCircledIcon/></Callout.Icon>
                                <Callout.Text>{walletBalanceError}</Callout.Text>
                            </Callout.Root>
                        )}
                    </Flex>
                    
                    <Separator my="2" size="4" />

                    {/* The FaucetButton will automatically use the Testnet faucet if the connected wallet is on the Testnet network. */}
                    <FaucetButton onSuccess={() => {
                        console.log('Faucet request for connected wallet successful');
                        fetchWalletBalance(); // Refresh balance after successful faucet request
                    }}/>
                </Flex>
            </Box>
          )}

          {activeMultisigConfig ? (
            <MultisigDashboard config={activeMultisigConfig} onUnloadConfig={handleUnloadConfig} />
          ) : (
            <>
              <CreateMultisigFormSui onComplete={handleMultisigCreationComplete} />
              <Separator my="4" size="4" />
              <LoadMultisigConfig onConfigLoaded={handleConfigLoaded} />
            </>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
