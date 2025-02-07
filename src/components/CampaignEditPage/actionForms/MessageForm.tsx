import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  Box,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Flex,
  Checkbox,
  Tooltip,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { Action, SendMessageConfig } from '../../../types/type';

interface MessageFormProps {
  action: Action;
  onUpdate: (updatedAction: Partial<Action>) => void;
}

const MessageForm: React.FC<MessageFormProps> = ({ action, onUpdate }) => {
  const config = action.config as SendMessageConfig;
  const [message, setMessage] = useState(config.message || '');
  const [scrapeProfile, setScrapeProfile] = useState(config.scrapeProfile || false);
  const [delay, setDelay] = useState({
    days: config.delay?.days || 0,
    hours: config.delay?.hours || 0,
    minutes: Math.max(config.delay?.minutes || 2, 2),
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessage(config.message || '');
    setScrapeProfile(config.scrapeProfile || false);
    setDelay({
      days: config.delay?.days || 0,
      hours: config.delay?.hours || 0,
      minutes: Math.max(config.delay?.minutes || 2, 2),
    });
  }, [config]);

  const handleChange = useCallback((field: keyof SendMessageConfig, value: any) => {
    onUpdate({
      config: {
        ...config,
        [field]: value,
      },
    });
  }, [config, onUpdate]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    handleChange('message', newMessage);
  };

  const handleScrapeProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setScrapeProfile(newValue);
    handleChange('scrapeProfile', newValue);
  };

  const handleDelayChange = (field: 'days' | 'hours' | 'minutes', value: number) => {
    setDelay(prev => {
      const newDelay = { ...prev, [field]: value };
      if (field === 'minutes' && value < 2) {
        newDelay.minutes = 2;
      }
      handleChange('delay', newDelay);
      return newDelay;
    });
  };

  const insertVariable = useCallback((variable: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.substring(0, start) + `{${variable}}` + message.substring(end);
      setMessage(newMessage);
      handleChange('message', newMessage);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
      }, 0);
    }
  }, [message, handleChange]);

  const previewMessage = useCallback(() => {
    let preview = message;
    preview = preview.replace(/{fullName}/g, 'John Doe');
    preview = preview.replace(/{headline}/g, 'Software Engineer at Tech Co');
    preview = preview.replace(/{location}/g, 'San Francisco, California');
    return preview;
  }, [message]);

  const variables = [
    { name: 'fullName', label: 'Full Name' },
    { name: 'headline', label: 'Headline' },
    { name: 'location', label: 'Location' },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Message</FormLabel>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          placeholder="Enter your message here"
          minHeight="150px"
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          _hover={{ borderColor: "gray.500" }}
          _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
        />
      </FormControl>

      <Box>
        <Text fontWeight="bold" mb={2}>Insert Variable:</Text>
        <Flex flexWrap="wrap" gap={2}>
          {variables.map((v) => (
            <Button
              key={v.name}
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={() => insertVariable(v.name)}
            >
              {v.label}
            </Button>
          ))}
        </Flex>
      </Box>

      <FormControl display="flex" alignItems="center">
        <Checkbox
          isChecked={scrapeProfile}
          onChange={handleScrapeProfileChange}
        >
          Scrape Profile
        </Checkbox>
        <Tooltip label="Enables additional variables and fetches more detailed profile information">
          <InfoIcon ml={2} />
        </Tooltip>
      </FormControl>

      <Box bg="gray.700" p={4} borderRadius="md" border="1px solid" borderColor="gray.600">
        <Text fontWeight="bold" mb={2}>Message Preview:</Text>
        <Text whiteSpace="pre-wrap">{previewMessage()}</Text>
      </Box>

      <FormControl>
        <FormLabel>Action Delay</FormLabel>
        <HStack>
          <VStack align="start">
            <Text fontSize="sm">Days:</Text>
            <NumberInput
              min={0}
              value={delay.days}
              onChange={(value) => handleDelayChange('days', parseInt(value))}
              max={365}
              clampValueOnBlur={false}
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
              value={delay.hours}
              onChange={(value) => handleDelayChange('hours', parseInt(value))}
              max={23}
              clampValueOnBlur={false}
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
              min={2}
              value={delay.minutes}
              onChange={(value) => handleDelayChange('minutes', parseInt(value))}
              max={59}
              clampValueOnBlur={false}
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
        <Text>Message: {message.substring(0, 50)}...</Text>
        <Text>Scrape Profile: {scrapeProfile ? 'Yes' : 'No'}</Text>
        <Text>
          Delay: {delay.days} days, {delay.hours} hours, {delay.minutes} minutes
        </Text>
      </Box>
    </VStack>
  );
};

export default MessageForm;