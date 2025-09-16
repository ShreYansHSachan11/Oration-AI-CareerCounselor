'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  withLoading: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  const setLoading = useCallback(
    (loading: boolean, message?: string, progress?: number) => {
      setLoadingState({
        isLoading: loading,
        message,
        progress,
      });
    },
    []
  );

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>, message?: string): Promise<T> => {
      setLoading(true, message);
      try {
        const result = await promise;
        setLoading(false);
        return result;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setLoading]
  );

  return (
    <LoadingContext.Provider value={{ loadingState, setLoading, withLoading }}>
      {children}
      <GlobalLoadingOverlay loadingState={loadingState} />
    </LoadingContext.Provider>
  );
}

interface GlobalLoadingOverlayProps {
  loadingState: LoadingState;
}

function GlobalLoadingOverlay({ loadingState }: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {loadingState.isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-card border rounded-lg p-6 shadow-lg max-w-sm w-full mx-4"
          >
            <div className="flex items-center gap-4">
              <Spinner className="h-6 w-6" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {loadingState.message || 'Loading...'}
                </p>
                {loadingState.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingState.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(loadingState.progress)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
