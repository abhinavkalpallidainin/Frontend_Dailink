import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Icon,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Switch,
  Image,
  Badge,
} from "@chakra-ui/react";
import { FaCog, FaPlug } from "react-icons/fa";
import { useAccount } from "../../contexts/AccountContext";

interface Integration {
  name: string;
  description: string;
  isActive: boolean;
  icon?: string;
  configOptions?: string[];
  comingSoon?: boolean;
}

interface IntegrationCardProps {
  integration: Integration;
  onToggle: () => void;
  onConfigure: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onToggle,
  onConfigure,
}) => {
  const navigate = useNavigate();
   const cardBgColor = useColorModeValue("gray.800", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const activeColor = useColorModeValue("green.500", "green.300");
  const inactiveColor = useColorModeValue("gray.300", "gray.600");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const headingColor = useColorModeValue("blue.300", "blue.200");

  const handleConfigureClick = () => {
    if (integration.name === "DAININ Bots") {
      navigate("/dainin-bots-configuration");
    } else {
      onConfigure();
    }
  };

  return (
    
    <Box
      borderWidth={1}
      borderRadius="lg"
      p={6}
      bg={cardBgColor}
      borderColor={borderColor}
      boxShadow="lg"
      position="relative"
      transition="all 0.3s"
      _hover={{ transform: "translateY(-5px)", boxShadow: "xl" }}
      opacity={integration.comingSoon ? 0.7 : 1}
    >
      {!integration.comingSoon && (
        <Box
          position="absolute"
          top={2}
          right={2}
          width={3}
          height={3}
          borderRadius="full"
          bg={integration.isActive ? activeColor : inactiveColor}
        />
      )}
      {integration.comingSoon && (
        <Badge position="absolute" top={2} right={2} colorScheme="orange">
          Coming Soon
        </Badge>
      )}
      <VStack align="start" spacing={4}>
        <HStack spacing={4}>
          {integration.icon ? (
            <Image
              src={`/${integration.icon}`}
              alt={integration.name}
              boxSize="40px"
              objectFit="contain"
            />
          ) : (
            <Icon as={FaPlug} boxSize="40px" color="gray.400" />
          )}
          <Heading size="md" color={textColor}>{integration.name}</Heading>
        </HStack>
        <Text fontSize="sm" color={textColor}>
          {integration.description}
        </Text>
        <HStack justifyContent="space-between" width="100%">
          <Switch
            isChecked={integration.isActive}
            onChange={onToggle}
            colorScheme="green"
            isDisabled={integration.comingSoon}
          />
          <Button
            size="sm"
            color={headingColor}
            variant="ghost"
            onClick={handleConfigureClick}
            leftIcon={<Icon as={FaCog} />}
            isDisabled={integration.comingSoon}
          >
            Configure
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

const IntegrationsPage: React.FC = () => {
  const { selectedAccount } = useAccount();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentIntegration, setCurrentIntegration] =
    useState<Integration | null>(null);

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: "DAININ Bots",
      description:
        "Automate conversations with AI-powered bots tailored for your campaign.",
      isActive: false,
      icon: "Dainin_icon.png",
      configOptions: ["Bot selection", "Conversation flow", "Fallback options"],
    },
    {
      name: "OpenAI",
      description:
        "Leverage AI to enhance your campaign messages and analyze responses.",
      isActive: false,
      icon: "openai.jpg",
      configOptions: ["API Key", "Model selection", "Usage limits"],
    },
    {
      name: "HubSpot",
      description:
        "Integrate your campaign with HubSpot for advanced marketing automation.",
      isActive: false,
      icon: "hubspot logo.svg",
      configOptions: ["API Key", "Sync frequency", "Data mapping"],
      comingSoon: true,
    },
    {
      name: "Google Sheets",
      description:
        "Export and sync your campaign data with Google Sheets for easy reporting.",
      isActive: false,
      icon: "sheets logo.png",
      configOptions: ["Spreadsheet ID", "Sheet name", "Auto-sync"],
      comingSoon: true,
    },
    {
      name: "Webhook",
      description:
        "Set up custom webhooks to trigger actions in your other systems.",
      isActive: false,
      icon: "webhooks logo.jpg",
      configOptions: ["Webhook URL", "Event types", "Payload format"],
      comingSoon: true,
    },
    {
      name: "Calendly",
      description:
        "Allow leads to schedule meetings directly from your campaign.",
      isActive: false,
      icon: "calendly logo.png",
      configOptions: ["API Key", "Event types", "Availability"],
      comingSoon: true,
    },
  ]);

  const handleToggle = (integrationName: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.name === integrationName && !integration.comingSoon
          ? { ...integration, isActive: !integration.isActive }
          : integration
      )
    );
    console.log(`Toggling ${integrationName}`);
    // Implement the actual toggle logic here
  };
  const bgColor = useColorModeValue("gray.900", "gray.800");
   
    const headingColor = useColorModeValue("blue.300", "blue.200");
  

  const handleConfigure = (integration: Integration) => {
    if (!integration.comingSoon && integration.name !== "DAININ Bots") {
      setCurrentIntegration(integration);
      onOpen();
    }
  };

  return (
    <Box p={8} bg={bgColor}  minHeight="100vh" >
      <Heading mb={8} color={headingColor} size="xl" fontWeight="bold">
        Integrations
      </Heading>
      {selectedAccount ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.name}
              integration={integration}
              onToggle={() => handleToggle(integration.name)}
              onConfigure={() => handleConfigure(integration)}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Text fontSize="lg" fontWeight="medium">
          Please select an account to view available integrations.
        </Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{currentIntegration?.name} Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={4}>
              {currentIntegration?.configOptions?.map((option, index) => (
                <Box key={index}>
                  <Text fontWeight="medium">
                    {option} 
                  </Text>
                  {/* Add actual configuration form fields here */}
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default IntegrationsPage;
