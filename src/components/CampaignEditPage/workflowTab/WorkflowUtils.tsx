import { supabase } from '../../../utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ActionType, Action, CRMList, Campaign, ActionConfig } from '../../../types/type';
import { FaUserPlus, FaComments, FaThumbsUp, FaSync, FaEye, FaSearch, FaRocket, FaComment, FaClock } from 'react-icons/fa';
import { retry } from '../../../utils/retryUtility';

let queueSubscription: RealtimeChannel | null = null;

export const setupQueueSubscription = (campaignId: number, onUpdate: (queueCount: number) => void) => {
  if (queueSubscription) {
    queueSubscription.unsubscribe();
  }

  queueSubscription = supabase
    .channel(`queue_updates_${campaignId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'action_queues',
        filter: `campaign_id=eq.${campaignId}`
      },
      async (payload) => {
        const queueCount = await getActionQueueCount(campaignId);
        onUpdate(queueCount);
      }
    )
    .subscribe();

  return () => {
    if (queueSubscription) {
      queueSubscription.unsubscribe();
    }
  };
};

export const getActionQueueCount = async (campaignId: number): Promise<number> => {
  return retry(async () => {
    const { data: actions, error: actionError } = await supabase
      .from('action_configurations')
      .select('id, action_type')
      .eq('campaign_id', campaignId)
      .order('action_order', { ascending: true })
      .limit(1);

    if (actionError) throw actionError;
    if (!actions || actions.length === 0) return 0;

    const firstAction = actions[0];

    const { count, error: queueError } = await supabase
      .from('action_queues')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('action_type', firstAction.action_type)
      .eq('status', 'queued');

    if (queueError) throw queueError;
    return count || 0;
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const fetchCampaignLists = async (campaignId: number): Promise<CRMList[]> => {
  return retry(async () => {
    const { data: campaignListsData, error: campaignListsError } = await supabase
      .from('campaign_lists')
      .select('list_id')
      .eq('campaign_id', campaignId);

    if (campaignListsError) throw campaignListsError;

    const listIds = campaignListsData.map(item => item.list_id);

    const { data: listsData, error: listsError } = await supabase
      .from('crm_lists')
      .select('*, crm_profiles(count)')
      .in('id', listIds);

    if (listsError) throw listsError;

    return listsData.map(list => ({
      ...list,
      leadCount: list.crm_profiles[0].count
    }));
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const fetchCRMLists = async (accountId: string): Promise<CRMList[]> => {
  return retry(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    const { data, error } = await supabase
      .from('crm_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', accountId);

    if (error) throw error;
    return data || [];
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const handleAddToQueue = async (campaignId: number, selectedListId: string): Promise<void> => {
  return retry(async () => {
    console.log(`Starting handleAddToQueue for campaignId: ${campaignId}, selectedListId: ${selectedListId}`);

    // Check if the list is already associated with the campaign
    const { data: existingCampaignList, error: campaignListError } = await supabase
      .from('campaign_lists')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('list_id', selectedListId)
      .maybeSingle();

    if (campaignListError) throw campaignListError;

    if (!existingCampaignList) {
      const { error: insertCampaignListError } = await supabase
        .from('campaign_lists')
        .insert({ campaign_id: campaignId, list_id: selectedListId });

      if (insertCampaignListError) throw insertCampaignListError;
    }

    // Fetch profiles from the selected list
    const { data: profiles, error: profilesError } = await supabase
      .from('crm_profiles')
      .select('id, linkedin_id')
      .eq('list_id', selectedListId);

    if (profilesError) throw profilesError;
    
    console.log(`Fetched ${profiles?.length || 0} profiles`);
    
    if (!profiles || profiles.length === 0) {
      throw new Error('No profiles found in the selected list');
    }

    // Fetch the first action for the campaign
    const { data: firstAction, error: actionError } = await supabase
      .from('action_configurations')
      .select('id, action_type')
      .eq('campaign_id', campaignId)
      .order('action_order', { ascending: true })
      .limit(1)
      .single();

    if (actionError) throw actionError;
    
    console.log(`Fetched first action:`, firstAction);
    
    if (!firstAction) {
      throw new Error('No actions found for this campaign');
    }

    // Prepare campaign leads data
    const campaignLeadsToInsert = profiles.map(profile => ({
      campaign_id: campaignId,
      crm_profile_id: profile.id,
      status: 'queued',
      funnel_status: 'queue',
      current_action_id: firstAction.id,
      lh_id: profile.linkedin_id,
    }));

    // Insert campaign leads
    const { data: insertedCampaignLeads, error: insertCampaignLeadsError } = await supabase
      .from('campaign_leads')
      .insert(campaignLeadsToInsert)
      .select();

    if (insertCampaignLeadsError) throw insertCampaignLeadsError;

    console.log(`Successfully added ${insertedCampaignLeads?.length || 0} leads to the campaign_leads table`);

    // Prepare action queues data
    const actionQueuesToInsert = insertedCampaignLeads.map(lead => ({
      campaign_id: campaignId,
      action_type: firstAction.action_type,
      lead_id: lead.id,
      campaign_lead_id: lead.id,
      status: 'queued',
    }));

    // Insert action queues
    const { data: insertedActionQueues, error: insertActionQueuesError } = await supabase
      .from('action_queues')
      .insert(actionQueuesToInsert)
      .select();

    if (insertActionQueuesError) throw insertActionQueuesError;

    console.log(`Successfully inserted ${insertedActionQueues?.length || 0} items into action_queues`);

  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const handleAddAction = async (campaignId: number, actionType: ActionType): Promise<Action> => {
  try {
    const { data: lastAction, error: lastActionError } = await supabase
      .from('action_configurations')
      .select('action_order')
      .eq('campaign_id', campaignId)
      .order('action_order', { ascending: false })
      .limit(1)
      .single();

    if (lastActionError && lastActionError.code !== 'PGRST116') throw lastActionError;

    const newOrder = lastAction ? lastAction.action_order + 1 : 1;

    const newAction = {
      campaign_id: campaignId,
      action_type: actionType,
      action_order: newOrder,
      name: getActionName(actionType),
      config: getDefaultConfigForActionType(actionType),
      successful: 0,
      failed: 0,
      queue: 0,
      is_sequential: false,
    };

    const { data, error } = await supabase
      .from('action_configurations')
      .insert(newAction)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      type: data.action_type as ActionType,
      order: data.action_order,
      icon: getActionIcon(data.action_type as ActionType),
    };
  } catch (error) {
    console.error('Error adding action:', error);
    throw error;
  }
};

export const handleUpdateAction = async (action: Action): Promise<Action> => {
  try {
    console.log("Updating action in database:", action);

    const updateData = {
      name: action.name,
      custom_name: action.custom_name,
      config: action.config,
      action_order: action.order,
      action_type: action.type,
      successful: action.successful,
      failed: action.failed,
      queue: action.queue,
      is_sequential: action.is_sequential ?? false,
    };

    const { data, error } = await supabase
      .from('action_configurations')
      .update(updateData)
      .eq('id', action.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating action in database:", error);
      throw error;
    }

    console.log("Full database response:", data);

    if (!data) {
      throw new Error("No data returned from update operation");
    }

    const updatedAction: Action = {
      ...action,
      ...data,
      type: data.action_type as ActionType,
      order: data.action_order,
      icon: getActionIcon(data.action_type as ActionType),
    };

    console.log("Action updated successfully:", updatedAction);

    return updatedAction;
  } catch (error) {
    console.error('Error updating action:', error);
    throw error;
  }
};

export const handleDeleteAction = async (actionId: number): Promise<void> => {
  return retry(async () => {
    const { error } = await supabase
      .from('action_configurations')
      .delete()
      .eq('id', actionId);

    if (error) throw error;
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const handleMoveAction = async (campaignId: number, currentIndex: number, direction: 'up' | 'down'): Promise<void> => {
  return retry(async () => {
    const { data: actions, error: fetchError } = await supabase
      .from('action_configurations')
      .select('id, action_order')
      .eq('campaign_id', campaignId)
      .order('action_order', { ascending: true });

    if (fetchError) throw fetchError;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= actions.length) return;

    const [currentAction, targetAction] = [actions[currentIndex], actions[newIndex]];

    const updates = [
      { id: currentAction.id, action_order: targetAction.action_order },
      { id: targetAction.id, action_order: currentAction.action_order }
    ];

    const { error: updateError } = await supabase
      .from('action_configurations')
      .upsert(updates);

    if (updateError) throw updateError;
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const handleEditAction = async (actionId: number): Promise<Action> => {
  return retry(async () => {
    const { data, error } = await supabase
      .from('action_configurations')
      .select('*')
      .eq('id', actionId)
      .single();

    if (error) throw error;

    return {
      ...data,
      type: data.action_type as ActionType,
      order: data.action_order,
      icon: getActionIcon(data.action_type as ActionType),
      queue: data.queue || 0,
      successful: data.successful || 0,
      failed: data.failed || 0,
      excluded: data.excluded || 0,
      pending: data.pending || 0,
    };
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const calculateDelayInMs = (delay: { days: number; hours: number; minutes: number; } | undefined): number => {
  if (!delay) return 0;
  const { days = 0, hours = 0, minutes = 0 } = delay;
  return (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
};

export const fetchActionStats = async (campaignId: number): Promise<Array<{ id: number; successful: number; failed: number; queue: number }>> => {
  return retry(async () => {
    const { data, error } = await supabase
      .from('action_configurations')
      .select('id, successful, failed, queue')
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return data || [];
  }, {
    maxAttempts: 3,
    retryableError: (error) => error instanceof TypeError || error.name === 'NetworkError'
  });
};

export const getActionIcon = (actionType: ActionType) => {
  switch (actionType) {
    case 'SEND_INVITATION': return FaUserPlus;
    case 'SEND_MESSAGE': return FaComments;
    case 'LIKE_POST': return FaThumbsUp;
    case 'FOLLOW_UNFOLLOW': return FaSync;
    case 'VISIT_PROFILE': return FaEye;
    case 'SEARCH': return FaSearch;
    case 'BOOST_POST': return FaRocket;
    case 'COMMENT_POST': return FaComment;
    case 'DELAY': return FaClock;
    default: return FaUserPlus;
  }
};

export const getActionName = (actionType: ActionType): string => {
  switch (actionType) {
    case 'SEND_INVITATION': return 'Send Invitation';
    case 'SEND_MESSAGE': return 'Send Message';
    case 'LIKE_POST': return 'Like Post';
    case 'FOLLOW_UNFOLLOW': return 'Follow/Unfollow';
    case 'VISIT_PROFILE': return 'Visit Profile';
    case 'SEARCH': return 'Search';
    case 'BOOST_POST': return 'Boost Post';
    case 'COMMENT_POST': return 'Comment on Post';
    case 'DELAY': return 'Delay';
    default: return 'Unknown Action';
  }
};

const getDefaultConfigForActionType = (actionType: ActionType): ActionConfig => {
  switch (actionType) {
    case 'SEND_INVITATION':
    case 'SEND_MESSAGE':
      return { message: '' };
    case 'LIKE_POST':
      return { postCount: 1, addComment: false };
    case 'FOLLOW_UNFOLLOW':
      return { mode: 'follow' };
    case 'VISIT_PROFILE':
      return { profileCount: 1 };
    case 'SEARCH':
      return {};
    case 'BOOST_POST':
      return { budget: 0, duration: 0 };
    case 'COMMENT_POST':
      return { comment: '' };
    case 'DELAY':
      return { days: 0, hours: 0, minutes: 30 };
    default:
      return {};
  }
};

export default {
  setupQueueSubscription,
  getActionQueueCount,
  fetchCampaignLists,
  fetchCRMLists,
  handleAddToQueue,
  handleAddAction,
  handleUpdateAction,
  handleDeleteAction,
  handleMoveAction,
  handleEditAction,
  calculateDelayInMs,
  fetchActionStats,
  getActionIcon,
  getActionName,
};