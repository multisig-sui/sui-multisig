import { useState } from 'react';
import { ConnectButton, useCurrentAccount } from "@iota/dapp-kit";
import { Box, Container, Flex, Heading, Separator, Button } from "@radix-ui/themes";
import { WalletInfo } from "./components/WalletInfo";
import { Dashboard } from "./features/dashboard/Dashboard";
import { MultisigSetupForm } from './features/multisig-setup/MultisigSetupForm';
import { CreateTransaction } from './features/transactions/CreateTransaction';
import { AppView } from './types'; // Import from types/index.ts
import { MultisigConfig } from './features/multisig-setup/MultisigSetupForm'; // Import config type
import { ManageMultisig } from './features/multisig-manage/ManageMultisig'; // Import the new component

function App() {
  const account = useCurrentAccount();
  const isConnected = !!account;
  // Add state to hold address passed during navigation
  const [navigatedAddress, setNavigatedAddress] = useState<string | undefined>(undefined);
  const [currentView, setCurrentView] = useState<AppView>('dashboard'); // State for current view
  // Store the config of the currently active/managed multisig wallet
  const [activeMultisigConfig, setActiveMultisigConfig] = useState<MultisigConfig | null>(null); 

  console.log("[App] Rendering. Current view state:", currentView);

  // Update navigation handler type
  const handleNavigation = (view: AppView, address?: string) => {
    console.log(`[App] Navigating to ${view} ${address ? `with address ${address}`: ''}`);
    setNavigatedAddress(address); // Store address if provided
    setCurrentView(view);
  };

  // Handler passed to MultisigSetupForm
  const handleMultisigComplete = (config: MultisigConfig) => {
    console.log("[App] Multisig creation complete. Navigating to manageMultisig view.");
    setActiveMultisigConfig(config); // Store the generated config
    handleNavigation('manageMultisig'); // Use navigation handler
  };

  // Handler for loading an existing config
  const loadAndManageMultisig = (config: MultisigConfig) => {
    console.log("[App] Loading existing multisig config. Navigating to manageMultisig view.");
    setActiveMultisigConfig(config); // Store the loaded config
    handleNavigation('manageMultisig'); // Use navigation handler
  };

  const renderView = () => {
    console.log("[App] renderView called with view:", currentView); 
    switch (currentView) {
      case 'createMultisig':
        console.log("[App] Rendering MultisigSetupForm...");
        return <MultisigSetupForm onComplete={handleMultisigComplete} />;
      case 'createTransaction':
        console.log("[App] Rendering CreateTransaction...");
        // Pass the navigated address AND the active config down
        return (
            <CreateTransaction 
                prefilledSenderAddress={navigatedAddress} 
                activeMultisigConfig={activeMultisigConfig} // Pass config
            />
        );
      case 'manageMultisig':
        console.log("[App] Rendering ManageMultisig...");
        if (!activeMultisigConfig) {
            // Should not happen if navigation is correct, but handle defensively
            console.error("ManageMultisig view rendered without active config!");
            handleNavigation('dashboard'); // Use navigation handler
            return null;
        }
        // Pass navigation handler down
        return <ManageMultisig config={activeMultisigConfig} onNavigate={handleNavigation} />;
      case 'dashboard':
      default:
        console.log("[App] Rendering Dashboard..."); 
        // Pass navigation handler down
        return <Dashboard onNavigate={handleNavigation} onLoadConfig={loadAndManageMultisig} />;
    }
  };

  const goBackToDashboard = () => {
      // Clear active config when leaving the manage view
      if (currentView === 'manageMultisig') {
          setActiveMultisigConfig(null);
      }
      handleNavigation('dashboard'); // Use navigation handler
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
            {isConnected && currentView !== 'dashboard' && (
                <Button size="1" variant="soft" onClick={goBackToDashboard}>
                    &larr; Back to Dashboard
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
