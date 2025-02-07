import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  useToast,
  VStack,
  HStack,
  Spinner,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  getAllUnipileLinkedInAccounts,
  deleteLinkedInAccount,
  reconnectLinkedInAccount,
} from '../../utils/api';
import { ensureLinkedInAccount } from '../../utils/supabase';
import { useAccount } from '../../contexts/AccountContext';
import { CombinedLinkedInAccount } from '../../types/type';

const ManageAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<CombinedLinkedInAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAccount, setReconnectAccount] = useState<CombinedLinkedInAccount | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { setSelectedAccount } = useAccount();

  const fetchAndSyncAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAccounts = await getAllUnipileLinkedInAccounts();
      const syncedAccounts = await Promise.all(
        fetchedAccounts.map(async (account) => {
          const syncedAccount = await ensureLinkedInAccount({
            unipile_id: account.id,
            name: account.name,
            status: account.status,
            provider: "LINKEDIN",
          });
          return { ...account, ...syncedAccount, provider: "LINKEDIN" as const };
        })
      );
      setAccounts(syncedAccounts);
    } catch (error) {
      console.error('Error fetching and syncing accounts:', error);
      toast({
        title: 'Error fetching and syncing accounts',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAndSyncAccounts();
  }, [fetchAndSyncAccounts]);

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteLinkedInAccount(accountId);
      setAccounts((prevAccounts) => prevAccounts.filter((account) => account.id !== accountId));
      toast({
        title: 'Account deleted',
        description: 'The LinkedIn account has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting account:', error);
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
    if (!reconnectAccount) return;
    try {
      await reconnectLinkedInAccount(reconnectAccount.id, username, password);
      toast({
        title: 'Account reconnected',
        description: 'The LinkedIn account has been successfully reconnected.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      fetchAndSyncAccounts();
    } catch (error) {
      console.error('Error reconnecting account:', error);
      toast({
        title: 'Error reconnecting account',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSelectAccount = (account: CombinedLinkedInAccount) => {
    setSelectedAccount(account);
    toast({
      title: 'Account selected',
      description: `You are now using the account: ${account.name}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
        <Text mt={4}>Loading accounts...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Manage LinkedIn Accounts</Heading>
        <Button colorScheme="blue" onClick={() => navigate('/connect')}>
          Connect New Account
        </Button>
        {accounts.length === 0 ? (
          <Text>No LinkedIn accounts connected. Please connect an account to get started.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {accounts.map((account) => (
              <Box key={account.id} borderWidth={1} borderRadius="lg" p={4} boxShadow="md">
                <VStack align="stretch" spacing={3}>
                  <Heading as="h3" size="md">{account.name}</Heading>
                  <Text>Status: {account.status}</Text>
                  <Text>Created: {new Date(account.created_at).toLocaleDateString()}</Text>
                  <HStack>
                    <Button onClick={() => handleSelectAccount(account)}>Select Account</Button>
                    <Button onClick={() => {
                      setReconnectAccount(account);
                      onOpen();
                    }}>Reconnect</Button>
                    <Button colorScheme="red" onClick={() => handleDeleteAccount(account.id)}>Delete</Button>
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
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
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
    </Container>
  );
};

export default ManageAccounts;