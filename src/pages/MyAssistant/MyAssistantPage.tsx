import React, { useState, useEffect, useCallback } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, useToast, Alert, AlertIcon, useColorModeValue } from '@chakra-ui/react';
import { useAccount } from '../../contexts/AccountContext';
import AssistantConfiguration from '../../components/MyAssistantPage/AssistantConfiguration';
import AssistantLogs from '../../components/MyAssistantPage/AssistantLogs';
import { AssistantConfiguration as AssistantConfigType, LogEntry, DaininBot } from '../../types/type';
import { 
  getAssistantConfiguration, 
  getLogEntries, 
  checkNewMessages, 
  storePreviousMessages, 
  getBotConfiguration,
  createLogEntry
} from '../../utils/myAssistantUtils';

const MyAssistantPage: React.FC = () => {
  const { selectedAccount } = useAccount();
  const toast = useToast();
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfigType | null>(null);
  const [botConfig, setBotConfig] = useState<DaininBot | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState<number>(60);

  const bgColor = useColorModeValue("gray.900", "gray.800");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const headingColor = useColorModeValue("blue.300", "blue.200");

  const fetchAssistantConfiguration = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const config = await getAssistantConfiguration(selectedAccount.id);
      setAssistantConfig(config);
      if (config) {
        setIsAssistantEnabled(config.is_enabled);
        const bot = await getBotConfiguration(config.bot_id);
        setBotConfig(bot);
      }
    } catch (error) {
      console.error('Error fetching assistant configuration:', error);
      toast({
        title: 'Error fetching configuration',
        description: 'Failed to fetch assistant configuration. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedAccount, toast]);

  const fetchLogEntries = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const fetchedLogs = await getLogEntries(selectedAccount.id);
      setLogEntries(fetchedLogs);
    } catch (error) {
      console.error('Error fetching log entries:', error);
      toast({
        title: 'Error fetching logs',
        description: 'Failed to fetch log entries. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedAccount, toast]);

  useEffect(() => {
    if (selectedAccount) {
      fetchAssistantConfiguration();
      fetchLogEntries();
    }
  }, [selectedAccount, fetchAssistantConfiguration, fetchLogEntries]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let countdownId: NodeJS.Timeout;

    const checkMessages = async () => {
      if (isAssistantEnabled && selectedAccount && assistantConfig && botConfig) {
        try {
          await checkNewMessages(
            selectedAccount.id,
            assistantConfig.profile_ids,
            assistantConfig.bot_id,
            botConfig.api_key
          );
          setLastChecked(new Date());
          fetchLogEntries();
          setNextCheckIn(60);
        } catch (error) {
          console.error('Error checking new messages:', error);
          toast({
            title: 'Error checking messages',
            description: 'Failed to check for new messages. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    };

    const updateCountdown = () => {
      setNextCheckIn((prev) => (prev > 0 ? prev - 1 : 60));
    };

    if (isAssistantEnabled && selectedAccount && assistantConfig && botConfig) {
      checkMessages();
      intervalId = setInterval(checkMessages, 60000);
      countdownId = setInterval(updateCountdown, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [isAssistantEnabled, selectedAccount, assistantConfig, botConfig, toast, fetchLogEntries]);

  const handleAssistantToggle = useCallback(async (enabled: boolean) => {
    if (!selectedAccount || !assistantConfig) return;

    try {
      if (enabled) {
        await createLogEntry(selectedAccount.id, 'system', 'System', 'Assistant Enabled', 'Assistant has been enabled');
        await storePreviousMessages(selectedAccount.id, assistantConfig.profile_ids, assistantConfig.bot_id);
        setIsAssistantEnabled(true);
        toast({
          title: 'Assistant Enabled',
          description: 'Previous messages have been stored and the assistant is now active.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createLogEntry(selectedAccount.id, 'system', 'System', 'Assistant Disabled', 'Assistant has been disabled');
        setIsAssistantEnabled(false);
        toast({
          title: 'Assistant Disabled',
          description: 'The assistant has been deactivated.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error toggling assistant:', error);
      toast({
        title: 'Error Toggling Assistant',
        description: 'Failed to toggle assistant state. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedAccount, assistantConfig, toast]);

  if (!selectedAccount) {
    return (
      <Box p={6} bg={bgColor}>
        <Alert status="warning">
          <AlertIcon />
          Please select an account to configure your assistant.
        </Alert>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" p={8} bg={bgColor} color={textColor}>
      <Heading mb={6} color={headingColor}>My Assistant</Heading>
      
      <Tabs>
        <TabList>
          <Tab>Configuration</Tab>
          <Tab>Logs</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <AssistantConfiguration
              assistantConfig={assistantConfig}
              setAssistantConfig={setAssistantConfig}
              botConfig={botConfig}
              setBotConfig={setBotConfig}
              isAssistantEnabled={isAssistantEnabled}
              setIsAssistantEnabled={setIsAssistantEnabled}
              onAssistantToggle={handleAssistantToggle}
              fetchAssistantConfiguration={fetchAssistantConfiguration}
              fetchLogEntries={fetchLogEntries}
            />
          </TabPanel>
          <TabPanel>
            <AssistantLogs 
              logEntries={logEntries} 
              assistantConfig={assistantConfig}
              lastChecked={lastChecked}
              isAssistantEnabled={isAssistantEnabled}
              nextCheckIn={nextCheckIn}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MyAssistantPage;
