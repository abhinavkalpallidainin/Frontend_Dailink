import { Campaign, Action, Lead, ActionConfig, ScrapedProfile, CRMProfile, DelayConfig } from '../types/type';
import campaignService from './campaignService';
import {
  sendLinkedInInvitation,
  reactToLinkedInPost,
  followUnfollowProfile,
  startNewLinkedInChat,
  getLinkedInUserPosts,
  getLinkedInUserProfile,
  commentOnLinkedInPost
} from './api';
import {
  SendInvitationConfig,
  SendMessageConfig,
  LikePostConfig,
  FollowUnfollowConfig,
  VisitProfileConfig,
  CommentPostConfig
} from '../types/type';
import { emitToRoom } from './websocket';

export async function executeWorkflow(campaign: Campaign, leads: Lead[]) {
  console.log(`Starting workflow execution for campaign ${campaign.id}`);
  await campaignService.logExecution(campaign.id, 'WORKFLOW', 'running', `Starting workflow execution for ${leads.length} leads`);

  try {
    await campaignService.resetActionStats(campaign.id);
    if (!campaign.workflow || !Array.isArray(campaign.workflow) || campaign.workflow.length === 0) {
      throw new Error('Campaign workflow is undefined, not an array, or empty');
    }

    for (const action of campaign.workflow) {
      await processActionForAllLeads(campaign, action, leads);
      if (action.type === 'DELAY') {
        await handleGlobalDelay(campaign, action);
      }
    }

    console.log(`Workflow execution completed for campaign ${campaign.id}`);
    await campaignService.logExecution(campaign.id, 'WORKFLOW', 'completed', `Workflow execution completed for ${leads.length} leads`);
    
    await handleCampaignCompletion(campaign);
  } catch (error) {
    await handleWorkflowError(campaign, error);
  }
}

async function processActionForAllLeads(campaign: Campaign, action: Action, leads: Lead[]) {
  for (const lead of leads) {
    try {
      await executeAction(campaign, action, lead);
      await campaignService.updateActionStats(action.id, 'successful');
    } catch (error) {
      console.error(`Error executing action for lead ${lead.id}:`, error);
      await campaignService.updateActionStats(action.id, 'failed');
    }
  }
}

async function handleGlobalDelay(campaign: Campaign, action: Action) {
  const delayMs = calculateDelayInMs(action.config as DelayConfig);
  console.log(`Global delay for ${delayMs}ms`);
  await campaignService.logExecution(campaign.id, action.type, 'delaying', `Waiting for ${delayMs}ms before next action`);
  await delay(delayMs);
}

async function handleCampaignCompletion(campaign: Campaign) {
  const remainingLeads = await campaignService.getLeadsForCampaign(campaign.id);
  if (remainingLeads.length === 0) {
    await campaignService.updateCampaign(campaign.id, { status: 'Completed' });
    await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'completed', 'Campaign completed automatically due to empty queue');
  } else {
    await campaignService.updateCampaign(campaign.id, { status: 'Running' });
  }
}

async function handleWorkflowError(campaign: Campaign, error: any) {
  console.error(`Error executing workflow for campaign ${campaign.id}:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  await campaignService.logExecution(campaign.id, 'WORKFLOW', 'failed', `Workflow execution failed: ${errorMessage}`);
  await campaignService.updateCampaign(campaign.id, { status: 'Failed' });
  throw error;
}

async function executeAction(campaign: Campaign, action: Action, lead: Lead) {
  console.log(`Executing action ${action.type} for lead ${lead.id} (${lead.crm_profiles.name})`);
  console.log(`Campaign account_id: ${campaign.account_id}`);
  console.log('Executing action:', JSON.stringify(action, null, 2));
  await campaignService.logExecution(campaign.id, action.type, 'running', `Starting action for lead ${lead.id} (${lead.crm_profiles.name})`);
  
  try {
    const accountId = campaign.account_id;
    if (!accountId) {
      throw new Error('Campaign account_id is undefined');
    }
    console.log(`Using account_id: ${accountId}`);

    const crmProfile = await campaignService.getCRMProfile(lead.crm_profile_id);
    const scrapedProfile = await scrapeProfileIfNeeded(campaign, action, lead);

    await executeActionByType(campaign, action, lead, accountId, crmProfile, scrapedProfile);

    await handleSuccessfulAction(campaign, action, lead);
  } catch (error) {
    await handleFailedAction(campaign, action, lead, error);
    throw error;
  }
}

async function scrapeProfileIfNeeded(campaign: Campaign, action: Action, lead: Lead): Promise<ScrapedProfile | null> {
  if ('scrapeProfile' in action.config && action.config.scrapeProfile) {
    return await campaignService.scrapeProfile(
      campaign.id,
      lead.id,
      'useSalesNavigator' in action.config && typeof action.config.useSalesNavigator === 'boolean'
        ? action.config.useSalesNavigator
        : false
    );
  }
  return null;
}

async function executeActionByType(campaign: Campaign, action: Action, lead: Lead, accountId: string, crmProfile: CRMProfile, scrapedProfile: ScrapedProfile | null) {
  switch (action.type) {
    case 'SEND_INVITATION':
      await handleSendInvitation(campaign.id, accountId, lead, crmProfile, action.config as SendInvitationConfig, scrapedProfile);
      break;
    case 'SEND_MESSAGE':
      await handleSendMessage(campaign.id, accountId, lead, crmProfile, action.config as SendMessageConfig, scrapedProfile);
      break;
    case 'LIKE_POST':
      await handleLikePost(campaign.id, accountId, lead, action.config as LikePostConfig);
      break;
    case 'FOLLOW_UNFOLLOW':
      await handleFollowUnfollow(campaign.id, accountId, lead, action.config as FollowUnfollowConfig);
      break;
    case 'VISIT_PROFILE':
      await handleVisitProfile(campaign.id, accountId, lead, action.config as VisitProfileConfig);
      break;
    case 'COMMENT_POST':
      await handleCommentPost(campaign.id, accountId, lead, action.config as CommentPostConfig);
      break;
    case 'DELAY':
      // Do nothing for DELAY action as it's handled globally
      break;
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
}

async function handleSuccessfulAction(campaign: Campaign, action: Action, lead: Lead) {
  try {
    await campaignService.updateLeadStatus(campaign.id, lead.id, 'successful', action.id);
    await campaignService.logExecution(campaign.id, action.type, 'completed', `Action completed for lead ${lead.id} (${lead.crm_profiles.name})`);
    
    emitToRoom(campaign.id.toString(), 'action_completed', {
      actionId: action.id,
      successful: action.successful + 1,
      failed: action.failed,
      queue: action.queue - 1
    });
  } catch (error) {
    console.error('Error handling successful action:', error);
    await campaignService.logExecution(campaign.id, action.type, 'failed', `Failed to update status for successful action: ${JSON.stringify(error)}`);
  }
}

async function handleFailedAction(campaign: Campaign, action: Action, lead: Lead, error: any) {
  try {
    console.error(`Error executing action ${action.type} for lead ${lead.id} (${lead.crm_profiles.name}):`, error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    await campaignService.logExecution(campaign.id, action.type, 'failed', `Action failed for lead ${lead.id} (${lead.crm_profiles.name}): ${errorMessage}`);
    await campaignService.updateLeadStatus(campaign.id, lead.id, 'failed', action.id);

    emitToRoom(campaign.id.toString(), 'action_completed', {
      actionId: action.id,
      successful: action.successful,
      failed: action.failed + 1,
      queue: action.queue - 1
    });
  } catch (logError) {
    console.error('Error handling failed action:', logError);
  }
}

async function handleSendInvitation(campaignId: number, accountId: string, lead: Lead, crmProfile: CRMProfile, config: SendInvitationConfig, scrapedProfile: ScrapedProfile | null) {
  if ('message' in config) {
    let message = replaceVariables(config.message, lead, crmProfile, scrapedProfile);
    
    if (message.trim() !== '') {
      if (lead.lh_id) {
        await sendLinkedInInvitation(accountId, lead.lh_id);
        console.log(`Invitation sent successfully to ${lead.id} (${lead.crm_profiles.name})`);
        await campaignService.logExecution(campaignId, 'SEND_INVITATION', 'completed', `Invitation sent successfully to lead ${lead.id} (${lead.crm_profiles.name})`);
      } else {
        throw new Error('Lead has no LinkedIn ID');
      }
    } else {
      throw new Error('Empty invitation message after variable replacement');
    }
  } else {
    throw new Error('Invalid config for SEND_INVITATION action');
  }
}

async function handleSendMessage(campaignId: number, accountId: string, lead: Lead, crmProfile: CRMProfile, config: SendMessageConfig, scrapedProfile: ScrapedProfile | null) {
  console.log('SendMessageConfig:', JSON.stringify(config, null, 2));
  if (typeof config.message === 'string') {
    console.log('Original config message:', config.message);
    let message = replaceVariables(config.message, lead, crmProfile, scrapedProfile);
    console.log('Message after variable replacement:', message);
    
    if (message.trim() !== '') {
      console.log(`Sending message to ${lead.id} (${lead.crm_profiles.name}) using account ${accountId}: "${message}"`);
      if (lead.lh_id) {
        await startNewLinkedInChat(accountId, lead.lh_id, message);
        console.log(`Message sent successfully to ${lead.id} (${lead.crm_profiles.name})`);
        await campaignService.logExecution(campaignId, 'SEND_MESSAGE', 'completed', `Message sent successfully to lead ${lead.id} (${lead.crm_profiles.name})`);
      } else {
        throw new Error('Lead has no LinkedIn ID');
      }
    } else {
      throw new Error('Empty message after variable replacement');
    }
  } else {
    throw new Error('Invalid config for SEND_MESSAGE action');
  }
}

async function handleLikePost(campaignId: number, accountId: string, lead: Lead, config: LikePostConfig) {
  if ('postCount' in config) {
    if (lead.lh_id) {
      const posts = await getLinkedInUserPosts(accountId, lead.lh_id);
      if (posts.length > 0) {
        const postCount = Math.min(posts.length, config.postCount);
        for (let i = 0; i < postCount; i++) {
          await reactToLinkedInPost(accountId, posts[i].id);
          await campaignService.logExecution(campaignId, 'LIKE_POST', 'completed', `Liked post ${i + 1}/${postCount} for lead ${lead.id} (${lead.crm_profiles.name})`);
        }
      } else {
        await campaignService.logExecution(campaignId, 'LIKE_POST', 'completed', `No posts found to like for lead ${lead.id} (${lead.crm_profiles.name})`);
      }
    } else {
      throw new Error('Lead has no LinkedIn ID');
    }
  } else {
    throw new Error('Invalid config for LIKE_POST action');
  }
}

async function handleFollowUnfollow(campaignId: number, accountId: string, lead: Lead, config: FollowUnfollowConfig) {
  if ('mode' in config) {
    if (lead.lh_id) {
      await followUnfollowProfile(accountId, lead.lh_id, config.mode);
      await campaignService.logExecution(campaignId, 'FOLLOW_UNFOLLOW', 'completed', `${config.mode === 'follow' ? 'Followed' : 'Unfollowed'} lead ${lead.id} (${lead.crm_profiles.name})`);
    } else {
      throw new Error('Lead has no LinkedIn ID');
    }
  } else {
    throw new Error('Invalid config for FOLLOW_UNFOLLOW action');
  }
}

async function handleVisitProfile(campaignId: number, accountId: string, lead: Lead, config: VisitProfileConfig) {
  if (lead.lh_id) {
    await getLinkedInUserProfile(accountId, lead.lh_id);
    await campaignService.logExecution(campaignId, 'VISIT_PROFILE', 'completed', `Visited profile of lead ${lead.id} (${lead.crm_profiles.name})`);
  } else {
    throw new Error('Lead has no LinkedIn ID');
  }
}

async function handleCommentPost(campaignId: number, accountId: string, lead: Lead, config: CommentPostConfig) {
  if ('comment' in config && 'postCount' in config && typeof config.postCount === 'number') {
    if (lead.lh_id) {
      const posts = await getLinkedInUserPosts(accountId, lead.lh_id);
      if (posts.length > 0) {
        const postCount = Math.min(posts.length, config.postCount);
        for (let i = 0; i < postCount; i++) {
          await commentOnLinkedInPost(accountId, posts[i].id, config.comment);
          console.log(`Commented on post ${posts[i].id} for lead ${lead.id} (${lead.crm_profiles.name})`);
          await campaignService.logExecution(campaignId, 'COMMENT_POST', 'completed', `Commented on post ${i + 1}/${postCount} for lead ${lead.id} (${lead.crm_profiles.name})`);
        }
      } else {
        await campaignService.logExecution(campaignId, 'COMMENT_POST', 'completed', `No posts found to comment on for lead ${lead.id} (${lead.crm_profiles.name})`);
      }
    } else {
      throw new Error('Lead has no LinkedIn ID');
    }
  } else {
    throw new Error('Invalid config for COMMENT_POST action');
  }
}

function replaceVariables(text: string, lead: Lead, crmProfile: CRMProfile, scrapedProfile: ScrapedProfile | null): string {
  console.log('Original message:', text);
  console.log('Lead data:', lead);
  console.log('CRM Profile data:', crmProfile);
  console.log('Scraped profile:', scrapedProfile);

  let result = text
    .replace(/{fullName}/g, crmProfile.name || '')
    .replace(/{headline}/g, crmProfile.headline || '')
    .replace(/{location}/g, crmProfile.location || '');

  if (scrapedProfile) {
    result = result
      .replace(/{firstName}/g, scrapedProfile.first_name)
      .replace(/{lastName}/g, scrapedProfile.last_name)
      .replace(/{company}/g, scrapedProfile.work_experience[0]?.company || '')
      .replace(/{position}/g, scrapedProfile.work_experience[0]?.position || '');
  }

  console.log('Replaced message:', result);

  return result;
}

export function calculateDelayInMs(delay: DelayConfig): number {
  const { days = 0, hours = 0, minutes = 0 } = delay;
  return (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startCampaignWorkflow(campaign: Campaign) {
  console.log(`Starting campaign workflow for campaign ${campaign.id}`);
  await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'running', `Starting campaign workflow`);

  try {
    const leads = await campaignService.getLeadsForCampaign(campaign.id);
    if (leads.length === 0) {
      console.log(`No leads found for campaign ${campaign.id}`);
      await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'completed', 'No leads to process');
      await campaignService.updateCampaign(campaign.id, { status: 'Completed' });
      return;
    }
    await executeWorkflow(campaign, leads);

    console.log(`Campaign workflow completed for campaign ${campaign.id}`);
    await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'completed', `Campaign workflow completed`);
    await campaignService.updateCampaign(campaign.id, { status: 'Completed' });
  } catch (error) {
    console.error(`Error in campaign workflow for campaign ${campaign.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'failed', `Campaign workflow failed: ${errorMessage}`);
    await campaignService.updateCampaign(campaign.id, { status: 'Failed' });
    throw error;
  }
}

export async function stopCampaignWorkflow(campaign: Campaign) {
  console.log(`Stopping campaign workflow for campaign ${campaign.id}`);
  await campaignService.logExecution(campaign.id, 'CAMPAIGN', 'stopped', `Stopping campaign workflow`);
  await campaignService.updateCampaign(campaign.id, { status: 'Stopped' });
}

export default {
  executeWorkflow,
  startCampaignWorkflow,
  stopCampaignWorkflow,
  calculateDelayInMs,
};