import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../contexts/AccountContext';
import { reconnectLinkedInAccount, deleteLinkedInAccount } from '../../utils/api';

const Settings: React.FC = () => {
  const { selectedAccount, refreshAccounts } = useAccount();
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  // Define background colors
  const bgColor = useColorModeValue("gray.900", "gray.800");
  const cardBgColor = useColorModeValue("gray.800", "gray.700");
  const headingColor = useColorModeValue("blue.300", "blue.200");
    const textColor = useColorModeValue("gray.100", "gray.50");
  

  const handleReconnectAccount = async () => {
    if (!selectedAccount) return;

    try {
      await reconnectLinkedInAccount(selectedAccount.id, username, password);
      toast({
        title: 'Account reconnected',
        description: 'The LinkedIn account has been successfully reconnected.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setIsReconnectModalOpen(false);
      refreshAccounts();
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

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    try {
      await deleteLinkedInAccount(selectedAccount.id);
      toast({
        title: 'Account deleted',
        description: 'The LinkedIn account has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshAccounts();
      navigate('/');
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

  if (!selectedAccount) {
    return (
      <Container maxW="container.xl" py={8} bg={bgColor}>
        <Text color={headingColor}>No account selected. Please select an account from the sidebar.</Text>
      </Container>
    );
  }

  return (
      <Box bg={bgColor} minHeight="100vh" p={8}>
    <Container maxW="container.xl" py={8} bg={bgColor}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" color={headingColor}>Account Settings</Heading>
        <Box borderWidth={1} borderRadius="lg" p={6} boxShadow="md" bg={cardBgColor}>
          <VStack align="stretch" spacing={4}>
            <Heading as="h2" size="lg" color={textColor}>{selectedAccount.name}</Heading>
            <Text color={textColor}><strong>Status:</strong> {selectedAccount.status}</Text>
            <Text color={textColor}><strong>Created:</strong> {new Date(selectedAccount.created_at).toLocaleDateString()}</Text>
            <Text color={textColor}><strong>ID:</strong> {selectedAccount.id}</Text>
            <HStack>
              <Button colorScheme="blue" onClick={() => setIsReconnectModalOpen(true)}>Reconnect Account</Button>
              <Button colorScheme="red" onClick={handleDeleteAccount}>Delete Account</Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>

      <Modal isOpen={isReconnectModalOpen} onClose={() => setIsReconnectModalOpen(false)}>
        <ModalOverlay />
        <ModalContent bg={cardBgColor}>
          <ModalHeader color={textColor}>Reconnect LinkedIn Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Username</FormLabel>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} bg={bgColor} color={textColor} />
              </FormControl>
              <FormControl>
                <FormLabel color={textColor}>Password</FormLabel>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} bg={bgColor} color={textColor} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleReconnectAccount}>
              Reconnect
            </Button>
            <Button variant="ghost" onClick={() => setIsReconnectModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
    </Box>
  );
};

export default Settings;
