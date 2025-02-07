// src/components/SearchPage/ProfileSelectionControls.tsx
import React, { useState } from 'react';
import {
  HStack,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Input,
  Text,
  useToast,
  Checkbox,
  VStack,
  Spinner
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { SearchResult } from '../../types/search';

interface ProfileSelectionControlsProps {
  visibleProfiles: SearchResult[];
  selectedProfiles: string[];
  totalResults: number;
  onSelectionChange: (profiles: string[]) => void;
  onSelectByCount: (count: number) => Promise<void>;
  isLoading?: boolean;
}

const ProfileSelectionControls: React.FC<ProfileSelectionControlsProps> = ({
  visibleProfiles,
  selectedProfiles,
  totalResults,
  onSelectionChange,
  onSelectByCount,
  isLoading = false
}) => {
  const [selectionCount, setSelectionCount] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const handleCountInput = (value: string) => {
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setSelectionCount(value);
    }
  };

  const handleCountSelection = async () => {
    const count = parseInt(selectionCount);
    if (isNaN(count) || count <= 0) {
      toast({
        title: "Invalid number",
        description: "Please enter a valid number greater than 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (count > totalResults) {
      toast({
        title: "Too many profiles",
        description: `You can only select up to ${totalResults} profiles`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onSelectByCount(count);
      toast({
        title: "Success",
        description: `Selected ${count} profiles`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setIsOpen(false);
      setSelectionCount('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select profiles. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VStack align="stretch" spacing={2}>
      <HStack spacing={4}>
        <Checkbox
          isChecked={selectedProfiles.length === visibleProfiles.length && visibleProfiles.length > 0}
          isIndeterminate={selectedProfiles.length > 0 && selectedProfiles.length < visibleProfiles.length}
          onChange={(e) => {
            const visibleIds = visibleProfiles.map(p => p.id);
            if (e.target.checked) {
              const newSelected = Array.from(new Set([...selectedProfiles, ...visibleIds]));
              onSelectionChange(newSelected);
            } else {
              const newSelected = selectedProfiles.filter(id => !visibleIds.includes(id));
              onSelectionChange(newSelected);
            }
          }}
          isDisabled={isLoading}
        >
          <Text color="gray.300" fontSize="sm">
            {isLoading ? (
              <HStack spacing={2}>
                <Spinner size="xs" />
                <Text>Loading...</Text>
              </HStack>
            ) : (
              `Select visible (${visibleProfiles.length})`
            )}
          </Text>
        </Checkbox>

        <Button
          size="sm"
          rightIcon={<ChevronDownIcon />}
          variant="outline"
          colorScheme="blue"
          onClick={() => setIsOpen(!isOpen)}
          isDisabled={isLoading || isProcessing || totalResults === 0}
        >
          Select by count
        </Button>

        <Popover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          placement="bottom-start"
        >
          <PopoverContent bg="gray.700" borderColor="gray.600">
            <PopoverArrow bg="gray.700" />
            <PopoverCloseButton color="gray.300" />
            <PopoverHeader borderColor="gray.600" color="white">
              Select profiles by count
            </PopoverHeader>
            <PopoverBody>
              <VStack spacing={4}>
                <HStack>
                  <Input
                    placeholder={`Enter number (max ${totalResults})`}
                    value={selectionCount}
                    onChange={(e) => handleCountInput(e.target.value)}
                    type="text"
                    pattern="\d*"
                    bg="gray.800"
                    borderColor="gray.600"
                    color="white"
                    _hover={{ borderColor: "gray.500" }}
                    _focus={{ borderColor: "blue.400" }}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleCountSelection}
                    isLoading={isProcessing}
                  >
                    Select
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.400">
                  Total available: {totalResults} profiles
                </Text>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </HStack>

      {selectedProfiles.length > 0 && (
        <Text fontSize="sm" color="blue.300">
          {selectedProfiles.length} profiles selected
        </Text>
      )}
    </VStack>
  );
};

export default ProfileSelectionControls;