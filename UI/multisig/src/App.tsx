import React, { useState } from 'react';
import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Separator } from "@radix-ui/themes";
import { WalletStatus } from "./WalletStatus";
import { CreateMultisigFormSui } from "./features/multisig-setup/CreateMultisigFormSui";
import { LoadMultisigConfig } from './features/multisig-manage/LoadMultisigConfig';
import { MultisigDashboard } from './features/multisig-manage/MultisigDashboard';
import { SuiMultisigConfig } from './types';

function App() {
  const [activeMultisigConfig, setActiveMultisigConfig] = useState<SuiMultisigConfig | null>(null);

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
