import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  Text,
  VStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  Button,
} from '@chakra-ui/react';

interface DropdownOption {
  label: string;
  value: { min: number; max: number };
  count?: number;
}

interface DiscreteOptionDropdownFilterProps {
  title: string;
  placeholder?: string;
  selectedValues: Array<{ min: number; max: number }>;
  onChange: (values: Array<{ min: number; max: number }>) => void;
  options: DropdownOption[];
  allowMultiple?: boolean;
}

const DiscreteOptionDropdownFilter: React.FC<DiscreteOptionDropdownFilterProps> = ({
  title,
  placeholder = 'Select...',
  selectedValues,
  onChange,
  options,
  allowMultiple = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: DropdownOption) => {
    let newValues: Array<{ min: number; max: number }>;
    const isSelected = selectedValues.some(
      (val) => val.min === option.value.min && val.max === option.value.max
    );

    if (allowMultiple) {
      if (isSelected) {
        newValues = selectedValues.filter(
          (val) => !(val.min === option.value.min && val.max === option.value.max)
        );
      } else {
        newValues = [...selectedValues, option.value];
      }
    } else {
      newValues = [option.value];
      setIsOpen(false);
    }

    onChange(newValues);
  };

  const handleRemove = (value: { min: number; max: number }) => {
    const newValues = selectedValues.filter(
      (val) => !(val.min === value.min && val.max === value.max)
    );
    onChange(newValues);
  };

  const formatOptionLabel = (option: DropdownOption) => {
    if (option.value.max === 0) {
      return `${option.value.min}+`;
    }
    return `${option.value.min} - ${option.value.max}`;
  };

  return (
    <Box ref={dropdownRef} position="relative" width="100%">
      <VStack align="stretch" spacing={2}>
        {/* Title and Toggle Button */}
        <Flex justify="space-between" align="center">
          <Text color="gray.300" fontSize="sm" fontWeight="medium">
            {title}
          </Text>
          <Button size="sm" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? 'Close' : 'Open'}
          </Button>
        </Flex>

        {/* Selected Options */}
        {selectedValues.length > 0 && (
          <Flex wrap="wrap" gap={2}>
            {selectedValues.map((value) => (
              <Tag
                key={`${value.min}-${value.max}`}
                size="md"
                borderRadius="md"
                variant="solid"
                bg="green.700"
                color="white"
              >
                <TagLabel>
                  {value.max === 0 ? `${value.min}+` : `${value.min} - ${value.max}`}
                </TagLabel>
                <TagCloseButton onClick={() => handleRemove(value)} />
              </Tag>
            ))}
          </Flex>
        )}

        {/* Dropdown List */}
        {isOpen && (
          <Box
            bg="gray.700"
            borderRadius="md"
            boxShadow="lg"
            border="1px solid"
            borderColor="gray.600"
            maxH="300px"
            overflowY="auto"
            mt={2}
            zIndex={1400}
          >
            <List>
              {options.map((option) => {
                const isSelected = selectedValues.some(
                  (val) => val.min === option.value.min && val.max === option.value.max
                );
                return (
                  <ListItem
                    key={`${option.value.min}-${option.value.max}`}
                    px={4}
                    py={2}
                    cursor="pointer"
                    bg={isSelected ? 'gray.600' : 'transparent'}
                    _hover={{ bg: 'gray.600' }}
                    onClick={() => handleSelect(option)}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text color="white" fontSize="sm">
                      {formatOptionLabel(option)}
                    </Text>
                    {option.count !== undefined && (
                      <Text color="gray.400" fontSize="xs">
                        {option.count}
                      </Text>
                    )}
                  </ListItem>
                );
              })}
              {options.length === 0 && (
                <ListItem px={4} py={2}>
                  <Text color="gray.400" fontSize="sm">
                    No options available
                  </Text>
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default DiscreteOptionDropdownFilter;
