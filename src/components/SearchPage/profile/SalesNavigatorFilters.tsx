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
import { Filters } from "../../../types/search";
import { SearchIcon } from "@chakra-ui/icons";
import EnhancedDropdownFilterOneString from "../../Dropdown/EnhancedDropdownFilterOneString";

interface SalesNavigatorFiltersProps {
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

const SalesNavigatorFilters: React.FC<SalesNavigatorFiltersProps> = ({
  filters,
  handleFilterChange,
  onFilterInputChange,
  filterOptions,
}) => {
  const seniorityOptions = [
    { label: "Owner/Partner", value: "owner/partner", count: 0 },
    { label: "CXO", value: "cxo", count: 0 },
    { label: "VP", value: "vice_president", count: 0 },
    { label: "Director", value: "director", count: 0 },
    { label: "Experienced Manager", value: "experienced_manager", count: 0 },
    { label: "Entry Level Manager", value: "entry_level_manager", count: 0 },
    { label: "Strategic", value: "strategic", count: 0 },
    { label: "Senior", value: "senior", count: 0 },
    { label: "Entry", value: "entry_level", count: 0 },
    { label: "In Training", value: "in_training", count: 0 },
  ];

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
    { label: "10001+", value: { min: 10001, max: 0 } },
  ];

  const tenureOptions = [
    { label: "Less than 1 year", value: { min: 0, max: 1 } },
    { label: "1 to 2 years", value: { min: 1, max: 2 } },
    { label: "3 to 5 years", value: { min: 3, max: 5 } },
    { label: "6 to 10 years", value: { min: 6, max: 10 } },
    { label: "More than 10 years", value: { min: 10, max: 0 } }, // Open-ended range
  ];

  const profileLanguageOptions = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Portuguese", value: "pt" },
    { label: "Chinese", value: "zh" },
    { label: "Japanese", value: "ja" },
    { label: "Italian", value: "it" },
    { label: "Dutch", value: "nl" },
    { label: "Arabic", value: "ar" },
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

  const opportunityOptions = [
    { label: "Job Opportunities", value: "job_opportunities" },
    { label: "Freelance Work", value: "freelance" },
    { label: "Business Partnerships", value: "partnerships" },
    { label: "Networking", value: "networking" },
    { label: "Investment Opportunities", value: "investments" },
  ];

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
        options={filterOptions.saved_search || []}
        allowMultiple={false}
      />

      <EnhancedDropdownFilterOneString
        title="Recent Search"
        placeholder="Find Recent Searches"
        selectedValue={filters.recent_search}
        onChange={(values) => handleFilterChange("recent_search", values)}
        onInputChange={(value) => onFilterInputChange("recent_search", value)}
        options={filterOptions.recent_search || []}
        allowMultiple={false}
      />

      {/* Company Filters */}
      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Company
        </Text>

        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Current Company"
            placeholder="Add companies..."
            selectedValues={
              Array.isArray(filters.company)
                ? filters.company
                : filters.company
                ? [filters.company]
                : []
            }
            onChange={(values) => handleFilterChange("company", values)}
            onInputChange={(value) => onFilterInputChange("company", value)}
            options={filterOptions.company || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Company Headcount"
            placeholder="Select Ranges..."
            selectedValues={
              Array.isArray(filters.company_headcount)
                ? filters.company_headcount.map(
                    (range) => `${range.min}-${range.max}`
                  )
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "company_headcount",
                values.map((value) => {
                  const [min, max] = value.split("-").map(Number);
                  return { min, max };
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("company_headcount", value)
            }
            options={companyHeadcountOptions.map((option) => ({
              label: option.label,
              value: `${option.value.min}-${option.value.max}`,
            }))}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Past Company"
            placeholder="Add past companies..."
            selectedValues={
              Array.isArray(filters.past_company)
                ? filters.past_company
                : filters.past_company
                ? [filters.past_company]
                : []
            }
            onChange={(values) => handleFilterChange("past_company", values)}
            onInputChange={(value) =>
              onFilterInputChange("past_company", value)
            }
            options={filterOptions.past_company || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Company Type"
            placeholder="Select company types..."
            selectedValues={
              Array.isArray(filters.company_type) ? filters.company_type : []
            }
            onChange={(values) => handleFilterChange("company_type", values)}
            onInputChange={() => {}}
            options={companyTypeOptions}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Company Location"
            placeholder="Add company headquarters locations..."
            selectedValues={
              Array.isArray(filters.company_location)
                ? filters.company_location
                : []
            }
            onChange={(values) =>
              handleFilterChange("company_location", values)
            }
            onInputChange={(value) =>
              onFilterInputChange("company_location", value)
            }
            options={filterOptions.company_location || []}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

      {/* Job Title & Function */}
      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Function/Role
        </Text>
        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="job title"
            placeholder="Add job titles..."
            selectedValues={
              Array.isArray(filters.role)
                ? filters.role
                : filters.role
                ? [filters.role]
                : []
            }
            onChange={(values) => handleFilterChange("role", values)}
            onInputChange={(value) => onFilterInputChange("role", value)}
            options={filterOptions.role || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Seniority Level"
            placeholder="Select seniority levels..."
            selectedValues={
              Array.isArray(filters.seniority)
                ? filters.seniority
                : filters.seniority
                ? [filters.seniority]
                : []
            }
            onChange={(values) => handleFilterChange("seniority", values)}
            onInputChange={(value) => onFilterInputChange("seniority", value)}
            options={seniorityOptions}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Past Job Title"
            placeholder="Add past job titles..."
            selectedValues={
              Array.isArray(filters.past_role)
                ? filters.past_role
                : filters.past_role
                ? [filters.past_role]
                : []
            }
            onChange={(values) => handleFilterChange("past_role", values)}
            onInputChange={(value) => onFilterInputChange("past_role", value)}
            options={filterOptions.past_role || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Years at Company"
            placeholder="Select Ranges..."
            selectedValues={
              Array.isArray(filters.tenure_at_company)
                ? filters.tenure_at_company.map((range) =>
                    range.max === 0
                      ? `${range.min}+`
                      : `${range.min}-${range.max}`
                  )
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "tenure_at_company",
                values.map((value) => {
                  const [min, max] = value.includes("+")
                    ? [parseInt(value, 10), 0] // Open-ended range for "More than 10 years"
                    : value.split("-").map(Number);
                  return { min, max };
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("tenure_at_company", value)
            }
            options={tenureOptions.map((option) => ({
              label: option.label,
              value:
                option.value.max === 0
                  ? `${option.value.min}+` // Open-ended range
                  : `${option.value.min}-${option.value.max}`,
            }))}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Years in Current Position"
            placeholder="Select Ranges..."
            selectedValues={
              Array.isArray(filters.tenure_at_role)
                ? filters.tenure_at_role.map((range) =>
                    range.max === 0
                      ? `${range.min}+`
                      : `${range.min}-${range.max}`
                  )
                : []
            }
            onChange={(values: string[]) =>
              handleFilterChange(
                "tenure_at_role",
                values.map((value) => {
                  const [min, max] = value.includes("+")
                    ? [parseInt(value, 10), 0] // Open-ended range for "More than X years"
                    : value.split("-").map(Number);
                  return { min, max };
                })
              )
            }
            onInputChange={(value: string) =>
              onFilterInputChange("tenure_at_role", value)
            }
            options={tenureOptions.map((option) => ({
              label: option.label,
              value:
                option.value.max === 0
                  ? `${option.value.min}+` // Open-ended range for more than X years
                  : `${option.value.min}-${option.value.max}`,
            }))}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

      {/* Education & Experience 
            Personal
      */}
      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Personal
        </Text>

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
          options={filterOptions.location || []}
          allowMultiple={true}
        />

        <EnhancedDropdownFilter
          title="Industry"
          placeholder="Add industries..."
          selectedValues={
            Array.isArray(filters.industry) ? filters.industry : []
          }
          onChange={(values) => handleFilterChange("industry", values)}
          onInputChange={(value) => onFilterInputChange("industry", value)}
          options={filterOptions.industry || []}
          allowMultiple={true}
        />

        {/* Name Search Input */}
        <Box>
          <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={2}>
            First Name
          </Text>
          <InputGroup>
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Enter first name..."
              value={filters.first_name || ""}
              onChange={(e) => {
                handleFilterChange("first_name", e.target.value);
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

        <Box>
          <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={2}>
            Last Name
          </Text>
          <InputGroup>
            <InputLeftElement>
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Enter last name..."
              value={filters.last_name || ""}
              onChange={(e) => {
                handleFilterChange("last_name", e.target.value);
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

        <EnhancedDropdownFilter
          title="Years Of Experience"
          placeholder="Select Ranges..."
          selectedValues={
            Array.isArray(filters.tenure)
              ? filters.tenure.map((range) =>
                  range.max === 0
                    ? `${range.min}+`
                    : `${range.min}-${range.max}`
                )
              : []
          }
          onChange={(values: string[]) =>
            handleFilterChange(
              "tenure",
              values.map((value) => {
                const [min, max] = value.includes("+")
                  ? [parseInt(value, 10), 0] // Open-ended range for "More than X years"
                  : value.split("-").map(Number);
                return { min, max };
              })
            )
          }
          onInputChange={(value: string) =>
            onFilterInputChange("tenure", value)
          }
          options={tenureOptions.map((option) => ({
            label: option.label,
            value:
              option.value.max === 0
                ? `${option.value.min}+` // Open-ended range for more than X years
                : `${option.value.min}-${option.value.max}`,
          }))}
          allowMultiple={true}
        />

        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="School"
            placeholder="Add schools..."
            selectedValues={
              Array.isArray(filters.school)
                ? filters.school
                : filters.school
                ? [filters.school]
                : []
            }
            onChange={(values) => handleFilterChange("school", values)}
            onInputChange={(value) => onFilterInputChange("school", value)}
            options={filterOptions.school || []}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

      {/* Connection Filters */}
      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Connections & Activity
        </Text>

        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Connection Degree"
            placeholder="Select connection degrees..."
            selectedValues={filters.network_distance || []}
            onChange={(values) =>
              handleFilterChange("network_distance", values)
            }
            onInputChange={() => {}}
            options={networkDistanceOptions}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Profile Language"
            placeholder="Select languages..."
            selectedValues={filters.profile_language || []}
            onChange={(values) =>
              handleFilterChange("profile_language", values)
            }
            onInputChange={() => {}}
            options={profileLanguageOptions}
            allowMultiple={true}
          />

          {renderToggleSwitch(
            "Following Your Company",
            "following_your_company",
            toggleDescriptions.followingCompany
          )}

          {renderToggleSwitch(
            "Viewed Your Profile",
            "viewed_your_profile_recently",
            toggleDescriptions.viewedYourProfile
          )}
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

      {/* Sales Navigator Specific */}
      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Sales Navigator Filters
        </Text>

        <VStack spacing={4} align="stretch">
          {renderToggleSwitch(
            "Include Saved Leads",
            "include_saved_leads",
            toggleDescriptions.savedLeads
          )}

          {renderToggleSwitch(
            "Viewed Profile",
            "viewed_profile_recently",
            toggleDescriptions.viewedProfile
          )}

          {renderToggleSwitch(
            "Messaged Recently",
            "messaged_recently",
            toggleDescriptions.messagedRecently
          )}
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

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

export default SalesNavigatorFilters;
