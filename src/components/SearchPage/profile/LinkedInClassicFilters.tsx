// components/SearchPage/LinkedInClassicFilters.tsx

import React from 'react';
import {
  VStack,
  Box,
  Text,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import EnhancedDropdownFilter from '../../Dropdown/EnhancedDropdownFilter';


import { Filters } from '../../../types/search';

interface LinkedInClassicFiltersProps {
  filters: Filters;
  handleFilterChange: (filterName: keyof Filters, value: any) => void;
  onFilterInputChange: (filterName: string, value: string) => void;
  filterOptions: Record<string, { label: string; value: string }[]>;
}

const LinkedInClassicFilters: React.FC<LinkedInClassicFiltersProps> = ({
  filters,
  handleFilterChange,
  onFilterInputChange,
  filterOptions,
}) => {
  // Static filter options
  const networkDistanceOptions = [
    { label: '1st connections', value: '1' },
    { label: '2nd connections', value: '2' },
    { label: '3rd connections', value: '3' },
    { label: 'Group members', value: 'GROUP' }
  ];

  const profileLanguageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Dutch', value: 'nl' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Arabic', value: 'ar' }
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
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#4A5568',
          borderRadius: '2px',
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
                value={filters.keywords || ''}
                onChange={(e) => {
                  handleFilterChange('keywords', e.target.value);
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
            selectedValues={Array.isArray(filters.location) ? filters.location : filters.location ? [filters.location] : []}
            onChange={(values) => handleFilterChange('location', values)}
            onInputChange={(value) => onFilterInputChange('location', value)}
            options={filterOptions.location || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Current Company"
            placeholder="Add companies..."
            selectedValues={Array.isArray(filters.company) ? filters.company : filters.company ? [filters.company] : []}
            onChange={(values) => handleFilterChange('company', values)}
            onInputChange={(value) => onFilterInputChange('company', value)}
            options={filterOptions.company || []}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Industry"
            placeholder="Add industries..."
            selectedValues={filters.industry || []}
            onChange={(values) => handleFilterChange('industry', values)}
            onInputChange={(value) => onFilterInputChange('industry', value)}
            options={filterOptions.industry || []}
            allowMultiple={true}
          />
        </VStack>
      </Box>

      <Divider borderColor="gray.600" my={4} />

      <Box>
        <Text color="gray.300" fontSize="sm" fontWeight="medium" mb={4}>
          Profile Filters
        </Text>

        <VStack spacing={4} align="stretch">
          <EnhancedDropdownFilter
            title="Network Distance"
            placeholder="Select connection degree..."
            selectedValues={filters.network_distance || []}
            onChange={(values) => handleFilterChange('network_distance', values)}
            onInputChange={() => {}}
            options={networkDistanceOptions}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="Profile Language"
            placeholder="Select languages..."
            selectedValues={filters.profile_language || []}
            onChange={(values) => handleFilterChange('profile_language', values)}
            onInputChange={() => {}}
            options={profileLanguageOptions}
            allowMultiple={true}
          />

          <EnhancedDropdownFilter
            title="School"
            placeholder="Add schools..."
            selectedValues={Array.isArray(filters.school) ? filters.school : filters.school ? [filters.school] : []}
            onChange={(values) => handleFilterChange('school', values)}
            onInputChange={(value) => onFilterInputChange('school', value)}
            options={filterOptions.school || []}
            allowMultiple={true}
          />
        </VStack>
      </Box>
    </VStack>
  );
};

export default LinkedInClassicFilters;