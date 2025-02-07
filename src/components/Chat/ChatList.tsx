import React from 'react';
import { VStack, Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { LinkedInChat } from '../../utils/api';

interface ChatListProps {
  chats: LinkedInChat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat }) => {
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.700');

  return (
    <VStack align="stretch" spacing={2} w="100%">
      {chats.map((chat) => (
        <Box
          key={chat.id}
          p={3}
          bg={chat.id === selectedChatId ? selectedBg : 'transparent'}
          _hover={{ bg: hoverBg }}
          cursor="pointer"
          onClick={() => onSelectChat(chat.id)}
          borderRadius="md"
        >
          <Text fontWeight="bold" isTruncated>
            {chat.name || 'Unnamed Chat'}
          </Text>
          <Text fontSize="sm" color="gray.500" isTruncated>
            {new Date(chat.timestamp).toLocaleString()}
          </Text>
          {chat.unread_count > 0 && (
            <Badge colorScheme="red" ml={2}>
              {chat.unread_count}
            </Badge>
          )}
        </Box>
      ))}
    </VStack>
  );
};

export default ChatList;