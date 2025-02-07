import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Progress,
  VStack,
  useToast
} from '@chakra-ui/react';

interface ChatSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

const ChatSyncModal: React.FC<ChatSyncModalProps> = ({ isOpen, onClose, chatId }) => {
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      startSync();
    }
  }, [isOpen, chatId]);

  const startSync = async () => {
    setIsLoading(true);
    setSyncStatus('Starting synchronization...');
    setProgress(0);

    try {
      // Simulating a sync process with multiple status updates
      const steps = [
        'Connecting to LinkedIn...',
        'Fetching recent messages...',
        'Updating local database...',
        'Syncing attachments...',
        'Finalizing sync...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setSyncStatus(steps[i]);
        setProgress((i + 1) * (100 / steps.length));
      }

      setSyncStatus('Sync completed successfully');
      setProgress(100);

      toast({
        title: 'Sync completed',
        description: 'Chat messages have been successfully synchronized.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setSyncStatus('Error: Failed to complete synchronization');
      toast({
        title: 'Sync failed',
        description: 'An error occurred during synchronization. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Chat Synchronization</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>Status: {syncStatus}</Text>
            <Progress value={progress} size="sm" colorScheme="blue" />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose} isDisabled={isLoading}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChatSyncModal;