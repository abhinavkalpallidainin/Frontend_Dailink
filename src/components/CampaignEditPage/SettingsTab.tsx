import React from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Heading,
  Text,
  Box,
  Input,
  Switch,
  Flex,
} from '@chakra-ui/react';
import { Campaign } from '../../types/type';

interface SettingsTabProps {
  campaign: Campaign;
  setCampaign: React.Dispatch<React.SetStateAction<Campaign | null>>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ campaign, setCampaign }) => {
  const handleChange = (field: keyof Campaign, value: any) => {
    setCampaign(prevCampaign => {
      if (!prevCampaign) return null;
      return { ...prevCampaign, [field]: value };
    });
  };

  return (
    <Box bg="gray.800" p={6} borderRadius="md">
      <Heading size="md" mb={6} color="white">Campaign Settings</Heading>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel color="white">Daily Action Limit</FormLabel>
          <NumberInput
            min={0}
            max={1000}
            value={campaign.daily_limit || 0}
            onChange={(valueString) => handleChange('daily_limit', parseInt(valueString))}
          >
            <NumberInputField bg="gray.700" color="white" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="sm" color="gray.400">Set the maximum number of actions per day</Text>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Target Connections</FormLabel>
          <Select
            value={campaign.target_connections || ''}
            onChange={(e) => handleChange('target_connections', e.target.value)}
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
            <option value="">All Connections</option>
            <option value="1st">1st Connections</option>
            <option value="2nd">2nd Connections</option>
            <option value="3rd">3rd+ Connections</option>
          </Select>
          <Text fontSize="sm" color="gray.400">Choose which level of connections to target</Text>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Time Zone</FormLabel>
          <Select
            value={campaign.time_zone || ''}
            onChange={(e) => handleChange('time_zone', e.target.value)}
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
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </Select>
          <Text fontSize="sm" color="gray.400">Select the time zone for campaign execution</Text>
        </FormControl>

        <FormControl>
          <FormLabel color="white">Campaign Start Date</FormLabel>
          <Input
            type="date"
            value={campaign.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value)}
            bg="gray.700"
            color="white"
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Campaign End Date</FormLabel>
          <Input
            type="date"
            value={campaign.end_date || ''}
            onChange={(e) => handleChange('end_date', e.target.value)}
            bg="gray.700"
            color="white"
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="auto-stop" mb="0" color="white">
            Auto Stop When Queue Empty
          </FormLabel>
          <Switch
            id="auto-stop"
            isChecked={campaign.auto_stop_empty_queue || false}
            onChange={(e) => handleChange('auto_stop_empty_queue', e.target.checked)}
          />
        </FormControl>

        <FormControl>
          <FormLabel color="white">Execution Window</FormLabel>
          <Flex>
            <Select
              value={campaign.execution_window_start || ''}
              onChange={(e) => handleChange('execution_window_start', e.target.value)}
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
              mr={2}
            >
              {[...Array(24)].map((_, i) => (
                <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                  {`${i.toString().padStart(2, '0')}:00`}
                </option>
              ))}
            </Select>
            <Text color="white" alignSelf="center" mx={2}>to</Text>
            <Select
              value={campaign.execution_window_end || ''}
              onChange={(e) => handleChange('execution_window_end', e.target.value)}
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
              ml={2}
            >
              {[...Array(24)].map((_, i) => (
                <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                  {`${i.toString().padStart(2, '0')}:00`}
                </option>
              ))}
            </Select>
          </Flex>
          <Text fontSize="sm" color="gray.400">Set the daily time window for campaign execution</Text>
        </FormControl>
      </VStack>
    </Box>
  );
};

export default SettingsTab;