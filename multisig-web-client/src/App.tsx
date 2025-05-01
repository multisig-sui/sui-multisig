import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount } from "@iota/dapp-kit";
import { Box, Container, Flex, Heading, Separator, Button, Callout } from "@radix-ui/themes";
import { WalletInfo } from "./components/WalletInfo";
import { Dashboard } from "./features/dashboard/Dashboard";
import { MultisigSetupForm } from './features/multisig-setup/MultisigSetupForm';
import { CreateTransaction } from './features/transactions/CreateTransaction';
import { AppView } from './types'; // Import from types/index.ts
import { MultisigConfig } from './features/multisig-setup/MultisigSetupForm'; // Import config type
import { CheckCircledIcon } from "@radix-ui/react-icons";

function App() {
  const account = useCurrentAccount();
  const isConnected = !!account;
  const [currentView, setCurrentView] = useState<AppView>('dashboard'); // State for current view
  const [lastCreatedMultisig, setLastCreatedMultisig] = useState<MultisigConfig | null>(null); // State to maybe show success message

  console.log("[App] Rendering. Current view state:", currentView); // Log state on render

  // Handler passed to MultisigSetupForm
  const handleMultisigComplete = (config: MultisigConfig) => {
    console.log("[App] Multisig complete. Navigating back to dashboard."); // Log here
    setLastCreatedMultisig(config); // Store the config
    setCurrentView('dashboard'); // Navigate back to dashboard
    // Optionally, clear the message after a delay
    setTimeout(() => setLastCreatedMultisig(null), 5000); 
  };

  const renderView = () => {
    console.log("[App] renderView called with view:", currentView); // Log inside renderView
    switch (currentView) {
      case 'createMultisig':
        console.log("[App] Rendering MultisigSetupForm..."); // Log specific case
        return <MultisigSetupForm onComplete={handleMultisigComplete} />; // Pass handler
      case 'createTransaction':
        console.log("[App] Rendering CreateTransaction..."); // Log specific case
        return <CreateTransaction />;
      case 'dashboard':
      default:
        console.log("[App] Rendering Dashboard..."); // Log specific case
        // Maybe pass lastCreatedMultisig to Dashboard to show success?
        return <Dashboard onNavigate={setCurrentView} />; 
    }
  };

  const goBackToDashboard = () => {
      setCurrentView('dashboard');
  };

  return (
    <>
      <Flex
        position="sticky"
        top="0"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
          backgroundColor: "var(--gray-a1)", 
          zIndex: 10
        }}
      >
        <Flex align="center" gap="3">
            {/* Add a Back button if not on dashboard */}
            {isConnected && currentView !== 'dashboard' && (
                <Button size="1" variant="soft" onClick={goBackToDashboard}>
                    &larr; Back
                </Button>
            )}
            <Heading>IOTA Multisig Web Client</Heading>
        </Flex>
        
        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container mt="4">
        <WalletInfo />
        <Separator my="3" size="4" />

        {/* Optional: Display success message briefly after redirect */} 
        {lastCreatedMultisig && currentView === 'dashboard' && (
             <Callout.Root color="green" size="2" mb="4">
                <Callout.Icon>
                    <CheckCircledIcon />
                </Callout.Icon>
                <Callout.Text>
                    Successfully created and saved multisig wallet: {lastCreatedMultisig.multisig_address}
                </Callout.Text>
             </Callout.Root>
        )}

        {isConnected ? (
          renderView() 
        ) : (
          <Heading size="4" align="center" mt="6">
            Please connect your wallet to continue.
          </Heading>
        )}
      </Container>
    </>
  );
}

export default App;
