// src/components/SearchPage/SaveProfiles.tsx

import React, { useState, useCallback } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  Text,
  Divider,
  HStack,
  Icon,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronDownIcon, AddIcon, CheckIcon } from '@chakra-ui/icons';
import { List } from '../../../types/type';
import { SearchResult } from '../../../types/search';
import { addProfilesToList, createCRMList } from '../../../utils/supabase';
import { CombinedLinkedInAccount } from '../../../contexts/AccountContext';

interface SaveProfilesProps {
  selectedProfiles: SearchResult[];
  lists: List[];
  onListsUpdate: () => Promise<void>;
  account: CombinedLinkedInAccount;
  onSuccess: () => void;
}

const SaveProfiles: React.FC<SaveProfilesProps> = ({
  selectedProfiles,
  lists,
  onListsUpdate,
  account,
  onSuccess
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newListName, setNewListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const toast = useToast();

  const handleSaveToList = useCallback(async (list: List) => {
    if (selectedProfiles.length === 0) {
      toast({
        title: 'No profiles selected',
        description: 'Please select profiles to save',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      // Transform SearchResult to Profile format
      const profilesToSave = selectedProfiles.map(profile => ({
        linkedin_id: profile.id,
        name: profile.name,
        headline: profile.headline || '',
        location: profile.location || '',
        profile_url: profile.public_profile_url || '',
      }));

      await addProfilesToList(list.id, profilesToSave);
      
      toast({
        title: 'Success',
        description: `Saved ${selectedProfiles.length} profiles to "${list.name}"`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profiles to list',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  }, [selectedProfiles, toast, onSuccess, onClose]);

  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      toast({
        title: 'Invalid name',
        description: 'Please enter a list name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (!account.unipile_id) {
        throw new Error('Account unipile_id is required');
      }      
      const newList = await createCRMList(newListName.trim(), { unipile_id: account.unipile_id });
      if (newList) {
        await handleSaveToList(newList);
        await onListsUpdate();
        setNewListName('');
        toast({
          title: 'Success',
          description: `Created new list "${newListName}" and saved profiles`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating new list:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new list',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const handleSelectList = (list: List) => {
    setSelectedList(list);
    onOpen();
  };

  return (
    <>
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          colorScheme="blue"
          isDisabled={selectedProfiles.length === 0}
        >
          Save to List
        </MenuButton>
        <MenuList  sx={{ backgroundColor: 'gray.700 !important', borderColor: 'gray !important'}}>
          {lists.map((list) => (
            <MenuItem
              key={`menu-item-${list.id}`}
              onClick={() => handleSelectList(list)}
              _hover={{ bg: "gray.500" }}
              color="white"
                  bg="gray.700"
            >
              {list.name}
            </MenuItem>
          ))}
          <Divider my={2} borderColor="gray.600" />
          <MenuItem
            onClick={() => {
              setSelectedList(null);
              onOpen();
            }}
            _hover={{ bg: 'gray.500' }}
            color="white"
            bg="gray.900"
            icon={<AddIcon />}
          >
            Create New List
          </MenuItem>
        </MenuList>
      </Menu>

      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          onClose();
          setNewListName('');
          setSelectedList(null);
        }}
      >
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">
            {selectedList ? `Save to "${selectedList.name}"` : 'Create New List'}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {!selectedList ? (
                <Input
                  placeholder="Enter list name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                />
              ) : (
                <Text color="gray.300">
                  Are you sure you want to save {selectedProfiles.length} profile{selectedProfiles.length !== 1 ? 's' : ''} to this list?
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="green"
              mr={3}
              onClick={() => selectedList ? handleSaveToList(selectedList) : handleCreateNewList()}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              {selectedList ? 'Save' : 'Create & Save'}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                onClose();
                setNewListName('');
                setSelectedList(null);
              }}
              color="white"
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SaveProfiles;