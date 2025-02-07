import { supabase } from './supabase';

const UNIPILE_BASE_URL = process.env.REACT_APP_UNIPILE_BASE_URL || 'https://api1.unipile.com:13143';
const UNIPILE_ACCESS_TOKEN = process.env.REACT_APP_UNIPILE_ACCESS_TOKEN || 'your_default_access_token';

// Interfaces
export interface LinkedInCheckpoint {
  type: string; 
  public_key: string;
  data: string;
}

export interface LinkedInAccount {
  email: string;
  id: string;
  name: string;
  provider: 'LINKEDIN';
  status: string;
  object:string;
  checkpoint?: LinkedInCheckpoint;  
  account_id:string,
  created_at: string;
  sources: { id: string; status: string }[];
  unipile_id?: string;
  unipile_status?: string;
  last_synced?: string;
  initial_network_size?: number;
  initial_followers_count?: number;
  provider_id?: string;
  type:string;
  user_id:string;
}

export interface FormDataUser{
  email:string,
  password:string,
  fullname:string,
  role:string,
  unipile_id:string
}

export interface LinkedInChat {
  id: string;
  name: string | null;
  type: number;
  unread_count: number;
  timestamp: string;
  account_id: string;
  folder?: string[];
  attendees?: LinkedInProfile[];
  lastMessage?: string;
}
export interface Captcha {
  public_key: string;
  // Add any other properties that are part of the checkpoint object
  // For example, if there's a `type` property:
  type?: string;
  data?: string;
}


export interface LinkedInMessage {
  content: any;
  id: string;
  text: string;
  sender: string;
  created_at: string;
  is_sender?:number;
  timestamp:string
  attachments?: { url: string }[];
  
}

export interface LinkedInProfile {
  id: string;
  name: string;
  headline?: string;
  location?: string;
  picture_url?: string;
  connections_count?: number;
  follower_count?: number;
  attachments?: { url: string }[];

}

export interface LinkedInPost {
  id: string;
  content: string;
  created_at: string;
  author: string;
}

export interface LinkedInComment {
  id: string;
  content: string;
  created_at: string;
  author: string;
}

export interface LinkedInReaction {
  id: string;
  type: string;
  created_at: string;
  author: string;
}

export interface SearchParams {
  api: 'classic' | 'sales_navigator';
  category: 'people';
  keywords?: string;
  industry?: string[] | { include?: string[]; exclude?: string[] };
  location?: { include?: string[]; exclude?: string[] } | string[];
  page?: number;
}

export interface List {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  account_id: string;
  name: string;
  type: string;
  status: string;
  contacts: number;
  successful: number;
  failed: number;
  messaged: number;
  replied: number;
  followed: number;
  postLiked: number;
  created_at: string;
  workflow: CampaignWorkflow[];
}

export interface CampaignWorkflow {
  id: string;
  type: string;
  config: ActionConfig;
}

export interface ActionConfig {
  scrapeProfile?: boolean;
  useSalesNavigator?: boolean;
  [key: string]: any;
}

export interface ScrapedProfile {
  id: string;
  user_id: string;
  linkedin_id: string;
  provider_id: string;
  public_identifier: string;
  first_name: string;
  last_name: string;
  headline: string;
  location: string;
  connections_count: number;
  shared_connections_count: number;
  websites: string[];
  public_profile_url: string;
  summary: string;
  is_premium: boolean;
  is_open_to_work: boolean;
  is_open_profile: boolean;
  skills: any[];
  education: any[];
  work_experience: any[];
  languages: string[];
  volunteering_experience: any[];
  contact_info: any;
  profile_picture_url: string;
}
export interface Checkpoint {
  type: 'CAPTCHA';
  public_key: string;
  data: string; // base64 encoded image data
}


// Helper function for API requests
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, queryParams?: Record<string, string>) => {
  let url = `${UNIPILE_BASE_URL}${endpoint}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': UNIPILE_ACCESS_TOKEN,
  };

  const options: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Account Management
export const getAllUnipileLinkedInAccounts = async (): Promise<LinkedInAccount[]> => {
  const response = await apiRequest('/api/v1/accounts');
  return response.items || [];
};

export const syncUnipileAccounts = async (userId: string) => {
  try {
    const unipileAccounts = await getAllUnipileLinkedInAccounts();

    const upsertPromises = unipileAccounts.map(account => 
      supabase
        .from('linkedin_accounts')
        .upsert({
          user_id: userId,
          unipile_id: account.id,
          name: account.name,
          status: account.status,
          unipile_status: account.status,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'unipile_id'
        })
    );

    await Promise.all(upsertPromises);
    return { success: true, message: 'Accounts synced successfully' };
  } catch (error) {
    console.error('Error syncing Unipile accounts:', error);
    return { success: false, message: 'Failed to sync accounts', error };
  }
};

export const getSupabaseLinkedInAccounts = async (userId: string): Promise<LinkedInAccount[]> => {
  const { data, error } = await supabase
    .from('linkedin_accounts')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
};

export const connectLinkedInAccount = async (username: string, password: string): Promise<LinkedInAccount> => {
  return apiRequest('/api/v1/accounts', 'POST', { username, password, provider: 'LINKEDIN' });
};

export const getLinkedInAccount = async (accountId: string): Promise<LinkedInAccount> => {
  return apiRequest(`/api/v1/accounts/${accountId}`);
};

export const reconnectLinkedInAccount = async (accountId: string, username: string, password: string): Promise<LinkedInAccount> => {
  return apiRequest(`/api/v1/accounts/${accountId}`, 'PUT', { username, password, provider: 'LINKEDIN' });
};

export const deleteLinkedInAccount = async (accountId: string): Promise<void> => {
  await apiRequest(`/api/v1/accounts/${accountId}`, 'DELETE');
};

export const solveLinkedInCheckpoint = async (accountId: string, code: string): Promise<LinkedInAccount> => {
  return apiRequest('/api/v1/accounts/checkpoint', 'POST', { account_id: accountId, provider: 'LINKEDIN', code });
};

// Messaging
export const getLinkedInChats = async (accountId: string): Promise<LinkedInChat[]> => {
  const response = await apiRequest(`/api/v1/chats`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const startNewLinkedInChat = async (accountId: string, attendeeId: string, text: string): Promise<LinkedInChat> => {
  const formData = new FormData();
  formData.append('attendees_ids', attendeeId);
  formData.append('account_id', accountId);
  formData.append('text', text);

  const url = `${UNIPILE_BASE_URL}/api/v1/chats`;
  const options: RequestInit = {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'X-API-KEY': UNIPILE_ACCESS_TOKEN
    },
    body: formData
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getLinkedInChat = async (chatId: string): Promise<LinkedInChat> => {
  return apiRequest(`/api/v1/chats/${chatId}`);
};

export const getLinkedInMessages = async (chatId: string): Promise<LinkedInMessage[]> => {
  const response = await apiRequest(`/api/v1/chats/${chatId}/messages`);
  return response.items || [];
};

export const sendLinkedInMessage = async (chatId: string, text: string): Promise<LinkedInMessage> => {
  return apiRequest(`/api/v1/chats/${chatId}/messages`, 'POST', { text });
};

export const getLinkedInChatAttendees = async (chatId: string): Promise<LinkedInProfile[]> => {
  const response = await apiRequest(`/api/v1/chats/${chatId}/attendees`);
  return response.items || [];
};

// User Interactions
export const getLinkedInInvitations = async (accountId: string): Promise<any[]> => {
  const response = await apiRequest(`/api/v1/users/invite/sent`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const getLinkedInProfile = async (accountId: string): Promise<any> => {
  return apiRequest(`/api/v1/users/me`, 'GET', null, { account_id: accountId });
};

export const getDetailedLinkedInProfile = async (accountId: string, providerId: string): Promise<any> => {
  return apiRequest(`/api/v1/users/${providerId}`, 'GET', null, { account_id: accountId });
};

export const getLinkedInConnections = async (accountId: string): Promise<LinkedInProfile[]> => {
  const response = await apiRequest(`/api/v1/users/relations`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const getLinkedInUserProfile = async (accountId: string, identifier: string, useSalesNavigator: boolean = false): Promise<any> => {
  const queryParams: Record<string, string> = {
    account_id: accountId,
  };

  if (useSalesNavigator) {
    queryParams.linkedin_api = 'sales_navigator';
  }

  return apiRequest(`/api/v1/users/${identifier}`, 'GET', null, queryParams);
};

export const sendLinkedInInvitation = async (accountId: string, providerId: string): Promise<void> => {
  await apiRequest('/api/v1/users/invite', 'POST', { account_id: accountId, provider_id: providerId });
};

export const getLinkedInUserPosts = async (accountId: string, identifier: string): Promise<LinkedInPost[]> => {
  const response = await apiRequest(`/api/v1/users/${identifier}/posts`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const cancelLinkedInInvitation = async (accountId: string, invitationId: string): Promise<void> => {
  await apiRequest(`/api/v1/users/invite/sent/${invitationId}`, 'DELETE', null, { account_id: accountId });
};

// Posts and Interactions
export const getLinkedInPost = async (accountId: string, postId: string): Promise<LinkedInPost> => {
  return apiRequest(`/api/v1/posts/${postId}`, 'GET', null, { account_id: accountId });
};

export const createLinkedInPost = async (accountId: string, text: string): Promise<LinkedInPost> => {
  return apiRequest('/api/v1/posts', 'POST', { account_id: accountId, text });
};

export const getLinkedInPostComments = async (accountId: string, postId: string): Promise<LinkedInComment[]> => {
  const response = await apiRequest(`/api/v1/posts/${postId}/comments`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const commentOnLinkedInPost = async (accountId: string, postId: string, text: string): Promise<LinkedInComment> => {
  return apiRequest(`/api/v1/posts/${postId}/comments`, 'POST', { account_id: accountId, text });
};

export const reactToLinkedInPost = async (accountId: string, postId: string): Promise<LinkedInReaction> => {
  return apiRequest('/api/v1/posts/reaction', 'POST', { account_id: accountId, post_id: postId });
};



// List Management
export const getLists = async (): Promise<List[]> => {
  const response = await apiRequest('/api/v1/lists');
  return response.items || [];
};

export const createList = async (name: string): Promise<List> => {
  return apiRequest('/api/v1/lists', 'POST', { name });
};

export const updateList = async (id: string, name: string): Promise<List> => {
  return apiRequest(`/api/v1/lists/${id}`, 'PUT', { name });
};

export const deleteList = async (id: string): Promise<void> => {
  await apiRequest(`/api/v1/lists/${id}`, 'DELETE');
};

export const saveProfilesToList = async (listId: string, profileIds: string[]): Promise<void> => {
  await apiRequest(`/api/v1/lists/${listId}/profiles`, 'POST', { profile_ids: profileIds });
};

export const getListProfiles = async (listId: string): Promise<LinkedInProfile[]> => {
  const response = await apiRequest(`/api/v1/lists/${listId}/profiles`);
  return response.items || [];
};

export const deleteProfileFromList = async (listId: string, profileId: string): Promise<void> => {
  await apiRequest(`/api/v1/lists/${listId}/profiles/${profileId}`, 'DELETE');
};

// Campaign Management
export const getCampaigns = async (accountId: string): Promise<Campaign[]> => {
  const response = await apiRequest(`/api/v1/campaigns`, 'GET', null, { account_id: accountId });
  return response.items || [];
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> => {
  return apiRequest('/api/v1/campaigns', 'POST', campaign);
};

export const updateCampaign = async (id: number, updates: Partial<Campaign>): Promise<Campaign> => {
  return apiRequest(`/api/v1/campaigns/${id}`, 'PUT', updates);
};

export const deleteCampaign = async (id: number): Promise<void> => {
  await apiRequest(`/api/v1/campaigns/${id}`, 'DELETE');
};

export const getCampaign = async (id: number): Promise<Campaign> => {
  return apiRequest(`/api/v1/campaigns/${id}`);
};

// Network Stats
export const updateInitialNetworkStats = async (accountId: string, initialNetworkSize: number, initialFollowersCount: number): Promise<void> => {
  const { error } = await supabase
    .from('linkedin_accounts')
    .update({ 
      initial_network_size: initialNetworkSize, 
      initial_followers_count: initialFollowersCount 
    })
    .eq('unipile_id', accountId);

  if (error) {
    console.error('Error updating initial network stats:', error);
    throw new Error('Failed to update initial network stats');
  }
};

export const getNetworkStats = async (accountId: string): Promise<{ currentNetworkSize: number, currentFollowersCount: number }> => {
  const ownProfile = await getLinkedInProfile(accountId);
  const detailedProfile = await getDetailedLinkedInProfile(accountId, ownProfile.provider_id);
  
  return {
    currentNetworkSize: detailedProfile.connections_count || 0,
    currentFollowersCount: detailedProfile.follower_count || 0
  };
};

export const getNetworkGrowth = async (accountId: string): Promise<{ networkGrowth: number, followersGrowth: number }> => {
  const { data, error } = await supabase
    .from('linkedin_accounts')
    .select('initial_network_size, initial_followers_count')
    .eq('unipile_id', accountId)
    .single();

  if (error) {
    console.error('Error fetching initial network stats:', error);
    throw new Error('Failed to fetch initial network stats');
  }

  const { currentNetworkSize, currentFollowersCount } = await getNetworkStats(accountId);

  return {
    networkGrowth: currentNetworkSize - (data?.initial_network_size || 0),
    followersGrowth: currentFollowersCount - (data?.initial_followers_count || 0)
  };
};

// Follow/Unfollow functionality
export const followUnfollowProfile = async (accountId: string, profileId: string, action: 'follow' | 'unfollow'): Promise<void> => {
  await apiRequest(`/api/v1/users/${profileId}/${action}`, 'POST', { account_id: accountId });
};

// Profile Scraping
export const scrapeLinkedInProfile = async (campaignId: number, leadId: string, useSalesNavigator: boolean): Promise<ScrapedProfile> => {
  try {
    // Fetch the lead details
    const { data: lead, error: leadError } = await supabase
      .from('campaign_leads')
      .select('lh_id, campaign_id')
      .eq('id', leadId)
      .single();

    if (leadError) throw leadError;

    // Fetch the account_id for the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('account_id')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;

    // Scrape the profile
    const profile = await getLinkedInUserProfile(campaign.account_id, lead.lh_id, useSalesNavigator);

    // Prepare the data for insertion/update
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

    // Insert or update the scraped profile
    const { data, error: upsertError } = await supabase
      .from('scraped_profiles')
      .upsert(scrapedProfileData, { onConflict: 'linkedin_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return data;
  } catch (error) {
    console.error('Error scraping profile:', error);
    throw error;
  }
};





// Exporting all functions as a module
const apiModule = {
  getAllUnipileLinkedInAccounts,
  syncUnipileAccounts,
  getSupabaseLinkedInAccounts,
  connectLinkedInAccount,
  getLinkedInAccount,
  reconnectLinkedInAccount,
  deleteLinkedInAccount,
  solveLinkedInCheckpoint,
  getLinkedInChats,
  startNewLinkedInChat,
  getLinkedInChat,
  getLinkedInMessages,
  sendLinkedInMessage,
  getLinkedInChatAttendees,
  getLinkedInInvitations,
  getLinkedInProfile,
  getDetailedLinkedInProfile,
  getLinkedInConnections,
  getLinkedInUserProfile,
  sendLinkedInInvitation,
  getLinkedInUserPosts,
  cancelLinkedInInvitation,
  getLinkedInPost,
  createLinkedInPost,
  getLinkedInPostComments,
  commentOnLinkedInPost,
  reactToLinkedInPost,
  getLists,
  createList,
  updateList,
  deleteList,
  saveProfilesToList,
  getListProfiles,
  deleteProfileFromList,
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaign,
  updateInitialNetworkStats,
  getNetworkStats,
  getNetworkGrowth,
  followUnfollowProfile,
  scrapeLinkedInProfile
};

export default apiModule;
