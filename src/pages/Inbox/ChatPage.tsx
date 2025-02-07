import React, { useState, useEffect, useRef } from 'react';
import { Box, VStack, HStack, Text, Input, Button, useToast, Heading, Avatar } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { getLinkedInChat, getLinkedInMessages, sendLinkedInMessage, LinkedInChat, LinkedInMessage } from '../../utils/api';

const ChatPage: React.FC = () => {
  const { accountId, chatId } = useParams<{ accountId: string; chatId: string }>();
  const [chat, setChat] = useState<LinkedInChat | null>(null);
  const [messages, setMessages] = useState<LinkedInMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (accountId && chatId) {
      fetchChatAndMessages();
    }
  }, [accountId, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatAndMessages = async () => {
    setIsLoading(true);
    try {
      const [fetchedChat, fetchedMessages] = await Promise.all([
        getLinkedInChat(chatId!),
        getLinkedInMessages(chatId!)
      ]);
      
      setChat(fetchedChat);
      setMessages(fetchedMessages);
    } catch (error) {
      toast({
        title: 'Error fetching chat and messages',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const sentMessage = await sendLinkedInMessage(chatId!, newMessage.trim());
      setMessages(prevMessages => [...prevMessages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return <Text>Loading chat...</Text>;
  }

  return (
    <Box maxW="container.xl" mx="auto" p={4}>
      <VStack align="stretch" spacing={4}>
        <Heading as="h1" size="xl">{chat?.name || 'Chat'}</Heading>
        <Box flex={1} overflowY="auto" h="70vh" borderWidth={1} borderRadius="md" p={4}>
          {messages.map(message => (
            <HStack key={message.id} mb={4} alignItems="start">
              <Avatar size="sm" name={message.sender} />
              <Box bg="gray.100" p={3} borderRadius="md" maxW="70%">
                <Text fontWeight="bold">{message.sender}</Text>
                <Text>{message.text}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {new Date(message.timestamp).toLocaleString()}
                </Text>
              </Box>
            </HStack>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <HStack>
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Type a message..." 
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} colorScheme="blue">Send</Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ChatPage;