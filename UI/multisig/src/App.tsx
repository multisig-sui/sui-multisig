import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { WalletStatus } from "./WalletStatus";
import { CreateMultisigFormSui } from "./features/multisig-setup/CreateMultisigFormSui";

function App() {
  const handleMultisigCreationComplete = (config: any) => {
    console.log("Sui Multisig Config Created:", config);
    alert(`Multisig Address: ${config.multisigAddress}\nConfig saved to console and downloaded.`);
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
          <Heading>dApp Starter Template</Heading>
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
          <CreateMultisigFormSui onComplete={handleMultisigCreationComplete} />
        </Container>
      </Container>
    </>
  );
}

export default App;
