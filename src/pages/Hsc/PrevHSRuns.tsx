import React from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
  HStack,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';

const PrevHSCRuns: React.FC = () => {
  return (
    <ChakraProvider>
      <Box p={5} bg="gray.900" color="gray.100" minH="100vh">
        {/* Page Header */}
        <Box mb={5} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold">
            Your Connection Insights
          </Text>
        </Box>

        {/* Search Bar & Filter Options */}
        <HStack spacing={4} mb={5} justify="center">
          <Select placeholder="Filter Connections" width="200px">
            <option value="most-business-owners">Most Business Owners</option>
            <option value="industry">Industry</option>
            <option value="location">Location</option>
          </Select>
          <Button colorScheme="blue">Search</Button>
        </HStack>

        {/* Tabs for Connection Insights */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList mb="1em" justifyContent="center">
            <Tab>Connections List</Tab>
            <Tab>Summary</Tab>
          </TabList>

          <TabPanels>
            {/* Connections List Tab */}
            <TabPanel>
              <Table variant="simple" colorScheme="gray">
                <Thead>
                  <Tr>
                    <Th>Profile Picture</Th>
                    <Th>Name</Th>
                    <Th>Business Owners Count</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>
                      <Avatar
                        name="John Doe"
                        src="https://via.placeholder.com/150"
                      />
                    </Td>
                    <Td>John Doe</Td>
                    <Td>15</Td>
                    <Td>
                      <Button size="sm" colorScheme="blue">
                        View Profile
                      </Button>
                    </Td>
                  </Tr>
                  <Tr>
                    <Td>
                      <Avatar
                        name="Jane Smith"
                        src="https://via.placeholder.com/150"
                      />
                    </Td>
                    <Td>Jane Smith</Td>
                    <Td>20</Td>
                    <Td>
                      <Button size="sm" colorScheme="blue">
                        View Profile
                      </Button>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TabPanel>

            {/* Summary Tab */}
            <TabPanel>
              <VStack align="start">
                <Text>Total Business Owners in Network: 150</Text>
                <Text>Most Connected Person: Jane Smith</Text>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ChakraProvider>
  );
};

export default PrevHSCRuns;
