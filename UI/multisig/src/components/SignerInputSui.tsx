import { Box, Button, Flex, Text, TextField, Select } from "@radix-ui/themes";
import { Cross1Icon } from '@radix-ui/react-icons';
import { SuiKeyScheme } from '../types';

interface SignerInputSuiProps {
  index: number;
  publicKey: string;
  weight: number;
  keyScheme: SuiKeyScheme;
  onPublicKeyChange: (index: number, value: string) => void;
  onWeightChange: (index: number, value: number) => void;
  onKeySchemeChange: (index: number, scheme: SuiKeyScheme) => void;
  onRemove: (index: number) => void;
  showRemoveButton: boolean;
}

export function SignerInputSui({ 
  index, 
  publicKey, 
  weight, 
  keyScheme,
  onPublicKeyChange, 
  onWeightChange, 
  onKeySchemeChange,
  onRemove,
  showRemoveButton
}: SignerInputSuiProps) {
  return (
    <Flex direction="column" gap="2" p="3" style={{ border: '1px solid var(--gray-a7)', borderRadius: 'var(--radius-3)' }} mb="3">
      <Flex justify="between" align="center">
        <Text size="2" weight="bold">Signer #{index + 1}</Text>
        {showRemoveButton && (
            <Button color="red" variant="soft" onClick={() => onRemove(index)} size="1">
                <Cross1Icon /> Remove
            </Button>
        )}
      </Flex>
      
      <TextField.Root 
        placeholder="Base64 Public Key (from sui keytool list)"
        value={publicKey}
        onChange={(e) => onPublicKeyChange(index, e.target.value)}
      />
      
      <Flex gap="3" align="end">
        <Box flexGrow="1">
            <Text size="1" mb="1" as="div" color="gray">Key Scheme</Text>
            <Select.Root value={keyScheme} onValueChange={(value) => onKeySchemeChange(index, value as SuiKeyScheme)}>
                <Select.Trigger placeholder="Select scheme..." style={{width: '100%'}}/>
                <Select.Content>
                    <Select.Item value="ed25519">Ed25519</Select.Item>
                    <Select.Item value="secp256k1">Secp256k1</Select.Item>
                    <Select.Item value="secp256r1">Secp256r1</Select.Item>
                </Select.Content>
            </Select.Root>
        </Box>
        <Box style={{ width: '120px' }}>
            <Text size="1" mb="1" as="div" color="gray">Weight</Text>
            <TextField.Root 
                type="number"
                min={1} 
                max={255} // Max weight for Sui multisig is u8
                value={weight.toString()} 
                onChange={(e) => onWeightChange(index, parseInt(e.target.value, 10) || 1)}
            />
        </Box>
      </Flex>
    </Flex>
  );
} 