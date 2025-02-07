// FilterSection.tsx

import React from 'react';
import { Box } from '@chakra-ui/react';
import { Filters } from '../../../types/search';
import EnhancedDropdownFilter from '../../Dropdown/EnhancedDropdownFilter';

interface FilterSectionProps {
  title: string;
  filterName: keyof Filters;
  filters: Filters;
  handleFilterChange: (filterName: keyof Filters, value: any) => void;
  onFilterInputChange: (filterName: string, value: string) => void;
  options: { label: string; value: string }[];
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  filterName,
  filters,
  handleFilterChange,
  onFilterInputChange,
  options,
}) => {
  const logDebug = (action: string, data?: any) => {
    console.log(`[FilterSection/${filterName}] ${action}:`, data);
  };

  const handleChange = (values: string[]) => {
    logDebug('Handle change', values);
    
    // Don't send empty arrays to the API
    if (values.length === 0) {
      handleFilterChange(filterName, undefined);
      return;
    }

    let finalValue: any;
    
    switch (filterName) {
      case 'network_distance':
        // Convert string values to numbers except 'GROUP'
        finalValue = values.map(v => v === 'GROUP' ? v : parseInt(v));
        break;
        
      case 'company_headcount':
      case 'tenure':
      case 'tenure_at_company':
      case 'tenure_at_role':
      case 'following_your_company':
      case 'viewed_your_profile_recently':
      case 'viewed_profile_recently':
      case 'messaged_recently':
      case 'include_saved_leads':
        finalValue = values.length > 0;
        break;
        
      case 'location':
      case 'company':
      case 'school':
      case 'industry':
      case 'job_function':
      case 'role':
      case 'service':
        // For array-based filters, if empty, set to undefined
        finalValue = values.length > 0 ? values : undefined;
        break;
        
      default:
        // For single-value fields, if empty, set to undefined
        finalValue = values.length === 1 ? values[0] : undefined;
    }
    
    logDebug('Final value', finalValue);
    handleFilterChange(filterName, finalValue);
  };

  const getSelectedValues = (): string[] => {
    const currentValue = filters[filterName];
    
    if (Array.isArray(currentValue)) {
      return currentValue.map(val => String(val));
    }
    
    if (typeof currentValue === 'object' && currentValue !== null) {
      return [];
    }
    
    if (typeof currentValue === 'boolean') {
      return currentValue ? ['true'] : [];
    }
    
    return currentValue ? [String(currentValue)] : [];
  };

  // Skip range filters
  const isRangeFilter = [
    'company_headcount',
    'tenure',
    'tenure_at_company',
    'tenure_at_role',
  ].includes(filterName);

  if (isRangeFilter) {
    return null;
  }

  const selectedValues = getSelectedValues();

  return (
    <Box mb={4}>
      <EnhancedDropdownFilter
        title={title}
        placeholder={`Add ${title.toLowerCase()}`}
        selectedValues={selectedValues}
        onChange={handleChange}
        onInputChange={(value) => onFilterInputChange(filterName, value)}
        options={options.map(opt => ({
          ...opt,
          count: parseInt(opt.label.match(/\d+$/)?.[0] || '0')
        }))}
        allowMultiple={![
          'following_your_company',
          'viewed_your_profile_recently',
          'viewed_profile_recently',
          'messaged_recently',
          'include_saved_leads',
          'keywords',
          'first_name',
          'last_name'
        ].includes(filterName)}
      />
    </Box>
  );
};

export default FilterSection;