import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  HStack,
  VStack,
  useToast,
  Checkbox,
  Text,
  Badge,
  Tabs,
  TabList,
  Tab,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  ButtonGroup,
  Tooltip,
  Image,
  Container,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  AddIcon,
  DeleteIcon,
  ChevronDownIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  CheckIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import { supabase } from "../../utils/supabase";
import { format } from "date-fns";
import { debounce } from "lodash";

interface Campaign {
  id: number;
  name: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  position: string;
  location: string;
  email: string;
  phone: string;
  headline: string;
  lhId: string;
  addedToQueue: string;
  status: string;
  currentAction: string | null;
  actionStatus: string | null;
  lastActionDate: string | null;
  imageUrl: string | null;
  connectionDegree: string;
  errorMessage?: string;
}

interface ListsTabProps {
  campaign: Campaign;
  refreshTrigger: number;
  onLeadsAdded: () => void;
}

const ITEMS_PER_PAGE = 10;

const ListsTab: React.FC<ListsTabProps> = ({
  campaign,
  refreshTrigger,
  onLeadsAdded,
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    name: "",
    company: "",
    position: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeTab, setActiveTab] = useState("queue");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("campaign_leads")
        .select(
          `
        *,
        crm_profiles!fk_crm_profile(*)
      `,
          { count: "exact" }
        )
        .eq("campaign_id", campaign.id);

      if (activeTab === "queue") {
        query = query.eq("status", "queued");
      } else if (activeTab === "failed") {
        query = query.eq("status", "failed");
      } else if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      if (filters.name)
        query = query.ilike("crm_profiles.name", `%${filters.name}%`);
      if (filters.company)
        query = query.ilike("crm_profiles.company", `%${filters.company}%`);
      if (filters.position)
        query = query.ilike("crm_profiles.headline", `%${filters.position}%`);
      if (filters.location)
        query = query.ilike("crm_profiles.location", `%${filters.location}%`);

      const { data, error, count } = await query.range(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE - 1
      );

      if (error) throw error;

      setTotalLeads(count || 0);

      const formattedLeads: Lead[] = data.map((item) => ({
        id: item.id,
        firstName: item.crm_profiles.name.split(" ")[0],
        lastName: item.crm_profiles.name.split(" ").slice(1).join(" "),
        company: item.crm_profiles.company || "",
        position: item.crm_profiles.headline || "",
        location: item.crm_profiles.location || "",
        email: item.crm_profiles.email || "",
        phone: item.crm_profiles.phone || "",
        headline: item.crm_profiles.headline || "",
        lhId: item.lh_id || "",
        addedToQueue: item.created_at,
        status: item.status,
        currentAction: item.current_action,
        actionStatus: item.action_status,
        lastActionDate: item.last_action_date,
        imageUrl: item.crm_profiles.profile_picture_url || null,
        connectionDegree: item.crm_profiles.connection_degree || "",
        errorMessage: item.error_message,
        crm_profiles: item.crm_profiles,
      }));

      setLeads(formattedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError("Failed to load leads. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [campaign.id, currentPage, activeTab, filters]);

  const debouncedFetchLeads = useMemo(
    () => debounce(fetchLeads, 300),
    [fetchLeads]
  );

  useEffect(() => {
    debouncedFetchLeads();
    return () => {
      debouncedFetchLeads.cancel();
    };
  }, [debouncedFetchLeads, refreshTrigger, activeTab]);

  const moveLeadToSuccessful = async (leadId: string) => {
    try {
      await supabase
        .from("campaign_leads")
        .update({ status: "successful" })
        .eq("id", leadId);
      debouncedFetchLeads();
      toast({
        title: "Lead Updated",
        description: "Lead status changed to successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onLeadsAdded();
    } catch (error) {
      console.error("Error moving lead to successful:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from("campaign_leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;

      setLeads(leads.filter((lead) => lead.id !== leadId));
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId));
      toast({
        title: "Lead deleted",
        description: "The lead has been removed from the campaign",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onLeadsAdded();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSelectedLeads = async () => {
    try {
      const { error } = await supabase
        .from("campaign_leads")
        .delete()
        .in("id", selectedLeads);

      if (error) throw error;

      setLeads(leads.filter((lead) => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      toast({
        title: "Leads deleted",
        description: `${selectedLeads.length} lead(s) have been removed from the campaign`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onLeadsAdded();
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast({
        title: "Error",
        description: "Failed to delete selected leads",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleTabChange = (index: number) => {
    const tabNames = [
      "queue",
      "exclude_list",
      "processing",
      "processed",
      "successful",
      "failed",
    ];
    setActiveTab(tabNames[index]);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "queued":
        return "blue";
      case "processing":
        return "yellow";
      case "successful":
        return "green";
      case "failed":
        return "red";
      case "excluded":
        return "purple";
      case "processed":
        return "orange";
      default:
        return "gray";
    }
  };

  return (
    <Box bg="gray.900" color="gray.100" minHeight="100vh" p={4}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg">Campaign Leads</Heading>
            <HStack>
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  colorScheme="blue"
                >
                  Actions
                </MenuButton>
                <MenuList bg="gray.800">
                  <MenuItem
                    _hover={{ bg: "gray.500" }}
                    color="white"
                    bg="gray.700"
                    icon={<DeleteIcon />}
                    onClick={handleDeleteSelectedLeads}
                    isDisabled={selectedLeads.length === 0}
                  >
                    Delete selected
                  </MenuItem>
                  <MenuItem
                    _hover={{ bg: "gray.500" }}
                    color="white"
                    bg="gray.700"
                    icon={<DownloadIcon />}
                  >
                    Export
                  </MenuItem>
                </MenuList>
              </Menu>
              <IconButton
                aria-label="Settings"
                icon={<SettingsIcon />}
                colorScheme="blue"
                variant="outline"
              />
            </HStack>
          </Flex>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Tabs
            onChange={handleTabChange}
            variant="soft-rounded"
            colorScheme="blue"
          >
            <TabList>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>Queue</Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>
                Exclude list
              </Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>
                Processing
              </Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>
                Processed
              </Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>
                Successful
              </Tab>
              <Tab _selected={{ color: "white", bg: "blue.500" }}>Failed</Tab>
            </TabList>
          </Tabs>

          <Flex justify="space-between" align="center">
            <HStack>
              <Checkbox
                isChecked={selectedLeads.length === leads.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedLeads(leads.map((lead) => lead.id));
                  } else {
                    setSelectedLeads([]);
                  }
                }}
              />
              <Text>{`Selected ${selectedLeads.length} / ${totalLeads}`}</Text>
            </HStack>
            <HStack>
              <IconButton
                aria-label="Delete selected"
                icon={<DeleteIcon />}
                onClick={handleDeleteSelectedLeads}
                isDisabled={selectedLeads.length === 0}
                colorScheme="red"
                variant="ghost"
              />
              <IconButton
                aria-label="View options"
                icon={<SettingsIcon />}
                colorScheme="blue"
                variant="ghost"
              />
              <IconButton
                aria-label="Add column"
                icon={<AddIcon />}
                colorScheme="green"
                variant="ghost"
              />
            </HStack>
          </Flex>

          <VStack spacing={4} align="stretch">
            <HStack>
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  children={<SearchIcon color="gray.300" />}
                />
                <Input
                  placeholder="Search by name"
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  bg="gray.800"
                />
              </InputGroup>
              <Input
                placeholder="Company"
                value={filters.company}
                onChange={(e) => handleFilterChange("company", e.target.value)}
                bg="gray.800"
              />
              <Input
                placeholder="Position"
                value={filters.position}
                onChange={(e) => handleFilterChange("position", e.target.value)}
                bg="gray.800"
              />
              <Input
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                bg="gray.800"
              />
            </HStack>
            <Button
              colorScheme="blue"
              onClick={() => debouncedFetchLeads()}
              width="100%"
            >
              Apply Filters
            </Button>
          </VStack>

          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" color="blue.500" />
            </Flex>
          ) : (
            <Box overflowX="auto" bg="gray.800" borderRadius="md">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th width="30px" color="gray.400">
                      <Checkbox
                        isChecked={selectedLeads.length === leads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(leads.map((lead) => lead.id));
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                      />
                    </Th>
                    <Th color="gray.400">Name</Th>
                    <Th color="gray.400">Company</Th>
                    <Th color="gray.400">Position</Th>
                    <Th color="gray.400">Location</Th>
                    <Th color="gray.400">Status</Th>
                    <Th color="gray.400">Last Action</Th>
                    {activeTab === "failed" && (
                      <Th color="gray.400">Error Message</Th>
                    )}
                    <Th width="50px" color="gray.400">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {leads.map((lead) => (
                    <Tr key={lead.id}>
                      <Td>
                        <Checkbox
                          isChecked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(
                                selectedLeads.filter((id) => id !== lead.id)
                              );
                            }
                          }}
                        />
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Image
                            src={
                              lead.imageUrl || "https://via.placeholder.com/40"
                            }
                            alt={`${lead.firstName} ${lead.lastName}`}
                            borderRadius="full"
                            boxSize="30px"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{`${lead.firstName} ${lead.lastName}`}</Text>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                            >{`LH ID: ${lead.lhId}`}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>{lead.company}</Td>
                      <Td>{lead.position}</Td>
                      <Td>{lead.location}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(lead.status)}>
                          {lead.status.toUpperCase()}
                        </Badge>
                      </Td>
                      <Td>
                        <Tooltip
                          label={
                            lead.lastActionDate
                              ? format(new Date(lead.lastActionDate), "PPpp")
                              : "No action yet"
                          }
                        >
                          <Text>{lead.currentAction || "N/A"}</Text>
                        </Tooltip>
                      </Td>
                      {activeTab === "failed" && (
                        <Td>
                          <Tooltip
                            label={lead.errorMessage || "No error message"}
                          >
                            <Text isTruncated maxWidth="200px">
                              {lead.errorMessage || "N/A"}
                            </Text>
                          </Tooltip>
                        </Td>
                      )}
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Move to Successful"
                            icon={<CheckIcon />}
                            size="sm"
                            colorScheme="green"
                            onClick={() => moveLeadToSuccessful(lead.id)}
                            isDisabled={lead.status === "successful"}
                          />
                          <IconButton
                            aria-label="Delete lead"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteLead(lead.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          <Flex justify="space-between" align="center" mt={4}>
            <Text>
              Page {currentPage} of {Math.ceil(totalLeads / ITEMS_PER_PAGE)}
            </Text>
            <ButtonGroup>
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                isDisabled={currentPage === 1}
                colorScheme="blue"
                variant="outline"
              >
                Previous
              </Button>
              <Button
                rightIcon={<ChevronRightIcon />}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, Math.ceil(totalLeads / ITEMS_PER_PAGE))
                  )
                }
                isDisabled={
                  currentPage === Math.ceil(totalLeads / ITEMS_PER_PAGE)
                }
                colorScheme="blue"
                variant="outline"
              >
                Next
              </Button>
            </ButtonGroup>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "queued":
      return "blue";
    case "processing":
      return "yellow";
    case "successful":
      return "green";
    case "failed":
      return "red";
    case "excluded":
      return "purple";
    case "processed":
      return "orange";
    default:
      return "gray";
  }
};

export default ListsTab;
