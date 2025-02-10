import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { isToday, isYesterday, isThisYear } from "date-fns";
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  useToast,
  Heading,
  Spinner,
  Flex,
  Divider,
  Avatar,
  IconButton,
  useColorModeValue,
  Badge,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLinkedInChats,
  getLinkedInMessages,
  sendLinkedInMessage,
  getLinkedInChatAttendees,
  LinkedInAccount,
  LinkedInChat,
  LinkedInMessage,
  LinkedInProfile,
} from "../../utils/api";
import { useAccount } from "../../contexts/AccountContext";

import { FiSend, FiRefreshCw, FiSearch, FiMoreVertical } from "react-icons/fi";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface ExtendedLinkedInChat extends LinkedInChat {
  attendees: LinkedInProfile[];
  lastMessage?: string;
}

interface ExtendedLinkedInMessage extends LinkedInMessage {
  sender_id: string;
  timestamp: string;
  attachments?: { url: string }[];
}

const MessagingPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const { accounts, selectedAccount, setSelectedAccount } = useAccount();
  const [chats, setChats] = useState<ExtendedLinkedInChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedLinkedInMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Color mode values
  const bgColor = useColorModeValue("gray.800", "gray.900");
  const chatBgColor = useColorModeValue("gray.800", "gray.900");
  const chatUiBgColor = "black";
  const hoverBgColor = useColorModeValue("gray.700", "gray.800");
  const headerBgColor = useColorModeValue("gray.800", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const chatSelectColor = useColorModeValue("black", "white");
  const senderBgColor = " #9520f7";
  const receiverBgColor = useColorModeValue("gray.700", "gray.600");
  const senderTextColor = "white";
  const receiverTextColor = useColorModeValue("gray.200", "gray.100");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (accountId && (!selectedAccount || selectedAccount.id !== accountId)) {
      const account = accounts.find((acc) => acc.id === accountId);
      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [accountId, accounts, selectedAccount, setSelectedAccount]);

  const fetchChats = useCallback(async () => {
    if (!selectedAccount) return;
    setIsLoadingChats(true);
    try {
      const fetchedChats = await getLinkedInChats(selectedAccount.id);

      const chatsWithAttendees = await Promise.all(
        fetchedChats.map(async (chat) => {
          const attendees = await getLinkedInChatAttendees(chat.id);

          const messages = await getLinkedInMessages(chat.id);

          const lastMessage =
            messages.length > 0
              ? messages[0].attachments && messages[0].attachments.length > 0
                ? "Shared a LinkedIn Post"
                : messages[0].text
              : "No messages yet";
          return {
            ...chat,
            attendees,
            lastMessage,
          };
        })
      );

      setChats(chatsWithAttendees);

      if (chatsWithAttendees.length > 0 && !selectedChat) {
        setSelectedChat(chatsWithAttendees[0].id);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Error fetching chats",
        description: "Failed to fetch chats. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingChats(false);
    }
  }, [selectedAccount, selectedChat, toast]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getLinkedInMessages(selectedChat);
      const sortedMessages = fetchedMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(
        sortedMessages.map((msg) => ({
          ...msg,
          sender_id: msg.sender,
          timestamp: msg.timestamp,
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error fetching messages",
        description: "Failed to fetch messages. Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChat, toast]);

  useEffect(() => {
    if (selectedAccount) {
      fetchChats();
    }
  }, [selectedAccount, fetchChats]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const sentMessage = await sendLinkedInMessage(
        selectedChat,
        newMessage.trim()
      );
      const currentDate = new Date().toISOString();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...sentMessage,
          sender_id: sentMessage.sender,
          text: newMessage.trim(),
          is_sender: 1,
          timestamp: currentDate,
        },
      ]);

      // Update the last message for the selected chat
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === selectedChat
            ? {
                ...chat,
                lastMessage: newMessage.trim(),
                timestamp: currentDate,
              }
            : chat
        )
      );

      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return date.toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    if (isThisYear(date)) {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleString("en-US", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  if (!selectedAccount) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box h="100vh" overflow="hidden" bg={bgColor}>
      <Flex h="100%" direction="column">
        <Box p={4} bg={headerBgColor} boxShadow="sm">
          <Heading as="h1" size="lg" color={textColor}>
            LinkedIn Messages - {selectedAccount.name}
          </Heading>
        </Box>
        <Flex flex={1} overflow="hidden">
          <MotionBox
            w="350px"
            bg={chatBgColor}
            borderRightWidth={0}
            borderColor={borderColor}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VStack align="stretch" h="100%" spacing={0}>
              <HStack p={4} justify="space-between">
                <Avatar
                  size="sm"
                  name={selectedAccount.name}
                  src={(selectedAccount as any).picture_url}
                />
                <IconButton
                  aria-label="Refresh chats"
                  icon={<FiRefreshCw />}
                  size="sm"
                  onClick={fetchChats}
                  isLoading={isLoadingChats}
                />
              </HStack>
              <Divider
                sx={{
                  borderColor: "gray.400",
                  borderWidth: "2px",
                  borderStyle: "ridge",
                  my: 4,
                }}
              />
              <Box p={4}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search conversations"
                    borderRadius="full"
                    color="white"
                  />
                </InputGroup>
              </Box>
              <Box
                overflowY="auto"
                flex={1}
                css={{
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#4A5568",
                    borderRadius: "5px",
                  },
                }}
              >
                <AnimatePresence>
                  {chats.map((chat) => (
                    <MotionBox
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      overflowX="hidden" // Hide horizontal scrollbar
                    >
                      <Button
                        w="100%"
                        h="auto"
                        py={3}
                        px={4}
                        onClick={() => handleChatSelect(chat.id)}
                        bg={
                          selectedChat === chat.id
                            ? hoverBgColor
                            : "transparent"
                        }
                        color={
                          selectedChat === chat.id ? "white" : chatSelectColor
                        }
                        justifyContent="flex-start"
                        borderRadius="20px"
                        _hover={{ bg: hoverBgColor }}
                      >
                        <HStack spacing={3} align="center" w="100%">
                          <Avatar
                            size="md"
                            name={chat.attendees[0]?.name}
                            src={chat.attendees[0]?.picture_url}
                          />
                          <Box flex={1} textAlign="left">
                            <Text
                              fontWeight="bold"
                              fontSize="sm"
                              color={textColor}
                              isTruncated
                              maxW="150px"
                            >
                              {chat.attendees.map((a) => a.name).join(", ")}
                            </Text>
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              isTruncated
                              maxW="150px"
                            >
                              {chat.lastMessage}
                            </Text>
                          </Box>
                          <Box w="100px" textAlign="right">
                            <Text fontSize="xs" color="gray.500">
                              {formatChatDate(chat.timestamp)}
                            </Text>
                            {chat.unread_count > 0 && (
                              <Badge
                                colorScheme="blue"
                                borderRadius="full"
                                mt={1}
                              >
                                {chat.unread_count}
                              </Badge>
                            )}
                          </Box>
                        </HStack>
                      </Button>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              </Box>
            </VStack>
          </MotionBox>
          <MotionBox
            flex={1}
            bg={chatUiBgColor}
            display="flex"
            flexDirection="column"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            borderRadius="20px"
          >
            {selectedChat ? (
              <>
                <Flex
                  p={4}
                  borderWidth="4px"
                  borderStyle="ridge"
                  borderColor="gray.400"
                  align="center"
                  borderRadius="30px"
                  bg={chatBgColor}
                >
                  <Avatar
                    size="md"
                    bg="#739eef"
                    name={
                      chats.find((c) => c.id === selectedChat)?.attendees[0]
                        ?.name
                    }
                    src={
                      chats.find((c) => c.id === selectedChat)?.attendees[0]
                        ?.picture_url
                    }
                  />
                  <Box ml={3} flex={1}>
                    <Heading size="md" color={textColor} isTruncated>
                      {chats
                        .find((c) => c.id === selectedChat)
                        ?.attendees.map((a) => a.name)
                        .join(", ")}
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                      {
                        chats.find((c) => c.id === selectedChat)?.attendees[0]
                          ?.headline
                      }
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="More options"
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    color="gray.400"
                  />
                </Flex>
                <Box
                  flex={1}
                  overflowY="auto"
                  p={4}
                  css={{
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "#4A5568",
                      borderRadius: "5px",
                    },
                  }}
                >
                  <AnimatePresence>
                    {isLoadingMessages ? (
                      <Flex justify="center" align="center" h="100%">
                        <Spinner />
                      </Flex>
                    ) : (
                      messages.map((message, index) => {
                        const messageDate = new Date(message.timestamp);
                        const previousMessageDate =
                          index > 0
                            ? new Date(messages[index - 1].timestamp)
                            : null;

                        let showDateHeader = false;
                        let dateHeaderText = "";

                        if (isToday(messageDate)) {
                          showDateHeader =
                            !previousMessageDate ||
                            !isToday(previousMessageDate);
                          dateHeaderText = "Today";
                        } else if (isYesterday(messageDate)) {
                          showDateHeader =
                            !previousMessageDate ||
                            !isYesterday(previousMessageDate);
                          dateHeaderText = "Yesterday";
                        } else {
                          showDateHeader =
                            !previousMessageDate ||
                            messageDate.toDateString() !==
                              previousMessageDate.toDateString();

                          if (isThisYear(messageDate)) {
                            dateHeaderText = messageDate.toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            );
                          } else {
                            dateHeaderText = messageDate.toLocaleString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            );
                          }
                        }

                        return (
                          <React.Fragment key={message.id}>
                            {showDateHeader && (
                              <Flex justify="center" mb={2}>
                                <Box
                                  px={3}
                                  py={1}
                                  borderRadius="lg"
                                  bg="gray.200"
                                  color="gray.600"
                                  fontSize="sm"
                                >
                                  {dateHeaderText}
                                </Box>
                              </Flex>
                            )}
                            <MotionFlex
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                              mb={4}
                              flexDirection="column"
                              alignItems={
                                message.is_sender === 1
                                  ? "flex-end"
                                  : "flex-start"
                              }
                            >
                              <Box
                                maxW="70%"
                                p={3}
                                borderRadius="20px"
                                bg={
                                  message.is_sender === 1
                                    ? senderBgColor
                                    : receiverBgColor
                                }
                                color={
                                  message.is_sender === 1
                                    ? senderTextColor
                                    : receiverTextColor
                                }
                              >
                                {message.text ? (
                                  <Text>{message.text}</Text>
                                ) : message.attachments ? (
                                  <a
                                    href={message.attachments[0]?.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View LinkedIn Post
                                  </a>
                                ) : (
                                  <Text>Unknown Attachment Type</Text>
                                )}
                              </Box>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                {formatMessageDate(message.timestamp)}
                              </Text>
                            </MotionFlex>
                          </React.Fragment>
                        );
                      })
                    )}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </Box>
                <HStack
                  as="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  p={4}
                  borderWidth="4px"
                  borderColor="gray.400"
                  bg={chatBgColor}
                  borderStyle="ridge"
                  borderRadius="30px"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={!selectedChat || isSendingMessage}
                    borderRadius="full"
                    color="white"
                  />
                  <IconButton
                    type="submit"
                    aria-label="Send message"
                    icon={<FiSend />}
                    colorScheme="blue"
                    isLoading={isSendingMessage}
                    disabled={!selectedChat || !newMessage.trim()}
                    borderRadius="full"
                  />
                </HStack>
              </>
            ) : (
              <Flex justify="center" align="center" h="100%">
                <Text color="gray.500">Select a chat to start messaging</Text>
              </Flex>
            )}
          </MotionBox>
        </Flex>
      </Flex>
    </Box>
  );
};

export default MessagingPage;
