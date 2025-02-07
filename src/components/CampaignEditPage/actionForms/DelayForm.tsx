// DelayForm.tsx

import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Box,
} from '@chakra-ui/react';
import { Action, DelayConfig } from '../../../types/type';

interface DelayFormProps {
  action: Action;
  onUpdate: (updatedAction: Partial<Action>) => void;
}

const DelayForm: React.FC<DelayFormProps> = ({ action, onUpdate }) => {
  const config = action.config as DelayConfig;
  const [delay, setDelay] = useState({
    days: config.days || 0,
    hours: config.hours || 0,
    minutes: config.minutes || 0,
  });

  useEffect(() => {
    setDelay({
      days: config.days || 0,
      hours: config.hours || 0,
      minutes: config.minutes || 0,
    });
  }, [config]);

  const handleDelayChange = (field: 'days' | 'hours' | 'minutes', value: number) => {
    setDelay(prev => {
      const newDelay = { ...prev, [field]: value };
      onUpdate({
        config: newDelay,
      });
      return newDelay;
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Delay Duration</FormLabel>
        <HStack>
          <VStack align="start">
            <Text fontSize="sm">Days:</Text>
            <NumberInput
              min={0}
              value={delay.days}
              onChange={(value) => handleDelayChange('days', parseInt(value))}
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
        <Text fontWeight="bold" mb={2}>Delay Summary:</Text>
        <Text>
          {delay.days} days, {delay.hours} hours, {delay.minutes} minutes
        </Text>
      </Box>
    </VStack>
  );
};

export default DelayForm;