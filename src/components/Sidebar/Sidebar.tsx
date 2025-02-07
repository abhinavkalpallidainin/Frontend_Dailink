import React, { useCallback } from "react";
import {
  Box,
  VStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Icon,
  useColorModeValue,
  useToast,
  Heading,
} from "@chakra-ui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaChartLine,
  FaUserPlus,
  FaSearch,
  FaBullhorn,
  FaChevronDown,
  FaSync,
  FaSignOutAlt,
  FaInbox,
  FaAddressBook,
  FaCog,
  FaUsers,
  FaFilter,
  FaRobot,
  FaPlug,
  FaCubes,
  FaUserFriends,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { motion } from "framer-motion";
import {
  useAccount,
  CombinedLinkedInAccount,
} from "../../contexts/AccountContext";

interface SidebarProps {
  onLogout: () => Promise<void>;
}

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { accounts, selectedAccount, setSelectedAccount, syncAccounts, user } =
    useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue("gray.800", "gray.900");
  const textColor = useColorModeValue("gray.100", "gray.50");
  const hoverBgColor = useColorModeValue("gray.700", "gray.800");
  const activeBgColor = useColorModeValue("blue.500", "blue.600");
  const menuBgColor = useColorModeValue("gray.700", "gray.800");
  const menuHoverBgColor = useColorModeValue("gray.600", "gray.700");
  const menuTextColor = useColorModeValue("gray.100", "gray.50");
  const dividerColor = useColorModeValue("gray.600", "gray.700");

  const handleInboxClick = useCallback(() => {
    if (selectedAccount) {
      navigate(`/messaging/${selectedAccount.id}`);
    } else {
      toast({
        title: "No account selected",
        description: "Please select an account to view messages.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedAccount, navigate, toast]);

  const navItems = [
    { name: "Dashboard", icon: FaHome, path: "/" },
    { name: "Campaigns", icon: FaChartLine, path: "/campaigns" },
    { name: "Search", icon: FaSearch, path: "/search" },
    { name: "Ideal Client", icon: FaUserFriends, path: "/ideal-client" },
    { name: "CRM", icon: FaAddressBook, path: "/crm" },
    { name: "Inbox", icon: FaInbox, onClick: handleInboxClick },
    { name: "Settings", icon: FaCog, path: "/settings" },
    { name: "My Assistant", icon: FaRobot, path: "/my-assistant" },
    { name: "HayStacks", icon: FaCubes, path: "/HayStacks" },
    {
      name: "Integrations",
      icon: FaPlug,
      path: "/integrations",
    },
    ...(user?.role === "admin" ? [{ name: "Admin", icon: MdOutlineAdminPanelSettings, path: "/admin-dashboard" }] : [])
  ];

  const handleConnect = useCallback(() => {
    navigate("/connect");
  }, [navigate]);

  const handleManageAccounts = useCallback(() => {
    navigate("/manage-accounts");
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await onLogout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [navigate, toast, onLogout]);

  const handleRefreshAccounts = useCallback(async () => {
    try {
      await syncAccounts();
      toast({
        title: "Accounts refreshed",
        description: "Your DAILINK accounts have been successfully updated.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      toast({
        title: "Refresh failed",
        description:
          "An error occurred while refreshing accounts. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [syncAccounts, toast]);

  const handleAccountSelect = useCallback(
    (account: CombinedLinkedInAccount) => {
      setSelectedAccount(account);
      toast({
        title: "Account selected",
        description: `You are now using the account: ${account.name}`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      navigate("/");
    },
    [setSelectedAccount, navigate, toast]
  );

  return (
    <MotionBox
      as="nav"
      pos="fixed"
      h="100vh"
      w="250px"
      bg={bgColor}
      color={textColor}
      p={5}
      boxShadow="0 4px 12px 0 rgba(0, 0, 0, 0.05)"
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <VStack spacing={6} align="stretch" h="full">
        <Heading
          as="h1"
          size="xl"
          fontWeight="bold"
          mb={4}
          bgGradient="linear(to-r, blue.400, teal.400)"
          bgClip="text"
        >
          DAILINK
        </Heading>
        <VStack spacing={2} align="stretch">
          {navItems.map((item) => (
            <MotionButton
              key={item.name}
              as={item.path ? Link : undefined}
              to={item.path}
              onClick={item.onClick}
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              variant="ghost"
              justifyContent="flex-start"
              bg={
                location.pathname === item.path ? activeBgColor : "transparent"
              }
              color={textColor}
              _hover={{ bg: hoverBgColor }}
              w="full"
              borderRadius="md"
              fontWeight="medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.name}
            </MotionButton>
          ))}
        </VStack>
        <Divider my={4} borderColor={dividerColor} />
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<FaChevronDown />}
            w="full"
            color={textColor}
            bg={hoverBgColor}
            _hover={{ bg: menuHoverBgColor }}
            _active={{ bg: menuHoverBgColor }}
          >
            {selectedAccount ? selectedAccount.name : "Select Account"}
          </MenuButton>
          <MenuList bg={menuBgColor} borderColor={hoverBgColor} boxShadow="xl">
            {accounts.length > 0 && (
              <>
                {accounts.map((account) => (
                  <MenuItem
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    bg={
                      account.id === selectedAccount?.id
                        ? activeBgColor
                        : "transparent"
                    }
                    color={menuTextColor}
                    _hover={{ bg: menuHoverBgColor }}
                  >
                    {account.name}
                  </MenuItem>
                ))}
                <Divider my={2} borderColor={dividerColor} />
                <MenuItem
                  onClick={handleConnect}
                  icon={
                    <Icon as={FaUserPlus} boxSize={4} color={menuTextColor} />
                  }
                  color={menuTextColor}
                  bg="transparent"
                  _hover={{ bg: menuHoverBgColor }}
                >
                  Connect New Account
                </MenuItem>
              </>
            )}
            {user?.role === "admin" && (
              <>
                <MenuItem
                  onClick={handleManageAccounts}
                  icon={<Icon as={FaUsers} boxSize={4} color={menuTextColor} />}
                  color={menuTextColor}
                  bg="transparent"
                  _hover={{ bg: menuHoverBgColor }}
                >
                  Manage Accounts
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
        <MotionButton
          leftIcon={<Icon as={FaSync} boxSize={4} />}
          onClick={handleRefreshAccounts}
          variant="outline"
          size="sm"
          color={textColor}
          borderColor={textColor}
          _hover={{ bg: hoverBgColor }}
          mt={2}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Refresh Accounts
        </MotionButton>
        <MotionButton
          leftIcon={<Icon as={FaSignOutAlt} boxSize={4} />}
          onClick={handleLogout}
          variant="outline"
          size="sm"
          color={textColor}
          borderColor={textColor}
          _hover={{ bg: hoverBgColor }}
          mt="auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Logout
        </MotionButton>
      </VStack>
    </MotionBox>
  );
};

export default Sidebar;
