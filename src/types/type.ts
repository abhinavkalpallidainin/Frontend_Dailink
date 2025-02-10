import { ReactNode } from "react";

// User related types
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in?: string;
}

// LinkedIn Account related types
export interface LinkedInAccount {
  id: string;
  user_id: string;
  unipile_id: string;
  name: string;
  status: string;
  provider: "LINKEDIN";
  created_at: string;
  last_synced?: string;
  initial_network_size?: number;
  initial_followers_count?: number;
  provider_id?: string;
}

export interface UnipileLinkedInAccount {
  id: string;
  name: string;
  status: string;
  provider: "LINKEDIN";
  created_at: string;
  sources: { id: string; status: string }[];
}

export interface CombinedLinkedInAccount extends LinkedInAccount {
  user_id: string;
  sources: { id: string; status: string }[];
  unipile_id: string;
}

// Message related types
export interface Message {
  id: string;
  content: string;
  text?: string;
  sender_id: string;
  created_at: string;
  timestamp?: string;
  account_id?: string;
  lead_id?: string;
  original_id?: string;
}

// Assistant related types
export interface AssistantConfiguration {
  id: string;
  account_id: string;
  bot_id: string;
  list_id: string;
  profile_ids: string[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// List related types
export interface List {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  account_id: string;
}

// Profile related types
export interface Profile {
  id: string;
  list_id: string;
  linkedin_id: string;
  name: string;
  headline?: string;
  location?: string;
  profile_url?: string;
  created_at: string;
  updated_at: string;
}
export interface Account {
  id: string;
  list_id: string;
  linkedin_id: string;
  name: string;
  summary?: string;
  location?: string;
  industry?: string;
  followers_count?: number;
  profile_url?: string;
  created_at: string;
  updated_at: string;
  logo: string;
}
export interface ExtendedProfile extends Profile {
  industry?: string;
  company?: string;
  connectionDegree?: string;
  yearsOfExperience?: number;
}

// Lead related types
export interface Lead {
  id: string;
  campaign_id: number;
  crm_profile_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  next_action_date: string | null;
  personalized_message: string | null;
  funnel_status: string;
  action_status: string | null;
  last_action_date: string | null;
  lh_id: string | null;
  current_action_id: number | null;
  crm_profiles: {
    id: string;
    list_id: string;
    linkedin_id: string;
    name: string;
    headline: string | null;
    location: string | null;
    profile_url: string | null;
    email?: string | null;
    phone?: string | null;
    profile_picture_url?: string | null;
    connection_degree?: string;
  };
  firstName?: string;
  lastName?: string;
  company?: string;
  position?: string;
  imageUrl?: string;
}

// Action related types
export type ActionType =
  | "SEND_INVITATION"
  | "SEND_MESSAGE"
  | "VISIT_PROFILE"
  | "SEARCH"
  | "FOLLOW_UNFOLLOW"
  | "LIKE_POST"
  | "BOOST_POST"
  | "COMMENT_POST"
  | "DELAY"
  | "FILTER_FIRST_DEGREE_NETWORK";

export interface BaseActionConfig {
  scrapeProfile?: boolean;
  useSalesNavigator?: boolean;
  delay?: {
    days: number;
    hours: number;
    minutes: number;
  };
  defaultDelay?: {
    days: number;
    hours: number;
    minutes: number;
  };
  useDefaultDelay?: boolean;
}

export interface SearchConfig extends BaseActionConfig {
  keywords?: string;
  location?: { include?: string[]; exclude?: string[] } | string[];
  industry?: { include?: string[]; exclude?: string[] } | string[];
  company_size?: string[];
  connection_degree?: number[];
  job_title?: string[];
  tenure?: number;
}

export interface DelayConfig extends BaseActionConfig {
  days: number;
  hours: number;
  minutes: number;
}

export interface SendInvitationConfig extends BaseActionConfig {
  message: string;
}

export interface SendMessageConfig extends BaseActionConfig {
  message: string;
}

export interface LikePostConfig extends BaseActionConfig {
  postCount: number;
  addComment: boolean;
  
}

export interface CommentPostConfig extends BaseActionConfig {
  comment: string;
}

export interface VisitProfileConfig extends BaseActionConfig {
  profileCount: number;
}

export interface FollowUnfollowConfig extends BaseActionConfig {
  mode: "follow" | "unfollow";
  profileId?: string;
}

export interface BoostPostConfig extends BaseActionConfig {
  budget: number;
  duration: number;
}

export type ActionConfig =
  | SearchConfig
  | SendInvitationConfig
  | SendMessageConfig
  | LikePostConfig
  | CommentPostConfig
  | VisitProfileConfig
  | FollowUnfollowConfig
  | BoostPostConfig
  | DelayConfig;

export interface Action {
  id: number;
  campaign_id: number;
  type: ActionType;
  order: number;
  name: string;
  custom_name?: string;
  icon: ReactNode;
  config: ActionConfig;
  queue: number;
  successful: number;
  failed: number;
  excluded: number;
  pending: number;
  is_sequential?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Campaign related types
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
  post_liked: number;
  created_at: string;
  workflow: Action[];
  daily_limit: number;
  target_connections: string;
  time_zone: string;
  start_date: string;
  end_date: string;
  auto_stop_empty_queue: boolean;
  execution_window_start: string;
  execution_window_end: string;
}

export interface Sequence {
  id: string;
  name: string;
  campaign_id: number;
  actions: Action[];
}

export interface CampaignList {
  id: string;
  campaign_id: number;
  list_id: string;
  created_at: string;
}

export interface CampaignLog {
  id: string;
  campaign_id: number;
  action_type: string;
  details: Record<string, any>;
  created_at: string;
}

// Queue related types
export interface QueueView {
  type: "main" | "action";
  actionId?: number;
  actionName?: string;
  actionNumber?: number;
  queueCount: number;
}

// Bot related types
export interface DaininBot {
  id: string;
  user_id: string;
  name: string;
  assistant_id: string;
  api_key: string;
  is_cohort_bot: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  per_page: number;
}

// Error types
export interface LinkedInError extends Error {
  code: string;
  details?: Record<string, any>;
}

// Chat related types
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

export interface Chat {
  id: string;
  type: number;
  folder: string[];
  unread: number;
  archived: number;
  read_only: number;
  timestamp: string;
  account_id: string;
  provider_id: string;
  account_type: string;
  unread_count: number;
  disabledFeatures: string[];
  attendee_provider_id: string;
  name: string | null;
  muted_until: string | null;
}

// Log related types
export interface LogEntry {
  id: string;
  account_id: string;
  lead_id: string;
  lead_name: string;
  event_type: string;
  message: string;
  timestamp: string;
}

export interface ExecutionLog {
  id: string;
  action_type: string;
  status: "running" | "completed" | "failed" | "stopped" | "delaying";
  message: string;
  timestamp: string;
}

// LinkedIn specific types
export interface LinkedInProfile {
  id: string;
  name: string;
  headline?: string;
  location?: string;
  picture_url?: string;
  num_connections?: number;
  num_followers?: number;
}

export interface LinkedInMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
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

export interface LinkedInInvitation {
  id: string;
  recipient_id: string;
  status: string;
  sent_at: string;
}

// CRM related types
export interface CRMList {
  id: string;
  name: string;
  leadCount: number;
}

export interface CRMProfile {
  name: string;
  headline?: string;
  location?: string;
}

export interface LeadCount {
  status: string;
  count: number;
}

// Network stats related types
export interface NetworkStats {
  currentNetworkSize: number;
  currentFollowersCount: number;
}

export interface NetworkGrowth {
  networkGrowth: number;
  followersGrowth: number;
}

export type HSCStage =
  | "preparing-run"
  | "getting-champions"
  | "analyzing-champions"
  | "completed";

export interface HSCRun {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  // Add other relevant fields
}

export interface HSCRun {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  // Add other relevant fields
}

// Supabase specific types
export interface SupabaseData {
  [key: string]: any;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

// Scraped Profile type
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
  skills: Array<{ name: string; endorsement_count: number }>;
  education: Array<{
    degree: string;
    school: string;
    field_of_study: string;
    start: string | null;
    end: string | null;
  }>;
  work_experience: Array<{
    company: string;
    position: string;
    location: string;
    current: boolean;
    description: string;
    start: string;
    end: string | null;
  }>;
  languages: string[];
  volunteering_experience: Array<{
    start: string;
    end: string;
    cause: string;
    company: string;
    role: string;
  }>;
  contact_info: {
    emails: string[];
    phones: string[];
  };
  profile_picture_url: string;
}
