import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner
} from '@chakra-ui/react';

// Define necessary types
interface LinkedInAccount {
  id: string;
  name: string;
}

interface OutreachSequence {
  id: string;
  accountId: string;
  searchUrl: string;
  message: string;
  invitationsPerDay: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

// Simulate API calls
const getAllLinkedInAccounts = async (): Promise<LinkedInAccount[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: 'acc1', name: 'Account 1' },
    { id: 'acc2', name: 'Account 2' },
  ];
};

const createLinkedInOutreachSequence = async (
  accountId: string,
  searchUrl: string,
  message: string,
  invitationsPerDay: number
): Promise<OutreachSequence> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: `seq_${Date.now()}`,
    accountId,
    searchUrl,
    message,
    invitationsPerDay,
    status: 'active',
    createdAt: new Date().toISOString()
  };
};

const getLinkedInOutreachSequences = async (accountId: string): Promise<OutreachSequence[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      id: 'seq_1',
      accountId,
      searchUrl: "https://www.linkedin.com/search/results/people/?keywords=software%20engineer",
      message: "Hi, I'd like to connect!",
      invitationsPerDay: 20,
      status: 'active',
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'seq_2',
      accountId,
      searchUrl: "https://www.linkedin.com/search/results/people/?keywords=product%20manager",
      message: "Hello, I'm interested in your work!",
      invitationsPerDay: 15,
      status: 'completed',
      createdAt: '2023-02-01T00:00:00Z'
    }
  ];
};

const OutreachSequencePage: React.FC = () => {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [searchUrl, setSearchUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [invitationsPerDay, setInvitationsPerDay] = useState<number>(20);
  const [sequences, setSequences] = useState<OutreachSequence[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const toast = useToast();

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedAccounts = await getAllLinkedInAccounts();
      setAccounts(fetchedAccounts);
      if (fetchedAccounts.length > 0) {
        setSelectedAccountId(fetchedAccounts[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error fetching accounts',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchSequences = useCallback(async () => {
    if (!selectedAccountId) return;
    setIsLoading(true);
    try {
      const fetchedSequences = await getLinkedInOutreachSequences(selectedAccountId);
      setSequences(fetchedSequences);
    } catch (error) {
      toast({
        title: 'Error fetching sequences',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccountId, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchSequences();
  }, [fetchSequences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newSequence = await createLinkedInOutreachSequence(selectedAccountId, searchUrl, message, invitationsPerDay);
      setSequences(prevSequences => [...prevSequences, newSequence]);
      toast({
        title: 'Outreach sequence created',
        description: 'Your outreach sequence has been successfully created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setSearchUrl('');
      setMessage('');
      setInvitationsPerDay(20);
    } catch (error) {
      toast({
        title: 'Error creating outreach sequence',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Box maxW="container.xl" mx="auto" p={4}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Create Outreach Sequence</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>LinkedIn Account</FormLabel>
              <Select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>LinkedIn Search URL</FormLabel>
              <Input
                type="url"
                value={searchUrl}
                onChange={(e) => setSearchUrl(e.target.value)}
                placeholder="https://www.linkedin.com/search/results/people/?..."
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Invitation Message</FormLabel>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your invitation message here..."
                rows={4}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Invitations per Day</FormLabel>
              <Input
                type="number"
                value={invitationsPerDay}
                onChange={(e) => setInvitationsPerDay(parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </FormControl>
            <Button type="submit" colorScheme="blue" isLoading={isCreating}>
              Create Sequence
            </Button>
          </VStack>
        </form>

        <Heading as="h2" size="lg">Existing Sequences</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Status</Th>
              <Th>Invitations per Day</Th>
              <Th>Created At</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sequences.map((sequence) => (
              <Tr key={sequence.id}>
                <Td>{sequence.id}</Td>
                <Td>
                  <Badge colorScheme={sequence.status === 'active' ? 'green' : 'yellow'}>
                    {sequence.status}
                  </Badge>
                </Td>
                <Td>{sequence.invitationsPerDay}</Td>
                <Td>{new Date(sequence.createdAt).toLocaleString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
};

export default OutreachSequencePage;