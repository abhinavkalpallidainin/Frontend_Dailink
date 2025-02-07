import React, { useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Container,
  Alert,
  AlertIcon,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import { useAccount } from '../../contexts/AccountContext';
import { useNavigate } from 'react-router-dom';
const HayStacks: React.FC = () => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue("gray.900", "gray.800");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const boxBgColor = useColorModeValue("gray.700", "gray.600");
  const hoverBgColor = useColorModeValue("gray.600", "gray.500");
  const { selectedAccount, isLoading: isAccountLoading } = useAccount();
  const [isLoading] = useState(false);
  const buttonBgColor = "blue.500"; // Blue background for the button
  const buttonTextColor = "white"; // White text for the button
  const buttonHoverBgColor = "blue.600"; // Darker blue on hover for the button
  
  const superChampions = [
    { name: 'Super Champion 1', connections: 1000, industry: 'Technology', vaActions: 50 },
    { name: 'Super Champion 2', connections: 900, industry: 'Finance', vaActions: 45 },
  ];

  const Champions = [
    { name: 'Champion 1', connections: 1000, industry: 'Technology', vaActions: 50 },
    { name: 'Champion 2', connections: 900, industry: 'Finance', vaActions: 45 },
  ];

  const handleNextButton = (message: string) => {
    navigate('/Haystacks/show-previous-runs');
  };

  if (isAccountLoading || isLoading) {
    return (
      <Container centerContent>
        <Spinner size="xl" />
        <Text mt={4} color={textColor}>Loading dashboard...</Text>
      </Container>
    );
  }

  if (!selectedAccount) {
    return (
      <Container centerContent>
        <Alert status="warning">
          <AlertIcon />
          No LinkedIn account selected. Please select an account from the sidebar to view the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minHeight="100vh" p={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading size="lg" color={textColor}>Haystacks Dashboard</Heading>

          <Box
            as="button"
            bg={buttonBgColor}
            color={buttonTextColor}
            px={8}
            py={4}
            borderRadius="md"
            _hover={{ bg: buttonHoverBgColor }}
            onClick={() => handleNextButton('Next page')}
          >
            Skip to Next Page
          </Box>

          <VStack spacing={6} align="stretch">
            <Box>
              <Heading size="md" color={textColor} mb={4}>Super Champions</Heading>
              <Text color={textColor} fontWeight="bold" mb={2}>Number of VA Actions:</Text>
              <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                {superChampions.map((champion, index) => (
                  <Box
                    key={index}
                    bg={boxBgColor}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.600"
                    _hover={{ transform: "translateY(-5px)", shadow: "lg", bg: hoverBgColor }}
                    transition="transform 0.2s, box-shadow 0.2s"
                  >
                    <Heading size="sm" color={textColor} mb={2}>{champion.name}</Heading>
                    <Text color="gray.400">Connections: {champion.connections}</Text>
                    <Text color="gray.400">Industry: {champion.industry}</Text>
                    <Text color="gray.400">VA Actions: {champion.vaActions}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            <Box>
              <Heading size="md" color={textColor} mb={4}>Champions</Heading>
              <Text color={textColor} fontWeight="bold" mb={2}>Number of VA Actions:</Text>
              <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                {Champions.map((champion, index) => (
                  <Box
                    key={index}
                    bg={boxBgColor}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.600"
                    _hover={{ transform: "translateY(-5px)", shadow: "lg", bg: hoverBgColor }}
                    transition="transform 0.2s, box-shadow 0.2s"
                  >
                    <Heading size="sm" color={textColor} mb={2}>{champion.name}</Heading>
                    <Text color="gray.400">Connections: {champion.connections}</Text>
                    <Text color="gray.400">Industry: {champion.industry}</Text>
                    <Text color="gray.400">VA Actions: {champion.vaActions}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
  
};

export default HayStacks;