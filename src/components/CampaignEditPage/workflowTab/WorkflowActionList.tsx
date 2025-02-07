import React, { useMemo } from 'react';
import {
  VStack,
  Box,
  Flex,
  HStack,
  Text,
  IconButton,
  Spinner,
  Progress,
  Tooltip,
  useColorModeValue,
  Alert,
  AlertIcon,
  Icon,
} from '@chakra-ui/react';
import {
  EditIcon,
  DeleteIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowForwardIcon,
} from '@chakra-ui/icons';
import { FaClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Action, QueueView, ActionType, DelayConfig } from '../../../types/type';
import { getActionIcon, getActionName } from './WorkflowUtils';

const MotionBox = motion(Box);

interface WorkflowActionListProps {
  workflow: Action[];
  isWorkflowLoading: boolean;
  currentActionIndex: number | null;
  onMoveAction: (index: number, direction: 'up' | 'down') => void;
  onEditAction: (actionId: number) => void;
  onDeleteAction: (actionId: number) => void;
  setCurrentQueueView: (view: QueueView) => void;
  onListsDrawerOpen: () => void;
}

const WorkflowActionList: React.FC<WorkflowActionListProps> = ({
  workflow,
  isWorkflowLoading,
  currentActionIndex,
  onMoveAction,
  onEditAction,
  onDeleteAction,
  setCurrentQueueView,
  onListsDrawerOpen,
}) => {
  const bgColor = useColorModeValue("gray.800", "gray.900");
  const activeBgColor = useColorModeValue("gray.700", "gray.800");
  const textColor = useColorModeValue("white", "gray.100");
  const subTextColor = useColorModeValue("gray.300", "gray.400");

  const getQueueCount = (action: Action, index: number): number => {
    return index === 0 ? action.queue : workflow[index - 1].successful;
  };

  const calculateProgress = (action: Action): number => {
    const total = action.queue + action.successful + action.failed;
    return total > 0 ? (action.successful / total) * 100 : 0;
  };

  const renderDelayAction = useMemo(() => (action: Action, index: number) => {
    const config = action.config as DelayConfig;
    const totalMinutes = (config.days * 24 * 60) + (config.hours * 60) + config.minutes;
    const queueCount = getQueueCount(action, index);

    return (
      <Box
        bg={currentActionIndex === index ? activeBgColor : bgColor}
        p={4}
        borderRadius="md"
        position="relative"
        boxShadow="md"
      >
        <Flex justify="space-between" align="center" mb={2}>
          <HStack>
            <Box bg="blue.500" color={textColor} p={2} borderRadius="md" fontSize="xl">
              <Icon as={FaClock} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" color={textColor}>
                Delay
              </Text>
              <Text fontSize="sm" color={subTextColor}>
                {config.days} days, {config.hours} hours, {config.minutes} minutes
              </Text>
              <Text
                fontSize="sm"
                color={subTextColor}
                cursor="pointer"
                onClick={() => {
                  setCurrentQueueView({
                    type: 'action',
                    actionId: action.id,
                    actionName: 'Delay',
                    actionNumber: index + 1,
                    queueCount: queueCount,
                  });
                  onListsDrawerOpen();
                }}
              >
                Queue: {queueCount}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            {index > 0 && (
              <IconButton
                aria-label="Move up"
                icon={<ChevronUpIcon />}
                size="sm"
                onClick={() => onMoveAction(index, 'up')}
              />
            )}
            {index < workflow.length - 1 && (
              <IconButton
                aria-label="Move down"
                icon={<ChevronDownIcon />}
                size="sm"
                onClick={() => onMoveAction(index, 'down')}
              />
            )}
            <IconButton
              aria-label="Edit action"
              icon={<EditIcon />}
              size="sm"
              onClick={() => action.id && onEditAction(action.id)}
            />
            <IconButton
              aria-label="Delete action"
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => action.id && onDeleteAction(action.id)}
            />
          </HStack>
        </Flex>
        <Flex justify="space-between" mt={2}>
          <Text color="green.300" fontSize="sm">Successful: {action.successful}</Text>
          <Text color="yellow.300" fontSize="sm">
            Queue: {queueCount}
          </Text>
        </Flex>
        <Tooltip label={`${totalMinutes} minutes total`}>
          <Progress 
            value={calculateProgress(action)}
            size="sm" 
            colorScheme="blue" 
            mt={2}
          />
        </Tooltip>
      </Box>
    );
  }, [activeBgColor, bgColor, currentActionIndex, onDeleteAction, onEditAction, onMoveAction, setCurrentQueueView, onListsDrawerOpen, textColor, subTextColor, workflow.length]);

  const renderRegularAction = (action: Action, index: number) => (
    <Box
      bg={currentActionIndex === index ? activeBgColor : bgColor}
      p={4}
      borderRadius="md"
      position="relative"
      boxShadow="md"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <HStack>
          <Box bg="blue.500" color={textColor} p={2} borderRadius="md" fontSize="xl">
            {React.createElement(getActionIcon(action.type as ActionType))}
          </Box>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" color={textColor}>
              {action.name || getActionName(action.type as ActionType)}
            </Text>
            {action.custom_name && (
              <Text fontSize="sm" color={subTextColor}>
                {action.custom_name}
              </Text>
            )}
            <Text
              fontSize="sm"
              color={subTextColor}
              cursor="pointer"
              onClick={() => {
                setCurrentQueueView({
                  type: 'action',
                  actionId: action.id,
                  actionName: action.name || getActionName(action.type as ActionType),
                  actionNumber: index + 1,
                  queueCount: getQueueCount(action, index),
                });
                onListsDrawerOpen();
              }}
            >
              Queue: {getQueueCount(action, index)}
            </Text>
          </VStack>
        </HStack>
        <HStack>
          {index > 0 && (
            <IconButton
              aria-label="Move up"
              icon={<ChevronUpIcon />}
              size="sm"
              onClick={() => onMoveAction(index, 'up')}
            />
          )}
          {index < workflow.length - 1 && (
            <IconButton
              aria-label="Move down"
              icon={<ChevronDownIcon />}
              size="sm"
              onClick={() => onMoveAction(index, 'down')}
            />
          )}
          <IconButton
            aria-label="Edit action"
            icon={<EditIcon />}
            size="sm"
            onClick={() => action.id && onEditAction(action.id)}
          />
          <IconButton
            aria-label="Delete action"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            onClick={() => action.id && onDeleteAction(action.id)}
          />
        </HStack>
      </Flex>
      <Flex justify="space-between" mt={2}>
        <Text color="green.300" fontSize="sm">Successful: {action.successful}</Text>
        <Text color="red.300" fontSize="sm">Failed: {action.failed}</Text>
        <Text color="yellow.300" fontSize="sm">
          Queue: {getQueueCount(action, index)}
        </Text>
      </Flex>
      <Tooltip label={`Progress: ${action.successful} / ${action.queue + action.successful + action.failed}`}>
        <Progress
          value={calculateProgress(action)}
          size="sm"
          colorScheme="blue"
          mt={2}
        />
      </Tooltip>
    </Box>
  );

  if (isWorkflowLoading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (workflow.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No actions added to this workflow yet. Add an action to get started.
      </Alert>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <AnimatePresence>
        {workflow.map((action, index) => (
          <MotionBox
            key={action.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {action.type === 'DELAY' 
              ? renderDelayAction(action, index)
              : renderRegularAction(action, index)
            }
            {index < workflow.length - 1 && (
              <Flex justify="center" my={2}>
                <ArrowForwardIcon boxSize={6} color="blue.500" />
              </Flex>
            )}
          </MotionBox>
        ))}
      </AnimatePresence>
    </VStack>
  );
};

export default React.memo(WorkflowActionList);