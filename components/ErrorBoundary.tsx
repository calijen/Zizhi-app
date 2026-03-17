import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text, Button, Stack } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box className="min-h-screen bg-[#fdf6e3] flex items-center justify-center p-6">
          <Stack align="center" gap="xl" className="max-w-md w-full text-center">
            <Box className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Text className="text-4xl">⚠️</Text>
            </Box>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#1a110a]">
              Something went wrong
            </h1>
            <Text className="text-sm font-medium text-[#3a2a1a]/70 leading-relaxed">
              An unexpected error occurred. We've been notified and are looking into it.
            </Text>
            {this.state.error && (
              <Box className="p-4 bg-black/5 rounded-lg border-2 border-black/10 w-full overflow-auto max-h-32">
                <code className="text-[10px] font-mono text-red-600">
                  {this.state.error.toString()}
                </code>
              </Box>
            )}
            <Button 
              variant="filled" 
              color="dark" 
              className="rounded-none border-2 border-black font-black uppercase shadow-[4px_4px_0_black] hover:translate-y-[-2px] transition-all"
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
