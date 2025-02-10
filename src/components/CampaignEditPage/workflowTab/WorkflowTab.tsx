import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Button, VStack, HStack, Text, useToast, Spinner, Alert, AlertIcon,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Select, Progress, useDisclosure
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Campaign, Action, CRMList, ActionType, QueueView } from '../../../types/type';
import ActionPalette from '../ActionPalette';
import EditActionDrawer from '../EditActionDrawer';
import ListsTabDrawer from '../ListsTabDrawer';
import WorkflowQueueManager from './WorkflowQueueManager';
import WorkflowActionList from './WorkflowActionList';
import { calculateActionQueues } from '../../../utils/campaignService';
import {
  setupQueueSubscription,
  getActionQueueCount,
  fetchCampaignLists,
  fetchCRMLists,
  handleAddToQueue,
  handleAddAction,
  handleUpdateAction,
  handleDeleteAction,
  handleMoveAction,
  handleEditAction,
  fetchActionStats,
  calculateDelayInMs,
} from './WorkflowUtils';
import { startCampaignWorkflow, stopCampaignWorkflow } from '../../../utils/workflowExecutor';
import { supabase } from '../../../utils/supabase';
import { initializeWebSocket, emitAction } from '../../../utils/websocket';
import { RealtimeChannel } from '@supabase/supabase-js';

interface WorkflowTabProps {
  campaign: Campaign;
  setCampaign: React.Dispatch<React.SetStateAction<Campaign | null>>;
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({ campaign, setCampaign }) => {
  const [workflow, setWorkflow] = useState<Action[]>([]);
  const [campaignLists, setCampaignLists] = useState<CRMList[]>([]);
  const [crmLists, setCRMLists] = useState<CRMList[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [selectedCRMList, setSelectedCRMList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(campaign.status === 'Running');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [delayCountdown, setDelayCountdown] = useState<number | null>(null);
  const [currentActionIndex, setCurrentActionIndex] = useState<number | null>(null);
  const [currentQueueView, setCurrentQueueView] = useState<QueueView>({ type: 'main', queueCount: 0 });
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasActions, setHasActions] = useState(false);
  const [supabaseSubscription, setSupabaseSubscription] = useState<RealtimeChannel | null>(null);

  const { isOpen: isActionPaletteOpen, onOpen: onActionPaletteOpen, onClose: onActionPaletteClose } = useDisclosure();
  const { isOpen: isEditDrawerOpen, onOpen: onEditDrawerOpen, onClose: onEditDrawerClose } = useDisclosure();
  const { isOpen: isQueueModalOpen, onOpen: onQueueModalOpen, onClose: onQueueModalClose } = useDisclosure();
  const { isOpen: isListsDrawerOpen, onOpen: onListsDrawerOpen, onClose: onListsDrawerClose } = useDisclosure();
  const toast = useToast();

  const fetchActions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('action_configurations')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('action_order', { ascending: true });
  
      if (error) throw error;
      
      const actions = data || [];
      const queueCounts = await calculateActionQueues(campaign.id);
      
      const updatedActions = actions.map(action => ({
        ...action,
        id: action.id,
        type: action.action_type as ActionType,
        config: typeof action.config === 'string' ? JSON.parse(action.config) : action.config,
        queue: queueCounts[action.id] || 0,
      }));
  
      setWorkflow(updatedActions);
      setHasActions(updatedActions.length > 0);
  
      setCampaign(prevCampaign => ({
        ...prevCampaign!,
        workflow: updatedActions,
      }));
  
      if (updatedActions.length > 0) {
        setTotalLeads(updatedActions[0].queue);
      }
  
      console.log('Updated actions with queue counts:', updatedActions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: "Error fetching actions",
        description: "Unable to load campaign actions. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [campaign.id, setCampaign, toast]);

  const handleActionUpdate = useCallback((updatedAction: any) => {
    setWorkflow(prevWorkflow => 
      prevWorkflow.map(action => 
        action.id === updatedAction.id ? { ...action, ...updatedAction } : action
      )
    );
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [lists, crmLists, initialQueueCount, actionStats] = await Promise.all([
          fetchCampaignLists(campaign.id),
          fetchCRMLists(campaign.account_id),
          getActionQueueCount(campaign.id).catch(() => 0),
          fetchActionStats(campaign.id).catch(() => [])
        ]);
    
        setCampaignLists(lists);
        setCRMLists(crmLists);
        setTotalLeads(initialQueueCount);
    
        await fetchActions();
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Unable to fetch campaign data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const unsubscribe = setupQueueSubscription(campaign.id, (queueCount) => {
      setTotalLeads(queueCount);
      setWorkflow(prev => prev.map((action, index) => 
        index === 0 ? { ...action, queue: queueCount } : action
      ));
    });

    const cleanupWebSocket = initializeWebSocket(campaign.id.toString(), handleActionCompleted);

    const channel = supabase
      .channel(`public:action_configurations:campaign_id=eq.${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'action_configurations',
          filter: `campaign_id=eq.${campaign.id}`
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          handleActionUpdate(payload.new);
        }
      )
      .subscribe();
  
    setSupabaseSubscription(channel);
  
    return () => {
      unsubscribe();
      cleanupWebSocket();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [campaign.id, campaign.account_id, fetchActions, handleActionUpdate]);

  const handleActionCompleted = useCallback((data: { actionId: number, successful: number, failed: number, queue: number }) => {
    setWorkflow(prevWorkflow => prevWorkflow.map(action =>
      action.id === data.actionId ? { ...action, ...data } : action
    ));

    if (data.actionId === workflow[0]?.id) {
      setTotalLeads(prevTotal => prevTotal - 1);
    }
  }, [workflow]);

  const handleAddToQueueClick = useCallback(async () => {
    if (!selectedCRMList) {
      toast({ title: "Error", description: "Please select a CRM list", status: "error", duration: 3000, isClosable: true });
      return;
    }
  
    try {
      setIsLoading(true);
      await handleAddToQueue(campaign.id, selectedCRMList);
      onQueueModalClose();
      toast({ title: "Leads added to queue", status: "success", duration: 3000, isClosable: true });
      fetchActions();
    } catch (error) {
      console.error('Error adding to queue:', error);
      let errorMessage = "An unexpected error occurred while adding leads to the queue.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({ 
        title: "Error adding leads to queue", 
        description: errorMessage, 
        status: "error", 
        duration: 5000, 
        isClosable: true 
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaign.id, selectedCRMList, onQueueModalClose, toast, fetchActions]);

  const handleAddActionClick = useCallback(async (actionType: ActionType) => {
    setIsWorkflowLoading(true);
    try {
      const newAction = await handleAddAction(campaign.id, actionType);
      setWorkflow(prev => [...prev, newAction]);
      onActionPaletteClose();
      toast({ title: "Action added", status: "success", duration: 3000, isClosable: true });
      fetchActions();
    } catch (error) {
      console.error('Error adding action:', error);
      toast({ title: "Error", description: "Failed to add action", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [campaign.id, onActionPaletteClose, toast, fetchActions]);

  const handleUpdateActionClick = useCallback(async (updatedAction: Action) => {
    setIsWorkflowLoading(true);
    try {
      const result = await handleUpdateAction(updatedAction);
      setWorkflow(prev => prev.map(action => action.id === result.id ? result : action));
      setCampaign(prev => prev ? { ...prev, workflow: prev.workflow.map(action => action.id === result.id ? result : action) } : null);
      setEditingAction(null);
      onEditDrawerClose();
      fetchActions();
    } catch (error) {
      console.error('Error updating action:', error);
      toast({ title: "Error", description: "Failed to update action", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [onEditDrawerClose, setCampaign, toast, fetchActions]);

  const handleDeleteActionClick = useCallback(async (actionId: number) => {
    setIsWorkflowLoading(true);
    try {
      await handleDeleteAction(actionId);
      setWorkflow(prev => prev.filter(action => action.id !== actionId));
      setCampaign(prev => prev ? { ...prev, workflow: prev.workflow.filter(action => action.id !== actionId) } : null);
      fetchActions();
    } catch (error) {
      console.error('Error deleting action:', error);
      toast({ title: "Error", description: "Failed to delete action", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [setCampaign, toast, fetchActions]);

  const handleMoveActionClick = useCallback(async (index: number, direction: 'up' | 'down') => {
    setIsWorkflowLoading(true);
    try {
      await handleMoveAction(campaign.id, index, direction);
      const newWorkflow = [...workflow];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newWorkflow[index], newWorkflow[newIndex]] = [newWorkflow[newIndex], newWorkflow[index]];
      setWorkflow(newWorkflow);
      setCampaign(prev => prev ? { ...prev, workflow: newWorkflow } : null);
      fetchActions();
    } catch (error) {
      console.error('Error moving action:', error);
      toast({ title: "Error", description: "Failed to move action", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsWorkflowLoading(false);
    }
  }, [campaign.id, setCampaign, toast, workflow, fetchActions]);

  const handleEditActionClick = useCallback(async (actionId: number) => {
    try {
      const action = await handleEditAction(actionId);
      setEditingAction(action);
      onEditDrawerOpen();
    } catch (error) {
      console.error('Error fetching action for editing:', error);
      toast({ title: "Error", description: "Failed to fetch action details", status: "error", duration: 3000, isClosable: true });
    }
  }, [onEditDrawerOpen, toast]);

  const handleStartCampaign = useCallback(async () => {
    try {
      if (totalLeads === 0) {
        toast({
          title: "Cannot start campaign",
          description: "The queue is empty. Add leads to start the campaign.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await startCampaignWorkflow(campaign);
      setIsRunning(true);
      setCampaign(prev => prev ? { ...prev, status: 'Running' } : null);
      setCountdown(60);
      setCurrentActionIndex(0);
      if (workflow[0]?.config?.delay) {
        setDelayCountdown(calculateDelayInMs(workflow[0].config.delay));
      }
      toast({ title: "Campaign Started", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast({ title: "Error", description: "Failed to start the campaign", status: "error", duration: 3000, isClosable: true });
    }
  }, [campaign, toast, workflow, totalLeads, setCampaign]);

  const handleStopCampaign = useCallback(async () => {
    try {
      await stopCampaignWorkflow(campaign);
      setIsRunning(false);
      setCampaign(prev => prev ? { ...prev, status: 'Stopped' } : null);
      setCountdown(null);
      setDelayCountdown(null);
      setCurrentActionIndex(null);
      toast({ title: "Campaign Stopped", status: "info", duration: 3000, isClosable: true });
    } catch (error) {
      console.error('Error stopping campaign:', error);
      toast({ title: "Error", description: "Failed to stop the campaign", status: "error", duration: 3000, isClosable: true });
    }
  }, [campaign, toast, setCampaign]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      if (delayCountdown !== null && delayCountdown > 0) {
        timer = setTimeout(() => setDelayCountdown(prev => prev !== null ? prev - 1000 : null), 1000);
      } else if (countdown !== null && countdown > 0) {
        timer = setTimeout(() => setCountdown(prev => prev !== null ? prev - 1 : null), 1000);
      } else if (countdown === 0) {
        if (currentActionIndex !== null && currentActionIndex < workflow.length - 1) {
          setCurrentActionIndex(currentActionIndex + 1);
          setCountdown(60);
          const nextAction = workflow[currentActionIndex + 1];
          if (nextAction?.config?.delay) {
            setDelayCountdown(calculateDelayInMs(nextAction.config.delay));
          }
        } else {
          setCountdown(60);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, delayCountdown, isRunning, currentActionIndex, workflow]);
  
  const memoizedWorkflowActionList = useMemo(() => (
    <WorkflowActionList
      workflow={workflow}
      isWorkflowLoading={isWorkflowLoading}
      currentActionIndex={currentActionIndex}
      onMoveAction={handleMoveActionClick}
      onEditAction={handleEditActionClick}
      onDeleteAction={handleDeleteActionClick}
      setCurrentQueueView={setCurrentQueueView}
      onListsDrawerOpen={onListsDrawerOpen}
    />
  ), [workflow, isWorkflowLoading, currentActionIndex, handleMoveActionClick, handleEditActionClick, handleDeleteActionClick, onListsDrawerOpen]);
  
  return (
    <Box bg="gray.900" color="gray.100" p={6} borderRadius="lg" boxShadow="md">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">Workflow</Heading>
          <HStack>
            {isRunning ? (
              <Button colorScheme="red" onClick={handleStopCampaign}>Stop Campaign</Button>
            ) : (
              <Button colorScheme="green" onClick={handleStartCampaign}>Start Campaign</Button>
            )}
            <Button
              colorScheme="blue"
              onClick={onActionPaletteOpen}
              leftIcon={<AddIcon />}
            >
              Add Action
            </Button>
          </HStack>
        </Flex>
  
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
  
        {isRunning && (
          <Box mb={4}>
            <Text>Next action in: {countdown} seconds</Text>
            <Progress value={(60 - (countdown || 0)) / 60 * 100} size="sm" colorScheme="blue" />
            {delayCountdown !== null && workflow[currentActionIndex || 0]?.config?.delay && (
              <>
                <Text mt={2}>Action delay: {delayCountdown / 1000} seconds</Text>
                <Progress 
                  value={(calculateDelayInMs(workflow[currentActionIndex || 0].config.delay) - (delayCountdown || 0)) / calculateDelayInMs(workflow[currentActionIndex || 0].config.delay) * 100} 
                  size="sm" 
                  colorScheme="green" 
                />
              </>
            )}
          </Box>
        )}
  
        <WorkflowQueueManager
          campaign={campaign}
          totalLeads={totalLeads}
          campaignLists={campaignLists}
          isLoading={isLoading}
          onQueueModalOpen={onQueueModalOpen}
          setCurrentQueueView={setCurrentQueueView}
          onListsDrawerOpen={onListsDrawerOpen}
        />
  
        {memoizedWorkflowActionList}
  
        <ActionPalette
          isOpen={isActionPaletteOpen}
          onClose={onActionPaletteClose}
          onAddAction={handleAddActionClick}
        />
  
        {editingAction && (
          <EditActionDrawer
            isOpen={isEditDrawerOpen}
            onClose={() => {
              setEditingAction(null);
              onEditDrawerClose();
            }}
            action={editingAction}
            onUpdateAction={handleUpdateActionClick}
            campaign={campaign}
          />
        )}
  
        <Modal isOpen={isQueueModalOpen} onClose={onQueueModalClose}>
          <ModalOverlay />
          <ModalContent bg="gray.800" color="white">
            <ModalHeader>Add to Queue</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {crmLists.length > 0 ? (
                <Select
                  placeholder="Select CRM List"
                  onChange={(e) => setSelectedCRMList(e.target.value)}
                  value={selectedCRMList}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="gray.200"
                  sx={{
                    option: {
                      backgroundColor: "gray.700",
                      _hover: {
                        backgroundColor: "gray.500",
                      },
                    },
                  }}
                >
                  {crmLists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </Select>
              ) : (
                <Text>No CRM lists available. Please create a list first.</Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="blue" 
                mr={3} 
                onClick={handleAddToQueueClick}
                isDisabled={!selectedCRMList || crmLists.length === 0 || !hasActions}
                isLoading={isLoading}
              >
                Add to Queue
              </Button>
              <Button variant="ghost" onClick={onQueueModalClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
  
        <ListsTabDrawer
          campaign={campaign}
          refreshTrigger={0}
          isOpen={isListsDrawerOpen}
          onClose={onListsDrawerClose}
          currentQueueView={currentQueueView}
        />
      </VStack>
    </Box>
  );
  };
  
  export default React.memo(WorkflowTab);