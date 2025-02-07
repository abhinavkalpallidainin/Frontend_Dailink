import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface Filter {
  id: string;
  name: string;
}

interface FilterGroup {
  id: string;
  name: string;
  filters: Filter[];
}

interface EnhancedMenuFilterProps {
  savedFilterGroups: FilterGroup[];
  hasSelectedAccount: boolean;
  handleApplySavedFilter: (filter: Filter) => void;
}

const EnhancedMenuFilter: React.FC<EnhancedMenuFilterProps> = ({
  savedFilterGroups,
  hasSelectedAccount,
  handleApplySavedFilter,
}) => {
  const [selectedFilters, setSelectedFilters] = useState<Filter[]>([]);

  const handleSelectFilter = (filter: Filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
    handleApplySavedFilter(filter);
  };

  const handleRemoveFilter = (filter: Filter) => {
    setSelectedFilters(selectedFilters.filter(f => f !== filter));
    handleApplySavedFilter(filter);
  };

  return (
    <>
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
              {group.filters.map((filter) => (
                <MenuItem
                  key={filter.id}
                  onClick={() => handleSelectFilter(filter)}
                  _hover={{ bg: "blue.300" }}
                >
                  {filter.name}
                </MenuItem>
              ))}
              <MenuDivider />
            </React.Fragment>
          ))}
        </MenuList>
      </Menu>
      {selectedFilters.length > 0 && (
        <HStack spacing={2} mt={3}>
          {selectedFilters.map((filter) => (
            <Tag
              key={filter.id}
              size="md"
              borderRadius="md"
              variant="solid"
              bg="green.700"
              color="white"
            >
              <TagLabel>{filter.name}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveFilter(filter)} />
            </Tag>
          ))}
        </HStack>
      )}
    </>
  );
};

export default EnhancedMenuFilter;
