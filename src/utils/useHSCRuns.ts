import { supabase } from './supabase';
import { performLinkedInSearch } from './searchApi';
import { apiRequest } from './api';
import { Filters } from '@/types/search';

// Types
export type HSCStage = 'preparing-run' | 'running' | 'stopped' | 'completed';

export interface HSCRun {
  run_id: number;
  name: string;
  created_at: string;
  linkedin_account_id: string;
  user_id: string;
  use_first_degree: boolean;
  stage: HSCStage;
  champions_list_count: number | null;
  crm_list_id: string | null;
  progress: number;
  last_cursor: string | null;
  second_degree_filter_id: string | null;
  first_degree_filter_id: string | null;
}

export interface HSCRunParams {
  name: string;
  linkedin_account_id: string;
  user_id: string;
  use_first_degree: boolean;
  stage?: HSCStage;
  first_degree_filter_id?: string;
  second_degree_filter_id?: string;
}

export interface HSCRunStats {
  totalRuns: number;
  activeRuns: number;
  totalChampions: number;
  successRate: number;
  recentRuns: HSCRun[];
}

// Fetch all HSC runs for a user
export const fetchAllHSCRunIDs = async (userId: string): Promise<HSCRun[]> => {
  console.log("Fetching all HSC run IDs for user:", userId);
  
  if (!userId) {
    console.error("No user selected");
    throw new Error("Please select a user");
  }

  const { data, error } = await supabase
    .from('hsc_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching HSC runs:', error);
    throw error;
  }

  console.log("Found HSC runs:", data);
  return data || [];
};

// Create new HSC run
export const createHSCRun = async (params: HSCRunParams): Promise<HSCRun> => {
  console.log("Creating HSC run with params:", params);

  try {
    if (!params.linkedin_account_id || !params.user_id) {
      throw new Error('LinkedIn Account ID and User ID are required');
    }

    // Create CRM list first
    const { data: listData, error: listError } = await supabase
      .from('crm_lists')
      .insert({
        name: params.name,
        account_id: params.linkedin_account_id,
        user_id: params.user_id
      })
      .select()
      .single();

    if (listError) {
      console.error('Error creating CRM list:', listError);
      throw listError;
    }

    // Create HSC run
    const { data: runData, error: runError } = await supabase
      .from('hsc_runs')
      .insert({
        name: params.name,
        linkedin_account_id: params.linkedin_account_id,
        user_id: params.user_id,
        use_first_degree: params.use_first_degree,
        stage: params.stage || 'preparing-run',
        crm_list_id: listData.id,
        first_degree_filter_id: params.first_degree_filter_id,
        second_degree_filter_id: params.second_degree_filter_id,
        progress: 0
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating HSC run:', runError);
      throw runError;
    }

    return runData;
  } catch (error) {
    console.error('Error in createHSCRun:', error);
    throw error;
  }
};

// Fetch first-degree connections page
export const fetchFirstDegreeConnectionsPage = async (accountId: string, cursor?: string) => {
  try {
    const queryParams: Record<string, string> = {
      account_id: accountId,
      limit: '100'
    };
    
    if (cursor) {
      queryParams.cursor = cursor;
    }

    const response = await apiRequest(
      '/api/v1/linkedin/search',
      'POST',
      {
        api: 'sales_navigator',
        category: 'people',
        network_distance: [1],
        page_size: 100
      },
      queryParams
    );

    return response;
  } catch (error) {
    console.error('Error fetching first degree connections:', error);
    throw error;
  }
};

// Update HSC run stage
export const updateHSCRunStage = async (runId: number, stage: HSCStage): Promise<HSCRun> => {
  console.log("Updating HSC run stage:", { runId, stage });

  const { data, error } = await supabase
    .from('hsc_runs')
    .update({ stage })
    .eq('run_id', runId)
    .select()
    .single();

  if (error) {
    console.error('Error updating HSC run stage:', error);
    throw error;
  }

  return data;
};

// Update run progress
export const updateHSCRunProgress = async (runId: number, progress: number): Promise<HSCRun> => {
  console.log("Updating HSC run progress:", { runId, progress });

  const { data, error } = await supabase
    .from('hsc_runs')
    .update({ progress })
    .eq('run_id', runId)
    .select()
    .single();

  if (error) {
    console.error('Error updating HSC run progress:', error);
    throw error;
  }

  return data;
};

// Save HSC run cursor
export const saveHSCRunCursor = async (runId: number, cursor: string): Promise<HSCRun> => {
  console.log("Saving cursor for HSC run:", { runId, cursor });

  const { data, error } = await supabase
    .from('hsc_runs')
    .update({ last_cursor: cursor })
    .eq('run_id', runId)
    .select()
    .single();

  if (error) {
    console.error('Error saving HSC run cursor:', error);
    throw error;
  }

  return data;
};

// Get champions list count
export const getChampionsListCount = async (runId: number): Promise<number> => {
  const { data, error } = await supabase
    .from('hsc_runs')
    .select('champions_list_count')
    .eq('run_id', runId)
    .single();

  if (error) {
    console.error('Error fetching champions list count:', error);
    throw error;
  }

  return data?.champions_list_count || 0;
};

// Get HSC run stats
export const getHSCRunStats = async (userId: string): Promise<HSCRunStats> => {
  if (!userId) {
    throw new Error("No user selected");
  }

  const { data, error } = await supabase
    .from('hsc_runs')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching HSC run stats:', error);
    throw error;
  }

  const stats: HSCRunStats = {
    totalRuns: data?.length || 0,
    activeRuns: data?.filter(run => run.stage === 'running').length || 0,
    totalChampions: data?.reduce((sum, run) => sum + (run.champions_list_count || 0), 0) || 0,
    successRate: calculateSuccessRate(data || []),
    recentRuns: (data || []).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 5)
  };

  return stats;
};

// Helper function to calculate success rate
const calculateSuccessRate = (runs: HSCRun[]): number => {
  if (runs.length === 0) return 0;
  const completedRuns = runs.filter(run => run.stage === 'completed');
  return Math.round((completedRuns.length / runs.length) * 100);
};

// Get detailed HSC run information
export const getHSCRunDetails = async (runId: number): Promise<HSCRun & { crm_lists: { name: string; id: string } }> => {
  const { data, error } = await supabase
    .from('hsc_runs')
    .select(`
      *,
      crm_lists (
        name,
        id
      )
    `)
    .eq('run_id', runId)
    .single();

  if (error) {
    console.error('Error fetching HSC run details:', error);
    throw error;
  }

  return data;
};

// Delete HSC run
export const deleteHSCRun = async (runId: number): Promise<void> => {
  const { error } = await supabase
    .from('hsc_runs')
    .delete()
    .eq('run_id', runId);

  if (error) {
    console.error('Error deleting HSC run:', error);
    throw error;
  }
};

// Update HSC run name
export const updateHSCRunName = async (runId: number, name: string): Promise<HSCRun> => {
  const { data, error } = await supabase
    .from('hsc_runs')
    .update({ name })
    .eq('run_id', runId)
    .select()
    .single();

  if (error) {
    console.error('Error updating HSC run name:', error);
    throw error;
  }

  return data;
};

export const checkForCompletedRun = async (userId: string): Promise<boolean> => {
  const runs = await fetchAllHSCRunIDs(userId);
  return runs.length > 0 && runs[0].stage === 'completed';
};

export const checkForIncompleteRun = async (userId: string): Promise<boolean> => {
  const runs = await fetchAllHSCRunIDs(userId);
  return runs.length > 0 && runs[0].stage !== 'completed';
};