import React from 'react';
import { Box, VStack, Heading, Text, Button, HStack, Badge } from '@chakra-ui/react';
import { LinkedInAccount } from '../../utils/api';

interface AccountCardProps {
  account: LinkedInAccount;
  onSelect: (accountId: string) => void;
  onReconnect: (accountId: string) => void;
  onDelete: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onSelect, onReconnect, onDelete }) => {
  return (
    <Box borderWidth={1} borderRadius="lg" p={4} shadow="md">
      <VStack align="stretch" spacing={3}>
        <Heading as="h3" size="md">{account.name}</Heading>
        <Text fontSize="sm" color="gray.600">ID: {account.id}</Text>
        <HStack>
          <Badge colorScheme={account.status === 'OK' ? 'green' : 'red'}>
            {account.status}
          </Badge>
          <Text fontSize="sm">Created: {new Date(account.created_at).toLocaleDateString()}</Text>
        </HStack>
        <Text fontSize="sm">Provider: {account.provider}</Text>
        <HStack>
          <Button size="sm" colorScheme="blue" onClick={() => onSelect(account.id)}>
            Select
          </Button>
          <Button size="sm" colorScheme="yellow" onClick={() => onReconnect(account.id)}>
            Reconnect
          </Button>
          <Button size="sm" colorScheme="red" onClick={() => onDelete(account.id)}>
            Delete
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default AccountCard;