import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  Icon,
  Text,
  Flex,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaUserPlus, FaComments, FaThumbsUp, FaSync, FaClock } from 'react-icons/fa';
import { ActionType } from '../../types/type';

interface ActionPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAction: (actionType: ActionType) => void;
}

const MotionButton = motion(Button);

const availableActions = [
  { type: 'SEND_INVITATION' as const, name: 'Invite 2nd and 3rd level contacts', icon: FaUserPlus },
  { type: 'SEND_MESSAGE' as const, name: 'Message 1st connections', icon: FaComments },
  { type: 'LIKE_POST' as const, name: 'Like and comment posts and articles', icon: FaThumbsUp },
  { type: 'FOLLOW_UNFOLLOW' as const, name: 'Follow/Unfollow profiles', icon: FaSync },
  { type: 'DELAY' as const, name: 'Add delay before next action', icon: FaClock },
];

const ActionPalette: React.FC<ActionPaletteProps> = ({ isOpen, onClose, onAddAction }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader fontSize="2xl" fontWeight="bold">Add Action</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {availableActions.map((action) => (
              <MotionButton
                key={action.type}
                onClick={() => {
                  onAddAction(action.type);
                  onClose();
                }}
                justifyContent="flex-start"
                height="auto"
                p={4}
                bg="gray.700"
                _hover={{ bg: "gray.600" }}
                borderRadius="md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Flex align="center" width="100%">
                  <Icon as={action.icon} boxSize={6} mr={4} color="blue.400" />
                  <Text fontSize="md" fontWeight="medium">
                    {action.name}
                  </Text>
                </Flex>
              </MotionButton>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ActionPalette;