import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  SimpleGrid,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  IconButton,
  FormControl,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaRobot } from 'react-icons/fa';
import { DaininBot } from '../../types/type';
import { addDaininBot, getDaininBots, updateDaininBot, deleteDaininBot } from '../../utils/supabase';
import { useAccount } from '../../contexts/AccountContext';
import ChatInterface from '../../components/Chat/ChatInterface';

const DaininBotsConfigPage: React.FC = () => {
  const { selectedAccount } = useAccount();
  const [cohortApiToken, setCohortApiToken] = useState('');
  const [cohortBots, setCohortBots] = useState<DaininBot[]>([]);
  const [customBots, setCustomBots] = useState<DaininBot[]>([]);
  const [showCohortApiToken, setShowCohortApiToken] = useState(false);
  const [newCustomBot, setNewCustomBot] = useState<Omit<DaininBot, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    name: '',
    assistant_id: '',
    api_key: '',
    is_cohort_bot: false,
  });
  const [editingBot, setEditingBot] = useState<DaininBot | null>(null);
  const [testingBot, setTestingBot] = useState<DaininBot | null>(null);
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isTestOpen, onOpen: onTestOpen, onClose: onTestClose } = useDisclosure();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (selectedAccount) {
      loadBots();
    }
  }, [selectedAccount]);

  const loadBots = async () => {
    try {
      const bots = await getDaininBots(selectedAccount!.user_id);
      setCohortBots(bots.filter(bot => bot.is_cohort_bot));
      setCustomBots(bots.filter(bot => !bot.is_cohort_bot));
    } catch (error) {
      console.error('Error loading bots:', error);
      toast({
        title: 'Error loading bots',
        description: 'There was an error loading your bots. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCohortApiTokenSubmit = async () => {
    // TODO: Implement API call to fetch cohort bots
    console.log('Fetching cohort bots with token:', cohortApiToken);
    // Mock data for demonstration
    const mockCohortBots: DaininBot[] = [
      { id: '1', user_id: selectedAccount!.user_id, name: 'Sales Bot', assistant_id: 'sales123', api_key: cohortApiToken, is_cohort_bot: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', user_id: selectedAccount!.user_id, name: 'Support Bot', assistant_id: 'support123', api_key: cohortApiToken, is_cohort_bot: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', user_id: selectedAccount!.user_id, name: 'Lead Gen Bot', assistant_id: 'leadgen123', api_key: cohortApiToken, is_cohort_bot: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ];

    try {
      for (const bot of mockCohortBots) {
        await addDaininBot(bot);
      }
      await loadBots();
      toast({
        title: 'Cohort bots added',
        description: 'Cohort bots have been successfully added to your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding cohort bots:', error);
      toast({
        title: 'Error adding cohort bots',
        description: 'There was an error adding the cohort bots. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddCustomBot = async () => {
    if (newCustomBot.name && newCustomBot.assistant_id && newCustomBot.api_key && selectedAccount) {
      try {
        const addedBot = await addDaininBot({
          ...newCustomBot,
          user_id: selectedAccount.user_id,
        });
        setCustomBots([...customBots, addedBot]);
        setNewCustomBot({ name: '', assistant_id: '', api_key: '', is_cohort_bot: false });
        onAddClose();
        toast({
          title: 'Custom bot added',
          description: 'Your custom bot has been successfully added.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error adding custom bot:', error);
        toast({
          title: 'Error adding custom bot',
          description: 'There was an error adding your custom bot. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditBot = (bot: DaininBot) => {
    setEditingBot(bot);
    onEditOpen();
  };

  const handleUpdateBot = async () => {
    if (editingBot) {
      try {
        const updatedBot = await updateDaininBot(editingBot.id, {
          name: editingBot.name,
          assistant_id: editingBot.assistant_id,
          api_key: editingBot.api_key,
        });
        setCustomBots(customBots.map(bot => bot.id === updatedBot.id ? updatedBot : bot));
        onEditClose();
        toast({
          title: 'Custom bot updated',
          description: 'Your custom bot has been successfully updated.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error updating custom bot:', error);
        toast({
          title: 'Error updating custom bot',
          description: 'There was an error updating your custom bot. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteCustomBot = async (id: string) => {
    try {
      await deleteDaininBot(id);
      setCustomBots(customBots.filter(bot => bot.id !== id));
      toast({
        title: 'Custom bot deleted',
        description: 'Your custom bot has been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting custom bot:', error);
      toast({
        title: 'Error deleting custom bot',
        description: 'There was an error deleting your custom bot. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTestBot = (bot: DaininBot) => {
    setTestingBot(bot);
    onTestOpen();
  };

  return (
    <Box p={8} maxWidth="1200px" margin="auto">
      <Heading mb={6} size="xl" fontWeight="bold">Dainin Bots Configuration</Heading>
      
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList mb="1em">
          <Tab>Dainin AI Cohort Bots</Tab>
          <Tab>Custom Bots</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card variant="outline" bg={bgColor} borderColor={borderColor} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" mb={2}>Configure Dainin AI Cohort Bots</Heading>
                    <Text>Enter your API token to access pre-configured Dainin AI Cohort Bots.</Text>
                    <InputGroup size="md">
                      <Input
                        pr="4.5rem"
                        type={showCohortApiToken ? "text" : "password"}
                        placeholder="Enter API token"
                        value={cohortApiToken}
                        onChange={(e) => setCohortApiToken(e.target.value)}
                      />
                      <InputRightElement width="4.5rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowCohortApiToken(!showCohortApiToken)}
                          aria-label={showCohortApiToken ? "Hide API token" : "Show API token"}
                          icon={showCohortApiToken ? <FaEyeSlash /> : <FaEye />}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <Button colorScheme="blue" onClick={handleCohortApiTokenSubmit}>Submit</Button>
                  </VStack>
                </CardBody>
              </Card>

              {cohortBots.length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {cohortBots.map(bot => (
                    <Card key={bot.id} variant="outline" bg={bgColor} borderColor={borderColor} boxShadow="md">
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <Heading size="md">{bot.name}</Heading>
                          <Text>Assistant ID: {bot.assistant_id}</Text>
                          <Button size="sm" colorScheme="green" leftIcon={<FaRobot />} onClick={() => handleTestBot(bot)}>Test Bot</Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </VStack>
          </TabPanel>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Card variant="outline" bg={bgColor} borderColor={borderColor} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" mb={2}>Custom Bots Configuration</Heading>
                    <Text>Add and manage your custom bots using assistant IDs and API keys.</Text>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onAddOpen}>Add New Custom Bot</Button>
                  </VStack>
                </CardBody>
              </Card>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {customBots.map(bot => (
                  <Card key={bot.id} variant="outline" bg={bgColor} borderColor={borderColor} boxShadow="md">
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Heading size="md">{bot.name}</Heading>
                        <Text>Assistant ID: {bot.assistant_id}</Text>
                        <HStack>
                          <Button size="sm" colorScheme="blue" leftIcon={<FaEdit />} onClick={() => handleEditBot(bot)}>Edit</Button>
                          <Button size="sm" colorScheme="red" leftIcon={<FaTrash />} onClick={() => handleDeleteCustomBot(bot.id)}>Delete</Button>
                          <Button size="sm" colorScheme="green" leftIcon={<FaRobot />} onClick={() => handleTestBot(bot)}>Test Bot</Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={isAddOpen} onClose={onAddClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Custom Bot</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bot Name</FormLabel>
                <Input 
                  placeholder="Enter bot name" 
                  value={newCustomBot.name}
                  onChange={(e) => setNewCustomBot({...newCustomBot, name: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Assistant ID</FormLabel>
                <Input 
                  placeholder="Enter assistant ID" 
                  value={newCustomBot.assistant_id}
                  onChange={(e) => setNewCustomBot({...newCustomBot, assistant_id: e.target.value})}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>API Key</FormLabel>
                <InputGroup>
                  <Input 
                    type={showCohortApiToken ? "text" : "password"}
                    placeholder="Enter API key" 
                    value={newCustomBot.api_key}
                    onChange={(e) => setNewCustomBot({...newCustomBot, api_key: e.target.value})}
                  />
<InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowCohortApiToken(!showCohortApiToken)}
                      aria-label={showCohortApiToken ? "Hide API key" : "Show API key"}
                      icon={showCohortApiToken ? <FaEyeSlash /> : <FaEye />}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddCustomBot}>
              Add Bot
            </Button>
            <Button variant="ghost" onClick={onAddClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Custom Bot</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Bot Name</FormLabel>
                <Input 
                  value={editingBot?.name || ''}
                  onChange={(e) => setEditingBot(prev => prev ? {...prev, name: e.target.value} : null)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Assistant ID</FormLabel>
                <Input 
                  value={editingBot?.assistant_id || ''}
                  onChange={(e) => setEditingBot(prev => prev ? {...prev, assistant_id: e.target.value} : null)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>API Key</FormLabel>
                <InputGroup>
                  <Input 
                    type={showCohortApiToken ? "text" : "password"}
                    value={editingBot?.api_key || ''}
                    onChange={(e) => setEditingBot(prev => prev ? {...prev, api_key: e.target.value} : null)}
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      onClick={() => setShowCohortApiToken(!showCohortApiToken)}
                      aria-label={showCohortApiToken ? "Hide API key" : "Show API key"}
                      icon={showCohortApiToken ? <FaEyeSlash /> : <FaEye />}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateBot}>
              Update Bot
            </Button>
            <Button variant="ghost" onClick={onEditClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isTestOpen} onClose={onTestClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Test Bot: {testingBot?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {testingBot && (
              <ChatInterface
                assistantId={testingBot.assistant_id}
                apiKey={testingBot.api_key}
                onClose={onTestClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DaininBotsConfigPage;