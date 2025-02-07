import React, { useState } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Button,
  FormControl,
  FormLabel,
  Flex,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  useToast,
} from "@chakra-ui/react";
import { FaLinkedin } from "react-icons/fa";
import { connectLinkedInAccount, solveLinkedInCheckpoint } from "../../utils/api"; 
import CaptchaDisplay from "../../components/Captcha/CaptchaDisplay"; 

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [captcha, setCaptcha] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkpointRequired, setCheckpointRequired] = useState<boolean>(false);
  const [checkpointCode, setCheckpointCode] = useState<string>("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const toast = useToast();

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);
  const handleCheckpointCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => setCheckpointCode(event.target.value);

  const decodeBase64Captcha = (data: string): string => {
    const parts = data.split(":");
    if (parts.length > 1) {
      let sanitized = parts[1];
      sanitized = sanitized.replace(/\./g, "+").replace(/_/g, "/");
      const missingPadding = sanitized.length % 4;
      if (missingPadding) {
        sanitized += "=".repeat(4 - missingPadding);
      }
      return `data:image/png;base64,${sanitized}`;
    }
    return "";
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await connectLinkedInAccount(email, password);

      if (response.object === "Checkpoint") {        
        const { checkpoint, account_id } = response;

        if (checkpoint?.type === "CAPTCHA") {
          setCheckpointRequired(true);
          setAccountId(account_id);
          console.log(checkpoint);

          toast({
            title: "Checkpoint required",
            description: "CAPTCHA verification is needed to connect the account. Please proceed.",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          const decodedCaptcha = decodeBase64Captcha(checkpoint.data);
          
          setCaptcha(decodedCaptcha);
        } else if (checkpoint?.type === "IN_APP_VALIDATION") {
          toast({
            title: "Account connected",
            description: "Your LinkedIn account has been successfully connected.",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          setEmail("");
          setPassword("");
        } else {
          toast({
            title: "Unsupported checkpoint",
            description: `A checkpoint of type ${checkpoint?.type} is required. Please contact support.`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      } 
    } catch (error) {
      console.error("Connection error:", error); 
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
        description: error instanceof Error ? error.message : "An unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="white" minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md" border="1px solid gray" borderRadius="md" p={8}>
        <Box borderBottom="1px solid gray" mb={4} pb={4}>
          <Flex align="center" mb={6}>
            <Icon as={FaLinkedin} boxSize={8} mr={2} />
            <Heading as="h2" size="lg">
              Sign in to LinkedIn
            </Heading>
          </Flex>
        </Box>
        <VStack spacing={10} align="stretch" w="100%" padding={2}>
          {!checkpointRequired ? (
            <form onSubmit={handleConnect}>
              <FormControl mb={4}>
                <FormLabel>Email</FormLabel>
                <Input
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  borderRadius="md"
                  bg="white"
                  color="black"
                  borderColor="black"
                  _placeholder={{ color: "gray.500" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Password</FormLabel>
                <Input
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  type="password"
                  borderRadius="md"
                  bg="white"
                  color="black"
                  borderColor="black"
                  _placeholder={{ color: "gray.500" }}
                />
              </FormControl>
              <Flex justify="space-between" padding={7}>
                <Button
                  onClick={() => console.log("Cancel")}
                  bg="white"
                  color="black"
                  border="1px solid black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.700" }}
                >
                  Sign Up
                </Button>
              </Flex>
            </form>
          ) : (
            <form onSubmit={handleSolveCheckpoint}>
              <Alert status="info">
                <AlertIcon />
                <AlertTitle mr={2}>Checkpoint Required</AlertTitle>
              </Alert>
              <FormControl mb={4}>
                <FormLabel>Checkpoint Code</FormLabel>
                <CaptchaDisplay
                  captcha={captcha}
                  checkpointCode={checkpointCode}
                  setCheckpointCode={setCheckpointCode}
                />
                <Input
                  type="text"
                  value={checkpointCode}
                  onChange={handleCheckpointCodeChange}
                  placeholder="Enter the checkpoint code"
                  borderRadius="md"
                  bg="white"
                  color="black"
                  borderColor="black"
                  _placeholder={{ color: "gray.500" }}
                />
              </FormControl>
              <Button
                type="submit"
                isLoading={isLoading}
                bg="black"
                color="white"
                _hover={{ bg: "gray.700" }}
              >
                Verify Code
              </Button>
            </form>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default SignupPage;
