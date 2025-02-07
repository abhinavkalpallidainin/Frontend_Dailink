import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast, Heading } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const MotionBox = motion(Box);

interface LoginProps {
  onLogin: () => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await onLogin();
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: 'Error signing in',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      bgGradient="linear(to-r, blue.400, purple.500)"
    >
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        p={8}
        maxWidth="400px"
        borderWidth={1}
        borderRadius="lg"
        boxShadow="xl"
        bg="white"
      >
        <VStack spacing={6} align="stretch">
          <Heading
            as="h1"
            size="xl"
            textAlign="center"
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
            fontWeight="extrabold"
            textShadow="2px 2px 4px rgba(0,0,0,0.1)"
          >
            DAILINK
          </Heading>
          <Text fontSize="lg" textAlign="center" color="gray.600">
            Sign in to your account
          </Text>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl id="email">
                <FormLabel>Email address</FormLabel>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  bg="gray.50"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.300" }}
                />
              </FormControl>
              <FormControl id="password">
                <FormLabel>Password</FormLabel>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  bg="gray.50"
                  borderColor="gray.300"
                  _hover={{ borderColor: "blue.300" }}
                />
              </FormControl>
              <Button 
                type="submit" 
                colorScheme="blue" 
                width="full"
                isLoading={isLoading}
                loadingText="Signing In"
                _hover={{ bg: "blue.600" }}
                _active={{ bg: "blue.700" }}
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </VStack>
      </MotionBox>
    </Box>
  );
};

export default Login;