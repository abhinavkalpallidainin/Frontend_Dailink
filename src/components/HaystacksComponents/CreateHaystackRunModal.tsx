import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast
} from '@chakra-ui/react';
import { supabase } from '../../utils/supabase';
import { useAccount } from '../../contexts/AccountContext';

interface CreateHaystackRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated?: () => void;
}

const CreateHaystackRunModal: React.FC<CreateHaystackRunModalProps> = ({ 
  isOpen, 
  onClose,
  onRunCreated 
}) => {
  const [runName, setRunName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { selectedAccount } = useAccount();

  const handleSubmit = async () => {
    if (!runName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a run name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!selectedAccount?.id) {
      toast({
        title: 'Error',
        description: 'No LinkedIn account selected',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Create new HSC run
      const { data: newRun, error: runError } = await supabase
        .from('hsc_runs')
        .insert([
          {
            name: runName.trim(),
            linkedin_account_id: selectedAccount.id,
            user_id: user?.id,
            stage: 'preparing-run',
            progress: 0,
            use_first_degree: null, // Will be set later in the process
          }
        ])
        .select()
        .single();

      if (runError) throw runError;

      toast({
        title: 'Success',
        description: 'Haystack run created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear input and close modal
      setRunName('');
      onClose();
      
      // Trigger refresh if callback provided
      if (onRunCreated) {
        onRunCreated();
      }
    } catch (error) {
      console.error('Error creating HSC run:', error);
      toast({
        title: 'Error',
        description: 'Failed to create Haystack run',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Haystack Run</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Run Name</FormLabel>
              <Input
                placeholder="Enter run name"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                isDisabled={isSubmitting}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Creating"
          >
            Create Run
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateHaystackRunModal;