import React from 'react';
import { SimpleGrid, Box, VStack, Heading, Text, Button, Link, Badge, useColorModeValue } from '@chakra-ui/react';

export interface SearchResult {
  id: string;
  name: string;
  headline?: string;
  location?: string;
  profile_url: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  onConnect: (profileId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onConnect }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {results.map((result) => (
        <Box
          key={result.id}
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
          p={4}
          bg={bgColor}
          borderColor={borderColor}
        >
          <VStack align="start" spacing={2}>
            <Heading as="h3" size="md">{result.name}</Heading>
            {result.headline && <Text fontSize="sm">{result.headline}</Text>}
            {result.location && (
              <Badge colorScheme="green" fontSize="sm">
                {result.location}
              </Badge>
            )}
            <Link href={result.profile_url} isExternal color="blue.500" fontSize="sm">
              View Full Profile
            </Link>
            <Button
              size="sm"
              colorScheme="linkedin"
              onClick={() => onConnect(result.id)}
            >
              Connect
            </Button>
          </VStack>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default SearchResults;