import React, { useState, useCallback, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
  Button,
  HStack,
  useToast,
  Switch,
  Text,
  Box,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAccount } from '../../contexts/AccountContext';
import { AssistantConfiguration as AssistantConfigType, DaininBot, List, Message } from '../../types/type';
import {
  saveAssistantConfiguration,
  deleteAssistantConfiguration,
  getMessagesForLead,
  saveMessageToSupabase,
  getBotConfiguration,
  getCRMLists,
  getDaininBots,
  createLogEntry
} from '../../utils/myAssistantUtils';
import ProfileList from './ProfileList';

interface AssistantConfigurationProps {
  assistantConfig: AssistantConfigType | null;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfigType | null>>;
  botConfig: DaininBot | null;
  setBotConfig: React.Dispatch<React.SetStateAction<DaininBot | null>>;
  isAssistantEnabled: boolean;
  setIsAssistantEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onAssistantToggle: (enabled: boolean) => Promise<void>;
  fetchAssistantConfiguration: () => Promise<void>;
  fetchLogEntries: () => Promise<void>;
}

const AssistantConfiguration: React.FC<AssistantConfigurationProps> = ({
  assistantConfig,
  setAssistantConfig,
  botConfig,
  setBotConfig,
  isAssistantEnabled,
  setIsAssistantEnabled,
  onAssistantToggle,
  fetchAssistantConfiguration,
  fetchLogEntries
}) => {
  const { selectedAccount } = useAccount();
  const toast = useToast();

  const [lists, setLists] = useState<List[]>([]);
  const [bots, setBots] = useState<DaininBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    if (!selectedAccount) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLists = await getCRMLists(selectedAccount.id);
      console.log('Fetched lists:', fetchedLists);
      setLists(fetchedLists);
    } catch (error) {
      console.error('Error fetching CRM lists:', error);
      setError('Failed to fetch CRM lists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  const fetchBots = useCallback(async () => {
    if (!selectedAccount) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedBots = await getDaininBots(selectedAccount.user_id);
      console.log('Fetched bots:', fetchedBots);
      setBots(fetchedBots);
    } catch (error) {
      console.error('Error fetching Dainin bots:', error);
      setError('Failed to fetch Dainin bots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchLists();
    fetchBots();
  }, [fetchLists, fetchBots]);

  useEffect(() => {
    if (assistantConfig) {
      setSelectedBot(assistantConfig.bot_id);
      setSelectedList(assistantConfig.list_id);
    }
  }, [assistantConfig]);

  const handleProfileToggle = useCallback(async (profileId: string) => {
    if (!selectedAccount) {
      console.error('No selected account');
      return;
    }
  
    console.log(`Toggling profile ${profileId}`);
  
    const isCurrentlyEnabled = assistantConfig?.profile_ids.includes(profileId) || false;
    console.log(`Profile ${profileId} is currently ${isCurrentlyEnabled ? 'enabled' : 'disabled'}`);
  
    const updatedProfileIds = isCurrentlyEnabled
      ? assistantConfig!.profile_ids.filter(id => id !== profileId)
      : [...(assistantConfig?.profile_ids || []), profileId];
  
    if (!isCurrentlyEnabled) {
      console.log(`Enabling assistant for profile ${profileId}`);
      try {
        console.log(`Fetching messages for lead ${profileId}`);
        const messages = await getMessagesForLead(profileId, selectedAccount.id);
        console.log(`Fetched ${messages.length} messages for lead ${profileId}`);
  
        console.log(`Storing messages for lead ${profileId}`);
        for (const message of messages) {
          await saveMessageToSupabase(message, selectedAccount.id, profileId, selectedBot);
          console.log(`Stored message: ${JSON.stringify(message)}`);
        }
        console.log(`Stored ${messages.length} messages for lead ${profileId}`);
  

        toast({
          title: 'Message History Stored',
          description: `Stored ${messages.length} messages for lead ${profileId}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        await createLogEntry(selectedAccount.id, profileId, 'Profile', 'Assistant Enabled', `Assistant enabled for profile ${profileId}`);
      } catch (error) {
        console.error('Error storing message history:', error);
        toast({
          title: 'Error',
          description: `Failed to store message history for lead ${profileId}. Error: ${error}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } else {
      console.log(`Disabling assistant for profile ${profileId}`);
      await createLogEntry(selectedAccount.id, profileId, 'Profile', 'Assistant Disabled', `Assistant disabled for profile ${profileId}`);
    }

    setAssistantConfig(prev => {
      if (!prev) return prev;
      console.log(`Updating assistant config. New profile_ids: ${JSON.stringify(updatedProfileIds)}`);
      return { ...prev, profile_ids: updatedProfileIds };
    });
  }, [selectedAccount, assistantConfig, setAssistantConfig, toast]);

  const handleSaveConfig = useCallback(async () => {
    if (!selectedAccount || !selectedBot || !selectedList) {
      toast({
        title: 'Incomplete Configuration',
        description: 'Please select a bot and a CRM list before saving.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    setIsLoading(true);
    setError(null);
    try {
      await saveAssistantConfiguration(
        selectedAccount.id.toString(),
        selectedBot,
        selectedList,
        assistantConfig?.profile_ids || [],
        isAssistantEnabled
      );
      toast({
        title: 'Configuration Saved',
        description: 'Your assistant configuration has been saved successfully. Check the logs for details on message syncing.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchAssistantConfiguration();
      fetchLogEntries();
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Failed to save assistant configuration. Please try again.');
      toast({
        title: 'Error Saving Configuration',
        description: 'There was an error saving the configuration. Please check the console for more details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount, selectedBot, selectedList, assistantConfig, isAssistantEnabled, toast, fetchAssistantConfiguration, fetchLogEntries]);

  const handleDeleteConfig = useCallback(async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setError(null);
    try {
      await deleteAssistantConfiguration(selectedAccount.id);
      toast({
        title: 'Configuration Deleted',
        description: 'Your assistant configuration has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await createLogEntry(selectedAccount.id, 'system', 'System', 'Configuration Deleted', 'Assistant configuration was deleted');
      fetchAssistantConfiguration();
      fetchLogEntries();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setError('Failed to delete assistant configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount, toast, fetchAssistantConfiguration, fetchLogEntries]);

  const handleAssistantToggle = async (newValue: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      await saveAssistantConfiguration(
        selectedAccount!.id,
        selectedBot,
        selectedList,
        assistantConfig?.profile_ids || [],
        newValue
      );
      setIsAssistantEnabled(newValue);
      await onAssistantToggle(newValue);
      await createLogEntry(selectedAccount!.id, 'system', 'System', newValue ? 'Assistant Enabled' : 'Assistant Disabled', `Assistant was ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling assistant:', error);
      setError('Failed to toggle assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormControl>
        <FormLabel>Select Bot</FormLabel>
        <Select
        bg="gray.700"
        borderColor="gray.600"
        color="gray.200"
          value={selectedBot}
          onChange={(e) => setSelectedBot(e.target.value)}
          placeholder="Select a bot"
          isDisabled={isLoading || bots.length === 0}
          sx={{
            option: {
              backgroundColor: 'gray.700',
              _hover: {
                backgroundColor: 'gray.500'
              }
            }
          }}
        >
          {bots.map((bot) => (
            <option style={{ backgroundColor: 'gray.700' }} key={bot.id} value={bot.id}>{bot.name}</option>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormLabel>Select CRM List</FormLabel>
        <Select
         bg="gray.700"
         borderColor="gray.600"
         color="gray.200"
          value={selectedList}
          onChange={(e) => setSelectedList(e.target.value)}
          placeholder="Select a CRM list"
          isDisabled={isLoading || lists.length === 0}
          sx={{
            option: {
              backgroundColor: 'gray.700',
              _hover: {
                backgroundColor: 'gray.500'
              }
            }
          }}
        >
          {lists.map((list) => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </Select>
      </FormControl>

      {selectedList && (
        <ProfileList
          listId={selectedList}
          assistantConfig={assistantConfig}
          botConfig={botConfig}
          setAssistantConfig={setAssistantConfig}
          onProfileToggle={handleProfileToggle}
        />
      )}

      <HStack spacing={4}>
        <Button 
          colorScheme="blue" 
          onClick={handleSaveConfig}
          isDisabled={!selectedBot || !selectedList || isLoading}
          isLoading={isLoading}
        >
          Save Configuration
        </Button>
        <Button onClick={fetchAssistantConfiguration} isDisabled={isLoading}>
          Refresh Configuration
        </Button>
        {assistantConfig && (
          <Button colorScheme="red" onClick={handleDeleteConfig} isDisabled={isLoading}>
            Delete Configuration
          </Button>
        )}
      </HStack>

      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="assistant-toggle" mb="0">
          Enable Assistant
        </FormLabel>
        <Switch
          id="assistant-toggle"
          isChecked={isAssistantEnabled}
          onChange={(e) => handleAssistantToggle(e.target.checked)}
          colorScheme="green"
          isDisabled={!assistantConfig || isLoading}
        />
      </FormControl>

      {isLoading && (
        <Box textAlign="center">
          <Spinner size="xl" />
          <Text mt={2}>Loading...</Text>
        </Box>
      )}
    </VStack>
  );
};

export default AssistantConfiguration;