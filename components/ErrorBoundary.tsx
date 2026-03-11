
import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button, Stack } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box className="fixed inset-0 bg-red-50 flex items-center justify-center p-10 z-[9999]">
          <Stack align="center" gap="xl" className="max-w-md text-center bg-white border-4 border-black p-10 shadow-[12px_12px_0_black]">
            <Text className="text-6xl">⚠️</Text>
            <h1 className="text-2xl font-black uppercase">Something went wrong</h1>
            <Text className="text-sm font-bold text-red-600 font-mono break-all">
              {this.state.error?.message}
            </Text>
            <Button 
              color="dark" 
              className="rounded-none border-2 border-black shadow-[4px_4px_0_black] uppercase font-black"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
