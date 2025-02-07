import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Checkbox,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { Action, FollowUnfollowConfig } from '../../../types/type';

interface FollowUnfollowFormProps {
  action: Action;
  onUpdate: (updatedAction: Partial<Action>) => void;
}

const FollowUnfollowForm: React.FC<FollowUnfollowFormProps> = ({ action, onUpdate }) => {
  const config = action.config as FollowUnfollowConfig;
  const [mode, setMode] = useState(config.mode || 'follow');
  const [delay, setDelay] = useState({
    days: config.delay?.days || 0,
    hours: config.delay?.hours || 0,
    minutes: config.delay?.minutes || 0,
  });
  const [defaultDelay, setDefaultDelay] = useState({
    days: config.defaultDelay?.days || 0,
    hours: config.defaultDelay?.hours || 0,
    minutes: config.defaultDelay?.minutes || 30, // 30 minutes default
  });
  const [useDefaultDelay, setUseDefaultDelay] = useState(config.useDefaultDelay !== false);

  useEffect(() => {
    setMode(config.mode || 'follow');
    setDelay({
      days: config.delay?.days || 0,
      hours: config.delay?.hours || 0,
      minutes: config.delay?.minutes || 0,
    });
    setDefaultDelay({
      days: config.defaultDelay?.days || 0,
      hours: config.defaultDelay?.hours || 0,
      minutes: config.defaultDelay?.minutes || 30,
    });
    setUseDefaultDelay(config.useDefaultDelay !== false);
  }, [config]);

  const handleChange = (field: keyof FollowUnfollowConfig, value: any) => {
    onUpdate({
      config: {
        ...config,
        [field]: value,
      },
    });
  };

  const handleDelayChange = (field: 'days' | 'hours' | 'minutes', value: number) => {
    setDelay(prev => {
      const newDelay = { ...prev, [field]: value };
      handleChange('delay', newDelay);
      return newDelay;
    });
  };

  const handleDefaultDelayChange = (field: 'days' | 'hours' | 'minutes', value: number) => {
    setDefaultDelay(prev => {
      const newDelay = { ...prev, [field]: value };
      handleChange('defaultDelay', newDelay);
      return newDelay;
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Action</FormLabel>
        <Select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as 'follow' | 'unfollow');
            handleChange('mode', e.target.value);
          }}
        >
          <option value="follow">Follow</option>
          <option value="unfollow">Unfollow</option>
        </Select>
      </FormControl>

      <FormControl display="flex" alignItems="center">
        <Checkbox
          isChecked={useDefaultDelay}
          onChange={(e) => {
            setUseDefaultDelay(e.target.checked);
            handleChange('useDefaultDelay', e.target.checked);
          }}
        >
          Use Default Delay
        </Checkbox>
        <Tooltip label="When checked, the default delay will be used instead of the custom delay">
          <InfoIcon ml={2} />
        </Tooltip>
      </FormControl>

      <FormControl>
        <FormLabel>Custom Action Delay</FormLabel>
        <HStack>
          <VStack align="start">
            <Text fontSize="sm">Days:</Text>
            <NumberInput
              min={0}
              value={delay.days}
              onChange={(value) => handleDelayChange('days', parseInt(value))}
              isDisabled={useDefaultDelay}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
          <VStack align="start">
            <Text fontSize="sm">Hours:</Text>
            <NumberInput
              min={0}
              max={23}
              value={delay.hours}
              onChange={(value) => handleDelayChange('hours', parseInt(value))}
              isDisabled={useDefaultDelay}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
          <VStack align="start">
            <Text fontSize="sm">Minutes:</Text>
            <NumberInput
              min={0}
              max={59}
              value={delay.minutes}
              onChange={(value) => handleDelayChange('minutes', parseInt(value))}
              isDisabled={useDefaultDelay}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
        </HStack>
      </FormControl>

      <FormControl>
        <FormLabel>Default Action Delay</FormLabel>
        <HStack>
          <VStack align="start">
            <Text fontSize="sm">Days:</Text>
            <NumberInput
              min={0}
              value={defaultDelay.days}
              onChange={(value) => handleDefaultDelayChange('days', parseInt(value))}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
          <VStack align="start">
            <Text fontSize="sm">Hours:</Text>
            <NumberInput
              min={0}
              max={23}
              value={defaultDelay.hours}
              onChange={(value) => handleDefaultDelayChange('hours', parseInt(value))}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
          <VStack align="start">
            <Text fontSize="sm">Minutes:</Text>
            <NumberInput
              min={0}
              max={59}
              value={defaultDelay.minutes}
              onChange={(value) => handleDefaultDelayChange('minutes', parseInt(value))}
            >
              <NumberInputField bg="gray.700" border="1px solid" borderColor="gray.600" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
        </HStack>
      </FormControl>

      <Box bg="gray.700" p={4} borderRadius="md" border="1px solid" borderColor="gray.600">
        <Text fontWeight="bold" mb={2}>Action Summary:</Text>
        <Text>Mode: {mode}</Text>
        <Text>
          Delay: {useDefaultDelay 
            ? `${defaultDelay.days} days, ${defaultDelay.hours} hours, ${defaultDelay.minutes} minutes (Default)` 
            : `${delay.days} days, ${delay.hours} hours, ${delay.minutes} minutes (Custom)`}
        </Text>
      </Box>
    </VStack>
  );
};

export default FollowUnfollowForm;