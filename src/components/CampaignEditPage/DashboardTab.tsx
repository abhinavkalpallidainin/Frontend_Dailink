import React from 'react';
import { 
  Box, SimpleGrid, Text, Stat, StatLabel, StatNumber, 
  StatHelpText, StatArrow, Progress, Flex, Heading
} from '@chakra-ui/react';
import { Campaign } from '../../types/type';

interface DashboardTabProps {
  campaign: Campaign;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ campaign }) => {
  const successRate = campaign.contacts > 0 
    ? (campaign.successful / campaign.contacts) * 100 
    : 0;

  return (
    <Box>
      <Heading size="md" mb={6}>Campaign Overview</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        <StatBox
          label="Contacts"
          value={campaign.contacts}
          helpText="Total contacts in campaign"
        />
        <StatBox
          label="Successful"
          value={campaign.successful}
          helpText="Successful interactions"
          type="increase"
        />
        <StatBox
          label="Failed"
          value={campaign.failed}
          helpText="Failed interactions"
          type="decrease"
        />
        <StatBox
          label="Messaged"
          value={campaign.messaged}
          helpText="Contacts messaged"
        />
        <StatBox
          label="Replied"
          value={campaign.replied}
          helpText="Replies received"
          type="increase"
        />
        <StatBox
          label="Followed"
          value={campaign.followed}
          helpText="Profiles followed"
        />
      </SimpleGrid>

      <Box mt={8}>
        <Heading size="md" mb={4}>Campaign Progress</Heading>
        <Progress value={successRate} colorScheme="green" height="32px" borderRadius="md" />
        <Flex justify="space-between" mt={2}>
          <Text>Success Rate: {successRate.toFixed(1)}%</Text>
          <Text>{campaign.successful} / {campaign.contacts} completed</Text>
        </Flex>
      </Box>

      <Box mt={8}>
        <Heading size="md" mb={4}>Recent Activity</Heading>
        <Text color="gray.500">Recent activity data will be displayed here.</Text>
      </Box>
    </Box>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  helpText: string;
  type?: 'increase' | 'decrease';
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, helpText, type }) => (
  <Stat bg="gray.700" p={4} borderRadius="md" boxShadow="md">
    <StatLabel>{label}</StatLabel>
    <StatNumber>{value}</StatNumber>
    <StatHelpText>
      {type && <StatArrow type={type} />}
      {helpText}
    </StatHelpText>
  </Stat>
);

export default DashboardTab;