import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Flex,
  useColorModeValue,
  IconButton,
  VStack,
  HStack,
  Container,
  Alert,
  AlertIcon,
  useDisclosure,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { AddIcon, SearchIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import AddUser from "../../../components/Modal/AddUser";
import { getAllUsers, deleteUser, updateUser } from "../../../utils/supabase"; // Make sure to include an updateUser function in your supabase utils
import { User } from "@supabase/supabase-js";
import Swal from "sweetalert2";
import { keyframes } from "@emotion/react";

interface ExtendedUser extends User {
  fullname?: string;
  unipile_id?: string;
}
const bounceAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = useColorModeValue("gray.900", "gray.800");
  const cardBgColor = useColorModeValue("gray.800", "gray.700");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const headingColor = useColorModeValue("blue.300", "blue.200");
  const inputBgColor = useColorModeValue("gray.100", "gray.600");
  const inputTextColor = useColorModeValue("gray.900", "gray.200");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        setError("Failed to fetch users. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredUsers = users.filter(
    (user) =>
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.fullname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddUser = (newUser: ExtendedUser) => {
    setUsers([...users, newUser]);
    Swal.fire("Success", "User added successfully", "success");
  };

  const handleEditUser = async (updatedUser: ExtendedUser) => {
    const { error } = await updateUser(updatedUser);
    if (error) {
      Swal.fire("Error", "Failed to update user", "error");
    } else {
      setUsers(
        users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      Swal.fire("Success", "User updated successfully", "success");
    }
  };

  const handleEdit = (user: ExtendedUser) => {
    setEditingUser(user);
    onOpen();
  };

  const handleDelete = async (user:User) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const userId=user.id
        const email:string=user?.email || ""
        const { error } = await deleteUser(userId,email);
        if (error) {
          Swal.fire("Error", "Failed to delete user", "error");
        } else {
          setUsers(users.filter((user) => user.id !== userId));
          Swal.fire("Deleted!", "User has been deleted.", "success");
        }
      } catch (err) {
        Swal.fire(
          "Error",
          "An error occurred while deleting the user",
          "error"
        );
      }
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" color={headingColor}>
            User Management
          </Heading>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {isLoading ? (
            <VStack spacing={4} align="center" justify="center" height="100vh">
              <Spinner size="xl" />
              <Text>Loading...</Text>
            </VStack>
          ) : (
            <Box bg={cardBgColor} p={6} borderRadius="md">
              <Flex justify="space-between" align="center" mb={4}>
                <HStack spacing={4}>
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    bg={inputBgColor}
                    color={inputTextColor}
                  />
                  <IconButton aria-label="Search" icon={<SearchIcon />} />
                </HStack>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="green"
                  onClick={onOpen}
                >
                  Add User
                </Button>
              </Flex>

              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color={textColor}>Name</Th>
                    <Th color={textColor}>Email</Th>
                    <Th color={textColor}>Role</Th>
                    <Th color={textColor}>Unipile Id</Th>
                    <Th color={textColor}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedUsers.map((user, index) => (
                    <Tr key={index}>
                      <Td color="white">{user?.fullname || ""}</Td>
                      <Td color="white">{user?.email || ""}</Td>
                      <Td color="white">{user?.role || ""}</Td>
                      <Td color="white">{user?.unipile_id || ""}</Td>

                      <Td color="white">
                        <Box
                          as={EditIcon}
                          size="lg"
                          onClick={() => handleEdit(user)}
                          cursor="pointer"
                          mr={2}
                          _hover={{
                            animation: `${bounceAnimation} 0.3s ease-in-out`,
                          }}
                        />
                        <Box
                          as={DeleteIcon}
                          size="lg"
                          onClick={() => handleDelete(user)}
                          cursor="pointer"
                          _hover={{
                            animation: `${bounceAnimation} 0.3s ease-in-out`,
                          }}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {filteredUsers.length === 0 && !isLoading && (
                <Flex justify="center" align="center" py={8}>
                  <Text color="gray.400">No data available</Text>
                </Flex>
              )}

              {/* Pagination Controls */}
              {filteredUsers.length > 0 && (
                <Flex justify="center" align="center" mt={4} gap={4}>
                  <IconButton
                    aria-label="Previous page"
                    icon={<FaChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
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
                    isDisabled={!hasNextPage}
                    size="sm"
                    colorScheme="gray"
                  />
                </Flex>
              )}
            </Box>
          )}
        </VStack>
      </Container>
      <AddUser
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={editingUser ? handleEditUser : handleAddUser}
        initialUserData={editingUser}
      />
    </Box>
  );
};

export default UserManagement;
