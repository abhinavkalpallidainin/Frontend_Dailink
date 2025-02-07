import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack } from '@chakra-ui/react';

interface SearchFormProps {
  onSearch: (accountId: string, keywords: string, location: string) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading }) => {
  const [accountId, setAccountId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(accountId, keywords, location);
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Account ID</FormLabel>
          <Input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter your LinkedIn account ID"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Keywords</FormLabel>
          <Input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Location</FormLabel>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. New York"
          />
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          Search
        </Button>
      </VStack>
    </Box>
  );
};

export default SearchForm;