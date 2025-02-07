// SearchPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Select,
  Text,
  Spinner,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress,
  css
} from "@chakra-ui/react";
import { debounce } from "lodash";
import { ChevronDownIcon } from "@chakra-ui/icons";

// Contexts and Types
import { useAccount } from "../../contexts/AccountContext";
import { useList } from "../../contexts/ListContext";
import {
  Filters,
  SearchResult,
  RangeValue,
  FilterChangeHandler,
} from "../../types/search";
import { List as ListType } from "../../types/type";

// Components
import URLSearch from "../../components/SearchPage/profile/URLSearch";
import LinkedInClassicFilters from "../../components/SearchPage/profile/LinkedInClassicFilters";
import SalesNavigatorFilters from "../../components/SearchPage/profile/SalesNavigatorFilters";
import SearchResults from "../../components/SearchPage/profile/SearchResults";
import SearchResultsAccount from "../../components/SearchPage/account/SearchResultsAccount";
import CreateListModal from "../../components/SearchPage/filters/CreateListModal";
import AlertDialogComponent from "../../components/Alert/AlertDialogComponent";
import SaveFiltersModal from "../../components/SearchPage/profile/savefilters";
import LinkedInClassicAccountFilters from "../../components/SearchPage/account/LinkedInClassicAccountFilters";
import SalesNavigatorAccountFilters from "../../components/SearchPage/account/SalesNavigatorAccountFilters";

// API and Utilities
import {
  performLinkedInSearch,
  performLinkedInSearchAccount,
  getLinkedInSearchParameters,
  getLinkedInUserProfile,
  ParameterType,
  SearchResponse,
} from "../../utils/searchApi";
import {
  getCRMLists,
  addProfilesToList,
  getProfilesInList,
  supabase,
  addAccountsToList,
  getAccountsInList,
} from "../../utils/supabase";

// Constants
const DEBOUNCE_DELAY = 500;

// Updated Search State Interface
interface SearchState {
  results: SearchResult[];
  isSearching: boolean;
  totalResults: number;
  currentPage: number;
  error: string | null;
  cursor?: string;
}

// Add the Progress State Interface
interface SaveProgress {
  currentPage: number;
  totalPages: number;
  profilesSaved: number;
  totalProfilesToSave: number;
}

// Initial Filters State
const initialFilters: Filters = {
  keywords: "",
  location: [],
  people: [],
  company: [],
  school: [],
  industry: [],
  service: [],
  job_function: "",
  role: [],
  past_role: [],
  network_distance: [],
  profile_language: [],
  company_headcount: [],
  following_your_company: false,
  viewed_your_profile_recently: false,
  open_to: [],
  past_company: "",
  seniority: "",
  company_location: [],
  connections_of: [],
  function: [],
  first_name: "",
  last_name: "",
  tenure: [],
  company_type: [],
  viewed_profile_recently: false,
  messaged_recently: false,
  include_saved_leads: false,
  saved_search: "",
  recent_search: ""
};

// Add the Initial Progress State
const initialProgress: SaveProgress = {
  currentPage: 1,
  totalPages: 0,
  profilesSaved: 0,
  totalProfilesToSave: 0,
};

export const filterNameToParamType = (filterName: string): ParameterType => {
  const mapping: Record<string, ParameterType> = {
    location: "LOCATION",
    people: "PEOPLE",
    company: "COMPANY",
    past_company: "COMPANY",
    school: "SCHOOL",
    service: "SERVICE",
    job_function: "DEPARTMENT",
    role: "JOB_TITLE",
    past_role: "JOB_TITLE",
    industry: "INDUSTRY",
    keywords: "KEYWORDS",
    saved_search: "SAVED_SEARCHES",
    recent_search: "RECENT_SEARCHES",
    followers: "FOLLOWERS",
    connections: "CONNECTIONS",
    company_location: "LOCATION",
    department:"DEPARTMENT"
  };
  return mapping[filterName.toLowerCase()] || "KEYWORDS";
};

const SearchPage: React.FC = () => {
  // Context and Toast
  const { selectedAccount } = useAccount();
  const { lists, setLists, addList } = useList();
  const toast = useToast();

  // Modal Disclosure
  const {
    isOpen: isCreateListModalOpen,
    onOpen: openCreateListModal,
    onClose: closeCreateListModal,
  } = useDisclosure();

  const {
    isOpen: isSaveFiltersModalOpen,
    onOpen: openSaveFiltersModal,
    onClose: closeSaveFiltersModal,
  } = useDisclosure();

  // State Management
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isSearching: false,
    totalResults: 0,
    currentPage: 1,
    error: null,
  });

  const [searchPlatform, setSearchPlatform] = useState<
    "classic" | "sales_navigator"
  >("classic");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string>("");
  const [savedLeadsCounts, setSavedLeadsCounts] = useState<
    Record<string, number>
  >({});
  const [selectedProfilesAccount, setSelectedProfilesAccount] = useState<
    string[]
  >([]);
  const [savedLeadsCountsAccount, setSavedLeadsCountsAccount] = useState<
    Record<string, number>
  >({});
  const [filterOptions, setFilterOptions] = useState<
    Record<string, { label: string; value: string }[]>
  >({});
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [savedFilterGroups, setSavedFilterGroups] = useState<any[]>([]);
  const [isLead, setisLead] = useState(true);
  const [savingProgress, setSavingProgress] =
    useState<SaveProgress>(initialProgress);
  const [isSaving, setIsSaving] = useState(false);

  // Memoized Values
  const hasSelectedAccount = Boolean(selectedAccount);
  const canSaveProfiles = Boolean(selectedList && selectedProfiles.length > 0);
  const canSaveAccounts = Boolean(
    selectedList && selectedProfilesAccount.length > 0
  );

  // Helper function to process search response
  const processSearchResponse = (
    response: SearchResponse,
    currentPage: number
  ) => {
    setSearchState((prev) => ({
      ...prev,
      results: response.items || [],
      totalResults: response.paging.total_count,
      isSearching: false,
      currentPage,
      cursor: response.cursor,
    }));
  };

  // Fetch lists when selectedAccount changes
  useEffect(() => {
    const fetchLists = async () => {
      if (selectedAccount) {
        try {
          const fetchedLists = await getCRMLists(selectedAccount.id);
          console.log("Fetched lists:", fetchedLists);
          setLists(fetchedLists);
        } catch (error) {
          console.error("Error fetching lists:", error);
          toast({
            title: "Error fetching lists",
            description: "An unexpected error occurred. Please try again.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    };

    fetchLists();
  }, [selectedAccount, setLists, toast]);

  // URL Search Handler
  const handleUrlSearch = async (params: {
    api: "classic" | "sales_navigator";
    category: "people";
    url: string;
  }) => {
    if (!selectedAccount?.id) {
      toast({
        title: "No account selected",
        description: "Please select a LinkedIn account to perform the search.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSearchState((prev) => ({ ...prev, isSearching: true, error: null }));

    try {
      const results = await performLinkedInSearch(
        selectedAccount.id,
        params,
        params.api
      );

      processSearchResponse(results, 1);
      setSearchPlatform(params.api);
      setFilters(initialFilters);
    } catch (error: any) {
      handleSearchError(error);
    }
  };

  // Filter Options Handler
  const fetchFilterOptions = useCallback(
    debounce(async (filterName: string, query: string) => {
      if (!selectedAccount?.id || !query.trim()) return;

      try {
        const paramType = filterNameToParamType(filterName);
        const params = await getLinkedInSearchParameters(
          selectedAccount.id,
          paramType,
          query
        );

        setFilterOptions((prev) => ({
          ...prev,
          [filterName]: params.items.map((item) => ({
            label: item.title,
            value: item.id,
          })),
        }));
      } catch (error) {
        console.error(`Error fetching ${filterName} options:`, error);
        toast({
          title: "Error fetching options",
          description: "An unexpected error occurred",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }, DEBOUNCE_DELAY),
    [selectedAccount, toast]
  );

  // Filter Change Handler
  const handleFilterChange: FilterChangeHandler = useCallback(
    (filterName, value) => {
      if (filterName === "reset") {
        setFilters(initialFilters);
        return;
      }

      setFilters((prev) => {
        const newFilters = { ...prev };
        if (
          filterName.includes("_headcount") ||
          filterName.includes("tenure")
        ) {
          (newFilters[filterName] as unknown as RangeValue) =
            value as RangeValue;
        } else if (typeof value === "boolean") {
          (newFilters[filterName] as boolean) = value;
        } else {
          (newFilters[filterName] as any) = value;
        }

        return newFilters;
      });
    },
    []
  );

  // Search Error Handler
  const handleSearchError = useCallback(
    (error: any) => {
      console.error("Search error:", error);

      if (
        error.message?.includes("403") &&
        error.message?.includes("Feature not subscribed")
      ) {
        setAlertMessage("Not subscribed to Sales Navigator");
        setIsAlertOpen(true);
      } else {
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
          error: error.message || "An unexpected error occurred",
        }));

        toast({
          title: "Error searching profiles",
          description: error.message || "An unexpected error occurred",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
    [toast]
  );

  // Perform Search
  const performSearch = useCallback(
    debounce(async (searchFilters: Filters) => {
      if (!selectedAccount?.id) {
        toast({
          title: "No account selected",
          description:
            "Please select a LinkedIn account to perform the search.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setSearchState((prev) => ({ ...prev, isSearching: true, error: null }));

      try {
        const results = await performLinkedInSearch(
          selectedAccount.id,
          searchFilters,
          searchPlatform
        );

        processSearchResponse(results, 1);
      } catch (error: any) {
        handleSearchError(error);
      }
    }, DEBOUNCE_DELAY),
    [selectedAccount, searchPlatform, toast, handleSearchError]
  );
  const performSearchAccount = useCallback(
    debounce(async (searchFilters: Filters) => {
      if (!selectedAccount?.id) {
        toast({
          title: "No account selected",
          description:
            "Please select a LinkedIn account to perform the search.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setSearchState((prev) => ({ ...prev, isSearching: true, error: null }));

      try {
        const results = await performLinkedInSearchAccount(
          selectedAccount.id,
          searchFilters,
          searchPlatform
        );

        processSearchResponse(results, 1);
      } catch (error: any) {
        handleSearchError(error);
      }
    }, DEBOUNCE_DELAY),
    [selectedAccount, searchPlatform, toast, handleSearchError]
  );

  // Page Change Handler
  const handlePageChange = async (newPage: number) => {
    if (!selectedAccount?.id || !searchState.cursor) return;

    setSearchState((prev) => ({ ...prev, isSearching: true }));

    try {
      const results = await performLinkedInSearch(
        selectedAccount.id,
        filters,
        searchPlatform,
        searchState.cursor
      );

      processSearchResponse(results, newPage);
    } catch (error: any) {
      handleSearchError(error);
    }
  };
  const handlePageChangeAccount = async (newPage: number) => {
    if (!selectedAccount?.id || !searchState.cursor) return;

    setSearchState((prev) => ({ ...prev, isSearching: true }));

    try {
      const results = await performLinkedInSearchAccount(
        selectedAccount.id,
        filters,
        searchPlatform,
        searchState.cursor
      );

      processSearchResponse(results, newPage);
    } catch (error: any) {
      handleSearchError(error);
    }
  };

  // Effect for Search
  useEffect(() => {
    if (selectedAccount?.id) {
      if (isLead) {
        performSearch(filters);
      } else {
        performSearchAccount(filters);
      }
    }
  }, [filters, selectedAccount, performSearchAccount, performSearch]);

  // Effect for Saved Leads Count
  useEffect(() => {
    const fetchSavedLeadsCounts = async () => {
      if (!selectedAccount?.id) return;

      try {
        const counts: Record<string, number> = {};
        const fetchedLists = await getCRMLists(selectedAccount.id);

        for (const list of fetchedLists) {
          const profiles = await getProfilesInList(list.id);
          counts[list.id] = profiles.length;
        }

        setSavedLeadsCounts(counts);
      } catch (error) {
        console.error("Error fetching saved leads counts:", error);
        toast({
          title: "Error fetching lists",
          description: "Could not fetch saved leads counts",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchSavedLeadsCounts();
  }, [selectedAccount, toast]);

  // List Handlers
  const handleListChange = (listId: string) => {
    setSelectedList(listId);
  };

  const handleCreateList = async (name: string) => {
    if (!selectedAccount?.id || !name.trim()) return;

    try {
      const createdList = await addList(name);
      if (createdList) {
        closeCreateListModal();
        setSelectedList(createdList.id);

        toast({
          title: "List created",
          description: `New list "${createdList.name}" has been created successfully.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Update the lists state directly
        setLists((prevLists) => [...prevLists, createdList]);

        // Update saved leads counts
        setSavedLeadsCounts((prev) => ({ ...prev, [createdList.id]: 0 }));
      }
    } catch (error) {
      console.error("Error creating list:", error);
      toast({
        title: "Error creating list",
        description: "An unexpected error occurred. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Save Profiles Handler
  const handleSaveProfiles = async () => {
    if (!selectedAccount?.id || !selectedList || selectedProfiles.length === 0)
      return;

    try {
      setIsSaving(true);
      console.log("Starting profile save process:", {
        totalSelectedProfiles: selectedProfiles.length,
        isMultiPage: selectedProfiles.length > 10,
        tempProfiles: selectedProfiles.filter((id) =>
          id.startsWith("temp-profile-")
        ).length,
        realProfiles: selectedProfiles.filter(
          (id) => !id.startsWith("temp-profile-")
        ).length,
      });

      // First, fetch all the profiles we need
      if (selectedProfiles.some((id) => id.startsWith("temp-profile-"))) {
        try {
          // Fetch all profiles in one request
          const fullResults = await performLinkedInSearch(
            selectedAccount.id,
            filters,
            searchPlatform,
            undefined,
            selectedProfiles.length.toString() // Request all profiles at once
          );

          if (fullResults.items) {
            // Replace temporary IDs with actual profile IDs
            const actualProfileIds = fullResults.items.map((item) => item.id);
            const updatedSelectedProfiles = actualProfileIds.slice(
              0,
              selectedProfiles.length
            );

            // Update the selected profiles with real IDs
            setSelectedProfiles(updatedSelectedProfiles);

            // Save all profiles at once
            try {
              const profilesToSave = fullResults.items
                .slice(0, selectedProfiles.length)
                .map((profile) => ({
                  linkedin_id: profile.id,
                  name: profile.name || "",
                  headline: profile.headline || "",
                  location: profile.location || "",
                  profile_url: profile.public_profile_url || "",
                }));

              await addProfilesToList(selectedList, profilesToSave);

              setIsSaving(false);
              setSavingProgress(initialProgress);
              setSelectedProfiles([]);
              setSavedLeadsCounts((prev) => ({
                ...prev,
                [selectedList]:
                  (prev[selectedList] || 0) + profilesToSave.length,
              }));

              toast({
                title: "Success",
                description: `Successfully saved ${profilesToSave.length} profiles`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });

              return; // Exit early after successful save
            } catch (error) {
              console.error("Error saving profiles:", error);
              throw error;
            }
          }
        } catch (error) {
          console.error("Error fetching full results:", error);
          throw error;
        }
      }

      // If we get here, it means we're dealing with only real profile IDs
      const existingProfiles = await getProfilesInList(selectedList);
      const realProfiles = selectedProfiles.filter(
        (id) => !id.startsWith("temp-profile-")
      );

      try {
        const results = await performLinkedInSearch(
          selectedAccount.id,
          {
            ...filters,
            keywords: realProfiles.join(" OR "),
          },
          searchPlatform,
          undefined,
          realProfiles.length.toString()
        );

        if (results.items) {
          const profilesToSave = results.items.map((profile) => ({
            linkedin_id: profile.id,
            name: profile.name || "",
            headline: profile.headline || "",
            location: profile.location || "",
            profile_url: profile.public_profile_url || "",
          }));

          await addProfilesToList(selectedList, profilesToSave);

          setIsSaving(false);
          setSavingProgress(initialProgress);
          setSelectedProfiles([]);
          setSavedLeadsCounts((prev) => ({
            ...prev,
            [selectedList]: (prev[selectedList] || 0) + profilesToSave.length,
          }));

          toast({
            title: "Success",
            description: `Successfully saved ${profilesToSave.length} profiles`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error saving profiles:", error);
        throw error;
      }
    } catch (error) {
      console.error("Save process failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
      setSavingProgress(initialProgress);
      toast({
        title: "Error saving profiles",
        description: "An unexpected error occurred. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleSaveBoth = async () => {
    await handleSaveProfiles();
    await handleSaveProfilesAccount();
  };
  const handleSaveProfilesAccount = async () => {
    if (
      !selectedAccount?.id ||
      !selectedList ||
      selectedProfilesAccount.length === 0
    )
      return;

    try {
      setIsSaving(true);
      console.log("Starting profile save process:", {
        totalSelectedProfiles: selectedProfilesAccount.length,
        isMultiPage: selectedProfilesAccount.length > 10,
        tempProfiles: selectedProfilesAccount.filter((id) =>
          id.startsWith("temp-profile-")
        ).length,
        realProfiles: selectedProfilesAccount.filter(
          (id) => !id.startsWith("temp-profile-")
        ).length,
      });

      // First, fetch all the profiles we need
      if (
        selectedProfilesAccount.some((id) => id.startsWith("temp-profile-"))
      ) {
        try {
          // Fetch all profiles in one request
          const fullResults = await performLinkedInSearchAccount(
            selectedAccount.id,
            filters,
            searchPlatform,
            undefined,
            selectedProfilesAccount.length.toString() // Request all profiles at once
          );

          if (fullResults.items) {
            // Replace temporary IDs with actual profile IDs
            const actualProfileIds = fullResults.items.map((item) => item.id);
            const updatedSelectedProfiles = actualProfileIds.slice(
              0,
              selectedProfilesAccount.length
            );

            // Update the selected profiles with real IDs
            setSelectedProfilesAccount(updatedSelectedProfiles);

            // Save all profiles at once
            try {
              const profilesToSave = fullResults.items
                .slice(0, selectedProfilesAccount.length)
                .map((profile) => ({
                  linkedin_id: profile.id,
                  name: profile.name || "",
                  summary: profile.summary || "",
                  location: profile.location || "",
                  industry: profile.industry || "",
                  followers_count: profile.followers_count || 0,
                  profile_url: profile.profile_url || "",
                  logo:profile.logo||""
                }));

              await addAccountsToList(selectedList, profilesToSave);

              setIsSaving(false);
              setSavingProgress(initialProgress);
              setSelectedProfilesAccount([]);
              setSavedLeadsCountsAccount((prev) => ({
                ...prev,
                [selectedList]:
                  (prev[selectedList] || 0) + profilesToSave.length,
              }));

              toast({
                title: "Success",
                description: `Successfully saved ${profilesToSave.length} profiles`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });

              return; // Exit early after successful save
            } catch (error) {
              console.error("Error saving profiles:", error);
              throw error;
            }
          }
        } catch (error) {
          console.error("Error fetching full results:", error);
          throw error;
        }
      }

      // If we get here, it means we're dealing with only real profile IDs
      const existingProfiles = await getAccountsInList(selectedList);
      const realProfiles = selectedProfilesAccount.filter(
        (id) => !id.startsWith("temp-profile-")
      );

      try {
        const results = await performLinkedInSearchAccount(
          selectedAccount.id,
          {
            ...filters,
            keywords: realProfiles.join(" OR "),
          },
          searchPlatform,
          undefined,
          realProfiles.length.toString()
        );

        if (results.items) {
          const profilesToSave = results.items.map((profile) => ({
            linkedin_id: profile.id,
            name: profile.name || "",
            summary: profile.summary || "",
            location: profile.location || "",
            industry: profile.industry || "",
            followers_count: profile.followers_count || 0,
            profile_url: profile.profile_url || "",
            logo:profile.logo||""
          }));

          await addAccountsToList(selectedList, profilesToSave);

          setIsSaving(false);
          setSavingProgress(initialProgress);
          setSelectedProfilesAccount([]);
          setSavedLeadsCounts((prev) => ({
            ...prev,
            [selectedList]: (prev[selectedList] || 0) + profilesToSave.length,
          }));

          toast({
            title: "Success",
            description: `Successfully saved ${profilesToSave.length} profiles`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error saving profiles:", error);
        throw error;
      }
    } catch (error) {
      console.error("Save process failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setIsSaving(false);
      setSavingProgress(initialProgress);
      toast({
        title: "Error saving profiles",
        description: "An unexpected error occurred. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Platform Change Handler
  const handleSearchPlatformChange = (value: "classic" | "sales_navigator") => {
    setSearchPlatform(value);
    setFilters(initialFilters);
    setSearchState({
      results: [],
      isSearching: false,
      totalResults: 0,
      currentPage: 1,
      error: null,
      cursor: undefined,
    });
  };

  // Alert Handler
  const handleAlertClose = () => {
    setIsAlertOpen(false);
    setSearchPlatform("classic");
    setFilters(initialFilters);
  };

  // Render helper functions
  const renderSearchControls = () => (
    <VStack spacing={4} width="100%">
      <HStack justify="space-between" width="100%">
        <HStack>
          <Button
            colorScheme="blue"
            onClick={openCreateListModal}
            isDisabled={!hasSelectedAccount}
          >
            Create New List
          </Button>
          <Button
            colorScheme="purple"
            onClick={openSaveFiltersModal}
            isDisabled={!hasSelectedAccount}
          >
            Save Filters
          </Button>
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={!hasSelectedAccount || savedFilterGroups.length === 0}
            >
              Saved Filters
            </MenuButton>
            <MenuList>
              {savedFilterGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <Text px={3} py={2} fontWeight="bold" color="gray.500">
                    {group.name}
                  </Text>
                  {group.filters.map((filter: any) => (
                    <MenuItem
                      key={filter.id}
                      onClick={() => handleApplySavedFilter(filter)}
                    >
                      {filter.name}
                    </MenuItem>
                  ))}
                </React.Fragment>
              ))}
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
      {renderSaveProgress()}
    </VStack>
  );

  const renderSearchMetrics = () => {
    if (savingProgress.totalPages > 0) {
      return (
        <Box color="gray.300">
          <Flex align="center" gap={2}>
            <Spinner size="sm" />
            <Text>
              Saving profiles... Page {savingProgress.currentPage} of{" "}
              {savingProgress.totalPages}({savingProgress.profilesSaved}{" "}
              profiles saved)
            </Text>
          </Flex>
        </Box>
      );
    }

    if (searchState.isSearching) {
      return (
        <Box color="gray.300">
          <Flex align="center" gap={2}>
            <Spinner size="sm" />
            <Text>Searching...</Text>
          </Flex>
        </Box>
      );
    }

    if (searchState.error) {
      return <Box color="red.300">Error: {searchState.error}</Box>;
    }

    if (searchState.totalResults > 0) {
      return (
        <Box color="gray.300">
          Showing results from {searchState.totalResults.toLocaleString()}{" "}
          profiles found
        </Box>
      );
    }

    return <Box color="gray.300">No results found</Box>;
  };

  const renderSearchPlatformSelector = () => (
    <Select
    value={searchPlatform}
    onChange={(e) =>
      handleSearchPlatformChange(
        e.target.value as "classic" | "sales_navigator"
      )
    }
    bg="gray.700"
    borderColor="gray.600"
    color="gray.200"
    size="sm"
    isDisabled={!hasSelectedAccount}
    
    sx={{
      option: {
        backgroundColor: 'gray.700',
        _hover: {
          backgroundColor: 'gray.500'
        }
      }
    }}
  >
    <option value="classic" style={{ backgroundColor: 'gray.700' }}>Classic LinkedIn</option>
    <option value="sales_navigator" style={{ backgroundColor: 'gray.700' }}>Sales Navigator</option>
  </Select>
  );

  // Add this new effect to fetch saved filters
  useEffect(() => {
    const fetchSavedFilters = async () => {
      if (!selectedAccount) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: groups, error: groupsError } = await supabase
          .from("filter_groups")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (groupsError) throw groupsError;

        const groupsWithFilters = await Promise.all(
          groups.map(async (group) => {
            const { data: filters, error: filtersError } = await supabase
              .from("saved_filters")
              .select("*")
              .eq("group_id", group.id)
              .order("created_at", { ascending: true });

            if (filtersError) throw filtersError;

            return {
              ...group,
              filters: filters || [],
            };
          })
        );

        setSavedFilterGroups(groupsWithFilters);
      } catch (error) {
        console.error("Error fetching saved filters:", error);
        toast({
          title: "Error fetching saved filters",
          description: "An unexpected error occurred",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchSavedFilters();
  }, [selectedAccount]);

  // Add this new handler for applying saved filters
  const handleApplySavedFilter = (savedFilter: any) => {
    setFilters(savedFilter.filters);
    toast({
      title: "Filter applied",
      description: `Applied saved filter: ${savedFilter.name}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Add this new render function for the progress bar
  const renderSaveProgress = () => {
    if (!isSaving) return null;

    return (
      <Box mt={4}>
        <HStack justify="space-between" mb={2}>
          <Text color="gray.300">Saving Progress</Text>
          <Text color="gray.300">
            {savingProgress.profilesSaved} /{" "}
            {savingProgress.totalProfilesToSave} profiles
          </Text>
        </HStack>
        <Progress
          value={
            (savingProgress.profilesSaved /
              savingProgress.totalProfilesToSave) *
            100
          }
          size="sm"
          colorScheme="green"
          hasStripe
          isAnimated
        />
        <Text color="gray.400" fontSize="sm" mt={1}>
          Page {savingProgress.currentPage} of {savingProgress.totalPages}
        </Text>
      </Box>
    );
  };

  return (
    <Box bg="gray.900" minH="100vh" p={4}>
      {/* Account Warning */}
      {!hasSelectedAccount && (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          No account selected. Please select a LinkedIn account to search.
        </Alert>
      )}

      {/* Main Content */}
      <Tabs isFitted variant="enclosed" colorScheme="blue">
        <TabList mb="1em">
          <Tab
            _selected={{ color: "blue.300", borderColor: "blue.300" }}
            color="gray.300"
            onClick={() => {
              if (selectedAccount?.id) {
                setisLead(true)
              }
            }}
          >
            Lead Search
          </Tab>
          <Tab
            _selected={{ color: "blue.300", borderColor: "blue.300" }}
            color="gray.300"
            onClick={() => {
              if (selectedAccount?.id) {
                setisLead(true)
              }
            }}
          >
            URL Search
          </Tab>
          <Tab
            _selected={{ color: "blue.300", borderColor: "blue.300" }}
            color="gray.300"
            onClick={() => {
              if (selectedAccount?.id) {
                setisLead(false)
              }
            }}
          >
            Account Filters
          </Tab>
        </TabList>

        <TabPanels>
          {/* Filter Search Tab */}
          <TabPanel>
            <Flex>
              {/* Filters Sidebar */}
              <Box
                width="300px"
                bg="gray.800"
                p={4}
                borderRadius="md"
                boxShadow="md"
                mr={4}
              >
                <VStack align="stretch" spacing={4}>
                  {renderSearchPlatformSelector()}

                  {searchPlatform === "classic" ? (
                    <LinkedInClassicFilters
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      onFilterInputChange={fetchFilterOptions}
                      filterOptions={filterOptions}
                    />
                  ) : (
                    <SalesNavigatorFilters
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      onFilterInputChange={fetchFilterOptions}
                      filterOptions={filterOptions}
                    />
                  )}
                </VStack>
              </Box>

              {/* Results Section */}
              <VStack flex={1} align="stretch" spacing={4}>
                {renderSearchControls()}
                {renderSearchMetrics()}

                <SearchResults
                  searchResults={searchState.results}
                  selectedProfiles={selectedProfiles}
                  setSelectedProfiles={setSelectedProfiles}
                  totalResults={searchState.totalResults}
                  currentPage={searchState.currentPage}
                  isSearching={searchState.isSearching}
                  handlePageChange={handlePageChange}
                  hasNextPage={Boolean(searchState.cursor)}
                  onSelectByCount={async (count) => {
                    try {
                      console.log("Selecting profiles by count:", {
                        requestedCount: count,
                        currentlyVisible: searchState.results.length,
                        needsMultiplePages: count > searchState.results.length,
                      });

                      // Get all visible profile IDs
                      const visibleProfileIds = searchState.results.map(
                        (result) => result.id
                      );

                      // Create array of temporary IDs for profiles not yet loaded
                      const tempProfileIds = [];
                      for (let i = visibleProfileIds.length; i < count; i++) {
                        tempProfileIds.push(`temp-profile-${i}`);
                      }

                      // Combine visible and temporary IDs
                      const allSelectedIds = [
                        ...visibleProfileIds,
                        ...tempProfileIds,
                      ];

                      // Update selected profiles state
                      setSelectedProfiles(allSelectedIds.slice(0, count));

                      toast({
                        title: "Success",
                        description: `Selected ${count} profiles`,
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                      });
                    } catch (error) {
                      console.error("Error selecting profiles:", error);
                      toast({
                        title: "Error",
                        description: "Failed to select profiles",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                  isLoadingSelection={false}
                  lists={lists}
                  refreshLists={async () => {
                    // Refresh lists logic
                  }}
                  selectedAccount={selectedAccount!}
                />
              </VStack>
            </Flex>
          </TabPanel>

          {/* URL Search Tab */}
          <TabPanel>
            <Flex direction="column" gap={6}>
              {renderSearchControls()}

              <URLSearch
                onSearch={handleUrlSearch}
                isSearching={searchState.isSearching}
                isDisabled={!hasSelectedAccount}
              />

              {searchState.results.length > 0 && (
                <>
                  {renderSearchMetrics()}
                  <SearchResults
                    searchResults={searchState.results}
                    selectedProfiles={selectedProfiles}
                    setSelectedProfiles={setSelectedProfiles}
                    totalResults={searchState.totalResults}
                    currentPage={searchState.currentPage}
                    isSearching={searchState.isSearching}
                    handlePageChange={handlePageChange}
                    hasNextPage={Boolean(searchState.cursor)}
                    onSelectByCount={async (count) => {
                      // Implement select by count logic
                    }}
                    isLoadingSelection={false}
                    lists={lists}
                    refreshLists={async () => {
                      // Refresh lists logic
                    }}
                    selectedAccount={selectedAccount!}
                  />
                </>
              )}
            </Flex>
          </TabPanel>
          <TabPanel>
            <Flex>
              {/* Filters Sidebar */}
              <Box
                width="300px"
                bg="gray.800"
                p={4}
                borderRadius="md"
                boxShadow="md"
                mr={4}
              >
                <VStack align="stretch" spacing={4}>
                  {renderSearchPlatformSelector()}

                  {searchPlatform === "classic" ? (
                    <LinkedInClassicAccountFilters
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      onFilterInputChange={fetchFilterOptions}
                      filterOptions={filterOptions}
                    />
                  ) : (
                    <SalesNavigatorAccountFilters
                      filters={filters}
                      handleFilterChange={handleFilterChange}
                      onFilterInputChange={fetchFilterOptions}
                      filterOptions={filterOptions}
                    />
                  )}
                </VStack>
              </Box>

              {/* Results Section */}
              <VStack flex={1} align="stretch" spacing={4}>
                {renderSearchControls()}
                {renderSearchMetrics()}

                <SearchResultsAccount
                  searchResults={searchState.results}
                  selectedProfiles={selectedProfilesAccount}
                  setSelectedProfiles={setSelectedProfilesAccount}
                  totalResults={searchState.totalResults}
                  currentPage={searchState.currentPage}
                  isSearching={searchState.isSearching}
                  handlePageChange={handlePageChangeAccount}
                  hasNextPage={Boolean(searchState.cursor)}
                  onSelectByCount={async (count) => {
                    try {
                      console.log("Selecting profiles by count:", {
                        requestedCount: count,
                        currentlyVisible: searchState.results.length,
                        needsMultiplePages: count > searchState.results.length,
                      });

                      // Get all visible profile IDs
                      const visibleProfileIds = searchState.results.map(
                        (result) => result.id
                      );

                      // Create array of temporary IDs for profiles not yet loaded
                      const tempProfileIds = [];
                      for (let i = visibleProfileIds.length; i < count; i++) {
                        tempProfileIds.push(`temp-profile-${i}`);
                      }

                      // Combine visible and temporary IDs
                      const allSelectedIds = [
                        ...visibleProfileIds,
                        ...tempProfileIds,
                      ];

                      // Update selected profiles state
                      setSelectedProfilesAccount(
                        allSelectedIds.slice(0, count)
                      );

                      toast({
                        title: "Success",
                        description: `Selected ${count} profiles`,
                        status: "success",
                        duration: 2000,
                        isClosable: true,
                      });
                    } catch (error) {
                      console.error("Error selecting profiles:", error);
                      toast({
                        title: "Error",
                        description: "Failed to select profiles",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                  isLoadingSelection={false}
                  lists={lists}
                  refreshLists={async () => {
                    // Refresh lists logic
                  }}
                  selectedAccount={selectedAccount!}
                />
              </VStack>
            </Flex>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modals */}
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={closeCreateListModal}
        onCreateList={handleCreateList}
      />

      <AlertDialogComponent
        isOpen={isAlertOpen}
        onClose={handleAlertClose}
        title={alertMessage}
        message="Your account does not have access to Sales Navigator. We'll switch back to LinkedIn Classic filters."
      />

      <SaveFiltersModal
        isOpen={isSaveFiltersModalOpen}
        onClose={closeSaveFiltersModal}
        filters={filters}
      />
    </Box>
  );
};

export default SearchPage;
