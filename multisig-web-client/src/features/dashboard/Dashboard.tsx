import { Box, Button, Container, Flex, Heading, Callout } from "@radix-ui/themes";
import { OwnedObjects } from "../../OwnedObjects"; // Adjust path as needed
import { AppView } from '../../types'; 
import { MultisigConfig } from "../multisig-setup/MultisigSetupForm"; // Import config type
import React, { useRef, useState } from 'react';

interface DashboardProps {
  onNavigate: (view: AppView) => void; 
  onLoadConfig: (config: MultisigConfig) => void; // Add prop for loading config
}

// Helper function to validate the loaded config structure
// Use 'unknown' for the input type
function isValidMultisigConfig(data: unknown): data is MultisigConfig {
    // First, check if data is an object and not null
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    // Now TypeScript knows data is an object, but properties are unknown
    // Use type assertion or check properties carefully
    const potentialConfig = data as Record<string, unknown>; 

    return (
        typeof potentialConfig.multisig_address === 'string' &&
        typeof potentialConfig.threshold === 'number' &&
        Array.isArray(potentialConfig.signers) &&
        potentialConfig.signers.every((signer: unknown) => { // Check signer as unknown first
            if (typeof signer !== 'object' || signer === null) return false;
            const potentialSigner = signer as Record<string, unknown>; // Assert signer is object
            return typeof potentialSigner.public_key === 'string' &&
                   typeof potentialSigner.weight === 'number'
        })
    );
}

export function Dashboard({ onNavigate, onLoadConfig }: DashboardProps) { 
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleCreateMultisig = () => {
    console.log("[Dashboard] handleCreateMultisig called. Navigating to createMultisig...");
    onNavigate('createMultisig'); 
  };

  const handleCreateTransaction = () => {
    console.log("[Dashboard] handleCreateTransaction called. Navigating to createTransaction...");
    onNavigate('createTransaction'); 
  };

  const handleLoadClick = () => {
    setLoadError(null); // Clear previous errors
    fileInputRef.current?.click(); // Trigger hidden file input
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    if (file.type !== 'application/json') {
        setLoadError('Invalid file type. Please select a .json file.');
        // Reset file input value so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') {
                throw new Error('Failed to read file content.');
            }
            const data = JSON.parse(text);

            if (isValidMultisigConfig(data)) {
                console.log("[Dashboard] Successfully loaded and validated config:", data);
                onLoadConfig(data); // Pass validated config up to App
            } else {
                throw new Error('Invalid multisig configuration file structure.');
            }
        } catch (error) {
            console.error("[Dashboard] Error loading or parsing config file:", error);
            setLoadError(error instanceof Error ? error.message : 'Failed to load or parse file.');
        }
        // Reset file input value after processing
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
        console.error("[Dashboard] Error reading file:", reader.error);
        setLoadError('Failed to read the selected file.');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <Container mt="4">
      <Heading mb="3">Dashboard</Heading>
      <Flex gap="3" mb="4" direction={{ initial: 'column', sm: 'row' }}>
        <Button onClick={handleCreateMultisig}>Create New Multisig Wallet</Button>
        {/* Hidden File Input */}
        <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
        />
        <Button variant="surface" onClick={handleLoadClick}>Load Existing Multisig</Button>
        <Button onClick={handleCreateTransaction}>Create Generic Transaction</Button>
      </Flex>

      {/* Display Load Error */}
      {loadError && (
        <Callout.Root color="red" size="1" mb="3">
            <Callout.Text>{loadError}</Callout.Text>
        </Callout.Root>
      )}

      <Box mt="4">
        <Heading size="3" mb="2">Your Objects</Heading>
        <OwnedObjects /> 
      </Box>

      {/* TODO: Add list of existing multisig wallets */}
      {/* TODO: Add list of pending transactions */}
    </Container>
  );
} 