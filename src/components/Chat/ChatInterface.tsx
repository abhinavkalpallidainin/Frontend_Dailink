import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  assistantId: string;
  apiKey: string;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ assistantId, apiKey, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    createThread();
    return () => {
      if (threadId) {
        deleteThread(threadId);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setThreadId(data.id);
    } catch (error) {
      console.error('Error creating thread:', error);
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
    if (!input.trim() || !threadId) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add the message to the thread
      await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ role: 'user', content: input })
      });

      // Run the assistant
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

      // Poll for the run to complete
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

      // Fetch the latest messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const messagesData = await messagesResponse.json();
      const latestMessage = messagesData.data[0];

      const assistantMessage: Message = {
        role: 'assistant',
        content: latestMessage.content[0].text.value
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error interacting with OpenAI API:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      width="100%"
      height="500px"
      bg={bgColor}
      borderColor={borderColor}
      borderWidth={1}
      borderRadius="md"
      p={4}
    >
      <VStack height="100%" spacing={4}>
        <Box 
          flex={1} 
          width="100%" 
          overflowY="auto" 
          borderColor={borderColor}
          borderWidth={1}
          borderRadius="md"
          p={2}
        >
          {messages.map((message, index) => (
            <HStack key={index} alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'} mb={2}>
              <Text
                bg={message.role === 'user' ? 'blue.500' : 'gray.200'}
                color={message.role === 'user' ? 'white' : 'black'}
                px={3}
                py={2}
                borderRadius="lg"
              >
                {message.content}
              </Text>
            </HStack>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        <HStack width="100%">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} isLoading={isLoading}>Send</Button>
        </HStack>
        <Button onClick={onClose}>Close Chat</Button>
      </VStack>
    </Box>
  );
};

export default ChatInterface;