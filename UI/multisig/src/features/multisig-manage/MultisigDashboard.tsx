import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Card, Flex, Heading, Text, Separator, Badge, Table, Code, Strong, Callout } from '@radix-ui/themes';
import { SuiMultisigConfig, SuiSigner } from '../../types';
import { useSuiClient } from '@mysten/dapp-kit';
import { CoinBalance } from '@mysten/sui/client';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { ReloadIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { FaucetButton } from '../../components/FaucetButton';
import { CreateTransactionForm } from '../multisig-tx/CreateTransactionForm';

const SUI_COIN_TYPE = '0x2::sui::SUI';
const MIST_PER_SUI = 1_000_000_000;

function b64ToUint8Array(b64: string): Uint8Array {
    const binary_string = atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

const getSuiAddressFromSigner = (signer: Omit<SuiSigner, 'id'>): string => {
    try {
        const decodedBytes = b64ToUint8Array(signer.publicKey);
        if (decodedBytes.length === 0) return 'Invalid PK';
        const flag = decodedBytes[0];
        const rawKeyBytes = decodedBytes.subarray(1);
        let suiPublicKey: any;

        const ED25519_PUBLIC_KEY_LENGTH = 32;
        const SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;
        const SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH = 33;

        switch (flag) {
            case 0x00: // Ed25519
                if (rawKeyBytes.length !== ED25519_PUBLIC_KEY_LENGTH) return 'Invalid Ed25519 len';
                suiPublicKey = new Ed25519PublicKey(rawKeyBytes);
                break;
            case 0x01: // Secp256k1
                if (rawKeyBytes.length !== SECP256K1_COMPRESSED_PUBLIC_KEY_LENGTH) return 'Invalid Secp256k1 len';
                suiPublicKey = new Secp256k1PublicKey(rawKeyBytes);
                break;
            case 0x02: // Secp256r1
                if (rawKeyBytes.length !== SECP256R1_COMPRESSED_PUBLIC_KEY_LENGTH) return 'Invalid Secp256r1 len';
                suiPublicKey = new Secp256r1PublicKey(rawKeyBytes);
                break;
            default:
                return 'Unknown PK flag';
        }
        return suiPublicKey.toSuiAddress();
    } catch (e) {
        console.error("Error deriving Sui address for signer:", signer.publicKey, e);
        return 'Error deriving address';
    }
};

interface MultisigDashboardProps {
  config: SuiMultisigConfig;
  onUnloadConfig: () => void;
}

export function MultisigDashboard({ config, onUnloadConfig }: MultisigDashboardProps) {
  const suiClient = useSuiClient();
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [showCreateTxForm, setShowCreateTxForm] = useState<boolean>(false);

  const fetchBalance = useCallback(async () => {
    if (!config.multisigAddress) return;
    setIsLoadingBalance(true);
    setBalanceError(null);
    try {
      const coinBalance = await suiClient.getBalance({
        owner: config.multisigAddress,
        coinType: SUI_COIN_TYPE,
      });
      setBalance(coinBalance);
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      setBalanceError(`Failed to fetch balance: ${error.message}`);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [suiClient, config.multisigAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const formatBalance = (totalBalance: string) => {
    const balanceInMist = BigInt(totalBalance);
    return (Number(balanceInMist) / MIST_PER_SUI).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 9 });
  };

  const handleTransactionCreated = (txDigest: string) => {
    console.log("Transaction created with digest:", txDigest);
    setShowCreateTxForm(false);
    fetchBalance();
  };

  return (
    <Card size="3" style={{ marginTop: '20px' }}>
      <Flex justify="between" align="center" mb="3">
        <Heading size="5">Multisig Wallet Dashboard</Heading>
        <Button variant="soft" color="gray" onClick={onUnloadConfig}>
          Close Dashboard / Load Another
        </Button>
      </Flex>
      <Separator my="3" size="4" />

      <Box mb="4">
        <Heading size="3" mb="2">Wallet Details</Heading>
        <Flex direction="column" gap="2">
          <Flex justify="between"><Text weight="bold">Multisig Address:</Text> <Code variant="ghost">{config.multisigAddress}</Code></Flex>
          <Flex justify="between"><Text weight="bold">Threshold:</Text> <Badge color="blue" size="2">{config.threshold}</Badge></Flex>
          <Flex justify="between"><Text weight="bold">Total Signers:</Text> <Text>{config.signers.length}</Text></Flex>
          <Flex justify="between" align="center">
            <Text weight="bold">SUI Balance:</Text>
            <Flex align="center" gap="2">
              {isLoadingBalance ? (
                <Text size="2" color="gray">Loading...</Text>
              ) : balanceError ? (
                <Text size="2" color="red">Error</Text>
              ) : balance ? (
                <Strong>{formatBalance(balance.totalBalance)} SUI</Strong>
              ) : (
                <Text size="2" color="gray">N/A</Text>
              )}
              <Button size="1" variant="soft" onClick={fetchBalance} disabled={isLoadingBalance} title="Refresh Balance">
                <ReloadIcon />
              </Button>
            </Flex>
          </Flex>
          {balanceError && (
             <Callout.Root color="red" size="1" mt="1">
                <Callout.Icon><InfoCircledIcon/></Callout.Icon>
                <Callout.Text>{balanceError}</Callout.Text>
            </Callout.Root>
          )}
          <Box mt="2">
            <FaucetButton 
              targetAddress={config.multisigAddress} 
              onSuccess={fetchBalance}
              buttonText={`Fund Multisig (${config.multisigAddress.slice(0,6)}...)`}
              buttonSize="1"
            />
          </Box>
        </Flex>
      </Box>

      <Separator my="3" size="4" />

      <Box>
        <Heading size="3" mb="2">Signers ({config.signers.length})</Heading>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Sui Address</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Public Key (Base64)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Key Scheme</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">Weight</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {config.signers.map((signer, index) => (
              <Table.Row key={index}>
                <Table.RowHeaderCell>{index + 1}</Table.RowHeaderCell>
                <Table.Cell>
                    <Code variant="ghost" title={getSuiAddressFromSigner(signer)}>
                        {getSuiAddressFromSigner(signer)}
                    </Code>
                </Table.Cell>
                <Table.Cell>
                    <Code variant="ghost" style={{maxWidth: '200px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={signer.publicKey}>
                        {signer.publicKey}
                    </Code>
                </Table.Cell>
                <Table.Cell>{signer.keyScheme.toUpperCase()}</Table.Cell>
                <Table.Cell align="right">{signer.weight}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      
      <Box mt="4" p="3" style={!showCreateTxForm ? {border: '1px dashed var(--gray-a7)', borderRadius: 'var(--radius-2)'} : {}}>
        {showCreateTxForm ? (
          <CreateTransactionForm 
            multisigConfig={config}
            onTransactionCreated={handleTransactionCreated}
            onCancel={() => setShowCreateTxForm(false)}
          />
        ) : (
          <Flex direction="column" align="center" gap="2">
            <Text color="gray" size="2">Ready to make a transaction?</Text>
            <Button onClick={() => setShowCreateTxForm(true)} variant="solid">
              Create New Transaction
            </Button>
          </Flex>
        )}
      </Box>
    </Card>
  );
} 