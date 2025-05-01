import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount } from "@iota/dapp-kit";
import { Box, Container, Flex, Heading, Separator, Button } from "@radix-ui/themes";
import { WalletInfo } from "./components/WalletInfo";
import { Dashboard } from "./features/dashboard/Dashboard";
import { MultisigSetupForm } from './features/multisig-setup/MultisigSetupForm';
import { AppView } from './types'; // Import from types/index.ts

function App() {
  const account = useCurrentAccount();
  const isConnected = !!account;
  const [currentView, setCurrentView] = useState<AppView>('dashboard'); // State for current view

  const renderView = () => {
    switch (currentView) {
      case 'createMultisig':
        return <MultisigSetupForm />;
      case 'createTransaction':
        // TODO: Render transaction creation view later
        return <Heading size="4">Create Transaction (Not Implemented)</Heading>;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setCurrentView} />; // Pass setter function
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
        {isConnected ? (
          renderView() // Render the current view based on state
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
