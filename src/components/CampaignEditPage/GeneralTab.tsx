import React from 'react';
import { VStack, FormControl, FormLabel, Input, Select } from '@chakra-ui/react';
import { Campaign } from '../../types/type';

interface GeneralTabProps {
  campaign: Campaign;
  setCampaign: React.Dispatch<React.SetStateAction<Campaign | null>>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ campaign, setCampaign }) => {
  return (
    <VStack spacing={6} align="stretch" bg="gray.800" p={6} borderRadius="md" boxShadow="lg">
      <FormControl>
        <FormLabel>Campaign Name</FormLabel>
        <Input
          value={campaign.name}
          onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
          bg="gray.700"
        />
      </FormControl>
      <FormControl>
        <FormLabel>Campaign Type</FormLabel>
        <Select
          value={campaign.type}
          onChange={(e) => setCampaign({ ...campaign, type: e.target.value })}
          bg="gray.700"
          borderColor="gray.600"
          color="gray.200"
          sx={{
            option: {
              backgroundColor: "gray.700",
              _hover: {
                backgroundColor: "gray.500",
              },
            },
          }}
        >
          <option value="Outreach">Outreach</option>
          <option value="Messaging">Messaging</option>
        </Select>
      </FormControl>
      <FormControl>
        <FormLabel>Status</FormLabel>
        <Select
          value={campaign.status}
          onChange={(e) => setCampaign({ ...campaign, status: e.target.value })}
          bg="gray.700"
          borderColor="gray.600"
          color="gray.200"
          sx={{
            option: {
              backgroundColor: "gray.700",
              _hover: {
                backgroundColor: "gray.500",
              },
            },
          }}
        >
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
        </Select>
      </FormControl>
    </VStack>
  );
};

export default GeneralTab;