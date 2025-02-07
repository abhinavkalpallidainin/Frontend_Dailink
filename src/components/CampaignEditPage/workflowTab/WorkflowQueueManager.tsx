import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  VStack,
  Tooltip,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { AddIcon, ViewIcon } from '@chakra-ui/icons';
import { Campaign, CRMList, QueueView } from '../../../types/type';

interface WorkflowQueueManagerProps {
  campaign: Campaign;
  totalLeads: number;
  campaignLists: CRMList[];
  isLoading: boolean;
  onQueueModalOpen: () => void;
  setCurrentQueueView: (view: QueueView) => void;
  onListsDrawerOpen: () => void;
}

const WorkflowQueueManager: React.FC<WorkflowQueueManagerProps> = ({
  campaign,
  totalLeads,
  campaignLists,
  isLoading,
  onQueueModalOpen,
  setCurrentQueueView,
  onListsDrawerOpen,
}) => {
  const bgColor = useColorModeValue("gray.700", "gray.800");
  const textColor = useColorModeValue("gray.100", "gray.200");
  const badgeColor = useColorModeValue("green.500", "green.300");
  const listTextColor = useColorModeValue("gray.300", "gray.400");

  const handleViewQueue = () => {
    setCurrentQueueView({ type: 'main', queueCount: totalLeads });
    onListsDrawerOpen();
  };

  return (
    <Box bg={bgColor} p={4} borderRadius="md" mb={6} boxShadow="md">
      <Flex justify="space-between" align="center">
        <HStack spacing={2}>
          <Text color={textColor} fontWeight="bold" fontSize="lg">Queue</Text>
          <Tooltip label="Total number of leads in the campaign queue" placement="top">
            <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="full">
              {totalLeads}
            </Badge>
          </Tooltip>
        </HStack>
        <HStack spacing={2}>
          <Button
            colorScheme="teal"
            onClick={onQueueModalOpen}
            leftIcon={<AddIcon />}
            size="sm"
          >
            Add to Queue
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleViewQueue}
            leftIcon={<ViewIcon />}
            size="sm"
          >
            View Queue
          </Button>
        </HStack>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" mt={4}>
          <Spinner size="md" color={badgeColor} />
        </Flex>
      ) : (
        <VStack align="stretch" mt={4} spacing={2}>
          {campaignLists.length > 0 ? (
            campaignLists.map(list => (
              <Tooltip key={list.id} label={`List ID: ${list.id}`} placement="top-start">
                <Text color={listTextColor} fontSize="sm">
                  {list.name} ({list.leadCount} leads)
                </Text>
              </Tooltip>
            ))
          ) : (
            <Alert status="info" variant="subtle">
              <AlertIcon />
              No lists added to this campaign yet.
            </Alert>
          )}
        </VStack>
      )}

      {totalLeads === 0 && !isLoading && (
        <Alert status="warning" mt={4}>
          <AlertIcon />
          The queue is empty. Add leads to start the campaign.
        </Alert>
      )}

      <Flex justify="space-between" mt={4} pt={2} borderTop={`1px solid ${useColorModeValue("gray.600", "gray.700")}`}>
        <Text color={listTextColor} fontSize="sm">Campaign ID: {campaign.id}</Text>
        <HStack>
          <Text color={listTextColor} fontSize="sm">Status:</Text>
          <Badge 
            colorScheme={campaign.status === 'Running' ? 'green' : campaign.status === 'Draft' ? 'yellow' : 'red'}
            fontSize="sm"
          >
            {campaign.status}
          </Badge>
        </HStack>
      </Flex>
    </Box>
  );
};

export default React.memo(WorkflowQueueManager);