import React from 'react';
import { Box, Flex, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <Box bg="blue.500" py={4}>
      <Flex maxW="container.lg" mx="auto" justifyContent="space-between" alignItems="center">
        <Link as={RouterLink} to="/" color="white" fontWeight="bold">
          LinkedIn Automation
        </Link>
        <Flex>
          <Link as={RouterLink} to="/" color="white" mr={4}>
            Dashboard
          </Link>
          <Link as={RouterLink} to="/connect" color="white" mr={4}>
            Connect
          </Link>
          <Link as={RouterLink} to="/accounts" color="white" mr={4}>
            Accounts
          </Link>
          <Link as={RouterLink} to="/search" color="white" mr={4}>
            Search
          </Link>
          <Link as={RouterLink} to="/outreach" color="white" mr={4}>
            Outreach
          </Link>
          <Link as={RouterLink} to="/messaging/default" color="white">
            Messaging
          </Link>
        <Link as={RouterLink} to="/HayStacks" color="white" mr={4}>
          HayStacks
        </Link>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;