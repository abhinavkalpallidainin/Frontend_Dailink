import React, { useState, useEffect, useCallback } from 'react';
import { Box, VStack, HStack, Text, Button, useToast, Heading, SimpleGrid, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Input } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getAllUnipileLinkedInAccounts, deleteLinkedInAccount, reconnectLinkedInAccount, LinkedInAccount } from '../../utils/api';

interface ConnectedAccountsProps {
  onAccountsChanged: () => Promise<void>;
}

const ConnectedAccounts: React.FC<ConnectedAccountsProps> = ({ onAccountsChanged }) => {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<LinkedInAccount | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const fetchAccounts = useCallback(async () => {
    console.log('Fetching accounts in ConnectedAccounts component');
    setIsLoading(true);
    try {
      const fetchedAccounts = await getAllUnipileLinkedInAccounts();
      setAccounts(fetchedAccounts);
    } catch (error) {
      toast({
        title: 'Error fetching accounts',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteAccount = async (account: LinkedInAccount) => {
    try {
      await deleteLinkedInAccount(account.id);
      setAccounts(prevAccounts => prevAccounts.filter(a => a.id !== account.id));
      toast({
        title: 'Account deleted',
        description: `The account ${account.name} has been successfully deleted.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      await onAccountsChanged();
    } catch (error) {
      toast({
        title: 'Error deleting account',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReconnectAccount = async () => {
    if (!selectedAccount) return;
    try {
      await reconnectLinkedInAccount(selectedAccount.id, username, password);
      toast({
        title: 'Account reconnected',
        description: `The account ${selectedAccount.name} has been successfully reconnected.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      await fetchAccounts();
      await onAccountsChanged();
    } catch (error) {
      toast({
        title: 'Error reconnecting account',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openReconnectModal = (account: LinkedInAccount) => {
    setSelectedAccount(account);
    setUsername('');
    setPassword('');
    onOpen();
  };

  if (isLoading) {
    return <Text>Loading accounts...</Text>;
  }

  return (
    <Box maxW="container.xl" mx="auto" p={4}>
      <VStack align="stretch" spacing={6}>
        <Heading as="h1" size="xl">Connected LinkedIn Accounts</Heading>
        <Button colorScheme="blue" onClick={() => navigate('/connect')}>Connect New Account</Button>
        {accounts.length === 0 ? (
          <Text>No LinkedIn accounts connected. Please connect an account to get started.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {accounts.map(account => (
              <Box key={account.id} borderWidth={1} borderRadius="lg" p={4}>
                <VStack align="stretch" spacing={3}>
                  <Heading as="h3" size="md">{account.name}</Heading>
                  <Text>Status: {account.status}</Text>
                  <Text>Created: {new Date(account.created_at).toLocaleDateString()}</Text>
                  <HStack>
                    <Button onClick={() => navigate(`/messaging/${account.id}`)}>Open Messages</Button>
                    <Button onClick={() => openReconnectModal(account)}>Reconnect</Button>
                    <Button colorScheme="red" onClick={() => handleDeleteAccount(account)}>Delete</Button>
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reconnect Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
              <Input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleReconnectAccount}>
              Reconnect
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ConnectedAccounts;