import React, { useEffect, useCallback, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  useToast,
  VStack,
  Spinner,
  Container,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAccount } from '../../contexts/AccountContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NetworkStats, NetworkGrowth } from '../../types/type';
import { getNetworkStats, getNetworkGrowth } from '../../utils/api';

// Mock data for the graph
const inviteData = [
  { date: 'Aug 7', invited: 94, accepted: 41 },
  { date: 'Aug 9', invited: 26, accepted: 15 },
  { date: 'Aug 11', invited: 68, accepted: 34 },
  { date: 'Aug 13', invited: 93, accepted: 43 },
  { date: 'Aug 15', invited: 26, accepted: 11 },
  { date: 'Aug 17', invited: 22, accepted: 8 },
  { date: 'Aug 19', invited: 94, accepted: 39 },
  { date: 'Aug 21', invited: 24, accepted: 12 },
  { date: 'Aug 23', invited: 16, accepted: 6 },
  { date: 'Aug 25', invited: 31, accepted: 13 },
  { date: 'Aug 27', invited: 23, accepted: 10 },
  { date: 'Aug 29', invited: 9, accepted: 4 },
  { date: 'Aug 31', invited: 38, accepted: 10 },
  { date: 'Sep 2', invited: 0, accepted: 0 },
  { date: 'Sep 4', invited: 94, accepted: 12 },
];

const Dashboard: React.FC = () => {
  const { selectedAccount, refreshAccounts, isLoading: isAccountLoading } = useAccount();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignStats, setCampaignStats] = useState({
    invitesSent: 200,
    invitesAccepted: 80,
    replies: 40,
    meetingsScheduled: 10,
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    currentNetworkSize: 0,
    currentFollowersCount: 0,
  });
  const [networkGrowth, setNetworkGrowth] = useState<NetworkGrowth>({
    networkGrowth: 0,
    followersGrowth: 0,
  });

  const bgColor = useColorModeValue("gray.900", "gray.800");
  const cardBgColor = useColorModeValue("gray.800", "gray.700");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const headingColor = useColorModeValue("blue.300", "blue.200");

  const fetchNetworkStats = useCallback(async (accountId: string) => {
    try {
      const stats = await getNetworkStats(accountId);
      setNetworkStats(stats);

      const growth = await getNetworkGrowth(accountId);
      setNetworkGrowth(growth);
    } catch (error) {
      console.error('Error fetching network stats:', error);
      setError('Failed to fetch network stats. Please try again later.');
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (selectedAccount && !isAccountLoading) {
        setIsLoading(true);
        setError(null);
        try {
          await fetchNetworkStats(selectedAccount.id);
        } catch (error) {
          setError('Failed to fetch account data. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeDashboard();
  }, [selectedAccount, isAccountLoading, fetchNetworkStats]);

  const handleRefresh = useCallback(async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setError(null);
    try {
      await refreshAccounts();
      if (selectedAccount) {
        await fetchNetworkStats(selectedAccount.id);
      }
      setCampaignStats(prevStats => ({
        ...prevStats,
        invitesSent: prevStats.invitesSent + 10,
        invitesAccepted: prevStats.invitesAccepted + 5,
      }));
      toast({
        title: 'Dashboard refreshed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      toast({
        title: 'Error refreshing dashboard',
        description: 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccounts, selectedAccount, fetchNetworkStats, toast]);

  if (isAccountLoading || isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
        <Text mt={4} color={textColor}>Loading dashboard...</Text>
      </Container>
    );
  }

  if (!selectedAccount) {
    return (
      <Container centerContent>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account from the sidebar to view the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" color={headingColor}>LinkedIn Automation Dashboard</Heading>
          
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Connected Account</StatLabel>
                <StatNumber color={textColor}>{selectedAccount.name}</StatNumber>
                <StatHelpText color="gray.300">Status: {selectedAccount.status}</StatHelpText>
              </Stat>
            </Box>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Invites Sent (This Week)</StatLabel>
                <StatNumber color={textColor}>{campaignStats.invitesSent}</StatNumber>
                <StatHelpText color="gray.300">
                  <StatArrow type="increase" />
                  23.36%
                </StatHelpText>
              </Stat>
            </Box>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Invites Accepted</StatLabel>
                <StatNumber color={textColor}>{campaignStats.invitesAccepted}</StatNumber>
                <StatHelpText color="gray.300">
                  Acceptance Rate: {((campaignStats.invitesAccepted / campaignStats.invitesSent) * 100).toFixed(2)}%
                </StatHelpText>
              </Stat>
            </Box>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Meetings Scheduled</StatLabel>
                <StatNumber color={textColor}>{campaignStats.meetingsScheduled}</StatNumber>
                <StatHelpText color="gray.300">
                  <StatArrow type="increase" />
                  9.05%
                </StatHelpText>
              </Stat>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Network Size</StatLabel>
                <StatNumber color={textColor}>{networkStats.currentNetworkSize}</StatNumber>
                <StatHelpText color="gray.300">
                  <StatArrow type="increase" />
                  {networkGrowth.networkGrowth} new connections
                </StatHelpText>
              </Stat>
            </Box>
            <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
              <Stat>
                <StatLabel color="gray.300">Followers</StatLabel>
                <StatNumber color={textColor}>{networkStats.currentFollowersCount}</StatNumber>
                <StatHelpText color="gray.300">
                  <StatArrow type="increase" />
                  {networkGrowth.followersGrowth} new followers
                </StatHelpText>
              </Stat>
            </Box>
          </SimpleGrid>

          <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg={cardBgColor}>
            <Heading as="h3" size="md" mb={4} color={textColor}>Connection Invites (Last 3 Weeks)</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inviteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="invited" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="accepted" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box borderWidth={1} borderRadius="lg" p={4} boxShadow="md" bg={cardBgColor}>
              <Heading as="h3" size="md" mb={4} color={textColor}>Weekly Performance</Heading>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.300">Invites Sent: {campaignStats.invitesSent}</Text>
                <Text color="gray.300">Invites Accepted: {campaignStats.invitesAccepted}</Text>
                <Text color="gray.300">Replies Received: {campaignStats.replies}</Text>
                <Text color="gray.300">Meetings Scheduled: {campaignStats.meetingsScheduled}</Text>
              </VStack>
            </Box>
            <Box borderWidth={1} borderRadius="lg" p={4} boxShadow="md" bg={cardBgColor}>
              <Heading as="h3" size="md" mb={4} color={textColor}>Conversion Rates</Heading>
              <VStack align="stretch" spacing={3}>
                <Text color="gray.300">Acceptance Rate: {((campaignStats.invitesAccepted / campaignStats.invitesSent) * 100).toFixed(2)}%</Text>
                <Text color="gray.300">Reply Rate: {((campaignStats.replies / campaignStats.invitesAccepted) * 100).toFixed(2)}%</Text>
                <Text color="gray.300">Meeting Conversion: {((campaignStats.meetingsScheduled / campaignStats.replies) * 100).toFixed(2)}%</Text>
              </VStack>
            </Box>
          </SimpleGrid>

          <Button onClick={handleRefresh} isLoading={isLoading} colorScheme="blue">
            Refresh Dashboard
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;