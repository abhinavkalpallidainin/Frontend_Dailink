import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Input,
  Text,
  Box,
  useToast,
  Spinner,
  IconButton,
  Flex,
  useColorModeValue,
  Badge,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import { FaPaperPlane, FaRobot } from 'react-icons/fa';
import { Profile, Message } from '../../types/type';
import { 
  getMessagesForLead, 
  sendMessageToLead, 
  getChatId, 
  saveMessageToSupabase,
  generateBotResponse,
  createLogEntry
} from '../../utils/myAssistantUtils';
import { useAccount } from '../../contexts/AccountContext';

interface LeadChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Profile;
  isAssistantEnabled: boolean;
  assistantId: string;
  apiKey: string;
}

const LeadChatModal: React.FC<LeadChatModalProps> = ({
  isOpen,
  onClose,
  lead,
  isAssistantEnabled,
  assistantId,
  apiKey,
}) => {
  const { selectedAccount } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const userMessageBg = useColorModeValue('blue.500', 'blue.200');
  const leadMessageBg = useColorModeValue('gray.100', 'gray.600');
  const userTextColor = useColorModeValue('white', 'gray.800');
  const leadTextColor = useColorModeValue('gray.800', 'white');

  const fetchMessages = useCallback(async () => {
    if (!selectedAccount) {
      console.log('selectedAccount is missing', { selectedAccount });
      return;
    }
    setIsLoading(true);
    try {
      console.log(`Fetching messages for lead ${lead.linkedin_id} and account ${selectedAccount.id}`);
      const fetchedMessages = await getMessagesForLead(lead.linkedin_id.toString(), selectedAccount.id.toString());
      console.log(`Fetched ${fetchedMessages.length} messages for lead ${lead.linkedin_id}`);
      
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error fetching messages',
        description: 'Unable to load chat history. Please try again later.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [lead.linkedin_id, selectedAccount, toast]);

  useEffect(() => {
    if (selectedAccount && isOpen) {
        console.log('Opening chat for lead:', lead);
      getChatId(lead.linkedin_id, selectedAccount.id).then(setChatId);
    }
  }, [lead.linkedin_id, selectedAccount, isOpen]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [fetchMessages, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let currentThreadId: string | null = null;

    const setupThread = async () => {
      if (isAssistantEnabled) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }
    };

    setupThread();

    return () => {
      if (currentThreadId) {
        deleteThread(currentThreadId);
      }
    };
  }, [isAssistantEnabled, apiKey]);

  const createThread = async () => {
    try {
      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: 'Error creating chat thread',
        description: 'Unable to initialize the assistant. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return null;
    }
  };

  const deleteThread = async (threadId: string) => {
    try {
      await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAccount || !selectedAccount.id) return;
    setIsSending(true);
    try {
      const sentMessage = await sendMessageToLead(lead.linkedin_id.toString(), newMessage, selectedAccount.id.toString());
      console.log(`Sent message: ${JSON.stringify(sentMessage)}`);
      
      await saveMessageToSupabase(sentMessage, selectedAccount.id, lead.linkedin_id, assistantId);
      console.log(`Saved sent message to database: ${JSON.stringify(sentMessage)}`);
      
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      await createLogEntry(selectedAccount.id, lead.linkedin_id, lead.name, 'Message Sent', 'User sent a message');
  
      if (isAssistantEnabled && threadId) {
        await generateAssistantResponse(newMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'Unable to send your message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  const generateAssistantResponse = async (userMessage: string) => {
    try {
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ role: 'user', content: userMessage })
      });

      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ assistant_id: assistantId })
      });

      const runData = await runResponse.json();

      let runStatus = runData.status;
      while (runStatus !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runData.id}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
      }

      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const messagesData = await messagesResponse.json();
      const latestMessage = messagesData.data[0];

      const botResponse = latestMessage.content[0].text.value;
      const sentBotMessage = await sendMessageToLead(lead.linkedin_id, botResponse, selectedAccount!.id);
      console.log(`Sent bot message: ${JSON.stringify(sentBotMessage)}`);
      
      await saveMessageToSupabase(sentBotMessage, selectedAccount!.id, lead.linkedin_id, assistantId);
      console.log(`Saved bot message to database: ${JSON.stringify(sentBotMessage)}`);
      
      setMessages(prev => [...prev, sentBotMessage]);

      await createLogEntry(selectedAccount!.id, lead.linkedin_id, lead.name, 'Bot Response', 'Assistant generated a response');
    } catch (error) {
      console.error('Error generating bot response:', error);
      toast({
        title: 'Error generating response',
        description: 'The assistant encountered an error. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageContent = (message: Message) => {
    return message.content || message.text || '';
  };
  
  const getMessageDate = (message: Message) => {
    return message.created_at || message.timestamp || '';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent height="80vh" maxWidth="800px">
        <ModalHeader>
          <HStack>
            <Text>{lead.name}</Text>
            {isAssistantEnabled && (
              <Tooltip label="AI Assistant is active for this conversation">
                <Badge colorScheme="green"><FaRobot /></Badge>
              </Tooltip>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" p={0}>
          <Flex direction="column" flex={1} bg={bgColor} borderRadius="md" overflow="hidden">
            <VStack flex={1} overflowY="auto" p={2} spacing={2} align="stretch" justifyContent="flex-end">
              {isLoading ? (
                <Spinner alignSelf="center" />
              ) : (
                <>
                  {messages.map((message, index) => (
                    <Flex
                      key={index}
                      justifyContent={message.sender_id === lead.linkedin_id ? 'flex-start' : 'flex-end'}
                    >
                      <Box
                        bg={message.sender_id === lead.linkedin_id ? leadMessageBg : userMessageBg}
                        color={message.sender_id === lead.linkedin_id ? leadTextColor : userTextColor}
                        borderRadius="lg"
                        p={2}
                        maxW="70%"
                        fontSize="sm"
                      >
                        <Text>{getMessageContent(message)}</Text>
                        <Text fontSize="xs" color={message.sender_id === lead.linkedin_id ? 'gray.500' : 'gray.200'} textAlign="right" mt={1}>
                          {formatMessageDate(getMessageDate(message))}
                        </Text>
                      </Box>
                    </Flex>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </VStack>
            <HStack p={4} bg={bgColor} borderTopWidth={1} borderColor={borderColor}>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isSending}
              />
              <IconButton
                icon={<FaPaperPlane />}
                onClick={handleSendMessage}
                isLoading={isSending}
                disabled={!newMessage.trim() || isSending}
                colorScheme="blue"
                aria-label="Send message"
              />
            </HStack>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default LeadChatModal;