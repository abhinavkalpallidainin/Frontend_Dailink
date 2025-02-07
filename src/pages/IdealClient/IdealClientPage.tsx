import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  Filters,
  SearchApiResponse,
  SearchResult,
} from "../../types/search";
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  Spinner,
  useToast,
  Heading,
  Progress,
  Card,
  CardBody,
  Badge,
  Grid,
  GridItem,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
} from "@chakra-ui/react";
import { supabase } from "../../utils/supabase";
import { useAccount } from "../../contexts/AccountContext";
import { performLinkedInSearch } from "../../utils/searchApi";
import { HSCRun } from "../../utils/useHSCRuns";

interface FilterGroup {
  id: string;
  name: string;
  filters: SavedFilter[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: any;
  group_id: string;
}

interface ConnectionAnalysis {
  connection_id: string;
  connection_name: string;
  ideal_client_count: number;
  status: "pending" | "complete" | "error";
}

const IdealClientPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedAccount } = useAccount();
  const toast = useToast();

  const isEditing = location.state?.isEditing || false;
  const runDetails = location.state?.runDetails as HSCRun | undefined;
  const bgColor = useColorModeValue("white", "white");
  const hoverColor = useColorModeValue("black", "black");
  const textColor = useColorModeValue("black", "black");
  const hoverTextColor = useColorModeValue("white", "white");

  // States
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [championFilter, setChampionFilter] = useState<SavedFilter | null>(
    null
  );
  const [idealClientFilter, setIdealClientFilter] =
    useState<SavedFilter | null>(null);
  const [runName, setRunName] = useState(runDetails?.name || "New Run");
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [championResults, setChampionResults] = useState<SearchResult[]>([]);
  const [idealClientCount, setIdealClientCount] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingChampions, setIsLoadingChampions] = useState(false);
  const [isLoadingIdealClients, setIsLoadingIdealClients] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionAnalysis, setConnectionAnalysis] = useState<
    ConnectionAnalysis[]
  >([]);
  const [progress, setProgress] = useState(0);

  // Load saved filters on mount
  useEffect(() => {
    fetchSavedFilters();
  }, []);

  // Load existing filters when editing
  useEffect(() => {
    if (isEditing && runDetails && filterGroups.length > 0) {
      // Load first degree filter (champion filter)
      if (runDetails.first_degree_filter_id) {
        const group = filterGroups.find((g) =>
          g.filters.some((f) => f.id === runDetails.first_degree_filter_id)
        );
        if (group) {
          const filter = group.filters.find(
            (f) => f.id === runDetails.first_degree_filter_id
          );
          setChampionFilter(filter || null);
        }
      }

      // Load second degree filter (ideal client filter)
      if (runDetails.second_degree_filter_id) {
        const group = filterGroups.find((g) =>
          g.filters.some((f) => f.id === runDetails.second_degree_filter_id)
        );
        if (group) {
          const filter = group.filters.find(
            (f) => f.id === runDetails.second_degree_filter_id
          );
          setIdealClientFilter(filter || null);
        }
      }
    }
  }, [isEditing, runDetails, filterGroups]);

  const fetchSavedFilters = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data: groups, error: groupsError } = await supabase
        .from("filter_groups")
        .select("*")
        .eq("user_id", user.id);

      if (groupsError) throw groupsError;

      const groupsWithFilters = await Promise.all(
        groups.map(async (group) => {
          const { data: filters, error: filtersError } = await supabase
            .from("saved_filters")
            .select("*")
            .eq("group_id", group.id);

          if (filtersError) throw filtersError;

          return {
            ...group,
            filters: filters || [],
          };
        })
      );

      setFilterGroups(groupsWithFilters);
    } catch (error) {
      console.error("Error fetching filters:", error);
      toast({
        title: "Error",
        description: "Failed to load saved filters",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const searchChampions = async () => {
    if (!championFilter || !selectedAccount?.id) return;

    setIsLoadingChampions(true);
    try {
      const modifiedFilter = {
        ...championFilter.filters,
        network_distance: ["1"],
      };

      let allResults: SearchResult[] = [];
      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const response: any = await performLinkedInSearch(
          selectedAccount.id,
          modifiedFilter as Filters,
          "sales_navigator",
          cursor
        );

        allResults = [...allResults, ...response.items];

        if (response.cursor) {
          cursor = response.cursor;
        } else {
          hasMore = false;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setChampionResults(allResults);
      toast({
        title: "Champions Found",
        description: `Found ${allResults.length} potential champions`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error searching champions:", error);
      toast({
        title: "Error",
        description: "Failed to search potential champions",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingChampions(false);
    }
  };

  const searchIdealClients = async () => {
    if (!idealClientFilter || !selectedAccount?.id) return;

    setIsLoadingIdealClients(true);
    try {
      const modifiedFilter = {
        ...idealClientFilter.filters,
        network_distance: ["2"],
      };

      const response = await performLinkedInSearch(
        selectedAccount.id,
        modifiedFilter as Filters,
        "sales_navigator"
      );

      setIdealClientCount(response.paging.total_count);
      toast({
        title: "Ideal Clients Found",
        description: `Found ${response.paging.total_count} potential ideal clients`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error searching ideal clients:", error);
      toast({
        title: "Error",
        description: "Failed to search ideal clients",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingIdealClients(false);
    }
  };

  const analyzeConnections = async () => {
    if (!championResults.length || !idealClientFilter || !selectedAccount?.id)
      return;

    setIsAnalyzing(true);
    setProgress(0);

    try {
      setConnectionAnalysis(
        championResults.map((champ) => ({
          connection_id: champ.id,
          connection_name: champ.name,
          ideal_client_count: 0,
          status: "pending",
        }))
      );

      for (let i = 0; i < championResults.length; i++) {
        const champion = championResults[i];
        try {
          const modifiedFilter = {
            ...idealClientFilter.filters,
            connections_of: [champion.id],
          };

          const response = await performLinkedInSearch(
            selectedAccount.id,
            modifiedFilter as Filters,
            "sales_navigator"
          );

          setConnectionAnalysis((prev) =>
            prev.map((item) =>
              item.connection_id === champion.id
                ? {
                    ...item,
                    ideal_client_count: response.paging.total_count,
                    status: "complete",
                  }
                : item
            )
          );
        } catch (error) {
          console.error(`Error analyzing champion ${champion.name}:`, error);
          setConnectionAnalysis((prev) =>
            prev.map((item) =>
              item.connection_id === champion.id
                ? { ...item, status: "error" }
                : item
            )
          );
        }

        setProgress(((i + 1) / championResults.length) * 100);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      toast({
        title: "Error",
        description: "Failed to complete analysis",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveFiltersToRun = async () => {
    if (!selectedAccount?.unipile_id) {
      toast({
        title: "Error",
        description: "No LinkedIn account selected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!championFilter || !idealClientFilter) {
      toast({
        title: "Error",
        description: "Please select both filters",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      if (isEditing && runDetails) {
        // Update existing run
        const { error } = await supabase
          .from("hsc_runs")
          .update({
            name: runName,
            first_degree_filter_id: championFilter.id,
            second_degree_filter_id: idealClientFilter.id,
          })
          .eq("run_id", runDetails.run_id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Run updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new run
        const { error } = await supabase.from("hsc_runs").insert({
          name: runName,
          linkedin_account_id: selectedAccount.unipile_id,
          user_id: user.id,
          first_degree_filter_id: championFilter.id,
          second_degree_filter_id: idealClientFilter.id,
          use_first_degree: true,
          stage: "preparing-run",
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Run created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      navigate("/Haystacks");
    } catch (error) {
      console.error("Error saving run:", error);
      toast({
        title: "Error",
        description: "Failed to save run",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box bg="gray.900" minH="100vh" p={8}>
      <VStack spacing={8} align="stretch" maxW="1200px" mx="auto">
        <HStack justify="space-between" align="center">
          <Heading color="white" size="lg">
            {isEditing ? "Edit Run Setup" : "New Run Setup"}
          </Heading>
          <Button
      variant="outline"
      bg={bgColor}
      color={textColor}
      borderColor={textColor}
      _hover={{ bg: hoverColor, color: hoverTextColor }}
      onClick={() => navigate('/Haystacks')}
    >
      Back to Runs
    </Button>
        </HStack>

        {/* Run Name */}
        <Card bg="gray.800" variant="filled">
          <CardBody>
            <FormControl>
              <FormLabel color="white">Run Name</FormLabel>
              <Input
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                placeholder="Enter run name"
                bg="gray.700"
                color="white"
                borderColor="gray.600"
              />
            </FormControl>
          </CardBody>
        </Card>

        {/* Step 1: Champion Filter Selection */}
        <Card bg="gray.800" variant="filled">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text color="white" fontSize="lg" fontWeight="bold">
                Step 1: Define Potential Champions
              </Text>

              {isLoadingFilters ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text color="gray.300">Loading filters...</Text>
                </HStack>
              ) : (
                <>
                  <Select
                    placeholder="Select champion filter"
                    value={
                      championFilter
                        ? `${championFilter.group_id}|${championFilter.id}`
                        : ""
                    }
                    onChange={(e) => {
                      const [groupId, filterId] = e.target.value.split("|");
                      const group = filterGroups.find((g) => g.id === groupId);
                      const filter = group?.filters.find(
                        (f) => f.id === filterId
                      );
                      setChampionFilter(filter || null);
                    }}
                    bg="gray.700"
                    color="white"
                    borderColor="gray.600"
                  >
                    {filterGroups.map((group) => (
                      <optgroup label={group.name} key={group.id}>
                        {group.filters.map((filter) => (
                          <option
                            key={filter.id}
                            value={`${group.id}|${filter.id}`}
                          >
                            {filter.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <Button
                    colorScheme="blue"
                    isLoading={isLoadingChampions}
                    onClick={searchChampions}
                    isDisabled={!championFilter}
                  >
                    Search Champions
                  </Button>
                  {championResults.length > 0 && (
                    <Text color="green.300">
                      Found {championResults.length} potential champions
                    </Text>
                  )}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Step 2: Ideal Client Filter Selection */}
        <Card bg="gray.800" variant="filled">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text color="white" fontSize="lg" fontWeight="bold">
                Step 2: Define Ideal Clients
              </Text>

              <Select
                placeholder="Select ideal client filter"
                value={
                  idealClientFilter
                    ? `${idealClientFilter.group_id}|${idealClientFilter.id}`
                    : ""
                }
                onChange={(e) => {
                  const [groupId, filterId] = e.target.value.split("|");
                  const group = filterGroups.find((g) => g.id === groupId);
                  const filter = group?.filters.find((f) => f.id === filterId);
                  setIdealClientFilter(filter || null);
                }}
                bg="gray.700"
                color="white"
                borderColor="gray.600"
                isDisabled={!championResults.length}
              >
                {filterGroups.map((group) => (
                  <optgroup label={group.name} key={group.id}>
                    {group.filters.map((filter) => (
                      <option
                        key={filter.id}
                        value={`${group.id}|${filter.id}`}
                      >
                        {filter.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              <Button
                colorScheme="blue"
                isLoading={isLoadingIdealClients}
                onClick={searchIdealClients}
                isDisabled={!idealClientFilter || !championResults.length}
              >
                Search Ideal Clients
              </Button>
              {idealClientCount !== null && (
                <Text color="green.300">
                  Found {idealClientCount.toLocaleString()} potential ideal
                  clients
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Step 3: Analysis */}
        <Card bg="gray.800" variant="filled">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text color="white" fontSize="lg" fontWeight="bold">
                Step 3: Analyze Connections
              </Text>

              <Button
                colorScheme="green"
                isLoading={isAnalyzing}
                onClick={analyzeConnections}
                isDisabled={!championResults.length || !idealClientFilter}
              >
                Start Analysis
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card bg="gray.800" variant="filled">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Text color="white" fontSize="lg" fontWeight="bold">
                  Analyzing Connections
                </Text>
                <Progress value={progress} size="sm" colorScheme="blue" />
                <Text color="gray.300">{Math.round(progress)}% complete</Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Results */}
        {connectionAnalysis.length > 0 && (
          <Card bg="gray.800" variant="filled">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Text color="white" fontSize="lg" fontWeight="bold">
                  Analysis Results
                </Text>

                <Grid
                  templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                  gap={4}
                >
                  {connectionAnalysis
                    .sort((a, b) => b.ideal_client_count - a.ideal_client_count)
                    .map((connection) => (
                      <GridItem key={connection.connection_id}>
                        <Card bg="gray.700" size="sm">
                          <CardBody>
                            <VStack align="stretch" spacing={2}>
                              <Text
                                color="white"
                                fontWeight="bold"
                                noOfLines={1}
                              >
                                {connection.connection_name}
                              </Text>
                              <HStack justify="space-between">
                                <Text color="gray.300">Ideal Clients:</Text>
                                <Badge
                                  colorScheme={
                                    connection.status === "complete"
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {connection.status === "complete"
                                    ? connection.ideal_client_count.toLocaleString()
                                    : "Error"}
                                </Badge>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      </GridItem>
                    ))}
                </Grid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Save/Cancel Buttons */}
        <HStack spacing={4} justify="flex-end">
          <Button
            variant="outline"
            bg={bgColor}
            color={textColor}
            borderColor={textColor}
            _hover={{ bg: hoverColor, color: hoverTextColor }}
            onClick={() => navigate("/Haystacks")}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={saveFiltersToRun}
            isLoading={isSaving}
            isDisabled={
              !championFilter || !idealClientFilter || !runName.trim()
            }
          >
            {isEditing ? "Update Run" : "Create Run"}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default IdealClientPage;
