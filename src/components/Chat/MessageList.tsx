import React from 'react';
import { VStack, Box, Text, Avatar, Flex, useColorModeValue } from '@chakra-ui/react';
import { LinkedInMessage } from '../../utils/api';

interface MessageListProps {
  messages: LinkedInMessage[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <VStack spacing={4} align="stretch" p={4}>
      {messages.map((message) => (
        <Flex
          key={message.id}
          justifyContent={message.sender === currentUserId ? 'flex-end' : 'flex-start'}
        >
          <Box
            maxW="70%"
            bg={message.sender === currentUserId ? 'blue.500' : bgColor}
            color={message.sender === currentUserId ? 'white' : textColor}
            borderRadius="lg"
            p={3}
          >
            {message.sender !== currentUserId && (
              <Flex alignItems="center" mb={2}>
                <Avatar size="xs" name={message.sender} mr={2} />
                <Text fontWeight="bold" fontSize="sm">{message.sender}</Text>
              </Flex>
            )}
            <Text>{message.text}</Text>
            <Text fontSize="xs" textAlign="right" mt={1} opacity={0.7}>
              {new Date(message.created_at).toLocaleString()}
            </Text>
          </Box>
        </Flex>
      ))}
    </VStack>
  );
};

export default MessageList;