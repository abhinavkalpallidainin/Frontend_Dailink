// src/components/SearchPage/SearchResults.tsx

import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Image,
  VStack,
  HStack,
  IconButton,
  Checkbox,
  Flex,
  Badge,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";
import {
  FaLinkedin,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { SearchResult } from "../../../types/search";
import { List } from "../../../types/type";
import { CombinedLinkedInAccount } from "../../../contexts/AccountContext";
import ProfileSelectionControls from "../../../components/Selection/ProfileSelectionControls";
import SaveAccounts from "./saveAccounts";

interface SearchResultsProps {
  searchResults: SearchResult[];
  selectedProfiles: string[];
  setSelectedProfiles: (profiles: string[]) => void;
  totalResults: number;
  currentPage: number;
  isSearching: boolean;
  handlePageChange: (page: number) => void;
  hasNextPage: boolean;
  onSelectByCount: (count: number) => Promise<void>;
  isLoadingSelection: boolean;
  lists: List[];
  refreshLists: () => Promise<void>;
  selectedAccount: CombinedLinkedInAccount;
}

const SearchResultsAccount: React.FC<SearchResultsProps> = ({
  searchResults,
  selectedProfiles,
  setSelectedProfiles,
  totalResults,
  currentPage,
  isSearching,
  handlePageChange,
  hasNextPage,
  onSelectByCount,
  isLoadingSelection,
  lists,
  refreshLists,
  selectedAccount,
}) => {
  const getNetworkBadgeColor = (networkDistance: string) => {
    switch (networkDistance) {
      case "DISTANCE_1":
        return "green";
      case "DISTANCE_2":
        return "blue";
      case "DISTANCE_3":
        return "yellow";
      default:
        return "gray";
    }
  };

  const formatNetworkDistance = (distance: string | undefined) => {
    if (typeof distance !== "string") {
      return "Unknown"; // Provide a default value or handle the error appropriately
    }
    if (distance === "OUT_OF_NETWORK") return "3rd+";
    return distance.replace("DISTANCE_", "");
  };

  return (
    <Box bg="gray.800" p={4} borderRadius="md" boxShadow="lg" w="full">
      <Flex justify="space-between" align="center" mb={4}>
        {isSearching ? (
          <HStack spacing={2}>
            <Spinner size="sm" />
            <Text color="white" fontSize="lg">
              Searching...
            </Text>
          </HStack>
        ) : (
          <Text color="white" fontSize="lg">
            {totalResults.toLocaleString()} results found
          </Text>
        )}
      </Flex>

      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th colSpan={2} color="gray.200" width="300px">
                <ProfileSelectionControls
                  visibleProfiles={searchResults}
                  selectedProfiles={selectedProfiles}
                  totalResults={totalResults}
                  onSelectionChange={setSelectedProfiles}
                  onSelectByCount={onSelectByCount}
                  isLoading={isLoadingSelection}
                />
              </Th>
              <Th color="gray.200">NAME</Th>
              <Th color="gray.200">ABOUT</Th>
              <Th color="gray.200">LOCATION</Th>
              <Th color="gray.200">INDUSTRY</Th>
              <Th color="gray.200">FOLLOWERS</Th>
              <Th color="gray.200" textAlign="right">
                <SaveAccounts
                  selectedProfiles={searchResults.filter((result) =>
                    selectedProfiles.includes(result.id)
                  )}
                  lists={lists}
                  onListsUpdate={refreshLists}
                  account={selectedAccount}
                  onSuccess={() => setSelectedProfiles([])}
                />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {searchResults.map((result) => (
              <Tr
                key={result.id}
                _hover={{ bg: "gray.700" }}
                bg={
                  selectedProfiles.includes(result.id)
                    ? "gray.700"
                    : "transparent"
                }
              >
                <Td width="40px">
                  <Checkbox
                    isChecked={selectedProfiles.includes(result.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProfiles([...selectedProfiles, result.id]);
                      } else {
                        setSelectedProfiles(
                          selectedProfiles.filter((id) => id !== result.id)
                        );
                      }
                    }}
                    colorScheme="blue"
                  />
                </Td>
                <Td width="50px">
                  <Image
                    src={result.logo}
                    alt={result.name}
                    borderRadius="full"
                    boxSize="40px"
                    fallbackSrc="https://via.placeholder.com/40"
                  />
                </Td>
                <Td>
                  <VStack align="start" spacing={1}>
                    <Text color="white" fontWeight="bold">
                      {result.name}
                    </Text>
                  </VStack>
                </Td>
                <Td>
                  <Text color="gray.200" fontSize="sm" noOfLines={2}>
                    {result.summary}
                  </Text>
                </Td>
                <Td>
                  <Text color="gray.200">{result.location}</Text>
                </Td>
                <Td>
                  <Text color="gray.200">{result.industry}</Text>
                </Td>
                <Td>
                  <Text color="gray.200">{result.followers_count}</Text>
                </Td>
                <Td>
                  <HStack justify="flex-end" spacing={2}>
                    <Tooltip label="View on LinkedIn">
                      <Button
                        as="a"
                        href={result.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        colorScheme="linkedin"
                        leftIcon={<FaLinkedin />}
                        rightIcon={<FaExternalLinkAlt />}
                      >
                        View
                      </Button>
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        {searchResults.length === 0 && !isSearching && (
          <Flex justify="center" align="center" py={8}>
            <Text color="gray.400">No results found</Text>
          </Flex>
        )}
      </Box>

      {/* Pagination Controls */}
      {searchResults.length > 0 && (
        <Flex justify="center" align="center" mt={4} gap={4}>
          <IconButton
            aria-label="Previous page"
            icon={<FaChevronLeft />}
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1 || isSearching}
            size="sm"
            colorScheme="gray"
          />
          <HStack spacing={1}>
            <Text color="gray.300">Page</Text>
            <Text color="white" fontWeight="bold">
              {currentPage}
            </Text>
          </HStack>
          <IconButton
            aria-label="Next page"
            icon={<FaChevronRight />}
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={!hasNextPage || isSearching}
            size="sm"
            colorScheme="gray"
          />
        </Flex>
      )}
    </Box>
  );
};

export default SearchResultsAccount;
