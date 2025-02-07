import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { getCRMLists, createCRMList, updateCRMList, deleteCRMList } from '../utils/supabase';
import { useAccount } from './AccountContext';
import { List, CombinedLinkedInAccount as TypeCombinedLinkedInAccount } from '../types/type';

interface ListContextType {
  lists: List[];
  isLoading: boolean;
  addList: (name: string) => Promise<List | null>;
  updateList: (id: string, name: string) => Promise<List | null>;
  removeList: (id: string) => Promise<void>;
  refreshLists: () => Promise<void>;
  setLists: React.Dispatch<React.SetStateAction<List[]>>;
}

const ListContext = createContext<ListContextType | undefined>(undefined);

export const ListProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAccount, ensureAccountInSupabase } = useAccount();
  const toast = useToast();

  const refreshLists = useCallback(async () => {
    if (!selectedAccount || !selectedAccount.unipile_id) {
      setLists([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedLists = await getCRMLists(selectedAccount.unipile_id);
      setLists(fetchedLists);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: 'Error fetching lists',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLists([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount, toast]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const addList = useCallback(async (name: string): Promise<List | null> => {
    if (!selectedAccount) return null;
    try {
      const ensuredAccount = await ensureAccountInSupabase(selectedAccount);
      const typedEnsuredAccount: TypeCombinedLinkedInAccount = {
        ...ensuredAccount,
        unipile_id: ensuredAccount.unipile_id || ensuredAccount.id,
      };
      const newList = await createCRMList(name, typedEnsuredAccount);
      if (newList) {
        setLists(prevLists => [...prevLists, newList]);
        toast({
          title: 'List created',
          description: `"${name}" has been created successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return newList;
      } else {
        throw new Error('Failed to create list');
      }
    } catch (error) {
      console.error('Error adding list:', error);
      toast({
        title: 'Error creating list',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [selectedAccount, ensureAccountInSupabase, toast]);

  const updateList = useCallback(async (id: string, name: string): Promise<List | null> => {
    if (!selectedAccount) return null;
    try {
      const updatedList = await updateCRMList(id, name);
      if (updatedList) {
        setLists(prevLists => 
          prevLists.map(list => 
            list.id === id ? { ...list, name } : list
          )
        );
        toast({
          title: 'List updated',
          description: `"${name}" has been updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        return updatedList;
      } else {
        throw new Error('Failed to update list');
      }
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: 'Error updating list',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  }, [selectedAccount, toast]);

  const removeList = useCallback(async (id: string): Promise<void> => {
    if (!selectedAccount) return;
    try {
      await deleteCRMList(id);
      setLists(prevLists => prevLists.filter(list => list.id !== id));
      toast({
        title: 'List deleted',
        description: 'The list has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing list:', error);
      toast({
        title: 'Error deleting list',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedAccount, toast]);

  const value = {
    lists,
    isLoading,
    addList,
    updateList,
    removeList,
    refreshLists,
    setLists,
  };

  return (
    <ListContext.Provider value={value}>
      {children}
    </ListContext.Provider>
  );
};

export const useList = (): ListContextType => {
  const context = useContext(ListContext);
  if (context === undefined) {
    throw new Error('useList must be used within a ListProvider');
  }
  return context;
};

export default ListContext;