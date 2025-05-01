import { Box, Button, Flex, Text, TextField } from "@radix-ui/themes";

interface SignerInputProps {
  index: number;
  publicKey: string;
  weight: number;
  onPublicKeyChange: (index: number, value: string) => void;
  onWeightChange: (index: number, value: number) => void;
  onRemove: (index: number) => void;
}

export function SignerInput({ 
  index, 
  publicKey, 
  weight, 
  onPublicKeyChange, 
  onWeightChange, 
  onRemove
}: SignerInputProps) {
  return (
    <Flex gap="3" align="center" mb="2">
      <Box flexGrow="1">
        <Text size="2" mb="1" as="label" htmlFor={`signer-pk-${index}`}>Signer {index + 1} Public Key</Text>
        <TextField.Root 
          id={`signer-pk-${index}`}
          placeholder="Enter Base64 Public Key (with flag)" 
          value={publicKey}
          onChange={(e) => onPublicKeyChange(index, e.target.value)}
        />
      </Box>
      <Box style={{ width: '100px' }}>
        <Text size="2" mb="1" as="label" htmlFor={`signer-weight-${index}`}>Weight</Text>
        <TextField.Root 
          id={`signer-weight-${index}`}
          type="number"
          min={1} 
          value={weight.toString()} // Input value must be string
          onChange={(e) => onWeightChange(index, parseInt(e.target.value, 10) || 1)} // Parse to number, default to 1 if invalid
        />
      </Box>
      <Button color="red" variant="soft" onClick={() => onRemove(index)} style={{ alignSelf: 'end' }}>
        Remove
      </Button>
    </Flex>
  );
} 