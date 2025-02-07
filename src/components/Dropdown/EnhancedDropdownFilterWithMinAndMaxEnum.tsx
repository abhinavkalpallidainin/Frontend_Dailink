import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Flex,
  IconButton,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import EnhancedDropdownFilter from "./EnhancedDropdownFilter";
import { Filters } from "../../types/search";

interface RangeValue {
  min: number | null;
  max: number | null;
  department?: string[];
  currency?: string;
}

interface EnhancedDropdownFilterwithMinAndMaxProps {
  title: string;
  placeholder: string;
  selectedValue: RangeValue | undefined;
  onChange: (values: RangeValue | null) => void;
  dropdownOptions?: string[];
  filters?: Filters;
  onFilterInputChange?: (filterName: string, value: string) => void;
  filterOptions?: Record<string, { label: string; value: string }[]>;
}

const allowedAnnualRevenueValues = [
  0, 0.2, 1, 2.5, 5, 10, 20, 50, 100, 500, 1000, 1001
];

const EnhancedDropdownFilterwithMinAndMaxEnum: React.FC<
  EnhancedDropdownFilterwithMinAndMaxProps
> = ({
  title,
  placeholder,
  selectedValue,
  onChange,
  dropdownOptions,
  filters = {},
  onFilterInputChange,
  filterOptions,
}) => {
  const [minValue, setMinValue] = useState<number | null>(selectedValue?.min || null);
  const [maxValue, setMaxValue] = useState<number | null>(selectedValue?.max || null);
  const [selectedDepartment, setSelectedDepartment] = useState<string[]>(
    selectedValue && selectedValue.department ? selectedValue.department : []
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(
    selectedValue?.currency
  );
  const [tagValue, setTagValue] = useState<string | null>(null); // State to store the current tag value
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedValue && selectedValue.min !== null && selectedValue.max !== null) {
      const value =
        (selectedDepartment.length > 0 ? `${selectedDepartment.join(", ")}: ` : "") +
        (selectedCurrency ? `${selectedCurrency} ` : "") +
        `${selectedValue.min} - ${selectedValue.max}`;
      setTagValue(value);
    }
  }, [selectedValue, selectedDepartment, selectedCurrency]);


  const handleAdd = () => {
    if (minValue !== null && maxValue !== null && minValue <= maxValue) {
      const newRange: RangeValue = {
        min: minValue,
        max: maxValue,
        department: selectedDepartment.length > 0 ? selectedDepartment : undefined,
        currency: selectedCurrency,
      };
      onChange(newRange); // Pass the new range as an object

      const value =
        (selectedDepartment.length > 0 ? `${selectedDepartment.join(", ")}: ` : "") +
        (selectedCurrency ? `${selectedCurrency} ` : "") +
        `${minValue} - ${maxValue}`;
      setTagValue(value); // Set the tag value

      setMinValue(null); // Reset the input values
      setMaxValue(null); // Reset the input values
      setSelectedDepartment([]); // Reset the department selection
      setSelectedCurrency(undefined); // Reset the currency selection
    } else {
      alert("Ensure min is less than or equal to max!");
    }
  };

  const handleReset = () => {
    setMinValue(null);
    setMaxValue(null);
    setSelectedDepartment([]);
    setSelectedCurrency(undefined);
    setTagValue(null); // Clear the tag value
    onChange(null); // Clear the selected range
  };

  const handleTagClose = () => {
    handleReset();
  };

  return (
    <Box>
      <VStack align="stretch" spacing={2}>
        <Text color="gray.300" fontSize="sm" fontWeight="medium">
          {title}
        </Text>

        {tagValue && (
          <Flex wrap="wrap" gap={2} mb={2}>
            <Tag
              size="md"
              borderRadius="md"
              variant="solid"
              bg="green.700"
              color="white"
            >
              <TagLabel>{tagValue}</TagLabel>
              <TagCloseButton onClick={handleTagClose} />
            </Tag>
          </Flex>
        )}

        <Flex
          justifyContent="space-between"
          alignItems="center"
          onClick={() => setIsOpen(!isOpen)}
          bg="gray.700"
          borderColor="gray.600"
          borderWidth="1px"
          borderRadius="md"
          p={1}
          _hover={{ borderColor: "gray.500" }}
          _focusWithin={{ borderColor: "blue.400" }}
          cursor="pointer"
        >
          <Text color="gray.500" fontSize="md" textAlign={"center"} pl={3}>
            {placeholder}
          </Text>
          <IconButton
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label="Toggle dropdown"
            variant="ghost"
            size="sm"
            color="gray.400"
            _hover={{ backgroundColor: "white" }}
          />
        </Flex>

        {isOpen && (
          <Box
            mt={2}
            p={4}
            bg="gray.700"
            borderRadius="md"
            borderWidth="1px"
            borderColor="gray.600"
          >
            {/* Optional Dropdown Filter */}
            {dropdownOptions &&
              dropdownOptions.length > 0 &&
              filterOptions && (
                <EnhancedDropdownFilter
                  title={dropdownOptions[0]}
                  placeholder={`Select ${dropdownOptions[0]}`}
                  selectedValues={
                    dropdownOptions[0] === "department"
                      ? selectedDepartment
                      : selectedCurrency
                      ? [selectedCurrency]
                      : []
                  }
                  onChange={(values) => {
                    if (dropdownOptions[0] === "department") {
                      setSelectedDepartment(values);
                    } else {
                      setSelectedCurrency(values[0]);
                    }
                  }}
                  onInputChange={(value) =>
                    onFilterInputChange &&
                    onFilterInputChange(dropdownOptions[0], value)
                  }
                  options={filterOptions[dropdownOptions[0]] || []}
                  allowMultiple={dropdownOptions[0] === "department"}
                />
              )}

            <HStack spacing={4} mt={4}>
              <Select
                placeholder="Select min value"
                value={minValue ?? ""}
                onChange={(e) => setMinValue(Number(e.target.value))}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "blue.400" }}
              >
                {allowedAnnualRevenueValues.map((value) => (
                  <option key={value} value={value} style={{ backgroundColor: "black", color: "white" }}>
                    {value}
                  </option>
                ))}
              </Select>

              <Text color="gray.400" fontSize="md">
                to
              </Text>

              <Select
                placeholder="Select max value"
                value={maxValue ?? ""}
                onChange={(e) => setMaxValue(Number(e.target.value))}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
                _hover={{ borderColor: "gray.500" }}
                _focus={{ borderColor: "blue.400" }}
              >
                {allowedAnnualRevenueValues.map((value) => (
                  <option key={value} value={value} style={{ backgroundColor: "black", color: "white" }}>
                    {value}
                  </option>
                ))}
              </Select>
            </HStack>

            <Flex justifyContent="flex-end" gap={2} mt={4}>
              <Button size="sm" onClick={handleAdd} colorScheme="blue">
                Add
              </Button>
              <Button size="sm" onClick={handleReset} colorScheme="red">
                Reset
              </Button>
            </Flex>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default EnhancedDropdownFilterwithMinAndMaxEnum;
