import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (name: string) => Promise<void>;
}

const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreateList }) => {
  const [newListName, setNewListName] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const toast = useToast();

  const handleCreateList = async () => {
    if (newListName.trim()) {
      setIsCreating(true);
      try {
        await onCreateList(newListName.trim());
        setNewListName('');
        onClose();
        toast({
          title: 'List created',
          description: `New list "${newListName}" has been created successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error creating list',
          description: 'An unexpected error occurred. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader color="white">Create New List</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <Input
            placeholder="Enter list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
            color="white"
          />
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleCreateList}
            isLoading={isCreating}
            loadingText="Creating"
          >
            Create
          </Button>
          <Button variant="ghost" onClick={onClose} color="white">Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateListModal;