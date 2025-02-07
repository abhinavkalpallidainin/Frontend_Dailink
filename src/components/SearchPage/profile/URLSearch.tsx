import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Radio,
  RadioGroup,
  Stack,
  InputGroup,
  InputLeftAddon,
  InputRightElement,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  IconButton,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { SearchIcon, QuestionOutlineIcon, CloseIcon } from '@chakra-ui/icons';

interface URLSearchProps {
  onSearch: (params: {
    api: 'classic' | 'sales_navigator';
    category: 'people';
    url: string;
  }) => void;
  isSearching: boolean;
  isDisabled?: boolean;
}

const URL_PATTERNS = {
  CLASSIC_PEOPLE: /^https:\/\/[^\/]*linkedin\.com\/search\/results\/people\//i,
  SALES_NAV_PEOPLE: /^https:\/\/[^\/]*linkedin\.com\/sales\/search\/people\//i,
};

const EXAMPLE_URLS = {
  classic: 'https://www.linkedin.com/search/results/people/?keywords=developer',
  sales_navigator: 'https://www.linkedin.com/sales/search/people?keywords=developer',
};

const URLSearch: React.FC<URLSearchProps> = ({ 
  onSearch, 
  isSearching, 
  isDisabled = false 
}) => {
  // State
  const [searchUrl, setSearchUrl] = useState('');
  const [searchType, setSearchType] = useState<'classic' | 'sales_navigator'>('classic');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // URL validation
  const validateLinkedInUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      
      // Check if it's a LinkedIn URL
      if (!urlObj.hostname.includes('linkedin.com')) {
        setError('Please enter a valid LinkedIn URL');
        return false;
      }

      // Check if it's a people search URL
      if (searchType === 'classic' && !URL_PATTERNS.CLASSIC_PEOPLE.test(url)) {
        setError('Please enter a valid LinkedIn people search URL');
        return false;
      }

      if (searchType === 'sales_navigator' && !URL_PATTERNS.SALES_NAV_PEOPLE.test(url)) {
        setError('Please enter a valid Sales Navigator people search URL');
        return false;
      }

      setError(null);
      return true;
    } catch {
      setError('Please enter a valid URL');
      return false;
    }
  };

  // Handlers
  const handleSearch = useCallback(() => {
    if (!searchUrl.trim()) {
      setError('Please enter a LinkedIn search URL');
      return;
    }

    if (!validateLinkedInUrl(searchUrl)) {
      return;
    }

    const searchParams = {
      api: searchType,
      category: 'people' as const,
      url: searchUrl
    };

    onSearch(searchParams);
  }, [searchUrl, searchType, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled) {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchUrl('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handlePasteExample = () => {
    setSearchUrl(EXAMPLE_URLS[searchType]);
    setError(null);
  };

  // URL helper tooltip content
  const getHelperContent = () => (
    <VStack spacing={2} align="start">
      <Text fontWeight="bold">Example URLs:</Text>
      <Text fontSize="sm">
        LinkedIn Classic:<br />
        {EXAMPLE_URLS.classic}
      </Text>
      <Text fontSize="sm">
        Sales Navigator:<br />
        {EXAMPLE_URLS.sales_navigator}
      </Text>
    </VStack>
  );

  return (
    <Box 
      bg="gray.800" 
      p={6} 
      borderRadius="md" 
      width="100%"
      opacity={isDisabled ? 0.6 : 1}
      pointerEvents={isDisabled ? 'none' : 'auto'}
    >
      <VStack spacing={6} align="stretch">
        {/* Search Type Selection */}
        <FormControl>
          <FormLabel color="gray.200">Search Type</FormLabel>
          <RadioGroup 
            value={searchType} 
            onChange={(value: 'classic' | 'sales_navigator') => {
              setSearchType(value);
              setError(null);
            }}
          >
            <Stack direction="row" spacing={6}>
              <Radio value="classic" colorScheme="blue">
                <Text color="gray.200">LinkedIn Classic</Text>
              </Radio>
              <Radio value="sales_navigator" colorScheme="blue">
                <Text color="gray.200">Sales Navigator</Text>
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        {/* URL Input */}
        <FormControl isInvalid={!!error}>
          <FormLabel color="gray.200">
            <HStack spacing={2}>
              <Text>LinkedIn Search URL</Text>
              <Tooltip 
                label={getHelperContent()} 
                placement="top" 
                hasArrow
                bg="gray.700"
              >
                <QuestionOutlineIcon color="gray.400" cursor="pointer" />
              </Tooltip>
            </HStack>
          </FormLabel>
          
          <InputGroup size="md">
            <InputLeftAddon
              children={<SearchIcon />}
              bg="gray.700"
              borderColor="gray.600"
              color="gray.400"
            />
            <Input
              ref={inputRef}
              value={searchUrl}
              onChange={(e) => {
                setSearchUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Paste your ${searchType === 'classic' ? 'LinkedIn' : 'Sales Navigator'} search URL here`}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _hover={{ borderColor: "gray.500" }}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
            />
            {searchUrl && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear input"
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  onClick={handleClear}
                />
              </InputRightElement>
            )}
          </InputGroup>

          {error ? (
            <FormErrorMessage>{error}</FormErrorMessage>
          ) : (
            <FormHelperText color="gray.400">
              <Text
                as="span"
                cursor="pointer"
                textDecoration="underline"
                onClick={handlePasteExample}
              >
                Click to paste example URL
              </Text>
            </FormHelperText>
          )}
        </FormControl>

        {/* Search Button */}
        <Button
          colorScheme="blue"
          onClick={handleSearch}
          isLoading={isSearching}
          leftIcon={<SearchIcon />}
          disabled={isDisabled || isSearching}
        >
          Search by URL
        </Button>
      </VStack>
    </Box>
  );
};

export default URLSearch;