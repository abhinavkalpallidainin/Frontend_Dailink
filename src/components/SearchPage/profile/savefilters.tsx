//frontend/src/components/SearchPage/savefilters.tsx
'use client'
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
  VStack,
  Input,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Divider,
  IconButton,
  HStack,
  Box,
  Text
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../../utils/supabase';

interface FilterGroup {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

interface SavedFilter {
  id: string;
  name: string;
  group_id: string;
  filters: any;
  created_at: string;
  user_id: string;
}

interface SaveFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
}

const SaveFiltersModal: React.FC<SaveFiltersModalProps> = ({
  isOpen,
  onClose,
  filters
}) => {
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [filterName, setFilterName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchFilterGroups();
  }, []);

  const fetchFilterGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('filter_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching filter groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load filter groups',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('filter_groups')
        .insert({
          name: newGroupName.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setGroups([...groups, data]);
      setSelectedGroup(data.id);
      setNewGroupName('');
      setIsCreatingGroup(false);

      toast({
        title: 'Success',
        description: 'Filter group created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating filter group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create filter group',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !selectedGroup) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('saved_filters')
        .insert({
          name: filterName.trim(),
          group_id: selectedGroup,
          user_id: user.id,
          filters: filters
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Filter saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Error saving filter:', error);
      toast({
        title: 'Error',
        description: 'Failed to save filter',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader>Save Search Filters</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Filter Name</FormLabel>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name"
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <Divider />

            {isCreatingGroup ? (
              <FormControl>
                <FormLabel>New Group Name</FormLabel>
                <HStack>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    bg="gray.700"
                    borderColor="gray.600"
                  />
                  <Button onClick={handleCreateGroup} colorScheme="blue" size="sm">
                    Create
                  </Button>
                  <Button 
                    onClick={() => setIsCreatingGroup(false)} 
                    variant="ghost" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </HStack>
              </FormControl>
            ) : (
              <FormControl>
                <HStack justify="space-between" align="center" mb={2}>
                  <FormLabel mb={0}>Select Group</FormLabel>
                  <IconButton
                    aria-label="Create new group"
                    icon={<AddIcon />}
                    size="sm"
                    onClick={() => setIsCreatingGroup(true)}
                  />
                </HStack>
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  placeholder="Select a group"
                  bg="gray.700"
                  borderColor="gray.600"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Select a group to save your filter in
                </FormHelperText>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            onClick={handleSaveFilter}
            isLoading={isSaving}
            isDisabled={!filterName.trim() || !selectedGroup}
          >
            Save Filter
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SaveFiltersModal;