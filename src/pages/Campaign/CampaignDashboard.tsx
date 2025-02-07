import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Badge, Spinner,
  Text, useToast, Menu, MenuButton, MenuList, MenuItem, IconButton,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, FormControl, FormLabel, Input, Select, Tabs, TabList, Tab, TabPanels, TabPanel,
  InputGroup, InputLeftElement, HStack, Stat, StatLabel, StatNumber, StatHelpText,
  StatArrow, SimpleGrid, Progress, Tooltip, useColorModeValue, ModalCloseButton, Alert, AlertIcon
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, SearchIcon, CalendarIcon, RepeatIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useAccount } from '../../contexts/AccountContext';
import { Campaign } from '../../types/type';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, getActionStats } from '../../utils/campaignService';

const MotionBox = motion(Box);

const CampaignDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStats, setActionStats] = useState({ last24Hours: 0, total: 0 });
  const { selectedAccount } = useAccount();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'Outreach' });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const bgColor = useColorModeValue("gray.800", "gray.900");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const cardBgColor = useColorModeValue("gray.700", "gray.800");

  const fetchCampaigns = useCallback(async () => {
    if (!selectedAccount) {
      setIsLoading(false);
      setError('No account selected. Please select an account to manage campaigns.');
      return;
    }
  
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCampaigns = await getCampaigns(selectedAccount.id);
      setCampaigns(fetchedCampaigns);
      setFilteredCampaigns(fetchedCampaigns);
      
      if (fetchedCampaigns.length > 0) {
        const stats = await getActionStats(fetchedCampaigns[0].id);
        setActionStats(stats);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.id) {
      fetchCampaigns();
    } else {
      setIsLoading(false);
      setError('No account selected. Please select an account to manage campaigns.');
    }
  }, [selectedAccount, fetchCampaigns]);

  const handleCreateCampaign = async () => {
    if (!selectedAccount || !selectedAccount.id) {
      toast({
        title: 'Error',
        description: 'No account selected. Please select an account to create a campaign.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const newCampaignData: Omit<Campaign, 'id' | 'created_at'> = {
        account_id: selectedAccount.id,
        name: newCampaign.name,
        type: newCampaign.type,
        status: 'Draft',
        contacts: 0,
        successful: 0,
        failed: 0,
        messaged: 0,
        replied: 0,
        followed: 0,
        post_liked: 0,
        workflow: [],
        daily_limit: 0,
        target_connections: '',
        time_zone: '',
        start_date: '',
        end_date: '',
        auto_stop_empty_queue: false,
        execution_window_start: '',
        execution_window_end: '',
      };

      const createdCampaign = await createCampaign(newCampaignData);
      if (createdCampaign) {
        setCampaigns(prev => [...prev, createdCampaign]);
        setFilteredCampaigns(prev => [...prev, createdCampaign]);
        onClose();
        toast({
          title: 'Campaign created',
          description: 'Your new campaign has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      toast({
        title: 'Error creating campaign',
        description: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'Running' ? 'Stopped' : 'Running';
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      await fetchCampaigns();
    } catch (err) {
      console.error('Error updating campaign status:', err);
      toast({
        title: 'Error updating campaign',
        description: 'There was an error updating the campaign status. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditCampaign = (campaignId: number) => {
    navigate(`/campaigns/${campaignId}/edit`);
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await deleteCampaign(campaignId);
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setFilteredCampaigns(prev => prev.filter(c => c.id !== campaignId));
        toast({
          title: 'Campaign deleted',
          description: 'The campaign has been successfully deleted.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        console.error('Error deleting campaign:', err);
        toast({
          title: 'Error deleting campaign',
          description: 'There was an error deleting the campaign. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = campaigns.filter(campaign => 
      campaign.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCampaigns(filtered);
  };

  if (!selectedAccount) {
    return (
      <Box bg={bgColor} minHeight="100vh" p={8}>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account to manage campaigns.
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Flex direction="column" mb={8}>
          <Heading size="xl" color={textColor} mb={2}>Campaigns for {selectedAccount.name}</Heading>
          <Text fontSize="md" color="gray.400">
            Last 24 hrs' actions: {actionStats.last24Hours} of {actionStats.total}
          </Text>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
            <StatLabel color="gray.400">Total Campaigns</StatLabel>
            <StatNumber color={textColor}>{campaigns.length}</StatNumber>
          </Stat>
          <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
            <StatLabel color="gray.400">Active Campaigns</StatLabel>
            <StatNumber color={textColor}>
              {campaigns.filter(c => c.status === 'Running').length}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {((campaigns.filter(c => c.status === 'Running').length / campaigns.length) * 100).toFixed(1)}%
            </StatHelpText>
          </Stat>
          <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
            <StatLabel color="gray.400">Total Connections</StatLabel>
            <StatNumber color={textColor}>
              {campaigns.reduce((sum, campaign) => sum + campaign.successful, 0)}
            </StatNumber>
          </Stat>
          <Stat bg={cardBgColor} p={4} borderRadius="md" boxShadow="md">
            <StatLabel color="gray.400">Success Rate</StatLabel>
            <StatNumber color={textColor}>
              {((campaigns.reduce((sum, campaign) => sum + campaign.successful, 0) / 
                campaigns.reduce((sum, campaign) => sum + campaign.contacts, 0)) * 100).toFixed(1)}%
            </StatNumber>
          </Stat>
        </SimpleGrid>

        <Tabs variant="soft-rounded" colorScheme="blue" mb={8}>
          <TabList>
            <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>All Campaigns</Tab>
            <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Running</Tab>
            <Tab color={textColor} _selected={{ color: "blue.300", bg: "blue.800" }}>Stopped</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CampaignTable campaigns={filteredCampaigns} onEdit={handleEditCampaign} onDelete={handleDeleteCampaign} onStatusChange={handleStatusChange} />
            </TabPanel>
            <TabPanel>
              <CampaignTable campaigns={filteredCampaigns.filter(c => c.status === 'Running')} onEdit={handleEditCampaign} onDelete={handleDeleteCampaign} onStatusChange={handleStatusChange} />
            </TabPanel>
            <TabPanel>
              <CampaignTable campaigns={filteredCampaigns.filter(c => c.status !== 'Running')} onEdit={handleEditCampaign} onDelete={handleDeleteCampaign} onStatusChange={handleStatusChange} />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Flex justify="space-between" align="center" mb={4}>
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search campaigns" 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              bg={cardBgColor}
              color={textColor}
              border="none"
            />
          </InputGroup>
          <HStack>
            <Button leftIcon={<CalendarIcon />} bg={cardBgColor} color={textColor}>
              Date Range
            </Button>
            <Button leftIcon={<RepeatIcon />} colorScheme="blue" onClick={fetchCampaigns}>
              Refresh
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="green" onClick={onOpen}>
              Create Campaign
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : filteredCampaigns.length === 0 ? (
          <Box textAlign="center" mt={8}>
            <Text fontSize="xl" color={textColor}>No campaigns found.</Text>
            <Text color="gray.500" mt={2}>Create a new campaign to get started.</Text>
          </Box>
        ) : null}
      </MotionBox>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={cardBgColor}>
          <ModalHeader color={textColor}>Create New Campaign</ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <FormControl>
              <FormLabel color={textColor}>Campaign Name</FormLabel>
              <Input 
                value={newCampaign.name} 
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                bg={bgColor}
                color={textColor}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel color={textColor}>Campaign Type</FormLabel>
              <Select 
                value={newCampaign.type}
                onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value})}
                bg={bgColor}
                color={textColor}
              >
                <option value="Outreach">Outreach</option>
                <option value="Messaging">Messaging</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCreateCampaign}>
              Create
            </Button>
            <Button variant="ghost" onClick={onClose} color={textColor}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

interface CampaignTableProps {
  campaigns: Campaign[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onStatusChange: (campaign: Campaign) => void;
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, onEdit, onDelete, onStatusChange }) => {
  const textColor = useColorModeValue("gray.100", "gray.50");
  const bgColor = useColorModeValue("gray.700", "gray.800");

  return (
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
          {campaigns.map((campaign) => (
            <Tr key={campaign.id} _hover={{ bg: bgColor }}>
              <Td color={textColor}>{campaign.name}</Td>
              <Td color={textColor}>{campaign.type}</Td>
              <Td>
                <Badge colorScheme={campaign.status === 'Running' ? 'green' : 'red'}>
                  {campaign.status}
                </Badge>
              </Td>
              <Td>
                <Tooltip label={`${campaign.successful} / ${campaign.contacts}`}>
                  <Progress 
                    value={(campaign.successful / (campaign.contacts || 1)) * 100} 
                    size="sm" 
                    colorScheme="blue"
                  />
                </Tooltip>
              </Td>
              <Td color={textColor}>
                {((campaign.successful / (campaign.contacts || 1)) * 100).toFixed(1)}%
              </Td>
              <Td>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Edit campaign"
                    icon={<EditIcon />}
                    size="sm"
                    colorScheme="blue"
                    onClick={() => onEdit(campaign.id)}
                  />
                  <IconButton
                    aria-label="Delete campaign"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => onDelete(campaign.id)}
                  />
                  <Menu>
                    <MenuButton as={IconButton} icon={<ChevronDownIcon />} color="white"variant="outline" size="sm" />
                    <MenuList>
                      <MenuItem  color="white"
                  bg="gray.700" onClick={() => onStatusChange(campaign)}>
                        {campaign.status === 'Running' ? 'Stop' : 'Start'}
                      </MenuItem>
                      <MenuItem onClick={() => onEdit(campaign.id)}>Edit</MenuItem>
                      <MenuItem onClick={() => onDelete(campaign.id)}>Delete</MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default CampaignDashboard;