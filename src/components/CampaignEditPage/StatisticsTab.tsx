import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Heading, VStack, HStack, Select,
  Table, Thead, Tbody, Tr, Th, Td, Spinner
} from '@chakra-ui/react';
import { Campaign } from '../../types/type';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatisticsTabProps {
  campaign: Campaign;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({ campaign }) => {
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  // Mock data for the chart
  const data = [
    { name: 'Day 1', contacts: 20, successful: 5, failed: 2 },
    { name: 'Day 2', contacts: 40, successful: 15, failed: 4 },
    { name: 'Day 3', contacts: 60, successful: 30, failed: 5 },
    { name: 'Day 4', contacts: 80, successful: 45, failed: 7 },
    { name: 'Day 5', contacts: 100, successful: 60, failed: 10 },
  ];

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        setChartDimensions({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <Box>
      <Heading size="md" mb={6}>Campaign Statistics</Heading>
      
      <HStack justify="space-between" mb={4}>
        <Heading size="sm">Performance Overview</Heading>
        <Select placeholder="Select date range" w="200px">
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="allTime">All time</option>
        </Select>
      </HStack>

      <Box height="400px" width="100%" mb={8} ref={chartRef}>
        {chartDimensions.width > 0 && chartDimensions.height > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="contacts" stroke="#8884d8" />
              <Line type="monotone" dataKey="successful" stroke="#82ca9d" />
              <Line type="monotone" dataKey="failed" stroke="#ff7300" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Spinner size="xl" />
        )}
      </Box>

      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="sm" mb={3}>Key Metrics</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Metric</Th>
                <Th isNumeric>Value</Th>
                <Th isNumeric>Change</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Total Contacts</Td>
                <Td isNumeric>{campaign.contacts}</Td>
                <Td isNumeric color="green.500">+20%</Td>
              </Tr>
              <Tr>
                <Td>Success Rate</Td>
                <Td isNumeric>{((campaign.successful / campaign.contacts) * 100).toFixed(2)}%</Td>
                <Td isNumeric color="green.500">+5%</Td>
              </Tr>
              <Tr>
                <Td>Response Rate</Td>
                <Td isNumeric>{((campaign.replied / campaign.messaged) * 100).toFixed(2)}%</Td>
                <Td isNumeric color="red.500">-2%</Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>

        <Box>
          <Heading size="sm" mb={3}>Action Breakdown</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Action</Th>
                <Th isNumeric>Count</Th>
                <Th isNumeric>Success Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>Profile Views</Td>
                <Td isNumeric>{campaign.contacts}</Td>
                <Td isNumeric>100%</Td>
              </Tr>
              <Tr>
                <Td>Messages Sent</Td>
                <Td isNumeric>{campaign.messaged}</Td>
                <Td isNumeric>{((campaign.replied / campaign.messaged) * 100).toFixed(2)}%</Td>
              </Tr>
              <Tr>
                <Td>Connection Requests</Td>
                <Td isNumeric>{campaign.followed}</Td>
                <Td isNumeric>{((campaign.successful / campaign.followed) * 100).toFixed(2)}%</Td>
              </Tr>
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};

export default StatisticsTab;