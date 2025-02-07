import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useAccount } from './AccountContext';
import { supabase } from '../utils/supabase';
import { HSCRun } from '../types/type';

interface HSCContextType {
  currentRun: HSCRun | null;
  currentRunId: string | null;
  isLoading: boolean;
  refreshCurrentRun: () => Promise<void>;
}

const HSCContext = createContext<HSCContextType | undefined>(undefined);

export const HSCProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currentRun, setCurrentRun] = useState<HSCRun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedAccount } = useAccount();
  const toast = useToast();

  const checkInProgressRun = useCallback(async () => {
    if (!selectedAccount?.user_id) {
      setCurrentRun(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: inProgressRun } = await supabase
        .from('hsc_runs')
        .select('*')
        .eq('user_id', selectedAccount.user_id)
        .eq('status', 'in_progress')
        .single();
      setCurrentRun(inProgressRun);
    } catch (error) {
      console.error('Error checking in-progress HSC run:', error);
      toast({
        title: 'Error',
        description: 'Failed to check for in-progress HSC run',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setCurrentRun(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount?.user_id, toast]);

  useEffect(() => {
    checkInProgressRun();
  }, [checkInProgressRun]);

  const refreshCurrentRun = useCallback(async () => {
    await checkInProgressRun();
  }, [checkInProgressRun]);

  const value = {
    currentRun,
    currentRunId: currentRun?.id || null,
    isLoading,
    refreshCurrentRun,
  };

  return (
    <HSCContext.Provider value={value}>
      {children}
    </HSCContext.Provider>
  );
};

export const useHSC = (): HSCContextType => {
  const context = useContext(HSCContext);
  if (context === undefined) {
    throw new Error('useHSC must be used within a HSCProvider');
  }
  return context;
};

export default HSCContext;