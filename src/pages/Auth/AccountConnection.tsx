import React, { useState } from "react";
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,

} from "@chakra-ui/react";
import { connectLinkedInAccount, solveLinkedInCheckpoint } from "../../utils/api";
import CaptchaDisplay from "../../components/Captcha/CaptchaDisplay";

interface AccountConnectionProps {
  onAccountAdded: () => Promise<void>;
}

const AccountConnection: React.FC<AccountConnectionProps> = ({
  onAccountAdded,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkpointRequired, setCheckpointRequired] = useState(false);
  const [checkpointCode, setCheckpointCode] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const toast = useToast();

  const decodeBase64Captcha = (data: string): string => {
    let sanitized = data.split(":")[0]; 
    sanitized = sanitized.replace(/\./g, "+").replace(/_/g, "/"); 
    const missingPadding = sanitized.length % 4;
    if (missingPadding) {
      sanitized += "=".repeat(4 - missingPadding); 
    }
    return sanitized;
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await connectLinkedInAccount(username, password);

      if (response.object === "Checkpoint") {        
        const { checkpoint, account_id } = response;

        if (checkpoint?.type === "CAPTCHA") {
          setCheckpointRequired(true);
          setAccountId(account_id);

          toast({
            title: "Checkpoint required",
            description:
              "CAPTCHA verification is needed to connect the account. Please proceed.",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          const decodedCaptcha = decodeBase64Captcha(checkpoint.data);
          setCaptcha(decodedCaptcha)
        } else {
          toast({
            title: "Unsupported checkpoint",
            description: `A checkpoint of type ${checkpoint?.type} is required. Please contact support.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: "Account connected",
          description: "Your LinkedIn account has been successfully connected.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        await onAccountAdded();
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      console.error("Connection error:", error); 
      toast({
        title: "Connection failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setIsLoading(true);
    try {
      const response = await solveLinkedInCheckpoint(accountId, checkpointCode);
      if (response.status === "RUNNING") {
        toast({
          title: "Account connected",
          description: "Your LinkedIn account has been successfully connected.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        await onAccountAdded();
        setCheckpointRequired(false);
        setCheckpointCode("");
        setAccountId(null);
      } else {
        toast({
          title: "Checkpoint failed",
          description: "Failed to verify the checkpoint. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Checkpoint failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="container.sm" mx="auto" p={4}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">
          Connect LinkedIn Account
        </Heading>

        {!checkpointRequired ? (
          <form onSubmit={handleConnect}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>LinkedIn Email</FormLabel>
                <Input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your LinkedIn email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>LinkedIn Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your LinkedIn password"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                Connect Account
              </Button>
            </VStack>
          </form>
        ) : (
          <form onSubmit={handleSolveCheckpoint}>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <AlertTitle mr={2}>Checkpoint Required</AlertTitle>
              </Alert>
              <FormControl isRequired>
                <FormLabel>Checkpoint Code</FormLabel>
                <CaptchaDisplay
                captcha={captcha}
                checkpointCode={checkpointCode}
                setCheckpointCode={setCheckpointCode}
              />
                <Input
                  type="text"
                  value={checkpointCode}
                  onChange={(e) => setCheckpointCode(e.target.value)}
                  placeholder="Enter the checkpoint code"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isLoading}>
                Verify Code
              </Button>
            </VStack>
          </form>
        )}

        <Text fontSize="sm" color="gray.500">
          By connecting your LinkedIn account, you agree to our Terms of Service
          and Privacy Policy.
        </Text>
      </VStack>
    </Box>
  );
};

export default AccountConnection;
