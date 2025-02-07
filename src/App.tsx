import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { AccountProvider, useAccount } from "./contexts/AccountContext";
import { ListProvider } from "./contexts/ListContext";
import { supabase } from "./utils/supabase";
import theme from "./theme";

// Import components
import Sidebar from "./components/Sidebar/Sidebar";
import IntegrationsPage from "./pages/Integrations/IntegrationsPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import CampaignDashboard from "./pages/Campaign/CampaignDashboard";
import CampaignEditPage from "./pages/Campaign/CampaignEditPage";
import AccountConnection from "./pages/Auth/AccountConnection";
import SearchPage from "./pages/Search/SearchPage";
import MyAssistantPage from "./pages/MyAssistant/MyAssistantPage";
import MessagingPage from "./pages/Inbox/MessagingPage";
import ManageAccounts from "./pages/Accounts/ManageAccounts";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import CRMPage from "./pages/Crm/CRMPage";
import HayStacks from "./pages/Haystacks/HayStacks";
import DaininBotsConfigurationPage from "./pages/DaininBots/DaininBotsConfigurationPage";
import PrevHSRuns from "./pages/Hsc/PrevHSRuns";
import SellHSC from "./pages/Hsc/SellHSC";
import HSCDashboard from "./pages/Hsc/HSCDashboard";
import IdealClientPage from "./pages/IdealClient/IdealClientPage";
import AdminDashboard from "./pages/Admin/Dashboard/AdminDashboard";
import UserManagement from "./pages/Admin/UserManagement/UserManagement";
import SignupPage from "./pages/Auth/SignupPage";

// Auth middleware
const AuthMiddleware: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAccount, accounts, user } = useAccount();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (
        !session &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup"
      ) {
        navigate("/login");
      } else if (
        session &&
        !selectedAccount &&
        accounts.length > 0 &&
        location.pathname !== "/manage-accounts"
      ) {
        navigate("/manage-accounts");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [location, navigate, selectedAccount, accounts, user]);

  if (isLoading) {
    return (
      <VStack spacing={4} align="center" justify="center" height="100vh">
        <Spinner size="xl" />
        <Text>Loading...</Text>
      </VStack>
    );
  }

  return <>{children}</>;
};
const AdminMiddleware: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAccount();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else if (user?.role !== "admin") {
        navigate("/");
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [location, navigate, user]);

  if (isLoading) {
    return (
      <VStack spacing={4} align="center" justify="center" height="100vh">
        <Spinner size="xl" />
        <Text>Loading...</Text>
      </VStack>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { setSelectedAccount, refreshAccounts } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await refreshAccounts();
    navigate("/manage-accounts");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedAccount(null);
    await refreshAccounts();
    navigate("/login");
  };

  const handleAccountAdded = async () => {
    await refreshAccounts();
    navigate("/manage-accounts");
  };

  const showSidebar =
    location.pathname !== "/login" && location.pathname !== "/signup";

  return (
    <ChakraProvider theme={theme}>
      <Flex minHeight="100vh">
        {showSidebar && <Sidebar onLogout={handleLogout} />}
        <Box
          flex={1}
          ml={showSidebar ? "250px" : 0}
          transition="margin-left 0.3s"
        >
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signupUnipile" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <AuthMiddleware>
                  <Dashboard />
                </AuthMiddleware>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <AdminMiddleware>
                  <AdminDashboard />
                </AdminMiddleware>
              }
            />
            <Route
              path="/admin-user-management"
              element={
                <AdminMiddleware>
                  <UserManagement />
                </AdminMiddleware>
              }
            />
            <Route
              path="/campaigns"
              element={
                <AuthMiddleware>
                  <CampaignDashboard />
                </AuthMiddleware>
              }
            />
            <Route
              path="/campaigns/:id/edit"
              element={
                <AuthMiddleware>
                  <CampaignEditPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/my-assistant"
              element={
                <AuthMiddleware>
                  <MyAssistantPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/connect"
              element={
                <AuthMiddleware>
                  <AccountConnection onAccountAdded={handleAccountAdded} />
                </AuthMiddleware>
              }
            />
            <Route
              path="/search"
              element={
                <AuthMiddleware>
                  <SearchPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/Haystacks"
              element={
                <AuthMiddleware>
                  <HayStacks />
                </AuthMiddleware>
              }
            />
            <Route
              path="/Haystacks/show-previous-runs"
              element={
                <AuthMiddleware>
                  <PrevHSRuns />
                </AuthMiddleware>
              }
            />
            <Route
              path="/Haystacks/sell-haystacks-champions"
              element={
                <AuthMiddleware>
                  <SellHSC />
                </AuthMiddleware>
              }
            />
            <Route
              path="/Haystacks/HSC-dashboard"
              element={
                <AuthMiddleware>
                  <HSCDashboard />
                </AuthMiddleware>
              }
            />
            <Route
              path="/ideal-client"
              element={
                <AuthMiddleware>
                  <IdealClientPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/messaging/:accountId"
              element={
                <AuthMiddleware>
                  <MessagingPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/integrations"
              element={
                <AuthMiddleware>
                  <IntegrationsPage />
                </AuthMiddleware>
              }
            />
            <Route
              path="/dainin-bots-configuration"
              element={
                <AuthMiddleware>
                  <DaininBotsConfigurationPage />
                </AuthMiddleware>
              }
            />

            <Route
              path="/Haystacks/run-setup"
              element={
                <AuthMiddleware>
                  <IdealClientPage />
                </AuthMiddleware>
              }
            />

            <Route
              path="/manage-accounts"
              element={
                <AuthMiddleware>
                  <ManageAccounts />
                </AuthMiddleware>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthMiddleware>
                  <Settings />
                </AuthMiddleware>
              }
            />
            <Route
              path="/crm"
              element={
                <AuthMiddleware>
                  <CRMPage />
                </AuthMiddleware>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Flex>
    </ChakraProvider>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <Router>
      <AccountProvider>
        <ListProvider>
          <App />
        </ListProvider>
      </AccountProvider>
    </Router>
  );
};

export default AppWrapper;
