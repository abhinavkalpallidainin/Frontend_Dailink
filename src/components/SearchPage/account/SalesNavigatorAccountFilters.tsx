import React from "react";
import {
  VStack,
  Box,
  Text,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  HStack,
  InputGroup,
  InputLeftElement,
  Input,
} from "@chakra-ui/react";
import EnhancedDropdownFilter from "../../Dropdown/EnhancedDropdownFilter";
import { Filters, SearchParametersData } from "../../../types/search";
import { SearchIcon } from "@chakra-ui/icons";
import EnhancedDropdownFilterOneString from "../../Dropdown/EnhancedDropdownFilterOneString";
import EnhancedDropdownFilterwithMinAndMax from "../../Dropdown/EnhancedDropdownFilterwithMinAndMax";
import EnhancedDropdownFilterwithMinAndMaxEnum from "../../Dropdown/EnhancedDropdownFilterWithMinAndMaxEnum";
import { getLinkedInSearchParameters } from "../../../utils/searchApi";
import { useAccount } from "../../../contexts/AccountContext";
import { filterNameToParamType } from "../../../pages/Search/SearchPage";
import { useState, useEffect } from "react";

interface SalesNavigatorAccountFiltersProps {
  filters: Filters;
  handleFilterChange: (filterName: keyof Filters | "reset", value: any) => void;
  onFilterInputChange: (filterName: string, value: string) => void;
  filterOptions: Record<string, { label: string; value: string }[]>;
}

const toggleDescriptions = {
  savedLeads: "Include profiles you have already saved",
  viewedProfile: "Show profiles you have viewed",
  messagedRecently: "Show profiles you have messaged",
  followingCompany: "Show people who follow your company",
  viewedYourProfile: "Show people who viewed your profile recently",
} as const;

const SalesNavigatorAccountFilters: React.FC<
  SalesNavigatorAccountFiltersProps
> = ({ filters, handleFilterChange, onFilterInputChange, filterOptions }) => {
  const { selectedAccount } = useAccount();
  const [departments, setDepartments] = useState<SearchParametersData>({
    items: [],
  });
  const [accountLists, setAccountLists] = useState<SearchParametersData>({
    items: [],
  });
  const [technologies, setTechnologies] = useState<SearchParametersData>({
    items: [],
  });
  const [industries, setIndustries] = useState<SearchParametersData>({
    items: [],
  });
  const [locations, setLocations] = useState<SearchParametersData>({
    items: [],
  });
  const [savedAccounts, setSavedAccounts] = useState<SearchParametersData>({
    items: [],
  });
  const [savedSearches, setSavedSearches] = useState<SearchParametersData>({
    items: [],
  });
  const [recentSearches, setRecentSearches] = useState<SearchParametersData>({
    items: [],
  });

  useEffect(() => {
    // Fetch departments when the component mounts or selectedAccount changes
    async function fetchParams() {
      if (selectedAccount) {
        try {
          const departmentParams: SearchParametersData =
            await getLinkedInSearchParameters(selectedAccount.id, "DEPARTMENT");
          setDepartments(departmentParams); // Update the state with the fetched data
          const accountListParams: SearchParametersData =
            await getLinkedInSearchParameters(
              selectedAccount.id,
              "ACCOUNT_LISTS"
            );
          setAccountLists(accountListParams);
          const technologiesParams: SearchParametersData =
            await getLinkedInSearchParameters(
              selectedAccount.id,
              "TECHNOLOGIES"
            );
          setTechnologies(technologiesParams);
          const industriesParams: SearchParametersData =
            await getLinkedInSearchParameters(selectedAccount.id, "INDUSTRY");
          setIndustries(industriesParams);
          const locationsParams: SearchParametersData =
            await getLinkedInSearchParameters(selectedAccount.id, "LOCATION");
          setLocations(locationsParams);
          const savedAccountParams: SearchParametersData =
            await getLinkedInSearchParameters(
              selectedAccount.id,
              "SAVED_ACCOUNTS"
            );
          setSavedAccounts(savedAccountParams);
          const savedSearchesParams: SearchParametersData =
            await getLinkedInSearchParameters(
              selectedAccount.id,
              "SAVED_SEARCHES"
            );
          setSavedSearches(savedSearchesParams);
          const recentSearchesParams: SearchParametersData =
            await getLinkedInSearchParameters(
              selectedAccount.id,
              "RECENT_SEARCHES"
            );
          setRecentSearches(recentSearchesParams);
        } catch (error) {
          console.error("Error fetching departments:", error);
        }
      }
    }

    fetchParams();
  }, [selectedAccount]);
  const departmentsOptions = departments.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const accountListsOptions = accountLists.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const technologiesOptions = technologies.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const filterOptionsforDepartments = {
    department: departmentsOptions, // Assign the departmentsOptions directly
  };
  const industriesOptions = industries.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const locationOptions = locations.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const savedAccountsOptions = savedAccounts.items.map((item) => ({
    label: item.title,
    value: item.id,
  }));
  const savedSearchesOptions = savedSearches.items
    .filter(
      (item) =>
        item.additional_data && item.additional_data.category === "company"
    )
    .map((item) => ({
      label: item.title,
      value: item.id,
    }));

  const recentSearchOptions = recentSearches.items
    .filter(
      (item) =>
        item.additional_data && item.additional_data.category === "company"
    )
    .map((item) => ({
      label: item.title,
      value: item.id,
    }));

  const networkDistanceOptions = [
    { label: "1st connections", value: "1" },
    { label: "2nd connections", value: "2" },
    { label: "3rd+ connections", value: "3" },
    { label: "Group members", value: "GROUP" },
  ];

  const companyHeadcountOptions = [
    { label: "1-10", value: { min: 1, max: 10 } },
    { label: "11-50", value: { min: 11, max: 50 } },
    { label: "51-200", value: { min: 51, max: 200 } },
    { label: "201-500", value: { min: 201, max: 500 } },
    { label: "501-1000", value: { min: 501, max: 1000 } },
    { label: "1001-5000", value: { min: 1001, max: 5000 } },
    { label: "5001-10000", value: { min: 5001, max: 10000 } },
    { label: "10001+", value: { min: 10001 } },
  ];
  const numberOfFollowers = [
    { label: "1-50", value: { min: 1, max: 50 } },
    { label: "51-100", value: { min: 51, max: 100 } },
    { label: "101-1000", value: { min: 101, max: 1000 } },
    { label: "1001-5000", value: { min: 1001, max: 5000 } },
    { label: "5001+", value: { min: 5001 } },
  ];

  const companyTypeOptions = [
    { label: "Public Company", value: "public_company" },
    { label: "Private Company", value: "private_company" },
    { label: "Self-Employed", value: "self_employed" },
    { label: "Government Agency", value: "government_agency" },
    { label: "Non-Profit", value: "non_profit" },
    { label: "Partnership", value: "partnership" },
    { label: "Educational", value: "educational" },
  ];
  const fortuneOptions = [
    { label: "Fortune 50", value: { min: 0, max: 50 } },
    { label: "Fortune 51-100", value: { min: 51, max: 100 } },
    { label: "Fortune 101-250", value: { min: 101, max: 250 } },
    { label: "Fortune 251-500", value: { min: 251, max: 500 } },
  ];
  const currencyOptions = {
    currency: [
      { label: "USD", value: "USD" },
      { label: "EUR", value: "EUR" },
      { label: "INR", value: "INR" },
    ],
  };

  const renderToggleSwitch = (
    label: string,
    fieldName: keyof Filters,
    description?: string
  ) => (
    <FormControl display="flex" flexDirection="column" mb={4}>
      <HStack justify="space-between" width="100%">
        <Box>
          <FormLabel htmlFor={fieldName} mb="0" color="white" cursor="pointer">
            {label}
          </FormLabel>
          {description && (
            <Text fontSize="xs" color="gray.400">
              {description}
            </Text>
          )}
        </Box>
        <Switch
          id={fieldName}
          isChecked={filters[fieldName] as boolean}
          onChange={(e) => handleFilterChange(fieldName, e.target.checked)}
          colorScheme="blue"
        />
      </HStack>
    </FormControl>
  );

  return (
    <VStack
      align="stretch"
      spacing={4}
      bg="gray.800"
      p={4}
      borderRadius="md"
      boxShadow="md"
      maxH="calc(100vh - 200px)"
      overflowY="auto"
      css={{
        "&::-webkit-scrollbar": {
          width: "4px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: "#4A5568",
          borderRadius: "2px",
        },
      }}
    >
      <Text color="gray.100" fontSize="lg" fontWeight="bold" mb={2}>
        Sales Navigator Filters
      </Text>

      {/* Basic Search */}
      <Box>
        <VStack spacing={4} align="stretch">
          {/* Keywords Search Input */}
          <Box>
            <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={2}>
              Keywords
            </Text>
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Enter keywords..."
                value={filters.keywords || ""}
                onChange={(e) => {
                  handleFilterChange("keywords", e.target.value);
                  //onFilterInputChange('keywords', e.target.value);
                }}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "blue.400" }}
              />
            </InputGroup>
          </Box>

          <Divider borderColor="gray.600" my={4} />
        </VStack>
      </Box>

      <EnhancedDropdownFilterOneString
        title="Saved Search"
        placeholder="Find Saved Searches"
        selectedValue={filters.saved_search}
        onChange={(values) => handleFilterChange("saved_search", values)}
        onInputChange={(value) => onFilterInputChange("saved_search", value)}
        options={savedSearchesOptions || []}
        allowMultiple={false}
      />
      <EnhancedDropdownFilterOneString
        title="Recent Search"
        placeholder="Find Recent Searches"
        selectedValue={filters.recent_search}
        onChange={(values) => handleFilterChange("recent_search", values)}
        onInputChange={(value) => onFilterInputChange("recent_search", value)}
        options={recentSearchOptions || []}
        allowMultiple={false}
      />
      <EnhancedDropdownFilter
        title="Industry"
        placeholder="Add industries..."
        selectedValues={Array.isArray(filters.industry) ? filters.industry : []}
        onChange={(values) => handleFilterChange("industry", values)}
        onInputChange={(value) => onFilterInputChange("industry", value)}
        options={industriesOptions || []}
        allowMultiple={true}
      />

      <EnhancedDropdownFilter
        title="Location"
        placeholder="Add locations..."
        selectedValues={
          Array.isArray(filters.location)
            ? filters.location
            : filters.location
            ? [filters.location]
            : []
        }
        onChange={(values) => handleFilterChange("location", values)}
        onInputChange={(value) => onFilterInputChange("location", value)}
        options={locationOptions || []}
        allowMultiple={true}
      />

      <EnhancedDropdownFilter
        title="Has Job Offers"
        placeholder="Select Yes or No"
        selectedValues={
          typeof filters.has_job_offers === "boolean"
            ? [String(filters.has_job_offers)]
            : []
        }
        onChange={(values) => {
          const value = values[0] === "true";
          handleFilterChange("has_job_offers", value);
        }}
        onInputChange={(value) => onFilterInputChange("has_job_offers", value)}
        options={[
          { label: "Yes", value: "true" },
          { label: "No", value: "false" },
        ]}
        allowMultiple={false}
      />

      {/* Company Filters */}
      <Box>
        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Headcount"
            placeholder="Select Ranges..."
            selectedValues={
              Array.isArray(filters.headcount)
                ? filters.headcount.map((range) => `${range.min}-${range.max}`)
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "headcount",
                values.map((value) => {
                  const [min, max] = value.split("-").map(Number);
                  return { min, max };
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("headcount", value)
            }
            options={companyHeadcountOptions.map((option) => ({
              label: option.label,
              value: `${option.value.min}-${option.value.max}`,
            }))}
            allowMultiple={true}
          />
          <EnhancedDropdownFilterwithMinAndMax
            title="Headcount Growth"
            placeholder="Select Ranges..."
            selectedValue={filters.headcount_growth}
            onChange={(values) =>
              handleFilterChange("headcount_growth", values)
            }
          />
          <EnhancedDropdownFilterwithMinAndMax
            title="Department Headcount"
            placeholder="Select Ranges..."
            selectedValue={filters.department_headcount}
            onChange={(values) =>
              handleFilterChange("department_headcount", values)
            }
            dropdownOptions={["department"]}
            filterOptions={filterOptionsforDepartments}
          />
          <EnhancedDropdownFilterwithMinAndMax
            title="Department Headcount Growth"
            placeholder="Select Ranges..."
            selectedValue={filters.department_headcount_growth}
            onChange={(values) =>
              handleFilterChange("department_headcount_growth", values)
            }
            dropdownOptions={["department"]}
            filterOptions={filterOptionsforDepartments}
          />
          <EnhancedDropdownFilter
            title="Network Distance"
            placeholder="Select connection degree..."
            selectedValues={filters.network_distance || []}
            onChange={(values) =>
              handleFilterChange("network_distance", values)
            }
            onInputChange={() => {}}
            options={networkDistanceOptions}
            allowMultiple={true}
          />
          <EnhancedDropdownFilterwithMinAndMaxEnum
            title="Annual revenue"
            placeholder="Select Currency..."
            selectedValue={filters.annual_revenue}
            onChange={(values) => handleFilterChange("annual_revenue", values)}
            dropdownOptions={["currency"]}
            filterOptions={currencyOptions}
            
          />

          <EnhancedDropdownFilter
            title="Number of Followers"
            placeholder="Select Ranges..."
            selectedValues={
              Array.isArray(filters.followers_count)
                ? filters.followers_count.map(
                    (range) =>
                      `${range.min}-${range.max === 0 ? "+" : range.max}`
                  )
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "followers_count",
                values.map((value) => {
                  const [min, max] = value.split("-").map(Number);
                  return { min, max: isNaN(max) ? 0 : max }; // Treat "5001+" as { min: 5001, max: 0 }
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("followers_count", value)
            }
            options={numberOfFollowers.map((option) => ({
              label: option.label,
              value: `${option.value.min}-${
                option.value.max === 0 ? "+" : option.value.max
              }`,
            }))} // Format ranges as "min-max" or "min+" for "5001+"
            allowMultiple={true}
          />

          {/* Job Title & Function */}

          {/* Education & Experience 
            Personal
      */}

          <EnhancedDropdownFilter
            title="Fortune"
            placeholder="Select Fortune Ranges..."
            selectedValues={
              Array.isArray(filters.fortune)
                ? filters.fortune.map((range) =>
                    range.max === range.min
                      ? `Fortune ${range.min}`
                      : `Fortune ${range.min}-${range.max}`
                  )
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "fortune",
                values.map((value) => {
                  const isSingle = !value.includes("-"); // Detect if it's a single value (e.g., "Fortune 50")
                  const [min, max] = isSingle
                    ? [
                        parseInt(value.replace("Fortune ", "")),
                        parseInt(value.replace("Fortune ", "")),
                      ]
                    : value.replace("Fortune ", "").split("-").map(Number);
                  return { min, max };
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("fortune", value)
            }
            options={fortuneOptions.map((option) => ({
              label: option.label,
              value: option.label.replace("Fortune ", ""), // Remove "Fortune " for internal values
            }))} // Keep the "Fortune" prefix for display purposes
            allowMultiple={true}
          />
          <EnhancedDropdownFilter
            title="Technologies"
            placeholder="Add technologies..."
            selectedValues={filters.technologies || []}
            onChange={(values) => handleFilterChange("technologies", values)}
            onInputChange={(value) =>
              onFilterInputChange("technologies", value)
            }
            options={technologiesOptions || []}
            allowMultiple={true}
          />
          <EnhancedDropdownFilter
            title="Recent activities"
            placeholder="Enter activities..."
            selectedValues={filters.recent_activities || []}
            onChange={(values) =>
              handleFilterChange("recent_activities", values)
            }
            onInputChange={(value) =>
              onFilterInputChange("recent_activities", value)
            }
            options={filterOptions.recent_activities || []}
            allowMultiple={true}
          />
          <EnhancedDropdownFilter
            title="Saved accounts"
            placeholder="Enter saved accounts..."
            selectedValues={filters.saved_accounts || []}
            onChange={(values) => handleFilterChange("saved_accounts", values)}
            onInputChange={(value) =>
              onFilterInputChange("saved_accounts", value)
            }
            options={savedAccountsOptions || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Account Lists"
            placeholder="Select account lists..."
            selectedValues={filters.account_lists?.include || []}
            onChange={(values) =>
              handleFilterChange("account_lists", {
                include: values, // Selected include values
              })
            }
            onInputChange={(value) =>
              onFilterInputChange("account_lists", value)
            }
            options={accountListsOptions}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      {/* Connection Filters */}

      {/* Sales Navigator Specific */}

      {/* Open To Section */}
      {/* <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Open To
        </Text>
        
        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Open To Opportunities"
            placeholder="Select opportunities..."
            selectedValues={Array.isArray(filters.open_to) ? filters.open_to : []}
            onChange={(values) => handleFilterChange('open_to', values)}
            onInputChange={() => {}}
            options={opportunityOptions}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} /> */}

      {/* Service Providers */}
      {/* <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Service Providers
        </Text>
        
        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Service Categories"
            placeholder="Select services..."
            selectedValues={Array.isArray(filters.service) ? filters.service : []}
            onChange={(values) => handleFilterChange('service', values)}
            onInputChange={(value) => onFilterInputChange('service', value)}
            options={filterOptions.service || []}
            allowMultiple={true}
          />
        </VStack>
      </Box> */}

      {/* Reset Filters Button */}
      <Box pt={4}>
        <Text
          color="blue.400"
          fontSize="sm"
          cursor="pointer"
          textAlign="center"
          onClick={() => handleFilterChange("reset", null)}
          _hover={{ textDecoration: "underline" }}
        >
          Reset All Filters
        </Text>
      </Box>
    </VStack>
  );
};

export default SalesNavigatorAccountFilters;
