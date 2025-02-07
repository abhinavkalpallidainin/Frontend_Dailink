import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  useDisclosure,
  Spinner,
  IconButton,
  InputGroup,
  InputLeftElement,
  Avatar,
  Tooltip,
  Alert,
  AlertIcon,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Spacer,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaFilter,
  FaLinkedin,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { useList } from "../../contexts/ListContext";
import {
  getProfilesInList,
  removeProfileFromList,
  getCRMLists,
} from "../../utils/supabase";
import { useAccount } from "../../contexts/AccountContext";
import { List, Profile } from "../../types/type";

const MotionBox = motion(Box);

interface ExtendedProfile extends Profile {
  industry?: string;
  company?: string;
  connectionDegree?: string;
  yearsOfExperience?: number;
}

interface ListWithCount extends List {
  profileCount?: number;
}

const CRMPage: React.FC = () => {
  const { selectedAccount, ensureAccountInSupabase } = useAccount();
  const { lists, setLists, addList, updateList, removeList } = useList() as {
    lists: ListWithCount[];
    setLists: React.Dispatch<React.SetStateAction<ListWithCount[]>>;
    addList: (name: string) => Promise<List | null>;
    updateList: (id: string, name: string) => Promise<List | null>;
    removeList: (id: string) => Promise<void>;
  };
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [listProfiles, setListProfiles] = useState<ExtendedProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ExtendedProfile[]>(
    []
  );
  const [editingList, setEditingList] = useState<List | null>(null);
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const {
    isOpen: isFilterOpen,
    onOpen: onFilterOpen,
    onClose: onFilterClose,
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    headline: "",
    location: "",
    industry: "",
    company: "",
    yearsOfExperience: [0, 50],
    connectionDegree: "",
  });
  const [sortField, setSortField] = useState<keyof ExtendedProfile>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const toast = useToast();

  useEffect(() => {
    const fetchLists = async () => {
      if (selectedAccount) {
        try {
          const fetchedLists = await getCRMLists(selectedAccount.id);
          console.log("Fetched lists:", fetchedLists);
          setLists(fetchedLists);
        } catch (error) {
          console.error("Error fetching lists:", error);
        }
      }
    };

    fetchLists();
  }, [selectedAccount, setLists]);

  useEffect(() => {
    if (lists.length > 0 && !selectedList) {
      setSelectedList(lists[0].id);
    }
  }, [lists, selectedList]);

  const fetchListProfiles = useCallback(
    async (listId: string) => {
      console.log("Fetching list profiles for listId:", listId);
      console.log("Selected account:", selectedAccount);

      if (!selectedAccount) {
        console.log("No selected account, aborting fetch");
        return;
      }

      setIsLoading(true);
      try {
        console.log("Calling getProfilesInList with listId:", listId);
        const profiles = await getProfilesInList(listId);
        console.log("Profiles fetched from Supabase:", profiles);

        const extendedProfiles: ExtendedProfile[] = profiles.map((profile) => ({
          ...profile,
          industry: profile.headline?.split(" at ")[0] || "",
          company: profile.headline?.split(" at ")[1] || "",
          connectionDegree: "2nd",
          yearsOfExperience: Math.floor(Math.random() * 20),
        }));
        console.log("Extended profiles:", extendedProfiles);

        setListProfiles(extendedProfiles);
        setFilteredProfiles(extendedProfiles);
        console.log("List profiles and filtered profiles set");
      } catch (error) {
        console.error("Error fetching list profiles:", error);
        toast({
          title: "Error fetching profiles",
          description: "An unexpected error occurred. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedAccount, toast]
  );

  useEffect(() => {
    console.log("useEffect triggered");
    console.log("Selected list:", selectedList);
    console.log("Selected account:", selectedAccount);

    if (selectedList && selectedAccount) {
      console.log("Calling fetchListProfiles");
      fetchListProfiles(selectedList);
    } else {
      console.log(
        "Not calling fetchListProfiles - missing selectedList or selectedAccount"
      );
    }
  }, [selectedList, selectedAccount, fetchListProfiles]);

  useEffect(() => {
    console.log("Lists:", lists);
    console.log("Selected list:", selectedList);
    console.log("List profiles:", listProfiles);
  }, [lists, selectedList, listProfiles]);

  const handleUpdateList = useCallback(async () => {
    if (editingList && selectedAccount) {
      try {
        await ensureAccountInSupabase(selectedAccount);
        const updatedList = await updateList(editingList.id, editingList.name);
        if (updatedList) {
          setEditingList(null);
          onEditClose();
          toast({
            title: "List updated",
            description: "The list has been updated successfully.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error updating list:", error);
        toast({
          title: "Error updating list",
          description: "An unexpected error occurred. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [
    editingList,
    selectedAccount,
    updateList,
    onEditClose,
    toast,
    ensureAccountInSupabase,
  ]);

  const handleDeleteList = useCallback(
    async (listId: string) => {
      if (!selectedAccount) return;
      try {
        await ensureAccountInSupabase(selectedAccount);
        await removeList(listId);
        if (selectedList === listId) {
          setSelectedList(null);
          setListProfiles([]);
          setFilteredProfiles([]);
        }
        toast({
          title: "List deleted",
          description: "The list has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error deleting list:", error);
        toast({
          title: "Error deleting list",
          description: "An unexpected error occurred. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [selectedAccount, selectedList, removeList, toast, ensureAccountInSupabase]
  );

  const handleDeleteProfile = useCallback(
    async (profileId: string) => {
      if (!selectedAccount) return;
      try {
        await ensureAccountInSupabase(selectedAccount);
        await removeProfileFromList(profileId);
        setListProfiles((prevProfiles) =>
          prevProfiles.filter((profile) => profile.id !== profileId)
        );
        setFilteredProfiles((prevProfiles) =>
          prevProfiles.filter((profile) => profile.id !== profileId)
        );
        toast({
          title: "Profile removed",
          description: "The profile has been removed from the list.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error removing profile from list:", error);
        toast({
          title: "Error removing profile",
          description: "An unexpected error occurred. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [selectedAccount, toast, ensureAccountInSupabase]
  );

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      applyFiltersAndSearch(listProfiles, term, filters);
    },
    [listProfiles, filters]
  );

  const handleFilterChange = useCallback((field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const applyFiltersAndSearch = useCallback(
    (profiles: ExtendedProfile[], searchTerm: string, filters: any) => {
      let filtered = profiles.filter(
        (profile) =>
          profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          profile.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filtered = filtered.filter((profile) => {
        return (
          (filters.headline === "" ||
            profile.headline
              ?.toLowerCase()
              .includes(filters.headline.toLowerCase())) &&
          (filters.location === "" ||
            profile.location
              ?.toLowerCase()
              .includes(filters.location.toLowerCase())) &&
          (filters.industry === "" ||
            profile.industry
              ?.toLowerCase()
              .includes(filters.industry.toLowerCase())) &&
          (filters.company === "" ||
            profile.company
              ?.toLowerCase()
              .includes(filters.company.toLowerCase())) &&
          (filters.connectionDegree === "" ||
            profile.connectionDegree === filters.connectionDegree) &&
          profile.yearsOfExperience !== undefined &&
          profile.yearsOfExperience >= filters.yearsOfExperience[0] &&
          profile.yearsOfExperience <= filters.yearsOfExperience[1]
        );
      });

      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if ((aValue ?? "") < (bValue ?? ""))
          return sortDirection === "asc" ? -1 : 1;
        if ((aValue ?? "") > (bValue ?? ""))
          return sortDirection === "asc" ? 1 : -1;
        return 0;
      });

      setFilteredProfiles(filtered);
    },
    [sortField, sortDirection]
  );

  useEffect(() => {
    applyFiltersAndSearch(listProfiles, searchTerm, filters);
  }, [listProfiles, searchTerm, filters, applyFiltersAndSearch]);

  const handleCreateList = useCallback(
    async (name: string) => {
      if (!selectedAccount) return;
      try {
        await ensureAccountInSupabase(selectedAccount);
        const newList = await addList(name);
        onCreateClose();
        if (newList) {
          setSelectedList(newList.id);
          toast({
            title: "List created",
            description: "The new list has been created successfully.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error creating list:", error);
        toast({
          title: "Error creating list",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [selectedAccount, addList, onCreateClose, toast, ensureAccountInSupabase]
  );

  const handleSort = useCallback((field: keyof ExtendedProfile) => {
    setSortField(field);
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const updateListCounts = useCallback(() => {
    setLists((prevLists) =>
      prevLists.map((list) => ({
        ...list,
        profileCount:
          listProfiles.length && selectedList === list.id
            ? listProfiles.length
            : list.profileCount,
      }))
    );
  }, [listProfiles.length, selectedList]);

  useEffect(() => {
    updateListCounts();
  }, [listProfiles.length, updateListCounts]);

  if (!selectedAccount) {
    return (
      <Box bg="gray.900" minH="100vh" p={6}>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account to manage CRM
          lists.
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg="gray.900" minH="100vh" p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading color="white" fontSize="2xl">
          CRM Dashboard
        </Heading>
        <HStack>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Create New List
          </Button>
          <Button
            leftIcon={<FaFilter />}
            colorScheme="teal"
            onClick={onFilterOpen}
          >
            Filters
          </Button>
        </HStack>
      </Flex>

      <Flex>
        <MotionBox
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          width="250px"
          maxH="500px"
          bg="gray.800"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          mr={6}
        >
          {/* Move heading OUTSIDE scrollable VStack */}
          <Heading
            size="md"
            color="white"
            mb={2}
            bg="gray.800"
            zIndex={2}
            p={2}
            borderRadius="md"
            boxShadow="md"
            position="sticky"
            top={0} // Keeps it at the top
          >
            Lists
          </Heading>

          {/* Scrollable List Container */}
          <VStack
            align="stretch"
            spacing={4}
            maxH="450px" // Ensure enough space for scrolling
            overflowY="auto" // Apply scrolling only here
            css={{
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#4A5568",
                borderRadius: "3px",
              },
            }}
          >
            {lists.map((list) => (
              <Flex
                key={list.id}
                align="center"
                bg={selectedList === list.id ? "blue.500" : "gray.700"}
                color={selectedList === list.id ? "white" : "gray.200"}
                p={2}
                borderRadius="md"
                _hover={{ bg: "gray.600" }}
                onClick={() => setSelectedList(list.id)}
              >
                <HStack spacing={2} flex="1" maxW="150px">
                  <Text isTruncated maxW="110px">
                    {list.name}
                  </Text>
                  <Text color="gray.400" fontSize="sm" isTruncated>
                    ({list.profileCount || 0})
                  </Text>
                </HStack>
                <Spacer />
                <HStack spacing={1}>
                  <IconButton
                    aria-label="Edit list"
                    icon={<FaEdit />}
                    size="sm"
                    color="blue.200"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingList(list);
                      onEditOpen();
                    }}
                  />
                  <IconButton
                    aria-label="Delete list"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                  />
                </HStack>
              </Flex>
            ))}
          </VStack>
        </MotionBox>

        <MotionBox
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          flex={1}
          bg="gray.800"
          p={6}
          borderRadius="md"
          boxShadow="lg"
        >
          <VStack align="stretch" spacing={6}>
            <Flex justify="space-between" align="center">
              <Heading size="md" color="white">
                Profiles
              </Heading>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="white" />
                </InputLeftElement>
                <Input
                  placeholder="Search profiles"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  bg="gray.700"
                  border="none"
                  color="white"
                  _focus={{ boxShadow: "outline" }}
                />
              </InputGroup>
            </Flex>

            {isLoading ? (
              <Flex justify="center" align="center" height="200px">
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : filteredProfiles.length > 0 ? (
              <AnimatePresence>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th color="gray.400" onClick={() => handleSort("name")}>
                        Name{" "}
                        {sortField === "name" &&
                          (sortDirection === "asc" ? (
                            <FaSortAmountUp />
                          ) : (
                            <FaSortAmountDown />
                          ))}
                      </Th>
                      <Th
                        color="gray.400"
                        onClick={() => handleSort("headline")}
                      >
                        Headline{" "}
                        {sortField === "headline" &&
                          (sortDirection === "asc" ? (
                            <FaSortAmountUp />
                          ) : (
                            <FaSortAmountDown />
                          ))}
                      </Th>
                      <Th
                        color="gray.400"
                        onClick={() => handleSort("location")}
                      >
                        Location{" "}
                        {sortField === "location" &&
                          (sortDirection === "asc" ? (
                            <FaSortAmountUp />
                          ) : (
                            <FaSortAmountDown />
                          ))}
                      </Th>
                      <Th color="gray.400">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredProfiles.map((profile) => (
                      <MotionBox
                        key={profile.id}
                        as={Tr}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        _hover={{ bg: "gray.700" }}
                      >
                        <Td>
                          <HStack>
                            <Avatar
                              size="sm"
                              name={profile.name}
                              src={profile.profile_url}
                            />
                            <Text color="white">{profile.name}</Text>
                          </HStack>
                        </Td>
                        <Td color="gray.300">{profile.headline || "N/A"}</Td>
                        <Td color="gray.300">{profile.location || "N/A"}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="View on LinkedIn" placement="top">
                              <IconButton
                                aria-label="View on LinkedIn"
                                icon={<FaLinkedin />}
                                size="sm"
                                colorScheme="linkedin"
                                onClick={() =>
                                  window.open(profile.profile_url, "_blank")
                                }
                              />
                            </Tooltip>
                            <Tooltip label="Remove from list" placement="top">
                              <IconButton
                                aria-label="Remove profile"
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDeleteProfile(profile.id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </MotionBox>
                    ))}
                  </Tbody>
                </Table>
              </AnimatePresence>
            ) : (
              <Flex justify="center" align="center" height="200px">
                <Text color="gray.500">No profiles found</Text>
              </Flex>
            )}
          </VStack>
        </MotionBox>
      </Flex>

      {/* Edit List Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Edit List Name</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={editingList?.name || ""}
              onChange={(e) =>
                setEditingList((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
              placeholder="Enter new list name"
              bg="gray.700"
              border="none"
              _focus={{ boxShadow: "outline" }}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateList}>
              Update
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create New List Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Create New List</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Enter list name"
              bg="gray.700"
              border="none"
              _focus={{ boxShadow: "outline" }}
              onChange={(e) =>
                setEditingList({
                  id: "",
                  name: e.target.value,
                  user_id: "",
                  account_id: "",
                  created_at: "",
                  updated_at: "",
                })
              }
            />
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                if (editingList?.name) {
                  handleCreateList(editingList.name);
                }
              }}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={onCreateClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Filters Drawer */}
      <Drawer isOpen={isFilterOpen} placement="right" onClose={onFilterClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader>Filter Profiles</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={2}>Headline</Text>
                <Input
                  placeholder="Filter by headline"
                  value={filters.headline}
                  onChange={(e) =>
                    handleFilterChange("headline", e.target.value)
                  }
                />
              </Box>
              <Box>
                <Text mb={2}>Location</Text>
                <Input
                  placeholder="Filter by location"
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange("location", e.target.value)
                  }
                />
              </Box>
              <Box>
                <Text mb={2}>Industry</Text>
                <Input
                  placeholder="Filter by industry"
                  value={filters.industry}
                  onChange={(e) =>
                    handleFilterChange("industry", e.target.value)
                  }
                />
              </Box>
              <Box>
                <Text mb={2}>Company</Text>
                <Input
                  placeholder="Filter by company"
                  value={filters.company}
                  onChange={(e) =>
                    handleFilterChange("company", e.target.value)
                  }
                />
              </Box>
              <Box>
                <Text mb={2}>Years of Experience</Text>
                <RangeSlider
                  defaultValue={[
                    filters.yearsOfExperience[0],
                    filters.yearsOfExperience[1],
                  ]}
                  min={0}
                  max={50}
                  step={1}
                  onChange={(val) =>
                    handleFilterChange("yearsOfExperience", val)
                  }
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <Text mt={2}>
                  {filters.yearsOfExperience[0]} -{" "}
                  {filters.yearsOfExperience[1]} years
                </Text>
              </Box>
              <Box>
                <Text mb={2}>Connection Degree</Text>
                <Select
                  placeholder="Select connection degree"
                  value={filters.connectionDegree}
                  onChange={(e) =>
                    handleFilterChange("connectionDegree", e.target.value)
                  }
                >
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                </Select>
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onFilterClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                applyFiltersAndSearch(listProfiles, searchTerm, filters);
                onFilterClose();
              }}
            >
              Apply Filters
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default CRMPage;
