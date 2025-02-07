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
  useColorModeValue
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
  

  const handleNextButton = (message: string) => {
    navigate('/Haystacks/sell-haystacks-champions/run-haystacks-champions');
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
      <Container maxW="container.xl" textAlign="center">
        <VStack spacing={8}>
          <Heading size="lg" color={textColor}>
            Payment/Advertisement Page for HaystacksChampion
          </Heading>
          <Box 
            bg={boxBgColor}
            borderWidth="1px" 
            borderColor="gray.600" 
            padding={10} 
            textAlign="center" 
            cursor="pointer" 
            transition="transform 0.2s, box-shadow 0.2s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg", bg: hoverBgColor }}
          >
            <Heading size="md" color={textColor}>This is where payment or ads will go.</Heading>
          </Box>
          <Box 
            as="button"
            bg={buttonBgColor}
            color={buttonTextColor}
            borderWidth="1px"
            borderColor="gray.600"
            padding={4}
            borderRadius="md"
            _hover={{ bg: buttonHoverBgColor }}
            onClick={() => handleNextButton("Skip to Next Page")}
          >
            Skip to Next Page
          </Box>
        </VStack>
      </Container>
    </Box>
  );
  
};

export default HayStacks;