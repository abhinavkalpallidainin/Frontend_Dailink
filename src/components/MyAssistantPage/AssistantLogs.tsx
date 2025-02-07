import React, { useState } from 'react';
import { 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Box, 
  Text, 
  Progress, 
  Badge, 
  Input, 
  Select, 
  VStack,
  HStack,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { LogEntry, AssistantConfiguration } from '../../types/type';

interface AssistantLogsProps {
  logEntries: LogEntry[];
  assistantConfig: AssistantConfiguration | null;
  lastChecked: Date | null;
  isAssistantEnabled: boolean;
  nextCheckIn: number;
}

const AssistantLogs: React.FC<AssistantLogsProps> = ({ 
  logEntries, 
  assistantConfig, 
  lastChecked, 
  isAssistantEnabled,
  nextCheckIn
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  const filteredAndSortedLogs = logEntries
    .filter(entry => 
      entry.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(entry => filterEventType ? entry.event_type === filterEventType : true)
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const uniqueEventTypes = Array.from(new Set(logEntries.map(entry => entry.event_type)));

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'New Message': return 'green';
      case 'Bot Response': return 'blue';
      case 'Error': return 'red';
      case 'Configuration': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Box>
      <Box bg={bgColor} p={4} borderRadius="md" mb={4}>
        <Text mb={2} fontWeight="bold" color={textColor}>
          Assistant Status: <Badge colorScheme={isAssistantEnabled ? 'green' : 'red'}>{isAssistantEnabled ? 'Enabled' : 'Disabled'}</Badge>
        </Text>
        <Text mb={2} color={textColor}>
          Last checked: {lastChecked ? lastChecked.toLocaleString() : 'Not checked yet'}
        </Text>
        {isAssistantEnabled && (
          <Box>
            <Text mb={2} color={textColor}>Next check in: {nextCheckIn} seconds</Text>
            <Progress value={(60 - nextCheckIn) / 60 * 100} size="sm" colorScheme="blue" />
          </Box>
        )}
      </Box>

      <VStack spacing={4} mb={4}>
        <Input 
          placeholder="Search logs..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <HStack width="100%">
          <Select 
            placeholder="Filter by event type" 
            value={filterEventType} 
            onChange={(e) => setFilterEventType(e.target.value)}
          >
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <Button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            Sort {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </HStack>
      </VStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Timestamp</Th>
            <Th>Lead</Th>
            <Th>Event</Th>
            <Th>Message</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredAndSortedLogs.map((entry) => (
            <Tr key={entry.id}>
              <Td>{new Date(entry.timestamp).toLocaleString()}</Td>
              <Td>{entry.lead_name}</Td>
              <Td>
                <Badge colorScheme={getEventTypeBadgeColor(entry.event_type)}>
                  {entry.event_type}
                </Badge>
              </Td>
              <Td>{entry.message}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {filteredAndSortedLogs.length === 0 && (
        <Text mt={4} textAlign="center" color="gray.500">
          No log entries found.
        </Text>
      )}
    </Box>
  );
};

export default AssistantLogs;