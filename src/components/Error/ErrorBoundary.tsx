import React, { ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button, Heading, VStack } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box textAlign="center" py={10} px={6}>
          <VStack spacing={4}>
            <Heading as="h2" size="xl" color="red.500">
              Oops! Something went wrong.
            </Heading>
            <Text fontSize="xl" mt={3} mb={2}>
              We're sorry — something's gone wrong. Please try again.
            </Text>
            {process.env.NODE_ENV === 'development' && (
              <Box 
                maxWidth="800px" 
                overflowX="auto" 
                bg="gray.100" 
                p={4} 
                borderRadius="md"
                textAlign="left"
              >
                <Text fontWeight="bold">Error:</Text>
                <Text>{this.state.error && this.state.error.toString()}</Text>
                <Text fontWeight="bold" mt={2}>Stack Trace:</Text>
                <Text whiteSpace="pre-wrap">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Text>
              </Box>
            )}
            <Button
              colorScheme="teal"
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            >
              Try again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;