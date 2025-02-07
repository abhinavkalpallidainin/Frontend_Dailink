import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Heading,
  Button,
  useToast,
  Progress,
  Flex,
  Icon,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { FaStop } from 'react-icons/fa';
import { Campaign, ExecutionLog } from '../../types/type';
import campaignService from '../../utils/campaignService';

interface ExecutionMonitorTabProps {
  campaign: Campaign;
  onStopCampaign: () => Promise<void>;
  refreshTrigger: number;
}

const ExecutionMonitorTab: React.FC<ExecutionMonitorTabProps> = ({ campaign, onStopCampaign, refreshTrigger }) => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAction, setCurrentAction] = useState<ExecutionLog | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [defaultDelay, setDefaultDelay] = useState({ days: 0, hours: 0, minutes: 30 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedLogs = await campaignService.getExecutionLogs(campaign.id);
      setLogs(fetchedLogs);
      const runningAction = fetchedLogs.find(log => log.status === 'running' || log.status === 'delaying');
      setCurrentAction(runningAction || null);
      if (runningAction && runningAction.status === 'delaying') {
        const delayMs = parseInt(runningAction.message.split(' ')[2]);
        const elapsedMs = Date.now() - new Date(runningAction.timestamp).getTime();
        setCountdown(Math.max(0, Math.floor((delayMs - elapsedMs) / 1000)));
        setProgress((elapsedMs / delayMs) * 100);
      } else {
        setCountdown(null);
        setProgress(0);
      }

      const campaignActions = await campaignService.getCampaignActions(campaign.id);
      const messageAction = campaignActions.find(action => action.type === 'SEND_MESSAGE');
      if (messageAction && messageAction.config.defaultDelay) {
        setDefaultDelay(messageAction.config.defaultDelay);
      }
    } catch (error) {
      console.error('Error fetching execution logs:', error);
      toast({
        title: 'Error fetching logs',
        description: 'Unable to fetch execution logs. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaign.id, toast]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh logs every 5 seconds

    return () => clearInterval(interval);
  }, [fetchLogs, refreshTrigger]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 0) return null;
          const newCountdown = prev - 1;
          setProgress(((defaultDelay.minutes * 60 - newCountdown) / (defaultDelay.minutes * 60)) * 100);
          return newCountdown;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown, defaultDelay.minutes]);

  const handleStopCampaign = async () => {
    setIsStopping(true);
    try {
      await onStopCampaign();
      toast({
        title: 'Campaign Stopped',
        description: 'The campaign has been successfully stopped.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop the campaign. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStopping(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'running':
        return 'blue';
      default:
        return 'yellow';
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box bg="gray.900" color="gray.100" p={6} borderRadius="lg" boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Execution Monitor</Heading>
          {campaign.status === 'Running' && (
            <Button
              colorScheme="red"
              onClick={handleStopCampaign}
              isLoading={isStopping}
              loadingText="Stopping..."
              leftIcon={<Icon as={FaStop} />}
            >
              Stop Campaign
            </Button>
          )}
        </Flex>

        <Box bg="gray.800" p={4} borderRadius="md" borderWidth={1} borderColor="gray.700">
          <Heading size="md" mb={2}>Current Action</Heading>
          {currentAction ? (
            <VStack align="start" spacing={2}>
              <Text><strong>Action:</strong> {currentAction.action_type}</Text>
              <Text><strong>Status:</strong> <Badge colorScheme={getStatusColor(currentAction.status)}>{currentAction.status}</Badge></Text>
              <Text><strong>Started at:</strong> {new Date(currentAction.timestamp).toLocaleString()}</Text>
              <Text><strong>Message:</strong> {currentAction.message}</Text>
              {countdown !== null && (
                <HStack spacing={4} width="100%">
                  <CircularProgress value={progress} color="blue.400" size="80px">
                    <CircularProgressLabel>{formatTime(countdown)}</CircularProgressLabel>
                  </CircularProgress>
                  <VStack align="start" flex={1}>
                    <Text><strong>Next action in:</strong> {formatTime(countdown)}</Text>
                    <Progress value={progress} size="sm" width="100%" colorScheme="blue" />
                  </VStack>
                </HStack>
              )}
            </VStack>
          ) : (
            <Text>No action currently running.</Text>
          )}
        </Box>

        <Box bg="gray.800" p={4} borderRadius="md" borderWidth={1} borderColor="gray.700">
          <Heading size="md" mb={4}>Execution Logs</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="gray.400">Timestamp</Th>
                <Th color="gray.400">Action</Th>
                <Th color="gray.400">Status</Th>
                <Th color="gray.400">Message</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                  <Td>{log.action_type}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(log.status)}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>{log.message}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};

export default ExecutionMonitorTab;