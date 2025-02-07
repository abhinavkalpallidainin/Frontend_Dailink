import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Input,
  Spinner,
  useToast,
  Badge,
  Image,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@chakra-ui/icons';
import { supabase } from '../../utils/supabase';
import { format } from 'date-fns';
import campaignService from '../../utils/campaignService';
import { Lead as ImportedLead } from '../../types/type';

interface Campaign {
  id: number;
  name: string;
}


interface QueueView {
  type: 'main' | 'action';
  actionId?: number;
  actionName?: string;
  actionNumber?: number;
  queueCount: number;
}

interface ListsTabDrawerProps {
  campaign: Campaign;
  refreshTrigger: number;
  isOpen: boolean;
  onClose: () => void;
  currentQueueView: QueueView;
}

const ITEMS_PER_PAGE = 10;

const ListsTabDrawer: React.FC<ListsTabDrawerProps> = ({
  campaign,
  refreshTrigger,
  isOpen,
  onClose,
  currentQueueView,
}) => {
  const [leads, setLeads] = useState<ImportedLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    name: '',
    company: '',
    position: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeTab, setActiveTab] = useState('queued');
  const toast = useToast();

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedLeads: ImportedLead[] = [];
      if (currentQueueView.type === 'action' && currentQueueView.actionId) {
        fetchedLeads = await campaignService.getLeadsForAction(campaign.id, currentQueueView.actionId, activeTab);
      } else {
        fetchedLeads = await campaignService.getLeadsForCampaign(campaign.id);
      }
  
      const transformedLeads: ImportedLead[] = fetchedLeads.map(lead => ({
        ...lead,
        firstName: lead.crm_profiles.name.split(' ')[0],
        lastName: lead.crm_profiles.name.split(' ').slice(1).join(' '),
        company: lead.crm_profiles.headline?.split(' at ')[1] || '',
        position: lead.crm_profiles.headline?.split(' at ')[0] || '',
      }));
  
      // Apply filters
      const filteredLeads = transformedLeads.filter(lead => {
        const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
        return (
          fullName.includes(filters.name.toLowerCase()) &&
          (lead.company || '').toLowerCase().includes(filters.company.toLowerCase()) &&
          (lead.position || '').toLowerCase().includes(filters.position.toLowerCase()) &&
          (lead.crm_profiles.location?.toLowerCase().includes(filters.location.toLowerCase()) || true)
        );
      });
  
      setTotalLeads(filteredLeads.length);
  
      // Apply pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
  
      setLeads(paginatedLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error fetching leads',
        description: 'Unable to load leads. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [campaign.id, currentPage, activeTab, filters, currentQueueView, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [fetchLeads, refreshTrigger, activeTab, isOpen]);

  const moveLeadToSuccessful = async (leadId: string) => {
    try {
      await campaignService.updateLeadStatus(campaign.id, leadId, 'successful', currentQueueView.actionId || 0);
      fetchLeads();
      toast({
        title: 'Lead Updated',
        description: 'Lead status changed to successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error moving lead to successful:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await campaignService.deleteLead(campaign.id, leadId);
      setLeads(leads.filter(lead => lead.id !== leadId));
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
      toast({
        title: 'Lead deleted',
        description: 'The lead has been removed from the campaign',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete lead',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleDeleteSelectedLeads = async () => {
    try {
      await Promise.all(selectedLeads.map(leadId => campaignService.deleteLead(campaign.id, leadId)));
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      toast({
        title: 'Leads deleted',
        description: `${selectedLeads.length} lead(s) have been removed from the campaign`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete selected leads',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'queued': return 'blue';
      case 'processing': return 'yellow';
      case 'successful': return 'green';
      case 'failed': return 'red';
      case 'excluded': return 'purple';
      case 'processed': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent bg="gray.900" color="gray.100">
        <DrawerCloseButton />
        <DrawerHeader>
          {currentQueueView.type === 'main' 
            ? 'Campaign Queue' 
            : `Action ${currentQueueView.actionNumber}: ${currentQueueView.actionName} Queue`}
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={6} align="stretch">
            <Flex justify="space-between" align="center">
              <HStack>
                <Text>{`Total: ${totalLeads}`}</Text>
                <Text>{`Selected: ${selectedLeads.length}`}</Text>
              </HStack>
              <HStack>
                <Button
                  leftIcon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={handleDeleteSelectedLeads}
                  isDisabled={selectedLeads.length === 0}
                >
                  Delete Selected
                </Button>
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                    Actions
                  </MenuButton>
                  <MenuList>
                    <MenuItem>Export Selected</MenuItem>
                    <MenuItem>Move to Another List</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>

            <HStack spacing={4}>
              <Input
                placeholder="Search by name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
              <Input
                placeholder="Company"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
              />
              <Input
                placeholder="Position"
                value={filters.position}
                onChange={(e) => handleFilterChange('position', e.target.value)}
              />
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
              <IconButton
                aria-label="Search"
                icon={<SearchIcon />}
                onClick={fetchLeads}
              />
            </HStack>

            <HStack spacing={4}>
              <Button
                onClick={() => handleTabChange('queued')}
                colorScheme={activeTab === 'queued' ? 'blue' : 'gray'}
              >
                Queue
              </Button>
              <Button
                onClick={() => handleTabChange('processing')}
                colorScheme={activeTab === 'processing' ? 'blue' : 'gray'}
              >
                Processing
              </Button>
              <Button
                onClick={() => handleTabChange('successful')}
                colorScheme={activeTab === 'successful' ? 'blue' : 'gray'}
              >
                Successful
              </Button>
              <Button
                onClick={() => handleTabChange('failed')}
                colorScheme={activeTab === 'failed' ? 'blue' : 'gray'}
              >
                Failed
              </Button>
            </HStack>

            {isLoading ? (
              <Flex justify="center" align="center" height="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : leads.length === 0 ? (
              <Text textAlign="center">No leads found.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>
                      <Checkbox
                        isChecked={selectedLeads.length === leads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(leads.map(lead => lead.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                      />
                    </Th>
                    <Th>Name</Th>
                    <Th>Company</Th>
                    <Th>Position</Th>
                    <Th>Location</Th>
                    <Th>Status</Th>
                    <Th>Current Action</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {leads.map(lead => (
                    <Tr key={lead.id}>
                      <Td>
                        <Checkbox
                          isChecked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                            }
                          }}
                        />
                      </Td>
                      <Td>
                        <HStack>
                          <Image
                            src={lead.imageUrl || 'https://via.placeholder.com/40'}
                            alt={`${lead.firstName} ${lead.lastName}`}
                            boxSize="40px"
                            borderRadius="full"
                          />
                          <VStack align="start" spacing={0}>
                            <Text>{`${lead.firstName} ${lead.lastName}`}</Text>
                            <Text fontSize="sm" color="gray.500">{lead.lh_id}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>{lead.company}</Td>
                      <Td>{lead.position}</Td>
                      <Td>{lead.crm_profiles.location}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(lead.status)}>{lead.status}</Badge>
                      </Td>
                      <Td>{lead.current_action_id}</Td>
                      <Td>
                        <HStack>
                          <Tooltip label="Move to Successful">
                            <IconButton
                              aria-label="Move to Successful"
                              icon={<CheckIcon />}
                              size="sm"
                              colorScheme="green"
                              onClick={() => moveLeadToSuccessful(lead.id)}
                              isDisabled={lead.status === 'successful'}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Lead">
                            <IconButton
                              aria-label="Delete Lead"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDeleteLead(lead.id)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}

            <Flex justify="space-between" align="center" mt={4}>
              <Text>
                Page {currentPage} of {Math.ceil(totalLeads / ITEMS_PER_PAGE)}
              </Text>
              <HStack>
                <Button
                  leftIcon={<ChevronLeftIcon />}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  rightIcon={<ChevronRightIcon />}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalLeads / ITEMS_PER_PAGE)))}
                  isDisabled={currentPage === Math.ceil(totalLeads / ITEMS_PER_PAGE)}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ListsTabDrawer;