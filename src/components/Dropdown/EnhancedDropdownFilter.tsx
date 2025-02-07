import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Input,
  List,
  ListItem,
  Text,
  HStack,
  VStack,
  InputGroup,
  InputRightElement,
  IconButton,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  Portal,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { debounce } from 'lodash';

interface DropdownOption {
  label: string;
  value: string;
  count?: number;
}

interface EnhancedDropdownFilterProps {
  title: string;
  placeholder?: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onInputChange: (value: string) => void;
  options: DropdownOption[];
  allowMultiple?: boolean;
  showSearch?: boolean;
}

const EnhancedDropdownFilter: React.FC<EnhancedDropdownFilterProps> = ({
  title,
  placeholder = 'Select...',
  selectedValues,
  onChange,
  onInputChange,
  options,
  allowMultiple = true,
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [dropdownWidth, setDropdownWidth] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logDebug = (action: string, data?: any) => {
    console.log(`[EnhancedDropdownFilter/${title}] ${action}:`, data);
  };

  useEffect(() => {
    const updateWidth = () => {
      if (dropdownRef.current) {
        setDropdownWidth(dropdownRef.current.getBoundingClientRect().width);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedOnInputChange = useCallback(
    debounce((value: string) => {
      logDebug('Debounced input change', value);
      onInputChange(value);
    }, 300),
    [onInputChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    logDebug('Input change', value);
    setInputValue(value);
    debouncedOnInputChange(value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (option: DropdownOption, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    logDebug('Option select', { option, currentSelected: selectedValues });

    let newValues: string[];
    if (allowMultiple) {
      newValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
    } else {
      newValues = [option.value];
      setIsOpen(false);
    }

    logDebug('New values', newValues);
    onChange(newValues);
    setInputValue('');
  };

  return (
    <Box ref={dropdownRef} position="relative" width="100%">
      <VStack align="stretch" spacing={2}>
        <Text color="gray.300" fontSize="sm" fontWeight="medium">
          {title}
        </Text>

        {selectedValues.length > 0 && (
          <Flex wrap="wrap" gap={2} mb={2}>
            {selectedValues.map(value => {
              const option = options.find(opt => opt.value === value);
              if (!option) return null;

              return (
                <Tag
                  key={value}
                  size="md"
                  borderRadius="md"
                  variant="solid"
                  bg="green.700"
                  color="white"
                >
                  <TagLabel>{option.label}</TagLabel>
                  <TagCloseButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option, e);
                    }}
                  />
                </Tag>
              );
            })}
          </Flex>
        )}

        <InputGroup>
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            bg="gray.700"
            borderColor="gray.600"
            color="white"
            _hover={{ borderColor: "gray.500" }}
            _focus={{ borderColor: "blue.400" }}
          />
          <InputRightElement>
            <IconButton
              aria-label="Toggle dropdown"
              icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="sm"
              variant="ghost"
              color="gray.400"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            />
          </InputRightElement>
        </InputGroup>

        {isOpen && (
          <Portal>
            <Box
              position="fixed"
              left={dropdownRef.current?.getBoundingClientRect().left}
              top={dropdownRef.current?.getBoundingClientRect().bottom}
              width={`${dropdownWidth}px`}
              zIndex={1400}
            >
              <List
                bg="gray.700"
                borderRadius="md"
                boxShadow="lg"
                maxH="300px"
                overflowY="auto"
                border="1px solid"
                borderColor="gray.600"
                mt={1}
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
                {options.map(option => (
                  <ListItem
                    key={option.value}
                    px={4}
                    py={2}
                    cursor="pointer"
                    bg={selectedValues.includes(option.value) ? "gray.600" : "transparent"}
                    _hover={{ bg: "gray.600" }}
                    onMouseDown={(e) => {
                      e.preventDefault();  // Prevent focus loss
                      handleSelect(option, e);
                    }}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text color="white" fontSize="sm">
                      {option.label}
                    </Text>
                    {option.count !== undefined && (
                      <Text color="gray.400" fontSize="xs">
                        {option.count}
                      </Text>
                    )}
                  </ListItem>
                ))}
                {options.length === 0 && (
                  <ListItem px={4} py={2}>
                    <Text color="gray.400" fontSize="sm">
                      No options available
                    </Text>
                  </ListItem>
                )}
              </List>
            </Box>
          </Portal>
        )}
      </VStack>
    </Box>
  );
};

export default EnhancedDropdownFilter;