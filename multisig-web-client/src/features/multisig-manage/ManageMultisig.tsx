import { Box, Card, Heading, Text, Flex, Separator, Button } from '@radix-ui/themes';
import { MultisigConfig } from '../multisig-setup/MultisigSetupForm'; // Get config type
import { AppView } from '../../types'; // Get AppView for navigation

interface ManageMultisigProps {
  config: MultisigConfig;
  onNavigate: (view: AppView, address?: string) => void;
}

export function ManageMultisig({ config, onNavigate }: ManageMultisigProps) {

  const handleInitiateTransaction = () => {
    console.log("Navigate to create transaction for:", config.multisig_address);
    // Pass the multisig address along with the view change
    onNavigate('createTransaction', config.multisig_address);
  };

  return (
    <Card size="3">
      <Heading mb="4">Manage Multisig Wallet</Heading>

      <Box mb="3">
        <Heading size="3" mb="1">Address</Heading>
        <Text as="div" size="2" color="gray" style={{ wordBreak: 'break-all' }}>
          {config.multisig_address}
        </Text>
      </Box>

      <Box mb="3">
        <Heading size="3" mb="1">Threshold</Heading>
        <Text as="div" size="2" color="gray">
          {config.threshold}
        </Text>
      </Box>

      <Separator my="4" size="4" />

      <Box mb="4">
        <Heading size="3" mb="2">Signers ({config.signers.length})</Heading>
        {config.signers.map((signer, index) => (
          <Card key={index} size="1" mb="2">
            <Flex direction="column" gap="1">
              <Text size="1" weight="bold">Signer {index + 1}</Text>
              <Text size="1" color="gray" style={{ wordBreak: 'break-all' }}>
                Public Key: {signer.public_key}
              </Text>
              <Text size="1" color="gray">
                Weight: {signer.weight}
              </Text>
            </Flex>
          </Card>
        ))}
      </Box>

      <Flex mt="4" gap="3">
          <Button onClick={handleInitiateTransaction}>
              Create Transaction for this Wallet
          </Button>
          {/* Add other actions later, e.g., View History, Add/Remove Signers (advanced) */}
      </Flex>

    </Card>
  );
} 