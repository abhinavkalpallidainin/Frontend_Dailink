import { supabase } from './supabase';
import {
  Campaign,
  Action,
  ActionType,
  Lead,
  ExecutionLog,
  ScrapedProfile,
  ActionConfig,
  CRMProfile
} from '../types/type';
import { getLinkedInUserProfile } from './api';

async function getLinkedInAccountId(unipileId: string): Promise<string> {
  try {
    const { data: existingAccount, error: fetchError } = await supabase
      .from('linkedin_accounts')
      .select('unipile_id')
      .eq('unipile_id', unipileId)
      .single();

    if (fetchError) throw fetchError;

    if (existingAccount && existingAccount.unipile_id) {
      return existingAccount.unipile_id;
    }

    throw new Error(`No LinkedIn account found for unipileId: ${unipileId}`);
  } catch (error) {
    console.error('Error in getLinkedInAccountId:', error);
    throw error;
  }
}

export const getCampaigns = async (unipileId: string): Promise<Campaign[]> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('account_id', unipileId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    throw error;
  }
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> => {
  try {
    const linkedInAccountId = await getLinkedInAccountId(campaign.account_id);
  
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        account_id: linkedInAccountId,
        workflow: campaign.workflow || [],
        daily_limit: campaign.daily_limit || 0,
        target_connections: campaign.target_connections || null,
        time_zone: campaign.time_zone || null,
        start_date: campaign.start_date || null,
        end_date: campaign.end_date || null,
        auto_stop_empty_queue: campaign.auto_stop_empty_queue || false,
        execution_window_start: campaign.execution_window_start || null,
        execution_window_end: campaign.execution_window_end || null
      })
      .select()
      .single();
  
    if (error) throw error;
    if (!data) throw new Error('Failed to add campaign: No data returned');

    return data;
  } catch (error) {
    console.error('Error in createCampaign:', error);
    throw error;
  }
};

export const updateCampaign = async (id: number, updates: Partial<Campaign>): Promise<Campaign> => {
  try {
    const allowedFields = [
      'name', 'type', 'status', 'daily_limit', 'target_connections', 
      'time_zone', 'start_date', 'end_date', 'auto_stop_empty_queue', 
      'execution_window_start', 'execution_window_end', 'workflow'
    ] as const;

    type AllowedField = typeof allowedFields[number];

    const filterUpdates = (updates: Partial<Campaign>): Partial<Pick<Campaign, AllowedField>> => {
      return Object.entries(updates).reduce((acc, [key, value]) => {
        if (allowedFields.includes(key as AllowedField) && value !== undefined) {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<Pick<Campaign, AllowedField>>);
    };

    const filteredUpdates = filterUpdates(updates);

    const { data, error } = await supabase
      .from('campaigns')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to update campaign: No data returned');

    return data;
  } catch (error) {
    console.error('Error in updateCampaign:', error);
    throw error;
  }
};

export const deleteCampaign = async (id: number): Promise<void> => {
  try {
    const { error: logsError } = await supabase
      .from('execution_logs')
      .delete()
      .eq('campaign_id', id);

    if (logsError) throw logsError;

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error in deleteCampaign:', error);
    throw error;
  }
};

export const getCampaign = async (id: string | number): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`No campaign found with id: ${id}`);

    return data;
  } catch (error) {
    console.error('Error in getCampaign:', error);
    throw error;
  }
};

export const getActionStats = async (campaignId: number): Promise<{ successful: number; failed: number; queue: number; last24Hours: number; total: number }> => {
  try {
    if (!campaignId) {
      throw new Error('Invalid campaign ID');
    }

    const { data: actions, error: actionsError } = await supabase
      .from('action_configurations')
      .select('successful, failed, queue, action_type')
      .eq('campaign_id', campaignId);

    if (actionsError) throw actionsError;

    if (!actions || actions.length === 0) {
      return { successful: 0, failed: 0, queue: 0, last24Hours: 0, total: 0 };
    }

    const stats = actions.reduce((acc, action) => ({
      successful: acc.successful + (action.successful || 0),
      failed: acc.failed + (action.failed || 0),
      queue: acc.queue + (action.queue || 0)
    }), { successful: 0, failed: 0, queue: 0 });

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { count: last24HoursCount, error: last24HoursError } = await supabase
      .from('action_queues')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .gte('created_at', yesterday.toISOString());

    if (last24HoursError) throw last24HoursError;

    const { count: totalCount, error: totalError } = await supabase
      .from('action_queues')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (totalError) throw totalError;

    return {
      ...stats,
      last24Hours: last24HoursCount || 0,
      total: totalCount || 0
    };
  } catch (error) {
    console.error('Error getting action stats:', error);
    throw error;
  }
};

export const getAction = async (actionId: number): Promise<Action> => {
  try {
    const { data, error } = await supabase
      .from('action_configurations')
      .select('*')
      .eq('id', actionId)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`No action found with id: ${actionId}`);

    // Extract custom_name from the config
    const custom_name = data.config.custom_name;
    const configWithoutCustomName = { ...data.config };
    delete configWithoutCustomName.custom_name;

    return {
      id: data.id,
      campaign_id: data.campaign_id,
      type: data.action_type as ActionType,
      order: data.action_order,
      name: data.name,
      custom_name: custom_name || undefined,
      icon: getActionIcon(data.action_type as ActionType),
      config: configWithoutCustomName,
      queue: data.queue || 0,
      successful: data.successful || 0,
      failed: data.failed || 0,
      excluded: data.excluded || 0,
      pending: data.pending || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in getAction:', error);
    throw error;
  }
};

function getActionIcon(actionType: ActionType): React.ReactNode {
  // Implement this function based on your UI library and icon set
  return null;
}

export const createAction = async (action: Omit<Action, 'id' | 'created_at' | 'updated_at'>): Promise<Action> => {
  try {
    const { data, error } = await supabase
      .from('action_configurations')
      .insert({
        campaign_id: action.campaign_id,
        action_type: action.type,
        action_order: action.order,
        name: action.name,
        config: action.config
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create action: No data returned');

    return {
      ...action,
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in createAction:', error);
    throw error;
  }
};

export const updateAction = async (action: Action): Promise<Action> => {
  try {
    if (typeof action.id !== 'number' || isNaN(action.id)) {
      throw new Error('Invalid action ID');
    }

    const { data, error } = await supabase
      .from('action_configurations')
      .update({
        action_type: action.type,
        action_order: action.order,
        custom_name: action.custom_name,
        name: action.name,
        config: action.config
      })
      .eq('id', action.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update action: No data returned');

    return {
      ...action,
      ...data,
      type: data.action_type as ActionType,
      order: data.action_order,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in updateAction:', error);
    throw error;
  }
};

export const deleteAction = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('action_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete action: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in deleteAction:', error);
    throw error;
  }
};

export const getActionsPerformedToday = async (campaignId: number): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('execution_logs')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .gte('timestamp', today)
      .eq('status', 'completed');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error in getActionsPerformedToday:', error);
    throw error;
  }
};

export const getExecutionLogs = async (campaignId: number): Promise<ExecutionLog[]> => {
  try {
    const { data, error } = await supabase
      .from('execution_logs')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    throw error;
  }
};

export const logExecution = async (
  campaignId: number,
  actionType: string,
  status: 'running' | 'completed' | 'failed' | 'stopped' | 'delaying',
  message: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('execution_logs')
      .insert({ campaign_id: campaignId, action_type: actionType, status, message });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging execution:', error);
    throw error;
  }
};

export const getLeadsCount = async (campaignId: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting leads count:', error);
    throw error;
  }
};

export const getLeadsForCampaign = async (campaignId: number): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        crm_profiles!fk_crm_profile(*)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'queued');

    if (error) throw error;
    
    return data.map(lead => ({
      ...lead,
      crm_profiles: lead.crm_profiles,
      lh_id: lead.crm_profiles.linkedin_id
    })) || [];
  } catch (error) {
    console.error('Error fetching leads for campaign:', error);
    throw error;
  }
};

export const getCampaignActions = async (campaignId: number): Promise<Action[]> => {
  try {
    const { data, error } = await supabase
      .from('action_configurations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('action_order', { ascending: true });

    if (error) throw error;

    return data.map(action => ({
      ...action,
      type: action.action_type as ActionType,
      config: typeof action.config === 'string' ? JSON.parse(action.config) : action.config,
    }));
  } catch (error) {
    console.error('Error fetching campaign actions:', error);
    throw error;
  }
};

export const getLeadsForAction = async (campaignId: number, actionId: number, status: string): Promise<Lead[]> => {
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        crm_profiles(*)
      `)
      .eq('campaign_id', campaignId)
      .eq('current_action_id', actionId)
      .eq('status', status);

    if (error) throw error;
    
    return data.map(lead => ({
      ...lead,
      lhId: lead.crm_profiles.linkedin_id
    })) || [];
  } catch (error) {
    console.error(`Error fetching ${status} leads for action:`, error);
    throw error;
  }
};

export const deleteLead = async (campaignId: number, leadId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campaign_leads')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('id', leadId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

export const moveLeadToNextAction = async (campaignId: number, leadId: string, currentActionId: number, nextActionId: number): Promise<void> => {
  try {
    // Update campaign_leads table
    const { error: leadError } = await supabase
      .from('campaign_leads')
      .update({
        current_action_id: nextActionId,
        status: 'queued',
        funnel_status: 'queue',
        action_status: null,
        next_action_date: null
      })
      .eq('id', leadId)
      .eq('campaign_id', campaignId);

    if (leadError) throw leadError;

    // Get the action type for the next action
    const { data: nextAction, error: actionError } = await supabase
      .from('action_configurations')
      .select('action_type')
      .eq('id', nextActionId)
      .single();

    if (actionError) throw actionError;

    // Check if the action queue entry already exists
    const { data: existingQueue, error: existingQueueError } = await supabase
      .from('action_queues')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('action_type', nextAction.action_type)
      .eq('lead_id', leadId)
      .single();

    if (existingQueueError && existingQueueError.code !== 'PGRST116') throw existingQueueError;

    if (!existingQueue) {
      // Insert new action queue entry only if it doesn't exist
      const { error: queueError } = await supabase
        .from('action_queues')
        .insert({
          campaign_id: campaignId,
          action_type: nextAction.action_type,
          lead_id: leadId,
          campaign_lead_id: leadId,
          status: 'queued'
        });

      if (queueError) throw queueError;
    }

    // Update action stats
    await updateActionStats(nextActionId, 'queued');
  } catch (error) {
    console.error('Error moving lead to next action:', error);
    throw error;
  }
};

export const updateActionStats = async (actionId: number, status: 'successful' | 'failed' | 'queued'): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('action_configurations')
      .select('successful, failed, queue')
      .eq('id', actionId)
      .single();

    if (error) throw error;

    const updates: { successful?: number; failed?: number; queue?: number } = {};

    if (status === 'successful') {
      updates.successful = (data.successful || 0) + 1;
      updates.queue = Math.max((data.queue || 0) - 1, 0);
    } else if (status === 'failed') {
      updates.failed = (data.failed || 0) + 1;
      updates.queue = Math.max((data.queue || 0) - 1, 0);
    } else if (status === 'queued') {
      updates.queue = (data.queue || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('action_configurations')
      .update(updates)
      .eq('id', actionId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating action stats:', error);
    throw error;
  }
};

export const resetActionStats = async (campaignId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('action_configurations')
      .update({ successful: 0, failed: 0, queue: 0 })
      .eq('campaign_id', campaignId);

    if (error) throw error;
  } catch (error) {
    console.error('Error resetting action stats:', error);
    throw error;
  }
};

export const updateLeadStatus = async (campaignId: number, leadId: string, status: 'successful' | 'failed' | 'processed', actionId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campaign_leads')
      .update({ 
        status, 
        funnel_status: status,
        current_action_id: actionId,
        last_action_date: new Date().toISOString(),
        action_status: status
      })
      .eq('id', leadId)
      .eq('campaign_id', campaignId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

export const scrapeProfile = async (campaignId: number, leadId: string, useSalesNavigator: boolean): Promise<ScrapedProfile | null> => {
  try {
    const { data: lead, error: leadError } = await supabase
      .from('campaign_leads')
      .select('lh_id, campaign_id')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('account_id')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    const profile = await getLinkedInUserProfile(campaign.account_id, lead.lh_id, useSalesNavigator);

    const scrapedProfileData: ScrapedProfile = {
      id: profile.provider_id,
      user_id: (await supabase.auth.getUser()).data.user?.id || '',
      linkedin_id: profile.provider_id,
      provider_id: profile.provider_id,
      public_identifier: profile.public_identifier,
      first_name: profile.first_name,
      last_name: profile.last_name,
      headline: profile.headline,
      location: profile.location,
      connections_count: profile.connections_count,
      shared_connections_count: profile.shared_connections_count,
      websites: profile.websites,
      public_profile_url: profile.public_profile_url,
      summary: profile.summary,
      is_premium: profile.is_premium,
      is_open_to_work: profile.is_open_to_work,
      is_open_profile: profile.is_open_profile,
      skills: profile.skills,
      education: profile.education,
      work_experience: profile.work_experience,
      languages: profile.languages,
      volunteering_experience: profile.volunteering_experience,
      contact_info: profile.contact_info,
      profile_picture_url: profile.profile_picture_url,
    };

    const { data, error: upsertError } = await supabase
      .from('scraped_profiles')
      .upsert(scrapedProfileData, { onConflict: 'linkedin_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return data;
  } catch (error) {
    console.error('Error scraping profile:', error);
    return null;
  }
};

export const calculateActionQueues = async (campaignId: number): Promise<{ [actionId: number]: number }> => {
  try {
    const actions = await getCampaignActions(campaignId);
    const queueCounts: { [actionId: number]: number } = {};

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      let query = supabase
        .from('campaign_leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('status', 'queued');

      if (i === 0) {
        // For the first action, count all queued leads
        const { count, error } = await query;
        if (error) throw error;
        queueCounts[action.id] = count || 0;
      } else {
        // For subsequent actions, count leads that have completed the previous action
        const prevAction = actions[i - 1];
        const { count, error } = await query
          .gte('current_action_id', prevAction.id);
        if (error) throw error;
        queueCounts[action.id] = count || 0;
      }
    }

    return queueCounts;
  } catch (error) {
    console.error('Error calculating action queues:', error);
    throw error;
  }
};

export const getActionQueueCount = async (campaignId: number, actionId: number): Promise<number> => {
  try {
    const queueCounts = await calculateActionQueues(campaignId);
    return queueCounts[actionId] || 0;
  } catch (error) {
    console.error('Error in getActionQueueCount:', error);
    throw error;
  }
};

export const markLeadAsCompleted = async (leadId: string, campaignId: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campaign_leads')
      .update({ 
        status: 'completed', 
        funnel_status: 'completed',
        action_status: 'completed'
      })
      .eq('id', leadId)
      .eq('campaign_id', campaignId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking lead as completed:', error);
    throw error;
  }
};

export const markLeadAsFailed = async (leadId: string, campaignId: number, actionId: number, errorMessage: string): Promise<void> => {
  try {
    const { error: updateLeadError } = await supabase
      .from('campaign_leads')
      .update({ 
        status: 'failed', 
        funnel_status: 'failed',
        error_message: errorMessage
      })
      .eq('id', leadId)
      .eq('campaign_id', campaignId);

    if (updateLeadError) throw updateLeadError;

    const { error: updateActionError } = await supabase.rpc('increment_action_failed', {
      p_action_id: actionId
    });

    if (updateActionError) throw updateActionError;
  } catch (error) {
    console.error('Error marking lead as failed:', error);
    throw error;
  }
};

export const getCRMProfile = async (crm_profile_id: string): Promise<CRMProfile> => {
  try {
    const { data, error } = await supabase
      .from('crm_profiles')
      .select('*')
      .eq('id', crm_profile_id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`No CRM profile found for ID: ${crm_profile_id}`);

    return data;
  } catch (error) {
    console.error('Error fetching CRM profile:', error);
    throw error;
  }
};

const campaignService = {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  getActionStats,
  getAction,
  updateAction,
  getCampaignActions,
  createAction,
  deleteAction,
  getActionsPerformedToday,
  getLeadsCount,
  getExecutionLogs,
  logExecution,
  getLeadsForCampaign,
  getLeadsForAction,
  deleteLead,
  resetActionStats,
  moveLeadToNextAction,
  updateActionStats,
  updateLeadStatus,
  scrapeProfile,
  getActionQueueCount,
  calculateActionQueues,
  markLeadAsCompleted,
  markLeadAsFailed,
  getCRMProfile,
};

export default campaignService;
export type CampaignService = typeof campaignService;