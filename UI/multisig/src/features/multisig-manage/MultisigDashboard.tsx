import React from 'react';
import { Box, Button, Card, Flex, Heading, Text, Separator, Badge, Table, Code } from '@radix-ui/themes';
import { SuiMultisigConfig } from '../../types';

interface MultisigDashboardProps {
  config: SuiMultisigConfig;
  onUnloadConfig: () => void;
}

export function MultisigDashboard({ config, onUnloadConfig }: MultisigDashboardProps) {
  return (
    <Card size="3" style={{ marginTop: '20px' }}>
      <Flex justify="between" align="center" mb="3">
        <Heading size="5">Multisig Wallet Dashboard</Heading>
        <Button variant="soft" color="gray" onClick={onUnloadConfig}>
          Close Dashboard / Load Another
        </Button>
      </Flex>
      <Separator my="3" size="4" />

      <Box mb="4">
        <Heading size="3" mb="2">Wallet Details</Heading>
        <Flex direction="column" gap="2">
          <Flex justify="between"><Text weight="bold">Multisig Address:</Text> <Code variant="ghost">{config.multisigAddress}</Code></Flex>
          <Flex justify="between"><Text weight="bold">Threshold:</Text> <Badge color="blue" size="2">{config.threshold}</Badge></Flex>
          <Flex justify="between"><Text weight="bold">Total Signers:</Text> <Text>{config.signers.length}</Text></Flex>
        </Flex>
      </Box>

      <Separator my="3" size="4" />

      <Box>
        <Heading size="3" mb="2">Signers ({config.signers.length})</Heading>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Public Key (Base64)</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Key Scheme</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">Weight</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {config.signers.map((signer, index) => (
              <Table.Row key={index}>
                <Table.RowHeaderCell>{index + 1}</Table.RowHeaderCell>
                <Table.Cell>
                    <Code variant="ghost" style={{maxWidth: '300px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={signer.publicKey}>
                        {signer.publicKey}
                    </Code>
                </Table.Cell>
                <Table.Cell>{signer.keyScheme.toUpperCase()}</Table.Cell>
                <Table.Cell align="right">{signer.weight}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      {/* Placeholder for future actions like balance display or transaction initiation */}
      <Box mt="4" p="3" style={{border: '1px dashed var(--gray-a7)', borderRadius: 'var(--radius-2)'}}>
        <Text color="gray" size="2">Future actions (e.g., Show Balance, Create Transaction) will appear here.</Text>
      </Box>
    </Card>
  );
} 