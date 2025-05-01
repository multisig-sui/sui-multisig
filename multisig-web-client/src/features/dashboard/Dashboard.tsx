import { Box, Button, Container, Flex, Heading } from "@radix-ui/themes";
import { OwnedObjects } from "../../OwnedObjects"; // Adjust path as needed

// Import AppView type from the correct path
import { AppView } from '../../types'; 

interface DashboardProps {
  onNavigate: (view: AppView) => void; // Use specific AppView type
}

export function Dashboard({ onNavigate }: DashboardProps) { 
  const handleCreateMultisig = () => {
    console.log("[Dashboard] handleCreateMultisig called. Navigating to createMultisig...");
    onNavigate('createMultisig'); 
  };

  const handleCreateTransaction = () => {
    console.log("[Dashboard] handleCreateTransaction called. Navigating to createTransaction...");
    onNavigate('createTransaction'); 
  };

  return (
    <Container mt="4">
      <Heading mb="3">Dashboard</Heading>
      <Flex gap="3" mb="4">
        <Button onClick={handleCreateMultisig}>Create New Multisig Wallet</Button>
        <Button onClick={handleCreateTransaction}>Create Transaction</Button>
      </Flex>

      <Box mt="4">
        <Heading size="3" mb="2">Your Objects</Heading>
        {/* We'll keep OwnedObjects here for now */}
        <OwnedObjects /> 
      </Box>

      {/* TODO: Add list of existing multisig wallets */}
      {/* TODO: Add list of pending transactions */}
    </Container>
  );
} 