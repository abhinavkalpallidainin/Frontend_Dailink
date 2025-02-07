import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Container,
  Alert,
  AlertIcon,
  useColorModeValue,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  InputGroup,
  InputLeftElement,
  Input,
  Progress,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import { useAccount } from '../../contexts/AccountContext';
import { motion } from 'framer-motion';
import { AddIcon, ChevronDownIcon, SearchIcon, CalendarIcon, RepeatIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { HSCRun, HSCRunStats, fetchAllHSCRunIDs, getHSCRunStats, deleteHSCRun, updateHSCRunStage } from '../../utils/useHSCRuns';
import { useNavigate } from 'react-router-dom';
import CreateHaystackRunModal from '../../components/HaystacksComponents/CreateHaystackRunModal';

const MotionBox = motion(Box);

const HayStacks: React.FC = () => {
  // Theme colors
  const bgColor = useColorModeValue("gray.900", "gray.800");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const cardBgColor = useColorModeValue("gray.700", "gray.600");

  // State and hooks
  const { selectedAccount, isLoading: isAccountLoading } = useAccount();
  const [hscRuns, setHscRuns] = useState<HSCRun[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<HSCRun[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<HSCRunStats>({
    totalRuns: 0,
    activeRuns: 0,
    totalChampions: 0,
    successRate: 0,
    recentRuns: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!selectedAccount?.user_id) {
      console.log('No selected account user_id');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching data for user:', selectedAccount.user_id);
      
      const [runsData, statsData] = await Promise.all([
        fetchAllHSCRunIDs(selectedAccount.user_id),
        getHSCRunStats(selectedAccount.user_id)
      ]);
      
      console.log('Fetched runs data:', runsData);
      console.log('Fetched stats data:', statsData);
      
      setHscRuns(runsData);
      setFilteredRuns(runsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching HSC data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Haystack runs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount?.user_id, toast]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search filter
  useEffect(() => {
    const filtered = hscRuns.filter(run =>
      run.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRuns(filtered);
  }, [searchTerm, hscRuns]);

  // Handlers
  const handleDelete = async (runId: number) => {
    try {
      await deleteHSCRun(runId);
      toast({
        title: 'Success',
        description: 'Run deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting run:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete run',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (runId: number, currentStage: string) => {
    const newStage = currentStage === 'running' ? 'stopped' : 'running';
    try {
      await updateHSCRunStage(runId, newStage as any);
      toast({
        title: 'Success',
        description: `Run ${newStage === 'running' ? 'started' : 'stopped'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating run status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update run status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditRun = (run: HSCRun) => {
    navigate('/Haystacks/run-setup', {
      state: {
        isEditing: true,
        runDetails: run
      }
    });
  };

  // Loading state
  if (isAccountLoading || isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
        <Text mt={4} color={textColor}>Loading dashboard...</Text>
      </Container>
    );
  }

  // No account selected
  if (!selectedAccount) {
    return (
      <Container centerContent>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account from the sidebar.
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs variant="soft-rounded" colorScheme="blue" mb={8}>
          <TabList>
            <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Dashboard</Tab>
            <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Runs</Tab>
          </TabList>

          <TabPanels>
            {/* Dashboard Panel */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <Heading size="lg" color={textColor} mb={4}>
                  HayStacks Dashboard
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                  <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
                    <StatLabel color="gray.400">Total Runs</StatLabel>
                    <StatNumber color={textColor}>{stats.totalRuns}</StatNumber>
                  </Stat>
                  <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
                    <StatLabel color="gray.400">Active Runs</StatLabel>
                    <StatNumber color={textColor}>{stats.activeRuns}</StatNumber>
                  </Stat>
                  <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
                    <StatLabel color="gray.400">Total Champions</StatLabel>
                    <StatNumber color={textColor}>{stats.totalChampions}</StatNumber>
                  </Stat>
                  <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
                    <StatLabel color="gray.400">Success Rate</StatLabel>
                    <StatNumber color={textColor}>{stats.successRate}%</StatNumber>
                  </Stat>
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Runs Panel */}
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <Heading size="lg" color={textColor} mb={4}>
                  HayStacks Runs
                </Heading>

                <Flex justify="space-between" align="center" mb={4}>
                  <InputGroup maxW="300px">
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Search Runs" 
                      bg={cardBgColor}
                      color={textColor}
                      border="none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  <HStack>
                    <Button leftIcon={<CalendarIcon />} bg={cardBgColor} color={textColor}>
                      Date Range
                    </Button>
                    <Button 
                      leftIcon={<RepeatIcon />} 
                      colorScheme="blue"
                      onClick={() => fetchData()}
                    >
                      Refresh
                    </Button>
                    <Button 
                      leftIcon={<AddIcon />} 
                      colorScheme="green" 
                      onClick={onOpen}
                    >
                      Create Run
                    </Button>
                  </HStack>
                </Flex>

                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th color={textColor}>Name</Th>
                        <Th color={textColor}>Type</Th>
                        <Th color={textColor}>Status</Th>
                        <Th color={textColor}>Progress</Th>
                        <Th color={textColor}>Success Rate</Th>
                        <Th color={textColor}>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRuns.length === 0 ? (
                        <Tr>
                          <Td colSpan={6} textAlign="center" color={textColor}>
                            No runs found
                          </Td>
                        </Tr>
                      ) : (
                        filteredRuns.map((run) => (
                          <Tr key={run.run_id} _hover={{ bg: cardBgColor }}>
                            <Td color={textColor}>{run.name}</Td>
                            <Td color={textColor}>{run.use_first_degree ? 'First Degree' : 'All'}</Td>
                            <Td>
                              <Badge colorScheme={run.stage === 'running' ? 'green' : 'gray'}>
                                {run.stage}
                              </Badge>
                            </Td>
                            <Td>
                              <Tooltip label={`${run.progress || 0}%`}>
                                <Progress 
                                  value={run.progress || 0} 
                                  size="sm" 
                                  colorScheme="blue"
                                />
                              </Tooltip>
                            </Td>
                            <Td color={textColor}>
                              {run.champions_list_count ? 
                                `${(run.champions_list_count / (run.progress || 1) * 100).toFixed(1)}%` : 
                                '0%'}
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit run"
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => handleEditRun(run)}
                                />
                                <IconButton
                                  aria-label="Delete run"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => handleDelete(run.run_id)}
                                />
                                <Menu>
                                  <MenuButton 
                                    as={IconButton} 
                                    icon={<ChevronDownIcon />} 
                                    variant="outline" 
                                    size="sm" 
                                  />
                                  <MenuList>
                                    <MenuItem
                                      onClick={() => handleStatusChange(run.run_id, run.stage)}
                                    >
                                      {run.stage === 'running' ? 'Stop' : 'Start'}
                                    </MenuItem>
                                    <MenuItem
                                      onClick={() => handleEditRun(run)}
                                    >
                                      Edit
                                    </MenuItem>
                                    <MenuItem
                                      onClick={() => handleDelete(run.run_id)}
                                    >
                                      Delete
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </HStack>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </MotionBox>

      <CreateHaystackRunModal 
        isOpen={isOpen} 
        onClose={onClose}
        onRunCreated={fetchData}
      />
    </Box>
  );
};

export default HayStacks;