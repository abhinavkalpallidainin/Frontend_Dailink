// src/utils/myAssistantUtils.ts

import { supabase } from './supabase';
import { Message, Profile, DaininBot, AssistantConfiguration, Chat, LogEntry, List } from '../types/type';
import { v4 as uuidv4 } from 'uuid';

const UNIPILE_BASE_URL = process.env.REACT_APP_UNIPILE_BASE_URL || 'https://api1.unipile.com:13143';
const UNIPILE_ACCESS_TOKEN = process.env.REACT_APP_UNIPILE_ACCESS_TOKEN || '';

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any, isFormData: boolean = false) => {
  const url = `${UNIPILE_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'X-API-KEY': UNIPILE_ACCESS_TOKEN,
    'accept': 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
  };

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const getChatId = async (leadId: string, accountId: string): Promise<string | null> => {
  try {
    const data = await apiRequest(`/api/v1/chat_attendees/${leadId}/chats?account_id=${accountId}`);
    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }
    console.log(`No chat found for lead ${leadId} and account ${accountId}`);
    return null;
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log(`No chat found for lead ${leadId} and account ${accountId}`);
      return null;
    }
    console.error('Error getting chat ID:', error);
    return null;
  }
};

export const getMessagesForLead = async (leadId: string, accountId: string): Promise<Message[]> => {
  try {
    console.log(`Fetching messages from Unipile for leadId: ${leadId} and accountId: ${accountId}`);
    
    const unipileMessages = await getChatMessages(leadId, accountId);
    console.log(`Retrieved ${unipileMessages.length} messages from Unipile for lead ${leadId}`);

    return unipileMessages;
  } catch (error) {
    console.error('Error fetching messages for lead:', error);
    return [];
  }
};

export const sendMessageToLead = async (leadId: string, content: string, accountId: string): Promise<Message> => {
  try {
    const formData = new FormData();
    formData.append('attendees_ids', leadId);
    formData.append('account_id', accountId);
    formData.append('text', content);

    const data = await apiRequest('/api/v1/chats', 'POST', formData, true);
    return data;
  } catch (error) {
    console.error('Error sending message to lead:', error);
    throw error;
  }
};

export const saveMessageToSupabase = async (message: Message, accountId: string, leadId: string, botId: string) => {
  try {
    console.log('Attempting to save message:', { message, accountId, leadId });

    const { data: existingMessage, error: checkError } = await supabase
      .from('messages_myassistant')
      .select('id')
      .eq('original_id', message.id)
      .eq('lead_id', leadId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing message:', checkError);
      throw checkError;
    }

    if (existingMessage) {
      console.log(`Message with original_id ${message.id} already exists. Skipping.`);
      return { status: 'skipped', id: existingMessage.id };
    }

    const newMessage = {
      id: uuidv4(),
      lead_id: leadId,
      content: message.content || message.text || '',
      sender_id: message.sender_id || botId || 'AI_ASSISTANT',
      account_id: accountId,
      created_at: message.created_at || message.timestamp || new Date().toISOString(),
      original_id: message.id
    };

    console.log('Inserting new message:', newMessage);

    const { data, error } = await supabase
      .from('messages_myassistant')
      .insert(newMessage);

    if (error) {
      console.error('Error inserting message:', error);
      throw error;
    }

    console.log(`Saved new message to database:`, data);
    return { status: 'saved', id: newMessage.id };
  } catch (error) {
    console.error('Error saving message to Supabase:', error);
    throw error;
  }
};

export const saveAssistantConfiguration = async (
  accountId: string,
  botId: string,
  listId: string,
  profileIds: string[],
  isEnabled: boolean
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assistant_configurations')
      .upsert({
        account_id: accountId,
        bot_id: botId,
        list_id: listId,
        profile_ids: profileIds,
        is_enabled: isEnabled,
      }, {
        onConflict: 'account_id'
      });

    if (error) throw error;

    console.log('Assistant configuration saved successfully');
    await createLogEntry(accountId, 'system', 'System', 'Configuration', 'Assistant configuration saved');

    let totalSaved = 0;
    let totalSkipped = 0;
    let leadsWithNoMessages = 0;

    for (const profileId of profileIds) {
      const leadProfile = await getLeadProfile(profileId);
      console.log('Processing lead:', leadProfile);
      const leadName = leadProfile ? leadProfile.name : 'Unknown';
      const linkedinId = leadProfile ? leadProfile.linkedin_id : profileId;
      
      await createLogEntry(accountId, linkedinId, leadName, 'Message Sync', 'Starting message sync');
      
      try {
        console.log(`Fetching messages for lead ${linkedinId}`);
        const messages = await getMessagesForLead(linkedinId, accountId);
        console.log(`Retrieved ${messages.length} messages for lead ${linkedinId}`);

        if (messages.length === 0) {
          await createLogEntry(accountId, linkedinId, leadName, 'Message Sync', 'No messages found');
          leadsWithNoMessages++;
          continue;
        }

        let savedCount = 0;
        let skippedCount = 0;

        for (const message of messages) {
          const result = await saveMessageToSupabase(message, accountId, linkedinId, botId);
          if (result.status === 'saved') {
            savedCount++;
          } else {
            skippedCount++;
          }
        }

        totalSaved += savedCount;
        totalSkipped += skippedCount;

        await createLogEntry(accountId, linkedinId, leadName, 'Message Sync', `Sync completed. Saved: ${savedCount}, Skipped: ${skippedCount}`);
      } catch (error) {
        console.error(`Error syncing messages for lead ${linkedinId}:`, error);
        await createLogEntry(accountId, linkedinId, leadName, 'Error', `Failed to sync messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Assistant configuration and messages saved successfully. Total saved: ${totalSaved}, Total skipped: ${totalSkipped}, Leads with no messages: ${leadsWithNoMessages}`);
    await createLogEntry(accountId, 'system', 'System', 'Configuration', `Message sync completed. Total saved: ${totalSaved}, Total skipped: ${totalSkipped}, Leads with no messages: ${leadsWithNoMessages}`);
  } catch (error) {
    console.error('Error saving assistant configuration:', error);
    await createLogEntry(accountId, 'system', 'System', 'Error', `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const getAssistantConfiguration = async (accountId: string): Promise<AssistantConfiguration | null> => {
  try {
    const { data, error } = await supabase
      .from('assistant_configurations')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching assistant configuration:', error);
    throw error;
  }
};

export const deleteAssistantConfiguration = async (accountId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('assistant_configurations')
      .delete()
      .eq('account_id', accountId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting assistant configuration:', error);
    throw error;
  }
};

export const getLeadProfile = async (leadId: string): Promise<Profile | null> => {
  try {
    let { data, error } = await supabase
      .from('crm_profiles')
      .select('*')
      .eq('linkedin_id', leadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        ({ data, error } = await supabase
          .from('crm_profiles')
          .select('*')
          .eq('id', leadId)
          .single());
        
        if (error && error.code === 'PGRST116') {
          console.log(`No profile found for lead ${leadId}`);
          return null;
        }
      }
      if (error) throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching lead profile:', error);
    return null;
  }
};

export const updateLeadProfile = async (leadId: string, updates: Partial<Profile>): Promise<Profile> => {
  try {
    const { data, error } = await supabase
      .from('crm_profiles')
      .update(updates)
      .eq('id', leadId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from update operation');
    return data;
  } catch (error) {
    console.error('Error updating lead profile:', error);
    throw error;
  }
};

export const getBotConfiguration = async (botId: string): Promise<DaininBot | null> => {
  try {
    const { data, error } = await supabase
      .from('dainin_bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bot configuration:', error);
    throw error;
  }
};

export const updateBotConfiguration = async (botId: string, updates: Partial<DaininBot>): Promise<DaininBot> => {
  try {
    const { data, error } = await supabase
      .from('dainin_bots')
      .update(updates)
      .eq('id', botId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from update operation');
    return data;
  } catch (error) {
    console.error('Error updating bot configuration:', error);
    throw error;
  }
};

export const getAllBots = async (userId: string): Promise<DaininBot[]> => {
  try {
    const { data, error } = await supabase
      .from('dainin_bots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all bots:', error);
    throw error;
  }
};

export const createBot = async (botData: Omit<DaininBot, 'id' | 'created_at' | 'updated_at'>): Promise<DaininBot> => {
  try {
    const { data, error } = await supabase
      .from('dainin_bots')
      .insert(botData)
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from insert operation');
    return data;
  } catch (error) {
    console.error('Error creating bot:', error);
    throw error;
  }
};

export const deleteBot = async (botId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('dainin_bots')
      .delete()
      .eq('id', botId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting bot:', error);
    throw error;
  }
};

export const getLatestMessageForLead = async (leadId: string): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages_myassistant')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No messages found for lead ${leadId}`);
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching latest message for lead:', error);
    return null;
  }
};

export const getMessageCountForLead = async (leadId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('messages_myassistant')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', leadId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching message count for lead:', error);
    throw error;
  }
};

export const getCRMLists = async (accountId: string): Promise<List[]> => {
  try {
    const { data, error } = await supabase
      .from('crm_lists')
      .select('*')
      .eq('account_id', accountId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching CRM lists:', error);
    throw error;
  }
};

export const getDaininBots = async (userId: string): Promise<DaininBot[]> => {
  try {
    const { data, error } = await supabase
      .from('dainin_bots')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching Dainin bots:', error);
    throw error;
  }
};

export const getChats = async (accountId: string): Promise<Chat[]> => {
  try {
    const data = await apiRequest(`/api/v1/chats?account_id=${accountId}`);
    return data.items || [];
  } catch (error) {
    console.error('Error fetching chats:', error);
    throw error;
  }
};

export const getChatMessages = async (leadId: string, accountId: string): Promise<Message[]> => {
  try {
    const chatId = await getChatId(leadId, accountId);
    if (!chatId) {
      console.log(`No chat found for lead ${leadId} and account ${accountId}`);
      return [];
    }

    const data = await apiRequest(`/api/v1/chats/${chatId}/messages?account_id=${accountId}`);
    return data.items || [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.log(`No messages found for lead ${leadId} and account ${accountId}`);
      return [];
    }
    console.error('Error fetching chat messages from Unipile:', error);
    throw error;
  }
};

export const getLogEntries = async (accountId: string): Promise<LogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('log_entries_assistantpage')
      .select('*')
      .eq('account_id', accountId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching log entries:', error);
    return [];
  }
};

export const createLogEntry = async (accountId: string, leadId: string, leadName: string, eventType: string, message: string): Promise<LogEntry> => {
  try {
    const { data, error } = await supabase
      .from('log_entries_assistantpage')
      .insert({
        account_id: accountId,
        lead_id: leadId,
        lead_name: leadName,
        event_type: eventType,
        message: message,
        timestamp: new Date().toISOString(),
      })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating log entry:', error);
    throw error;
  }
};

export const storePreviousMessages = async (accountId: string, enabledLeadIds: string[], botId: string) => {
  try {
    for (const leadId of enabledLeadIds) {
      const messages = await getMessagesForLead(leadId, accountId);
      for (const message of messages) {
        await saveMessageToSupabase(message, accountId, leadId, botId);
      }
    }
  } catch (error) {
    console.error('Error storing previous messages:', error);
    throw error;
  }
};

export const checkNewMessages = async (accountId: string, enabledLeadIds: string[], botId: string, apiKey: string) => {
  try {
    for (const leadId of enabledLeadIds) {
      try {
        const lastStoredMessage = await getLatestMessageForLead(leadId);
        const newMessages = await getMessagesForLead(leadId, accountId);
        
        console.log(`Checking messages for lead ${leadId}`);
        console.log(`Last stored message:`, lastStoredMessage);
        console.log(`Total messages from Unipile:`, newMessages.length);

        let newMessagesSinceLastStored: Message[] = [];

        if (lastStoredMessage) {
          newMessagesSinceLastStored = newMessages.filter(message => 
            new Date(message.created_at || message.timestamp || '') > new Date(lastStoredMessage.created_at || lastStoredMessage.timestamp || '')
          );
        } else {
          newMessagesSinceLastStored = newMessages;
        }

        console.log(`New messages since last stored: ${newMessagesSinceLastStored.length}`);

        for (const message of newMessagesSinceLastStored) {
          try {
            await saveMessageToSupabase(message, accountId, leadId, botId);
            const leadProfile = await getLeadProfile(leadId);
            const leadName = leadProfile?.name || 'Unknown';
            const messageContent = message.content || message.text || '';
            await createLogEntry(accountId, leadId, leadName, 'New Message', messageContent);

            console.log(`Processing new message: ${messageContent}`);

            if (message.sender_id === leadId) {
              console.log(`Generating bot response for message: ${messageContent}`);
              const botResponse = await generateBotResponse(messageContent, botId, apiKey, leadId, accountId);
              const sentBotMessage = await sendMessageToLead(leadId, botResponse, accountId);
              await saveMessageToSupabase(sentBotMessage, accountId, leadId, botId);
              await createLogEntry(accountId, leadId, leadName, 'Bot Response', botResponse);

              console.log(`Generated and saved bot response: ${botResponse}`);
            } else {
              console.log(`Message is from the assistant, not generating a response.`);
            }
          } catch (messageError) {
            console.error(`Error processing message for lead ${leadId}:`, messageError);
            await createLogEntry(accountId, leadId, 'Unknown', 'Error', `Failed to process message: ${messageError instanceof Error ? messageError.message : 'Unknown error'}`);
          }
        }
      } catch (leadError) {
        console.error(`Error checking messages for lead ${leadId}:`, leadError);
        await createLogEntry(accountId, leadId, 'Unknown', 'Error', `Failed to check messages: ${leadError instanceof Error ? leadError.message : 'Unknown error'}`);
      }
    }
    console.log('Finished checking new messages for all enabled leads');
  } catch (error) {
    console.error('Error in checkNewMessages:', error);
    await createLogEntry(accountId, 'system', 'System', 'Error', `checkNewMessages failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const generateBotResponse = async (
  userMessage: string,
  assistantId: string,
  apiKey: string,
  leadId: string,
  accountId: string
): Promise<string> => {
  try {
    // Fetch recent messages to maintain context
    const recentMessages = await getRecentMessages(leadId, accountId);

    // Prepare the conversation history
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.sender_id === leadId ? 'user' : 'assistant',
      content: msg.content || msg.text || ''
    }));

    // Add the current user message
    conversationHistory.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `You are an AI assistant with ID ${assistantId}. You are engaging in a conversation on LinkedIn. Maintain a professional and friendly tone. Use the conversation history to provide context-aware responses.` 
          },
          ...conversationHistory
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating bot response:', error);
    return "I'm sorry, I encountered an error while processing your message. Please try again later.";
  }
};

// Helper function to get recent messages
async function getRecentMessages(leadId: string, accountId: string, limit: number = 5): Promise<Message[]> {
  const messages = await getMessagesForLead(leadId, accountId);
  return messages.slice(-limit); // Get the last 'limit' messages
}

// Utility function to retry API calls with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, retries)));
      retries++;
    }
  }
  throw new Error('Max retries reached');
};

export default {
  getMessagesForLead,
  sendMessageToLead,
  saveMessageToSupabase,
  saveAssistantConfiguration,
  getAssistantConfiguration,
  deleteAssistantConfiguration,
  getLeadProfile,
  updateLeadProfile,
  getBotConfiguration,
  updateBotConfiguration,
  getAllBots,
  createBot,
  getCRMLists,
  getDaininBots,
  deleteBot,
  getLatestMessageForLead,
  getMessageCountForLead,
  getChatId,
  getChats,
  getChatMessages,
  getLogEntries,
  createLogEntry,
  storePreviousMessages,
  checkNewMessages,
  generateBotResponse,
  retryWithBackoff,
};