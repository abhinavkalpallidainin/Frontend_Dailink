import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import {
  CombinedLinkedInAccount,
  List,
  Profile,
  Campaign,
  CampaignLog,
  SupabaseResponse,
  DaininBot,
  Account,
} from "../types/type";
import { FormDataUser } from "./api";
import { getAllUnipileLinkedInAccounts } from "./api";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Error handling
const handleError = (error: any, customMessage: string) => {
  console.error(customMessage, error);
  throw new Error(`${customMessage}: ${error.message}`);
};

// User management
export const getOrCreateUser = async (): Promise<User> => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) handleError(authError, "Error getting authenticated user");
    if (!user) throw new Error("No authenticated user found");

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existingUserError && existingUserError.code !== "PGRST116") {
      handleError(existingUserError, "Error checking existing user");
    }

    if (!existingUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ id: user.id, email: user.email })
        .single();

      if (insertError) {
        handleError(insertError, "Error creating user in users table");
      }

      if (!newUser) {
        throw new Error("Failed to create new user");
      }
    }

    return user;
  } catch (error) {
    throw error;
  }
};

export const userSignup = async (formData: FormDataUser) => {
  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("email", formData.email)
      .single();

    if (existingUser) {
      throw new Error("User already exists");
    }

    if (existingUserError && existingUserError.code !== "PGRST116") {
      throw existingUserError;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: formData.email,
        password: formData.password,
      }
    );

    if (signUpError) {
      throw signUpError;
    }

    const user = signUpData.user;
    const fetchedAccounts = await getAllUnipileLinkedInAccounts();

    const account = fetchedAccounts.find(
      (account) => account.id === formData.unipile_id
    );
    const unipile_id = account ? account.id : null;

    if (unipile_id) {
      const { data, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email: formData.email,
            created_at: new Date().toISOString(),
            last_sign_in: new Date().toISOString(),
            role: formData.role,
            fullname: formData.fullname,
            unipile_id: unipile_id,
          },
        ])
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }
      return data;
    }
    throw "Unipile Id does'nt exist";
  } catch (error) {
    console.error("Error adding User:", error);
    throw error;
  }
};
export const updateUser = async (user: any) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        fullname: user.fullname,
        role: user.role,
        last_sign_in: new Date().toISOString(), // Example of updating another column
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error };
  }
};
// Mock function to fetch LinkedIn ID (replace with actual logic)

// LinkedIn Account functions
export const ensureLinkedInAccount = async (
  account: Partial<CombinedLinkedInAccount>
): Promise<CombinedLinkedInAccount> => {
  try {
    const user = await getOrCreateUser();

    console.log("Ensuring LinkedIn account:", account);

    const { data, error } = await supabase
      .from("linkedin_accounts")
      .select("*")
      .eq("unipile_id", account.unipile_id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      console.log("LinkedIn account not found, creating new one");
      if (!account.unipile_id || !account.name || !account.status) {
        throw new Error(
          "Missing required fields for creating LinkedIn account"
        );
      }

      const newAccountData = {
        user_id: user.id,
        unipile_id: account.unipile_id,
        name: account.name,
        status: account.status,
        provider: "LINKEDIN" as const,
        last_synced: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data: newAccount, error: insertError } = (await supabase
        .from("linkedin_accounts")
        .insert(newAccountData)
        .single()) as SupabaseResponse<CombinedLinkedInAccount>;

      if (insertError) throw insertError;
      if (!newAccount) throw new Error("Failed to create new LinkedIn account");
      console.log("New LinkedIn account created:", newAccount);

      return {
        ...newAccountData,
        id: newAccount.id,
        sources: account.sources || [],
      };
    }

    console.log("LinkedIn account found:", data);
    return {
      ...data,
      sources: account.sources || [],
    } as CombinedLinkedInAccount;
  } catch (error) {
    console.error("Error ensuring LinkedIn account:", error);
    throw error;
  }
};

export const getAllLinkedInAccounts = async (
  userId: string
): Promise<CombinedLinkedInAccount[]> => {
  try {
    const { data, error } = await supabase
      .from("linkedin_accounts")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map(
      (account) =>
        ({
          ...account,
          sources: [],
        } as CombinedLinkedInAccount)
    );
  } catch (error) {
    handleError(error, "Error fetching LinkedIn accounts");
    return [];
  }
};
export const getAllUsers = async (): Promise<User[]> => {
  try {
    let { data: users, error } = await supabase.from("users").select("*");

    if (error) throw error;
    return users || [];
  } catch (error) {
    handleError(error, "Error fetching LinkedIn accounts");
    return [];
  }
};
export const deleteUser = async (userId: string, email: string) => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error };
  }
};

// List functions
export const getCRMLists = async (accountId: string): Promise<List[]> => {
  try {
    const user = await getOrCreateUser();
    const { data, error } = await supabase
      .from("crm_lists")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching CRM lists:", error);
    return [];
  }
};

export const createCRMList = async (
  name: string,
  account: { unipile_id: string }
): Promise<List | null> => {
  try {
    const user = await getOrCreateUser();
    console.log("Creating CRM list:", {
      name,
      userId: user.id,
      accountId: account.unipile_id,
    });
    const { data, error } = await supabase
      .from("crm_lists")
      .insert({
        name,
        user_id: user.id,
        account_id: account.unipile_id,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when creating CRM list");
    return data;
  } catch (error) {
    console.error("Error creating CRM list:", error);
    throw error;
  }
};

export const updateCRMList = async (
  id: string,
  name: string
): Promise<List | null> => {
  try {
    const { data, error } = await supabase
      .from("crm_lists")
      .update({ name })
      .match({ id })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, "Error updating CRM list");
    return null;
  }
};

export const deleteCRMList = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("crm_lists").delete().match({ id });

    if (error) throw error;
  } catch (error) {
    handleError(error, "Error deleting CRM list");
  }
};

// Profile functions
export const addProfileToList = async (
  listId: string,
  profile: Omit<Profile, "id" | "list_id" | "created_at" | "updated_at">
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from("crm_profiles")
      .insert({ ...profile, list_id: listId })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, "Error adding profile to list");
    return null;
  }
};
export const addAccountToList = async (
  listId: string,
  account: Omit<Account, "id" | "list_id" | "created_at" | "updated_at">
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from("crm_accounts")
      .insert({ ...account, list_id: listId })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, "Error adding profile to list");
    return null;
  }
};

export const getProfilesInList = async (listId: string): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from("crm_profiles")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error fetching profiles in list");
    return [];
  }
};
export const getAccountsInList = async (listId: string): Promise<Account[]> => {
  try {
    const { data, error } = await supabase
      .from("crm_accounts")
      .select("*")
      .eq("list_id", listId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error fetching profiles in list");
    return [];
  }
};
export const removeProfileFromList = async (
  profileId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("crm_profiles")
      .delete()
      .match({ id: profileId });

    if (error) throw error;
  } catch (error) {
    handleError(error, "Error removing profile from list");
  }
};

export const searchProfiles = async (
  query: string,
  accountId: string
): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from("crm_profiles")
      .select("*")
      .eq("account_id", accountId)
      .or(
        `name.ilike.%${query}%,headline.ilike.%${query}%,location.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error searching profiles");
    return [];
  }
};

// Campaign functions
export const getCampaigns = async (accountId: string): Promise<Campaign[]> => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error fetching campaigns");
    return [];
  }
};

export const createCampaign = async (
  campaign: Omit<Campaign, "id" | "created_at">
): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .insert(campaign)
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when creating campaign");
    return data;
  } catch (error) {
    handleError(error, "Error creating campaign");
    throw error;
  }
};

export const updateCampaign = async (
  id: number,
  updates: Partial<Campaign>
): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when updating campaign");
    return data;
  } catch (error) {
    handleError(error, "Error updating campaign");
    throw error;
  }
};

export const deleteCampaign = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    handleError(error, "Error deleting campaign");
  }
};

// Campaign Log functions
export const getCampaignLogs = async (
  campaignId: number
): Promise<CampaignLog[]> => {
  try {
    const { data, error } = await supabase
      .from("campaign_logs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error fetching campaign logs");
    return [];
  }
};

export const createCampaignLog = async (
  log: Omit<CampaignLog, "id" | "created_at">
): Promise<CampaignLog> => {
  try {
    const { data, error } = await supabase
      .from("campaign_logs")
      .insert(log)
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when creating campaign log");
    return data;
  } catch (error) {
    handleError(error, "Error creating campaign log");
    throw error;
  }
};

// DAININ Bot functions
export const addDaininBot = async (
  botData: Omit<DaininBot, "id" | "created_at" | "updated_at">
): Promise<DaininBot> => {
  try {
    const { data, error } = await supabase
      .from("dainin_bots")
      .insert(botData)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when creating DAININ bot");
    return data;
  } catch (error) {
    handleError(error, "Error adding DAININ bot");
    throw error;
  }
};

export const getDaininBots = async (userId: string): Promise<DaininBot[]> => {
  try {
    const { data, error } = await supabase
      .from("dainin_bots")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, "Error fetching DAININ bots");
    return [];
  }
};

export const updateDaininBot = async (
  id: string,
  updates: Partial<DaininBot>
): Promise<DaininBot> => {
  try {
    const { data, error } = await supabase
      .from("dainin_bots")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("No data returned when updating DAININ bot");
    return data;
  } catch (error) {
    handleError(error, "Error updating DAININ bot");
    throw error;
  }
};

export const deleteDaininBot = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("dainin_bots").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    handleError(error, "Error deleting DAININ bot");
  }
};

export const addProfilesToList = async (
  listId: string,
  profiles: Partial<Profile>[]
): Promise<void> => {
  try {
    // First get existing profiles to avoid duplicates
    const { data: existingProfiles, error: fetchError } = await supabase
      .from("crm_profiles")
      .select("linkedin_id")
      .eq("list_id", listId);

    if (fetchError) {
      console.error("Error fetching existing profiles:", fetchError);
      throw fetchError;
    }

    const existingIds = new Set(
      existingProfiles?.map((p) => p.linkedin_id) || []
    );

    // Filter out profiles that already exist in the list
    const newProfiles = profiles.filter(
      (profile) => !existingIds.has(profile.linkedin_id)
    );

    if (newProfiles.length === 0) {
      console.log("No new profiles to add");
      return;
    }

    // Insert profiles in smaller batches to avoid potential issues
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < newProfiles.length; i += BATCH_SIZE) {
      batches.push(newProfiles.slice(i, i + BATCH_SIZE));
    }

    let successCount = 0;
    for (const batch of batches) {
      try {
        const profilesToInsert = batch.map((profile) => ({
          list_id: listId,
          linkedin_id: profile.linkedin_id,
          name: profile.name || "",
          headline: profile.headline || "",
          location: profile.location || "",
          profile_url: profile.profile_url || "",
        }));

        const { error: insertError } = await supabase
          .from("crm_profiles")
          .insert(profilesToInsert)
          .select();

        if (insertError) {
          if (insertError.code === "23505") {
            // Unique violation error code
            console.log("Skipping duplicate profiles in batch");
            continue;
          }
          console.error("Error inserting profiles batch:", insertError);
          throw insertError;
        }

        successCount += batch.length;
      } catch (error: any) {
        // Type the error as any since we know the structure
        if (error?.code === "23505") {
          console.log("Skipping duplicate profiles in batch");
          continue;
        }
        throw error;
      }
    }

    console.log(`Successfully added ${successCount} new profiles to list`);
  } catch (error) {
    console.error("Error in addProfilesToList:", error);
    throw error;
  }
};
export const addAccountsToList = async (
  listId: string,
  profiles: Partial<Account>[]
): Promise<void> => {
  try {
    // First get existing profiles to avoid duplicates
    const { data: existingProfiles, error: fetchError } = await supabase
      .from("crm_accounts")
      .select("linkedin_id")
      .eq("list_id", listId);

    if (fetchError) {
      console.error("Error fetching existing profiles:", fetchError);
      throw fetchError;
    }

    const existingIds = new Set(
      existingProfiles?.map((p) => p.linkedin_id) || []
    );

    // Filter out profiles that already exist in the list
    const newProfiles = profiles.filter(
      (profile) => !existingIds.has(profile.linkedin_id)
    );

    if (newProfiles.length === 0) {
      console.log("No new profiles to add");
      return;
    }

    // Insert profiles in smaller batches to avoid potential issues
    const BATCH_SIZE = 10;
    const batches = [];
    for (let i = 0; i < newProfiles.length; i += BATCH_SIZE) {
      batches.push(newProfiles.slice(i, i + BATCH_SIZE));
    }

    let successCount = 0;
    for (const batch of batches) {
      try {
        const profilesToInsert = batch.map((profile) => ({
          list_id: listId,
          linkedin_id: profile.linkedin_id,
          name: profile.name || "",
          summary: profile.summary || "",
          location: profile.location || "",
          industry: profile.industry || "",
          followers_count: profile.followers_count || 0,
          profile_url: profile.profile_url || "",
          logo: profile.logo || "",
        }));

        const { error: insertError } = await supabase
          .from("crm_accounts")
          .insert(profilesToInsert)
          .select();

        if (insertError) {
          if (insertError.code === "23505") {
            // Unique violation error code
            console.log("Skipping duplicate profiles in batch");
            continue;
          }
          console.error("Error inserting profiles batch:", insertError);
          throw insertError;
        }

        successCount += batch.length;
      } catch (error: any) {
        // Type the error as any since we know the structure
        if (error?.code === "23505") {
          console.log("Skipping duplicate profiles in batch");
          continue;
        }
        throw error;
      }
    }

    console.log(`Successfully added ${successCount} new profiles to list`);
  } catch (error) {
    console.error("Error in addProfilesToList:", error);
    throw error;
  }
};

export default supabase;
