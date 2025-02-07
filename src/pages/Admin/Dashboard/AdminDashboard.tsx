import React, { useEffect, useCallback, useState } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  useToast,
  VStack,
  Spinner,
  Container,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
} from "@chakra-ui/react";
import { useAccount } from "../../../contexts/AccountContext";
import { useNavigate } from "react-router-dom";

// Mock data for the graph

const AdminDashboard: React.FC = () => {
  const {
    selectedAccount,
    refreshAccounts,
    isLoading: isAccountLoading,
  } = useAccount();
  const toast = useToast();
  const navigate=useNavigate();


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue("gray.900", "gray.800");
  const cardBgColor = useColorModeValue("gray.800", "gray.700");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const headingColor = useColorModeValue("blue.300", "blue.200");

  useEffect(() => {
    const initializeDashboard = async () => {
      if (selectedAccount && !isAccountLoading) {
        setIsLoading(true);
        setError(null);
        try {
          // Your data fetching logic here
        } catch (error) {
          setError("Failed to fetch account data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeDashboard();
  }, [selectedAccount, isAccountLoading]);

  const handleRefresh = useCallback(async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setError(null);
    try {
      await refreshAccounts();
      toast({
        title: "Dashboard refreshed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast({
        title: "Error refreshing dashboard",
        description: "An unexpected error occurred. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccounts, selectedAccount, toast]);

  if (isAccountLoading || isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
        <Text mt={4} color={textColor}>
          Loading dashboard...
        </Text>
      </Container>
    );
  }

  if (!selectedAccount) {
    return (
      <Container centerContent>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account from the
          sidebar to view the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" color={headingColor}>
            Admin Dashboard
          </Heading>

          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <SimpleGrid columns={{ base: 1, md: 3, lg: 3 }} spacing={6}>
            <Box
              bg={cardBgColor}
              color="white"
              p={6}
              borderRadius="md"
              borderWidth="1px"
              textAlign="center"
              transition="transform 0.2s"
              _hover={{ transform: "scale(1.05)", bg: headingColor }}
              cursor="pointer"
              onClick={()=>navigate('/admin-user-management')}
            >
              <Heading as="h3" size="lg">
                User Management
              </Heading>
            </Box>
            {/* Add more cards here as needed */}
          </SimpleGrid>

          <Button
            onClick={handleRefresh}
            isLoading={isLoading}
            colorScheme="blue"
          >
            Refresh Dashboard
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
