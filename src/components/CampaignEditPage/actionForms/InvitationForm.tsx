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
  Switch,
  Tooltip,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { Action, SendInvitationConfig } from '../../../types/type';

interface InvitationFormProps {
  action: Action;
  onUpdate: (updatedAction: Partial<Action>) => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({ action, onUpdate }) => {
  const config = action.config as SendInvitationConfig;
  const [message, setMessage] = useState(config.message || '');
  const [scrapeProfile, setScrapeProfile] = useState(config.scrapeProfile || false);
  const [useSalesNavigator, setUseSalesNavigator] = useState(config.useSalesNavigator || false);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessage(config.message || '');
    setScrapeProfile(config.scrapeProfile || false);
    setUseSalesNavigator(config.useSalesNavigator || false);
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

  const handleChange = useCallback((field: keyof SendInvitationConfig, value: any) => {
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

  const handleUseSalesNavigatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setUseSalesNavigator(newValue);
    handleChange('useSalesNavigator', newValue);
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
    preview = preview.replace(/{firstName}/g, 'John')
                     .replace(/{lastName}/g, 'Doe')
                     .replace(/{company}/g, 'Tech Co')
                     .replace(/{position}/g, 'Software Engineer');
    return preview;
  }, [message]);

  const variables = [
    { name: 'fullName', label: 'Full Name' },
    { name: 'headline', label: 'Headline' },
    { name: 'location', label: 'Location' },
  ];

  const scrapedVariables = [
    { name: 'firstName', label: 'First Name' },
    { name: 'lastName', label: 'Last Name' },
    { name: 'company', label: 'Company' },
    { name: 'position', label: 'Position' },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <FormControl>
        <FormLabel>Invitation Message</FormLabel>
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          placeholder="Enter your invitation message here"
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

      {scrapeProfile && (
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="use-sales-navigator" mb="0">
            Use Sales Navigator
          </FormLabel>
          <Switch
            id="use-sales-navigator"
            isChecked={useSalesNavigator}
            onChange={handleUseSalesNavigatorChange}
          />
          <Tooltip label="Uses Sales Navigator for more detailed profile information (if available)">
            <InfoIcon ml={2} />
          </Tooltip>
        </FormControl>
      )}

      {scrapeProfile && (
        <Box>
          <Text fontWeight="bold" mb={2}>Additional Scraped Variables:</Text>
          <Flex flexWrap="wrap" gap={2}>
            {scrapedVariables.map((v) => (
              <Button
                key={v.name}
                size="sm"
                variant="outline"
                colorScheme="green"
                onClick={() => insertVariable(v.name)}
              >
                {v.label}
              </Button>
            ))}
          </Flex>
        </Box>
      )}

      <Box bg="gray.700" p={4} borderRadius="md" border="1px solid" borderColor="gray.600">
        <Text fontWeight="bold" mb={2}>Message Preview:</Text>
        <Text whiteSpace="pre-wrap">{previewMessage()}</Text>
      </Box>

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
    </VStack>
  );
};

export default InvitationForm;