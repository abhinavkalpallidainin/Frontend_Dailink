import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Button, useToast, Text, Spinner,
  Tabs, TabList, Tab, TabPanels, TabPanel, Badge,
  VStack, HStack, Progress, useColorModeValue, Alert, AlertIcon
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, SmallCloseIcon } from '@chakra-ui/icons';
import { Campaign } from '../../types/type';
import campaignService from '../../utils/campaignService';
import { startCampaignWorkflow, stopCampaignWorkflow } from '../../utils/workflowExecutor';
import { useAccount } from '../../contexts/AccountContext';
import GeneralTab from '../../components/CampaignEditPage/GeneralTab';
import WorkflowTab from '../../components/CampaignEditPage/workflowTab/WorkflowTab';
import ListsTab from '../../components/CampaignEditPage/ListsTab';
import DashboardTab from '../../components/CampaignEditPage/DashboardTab';
import StatisticsTab from '../../components/CampaignEditPage/StatisticsTab';
import SettingsTab from '../../components/CampaignEditPage/SettingsTab';
import ExecutionMonitorTab from '../../components/CampaignEditPage/ExecutionMonitorTab';
import ErrorBoundary from '../../components/Error/ErrorBoundary';
import { debounce } from 'lodash';

const CampaignEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [actionsLeft, setActionsLeft] = useState(0);
  const [actionStats, setActionStats] = useState({ last24Hours: 0, total: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingStoppingCampaign, setIsStartingStoppingCampaign] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedAccount } = useAccount();

  const bgColor = useColorModeValue("gray.900", "gray.900");
  const textColor = useColorModeValue("gray.100", "gray.100");

  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setError('No campaign ID provided.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fetchedCampaign = await campaignService.getCampaign(id);
      
      if (fetchedCampaign) {
        if (selectedAccount && selectedAccount.id) {
          fetchedCampaign.account_id = selectedAccount.id;
        } else if (!selectedAccount || !selectedAccount.id) {
          console.warn('Selected account or account ID is missing');
          toast({
            title: 'Warning',
            description: 'No account selected. Some features may be limited.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
        
        setCampaign(fetchedCampaign);
        
        const actionsPerformed = await campaignService.getActionsPerformedToday(fetchedCampaign.id);
        setActionsLeft(Math.max(0, fetchedCampaign.daily_limit - actionsPerformed));

        if (fetchedCampaign.account_id) {
          try {
            const stats = await campaignService.getActionStats(fetchedCampaign.id);
            setActionStats(stats);
          } catch (statsError) {
            console.error('Error fetching action stats:', statsError);
            toast({
              title: 'Warning',
              description: 'Unable to load action statistics. Some data may be incomplete.',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } else {
        setError('Campaign not found');
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
      setError('Unable to load campaign details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [id, selectedAccount, toast]);

  const debouncedFetchCampaign = useMemo(
    () => debounce(fetchCampaign, 500),
    [fetchCampaign]
  );

  useEffect(() => {
    if (selectedAccount && selectedAccount.id) {
      debouncedFetchCampaign();
    }
    return () => {
      debouncedFetchCampaign.cancel();
    };
  }, [selectedAccount, debouncedFetchCampaign]);

  const handleSave = async () => {
    if (!campaign) {
      toast({
        title: 'Error',
        description: 'No campaign data to save.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    try {
      setIsSaving(true);
      await campaignService.updateCampaign(campaign.id, campaign);
      toast({
        title: 'Campaign updated',
        description: 'Your campaign has been successfully updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/campaigns');
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error updating campaign',
        description: 'Unable to update campaign. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartStop = async () => {
    if (!campaign) {
      toast({
        title: 'Error',
        description: 'No campaign selected.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!selectedAccount || !selectedAccount.id) {
      toast({
        title: 'Error',
        description: 'No account selected. Please select an account first.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (campaign.account_id !== selectedAccount.id) {
      toast({
        title: 'Error',
        description: 'Campaign account does not match selected account.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsStartingStoppingCampaign(true);
      const newStatus = campaign.status === 'Running' ? 'Stopped' : 'Running';
      
      const updatedCampaign: Campaign = {
        ...campaign,
        account_id: selectedAccount.id,
        status: newStatus
      };

      if (newStatus === 'Running') {
        const leadCount = await campaignService.getLeadsCount(campaign.id);
        if (leadCount === 0) {
          toast({
            title: 'No leads',
            description: 'Cannot start campaign. There are no leads associated with this campaign.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setIsStartingStoppingCampaign(false);
          return;
        }
        await startCampaignWorkflow(updatedCampaign);
      } else {
        await stopCampaignWorkflow(updatedCampaign);
      }

      const savedCampaign = await campaignService.updateCampaign(campaign.id, updatedCampaign);
      setCampaign(savedCampaign);
      
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: `Campaign ${newStatus}`,
        description: `Your campaign has been ${newStatus.toLowerCase()}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: 'Error updating campaign status',
        description: 'Unable to update campaign status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsStartingStoppingCampaign(false);
    }
  };

  const handleLeadsAdded = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    debouncedFetchCampaign();
  }, [debouncedFetchCampaign]);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg={bgColor}>
        <Spinner size="xl" color="blue.500" />
        <Text ml={4} color={textColor}>Loading campaign...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box bg={bgColor} minHeight="100vh" p={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box bg={bgColor} minHeight="100vh" p={8}>
        <Alert status="error">
          <AlertIcon />
          No campaign found. Please check the campaign ID and try again.
        </Alert>
      </Box>
    );
  }

  const actionsProgress = campaign.daily_limit > 0 
    ? ((campaign.daily_limit - actionsLeft) / campaign.daily_limit) * 100 
    : 0;

  return (
    <ErrorBoundary>
      <Box bg={bgColor} minHeight="100vh" color={textColor} p={8}>
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl" color={textColor}>{campaign.name || 'Edit Campaign'}</Heading>
              <Badge colorScheme={campaign.status === 'Running' ? 'green' : 'red'} mt={2}>
                {campaign.status}
              </Badge>
            </Box>
            <HStack>
              <Button
                colorScheme={campaign.status === 'Running' ? 'red' : 'green'}
                onClick={handleStartStop}
                leftIcon={campaign.status === 'Running' ? <SmallCloseIcon /> : <CheckIcon />}
                isLoading={isStartingStoppingCampaign}
                loadingText={campaign.status === 'Running' ? 'Stopping...' : 'Starting...'}
              >
                {campaign.status === 'Running' ? 'Stop' : 'Start'}
              </Button>
              {campaign.status !== 'Running' && (
                <Button 
                  colorScheme="blue" 
                  onClick={handleSave} 
                  leftIcon={<EditIcon />}
                  isLoading={isSaving}
                  loadingText="Saving..."
                >
                  Save Campaign
                </Button>
              )}
            </HStack>
          </Flex>

          <Box>
            <Text mb={2}>Actions performed today: {campaign.daily_limit - actionsLeft} of {campaign.daily_limit}</Text>
            <Progress value={actionsProgress} colorScheme="blue" height="8px" borderRadius="full" />
          </Box>

          <Box>
            <Text>Last 24 hours: {actionStats.last24Hours} actions</Text>
            <Text>Total: {actionStats.total} actions</Text>
          </Box>

          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList mb={4}>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>General</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Workflow</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Lists</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Dashboard</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Statistics</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Settings</Tab>
              <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Execution Monitor</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <GeneralTab campaign={campaign} setCampaign={setCampaign} />
              </TabPanel>
              <TabPanel>
                <WorkflowTab 
                  campaign={campaign} 
                  setCampaign={setCampaign} 
                />
              </TabPanel>
              <TabPanel>
                <ListsTab campaign={campaign} refreshTrigger={refreshTrigger} onLeadsAdded={handleLeadsAdded} />
              </TabPanel>
              <TabPanel>
                <DashboardTab campaign={campaign} />
              </TabPanel>
              <TabPanel>
                <StatisticsTab campaign={campaign} />
              </TabPanel>
              <TabPanel>
                <SettingsTab campaign={campaign} setCampaign={setCampaign} />
              </TabPanel>
              <TabPanel>
                <ExecutionMonitorTab 
                  campaign={campaign} 
                  onStopCampaign={handleStartStop} 
                  refreshTrigger={refreshTrigger}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </ErrorBoundary>
  );
};

export default CampaignEditPage;