import React, { useState, useCallback } from 'react';
import { Box, Button, Callout, Card, Flex, Text, Inset } from '@radix-ui/themes';
import { UploadIcon } from '@radix-ui/react-icons';
import { SuiMultisigConfig } from '../../types';

interface LoadMultisigConfigProps {
  onConfigLoaded: (config: SuiMultisigConfig) => void;
}

export function LoadMultisigConfig({ onConfigLoaded }: LoadMultisigConfigProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFileName(null);
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      setError('Invalid file type. Please select a JSON file.');
      return;
    }

    setFileName(file.name);

    try {
      const fileContent = await file.text();
      const parsedConfig = JSON.parse(fileContent) as SuiMultisigConfig;

      // Basic validation (can be more thorough)
      if (!parsedConfig.multisigAddress || !parsedConfig.threshold || !parsedConfig.signers) {
        throw new Error('Invalid configuration file format. Missing required fields.');
      }
      if (parsedConfig.signers.some(s => !s.publicKey || s.weight === undefined || !s.keyScheme)) {
        throw new Error('Invalid signer data in configuration file.');
      }
      if (typeof parsedConfig.threshold !== 'number' || parsedConfig.threshold <= 0) {
        throw new Error('Invalid threshold in configuration file.');
      }

      onConfigLoaded(parsedConfig);
    } catch (e: any) {
      console.error("Error loading or parsing config file:", e);
      setError(`Error loading file: ${e.message}`);
      setFileName(null);
    } finally {
      // Reset file input so the same file can be loaded again if needed
      event.target.value = '';
    }
  }, [onConfigLoaded]);

  return (
    <Card size="2" style={{ marginTop: '20px' }}>
      <Inset clip="padding-box" side="top" pb="current">
        <Box style={{ padding: 'var(--space-3)', background: 'var(--gray-a3)'}}>
            <Text as="div" size="2" weight="bold" mb="1">
                Load Existing Multisig Configuration
            </Text>
        </Box>
      </Inset>
      <Box p="3">
        <Flex direction="column" gap="3">
          <Text size="2" color="gray">
            Upload a previously saved <code>sui_multisig_config_*.json</code> file.
          </Text>
          <Button asChild variant="outline">
            <label htmlFor="config-upload">
              <UploadIcon width="16" height="16" style={{marginRight: 'var(--space-2)'}}/> 
              Select JSON File
            </label>
          </Button>
          <input 
            id="config-upload" 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          {fileName && (
            <Text size="1" color="green">Selected: {fileName}</Text>
          )}
          {error && (
            <Callout.Root color="red" size="1" mt="2">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
        </Flex>
      </Box>
    </Card>
  );
} 