import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  InputGroup,
  Input,
  InputLeftElement,
  IconButton,
  Tooltip,
  Spinner,
  Text,
  useToast
} from '@chakra-ui/react';
import { FaSearch, FaComments } from 'react-icons/fa';
import { Profile, AssistantConfiguration, DaininBot } from '../../types/type';
import { getProfilesInList } from '../../utils/supabase';
import LeadChatModal from '../Chat/LeadChatModal';

interface ProfileListProps {
  listId: string;
  assistantConfig: AssistantConfiguration | null;
  botConfig: DaininBot | null;
  setAssistantConfig: React.Dispatch<React.SetStateAction<AssistantConfiguration | null>>;
  onProfileToggle: (profileId: string) => Promise<void>;
}

const ProfileList: React.FC<ProfileListProps> = ({
  listId,
  assistantConfig,
  botConfig,
  setAssistantConfig,
  onProfileToggle
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLeadChatOpen, setIsLeadChatOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchProfiles = useCallback(async () => {
    if (!listId) return;
    setIsLoading(true);
    try {
      const fetchedProfiles = await getProfilesInList(listId);
      console.log('Fetched profiles:', fetchedProfiles);
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Error fetching profiles',
        description: 'Failed to fetch profiles from the selected list. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [listId, toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleProfileToggle = useCallback(async (profile: Profile) => {
    console.log(`Toggling profile ${profile.linkedin_id} in ProfileList`);
    await onProfileToggle(profile.linkedin_id);
  }, [onProfileToggle]);

  const handleChatWithLead = useCallback((lead: Profile) => {
    setSelectedLead(lead);
    setIsLeadChatOpen(true);
  }, []);

  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <FaSearch color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search by name, headline, or location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {isLoading ? (
        <Spinner />
      ) : profiles.length === 0 ? (
        <Text>No profiles found in this list.</Text>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Headline</Th>
                <Th>Location</Th>
                <Th>Enable Assistant</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProfiles.map((profile) => (
                <Tr key={profile.id}>
                  <Td>{profile.name}</Td>
                  <Td>{profile.headline}</Td>
                  <Td>{profile.location}</Td>
                  <Td>
                    <Checkbox
                      isChecked={assistantConfig?.profile_ids.includes(profile.linkedin_id) || false}
                      onChange={() => handleProfileToggle(profile)}
                    />
                  </Td>
                  <Td>
                    <Tooltip label="Chat with lead">
                      <IconButton
                        aria-label="Chat with lead"
                        icon={<FaComments />}
                        onClick={() => handleChatWithLead(profile)}
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {selectedLead && botConfig && (
        <LeadChatModal
          isOpen={isLeadChatOpen}
          onClose={() => setIsLeadChatOpen(false)}
          lead={selectedLead}
          isAssistantEnabled={assistantConfig?.profile_ids.includes(selectedLead.linkedin_id) || false}
          assistantId={assistantConfig?.bot_id || ''}
          apiKey={botConfig.api_key}
        />
      )}
    </Box>
  );
};

export default ProfileList;