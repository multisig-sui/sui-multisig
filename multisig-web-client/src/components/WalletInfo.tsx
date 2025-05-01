import { useCurrentAccount } from "@iota/dapp-kit";
import { Container, Flex, Heading, Text } from "@radix-ui/themes";

export function WalletInfo() {
  const account = useCurrentAccount();

  return (
    <Container my="2">
      <Heading size="3" mb="2">Wallet Info</Heading> 

      {account ? (
        <Flex direction="column">
          <Text>Status: Connected</Text>
          <Text>Address: {account.address}</Text>
          {/* We might add Network info here later */}
        </Flex>
      ) : (
        <Text>Status: Not Connected</Text>
      )}
      {/* OwnedObjects removed from here */}
    </Container>
  );
} 