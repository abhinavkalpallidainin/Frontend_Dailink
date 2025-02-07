// components/SearchPage/LinkedInClassicFilters.tsx

import React from "react";
import {
  VStack,
  Box,
  Text,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import EnhancedDropdownFilter from "../../Dropdown/EnhancedDropdownFilter";
import { useState, useEffect } from "react";
import { useAccount } from "../../../contexts/AccountContext";



import { Filters,SearchParametersData } from "../../../types/search";
import { getLinkedInSearchParameters } from "../../../utils/searchApi";




interface LinkedInClassicAccountFiltersProps {
  filters: Filters;
  handleFilterChange: (filterName: keyof Filters, value: any) => void;
  onFilterInputChange: (filterName: string, value: string) => void;
  filterOptions: Record<string, { label: string; value: string }[]>;
}


const LinkedInClassicAccountFilters: React.FC<
  LinkedInClassicAccountFiltersProps
> = ({ filters, handleFilterChange, onFilterInputChange, filterOptions }) => {
    const { selectedAccount } = useAccount();
      const [industries, setIndustries] = useState<SearchParametersData>({ items: [] });
      const [locations, setLocations] = useState<SearchParametersData>({ items: [] });
    useEffect(() => {
        // Fetch departments when the component mounts or selectedAccount changes
        async function fetchParams() {
          if (selectedAccount) {
            try {
              const industriesParams: SearchParametersData =
                await getLinkedInSearchParameters(selectedAccount.id, "INDUSTRY");
              setIndustries(industriesParams); 
              const locationsParams:SearchParametersData=await getLinkedInSearchParameters(selectedAccount.id,"LOCATION")
              setLocations(locationsParams)
            } catch (error) {
              console.error("Error fetching departments:", error);
            }
          }
        }
    
        fetchParams();
      }, [selectedAccount]);
      const industriesOptions = industries.items.map((item) => ({
        label: item.title,
        value: item.id,
      }));
      const locationOptions = locations.items.map((item) => ({
        label: item.title,
        value: item.id,
      }));
  
  // Static filter options
  const networkDistanceOptions = [
    { label: "1st connections", value: "1" },
    { label: "2nd connections", value: "2" },
    { label: "3rd connections", value: "3" },
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
        LinkedIn Classic Filters
      </Text>

      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Basic Filters
        </Text>

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
            title="Industry"
            placeholder="Add industries..."
            selectedValues={filters.industry || []}
            onChange={(values) => handleFilterChange("industry", values)}
            onInputChange={(value) => onFilterInputChange("industry", value)}
            options={industriesOptions || []}
            allowMultiple={true}
          />
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
          <EnhancedDropdownFilter
            title="Has Job Offers"
            placeholder="Select Yes or No"
            selectedValues={
              typeof filters.has_job_offers === "boolean"
                ? [filters.has_job_offers.toString()]
                : []
            }
            onChange={(values) => {
              const value = values[0] === "true";
              handleFilterChange("has_job_offers", value);
            }}
            onInputChange={(value) =>
              onFilterInputChange("has_job_offers", value)
            }
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            allowMultiple={false}
          />
        </VStack>
      </Box>

      <Box>
        <VStack spacing={4} align="stretch">
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
        </VStack>
      </Box>
    </VStack>
  );
};

export default LinkedInClassicAccountFilters;
