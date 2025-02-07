import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  LinkedInAccount,
  getAllUnipileLinkedInAccounts,
  getLinkedInAccount,
} from "../utils/api";
import { supabase } from "../utils/supabase";
import { User } from "@supabase/supabase-js";

export interface CombinedLinkedInAccount extends LinkedInAccount {
  user_id: string;
  sources: { id: string; status: string }[];
}

interface AccountContextType {
  accounts: CombinedLinkedInAccount[];
  selectedAccount: CombinedLinkedInAccount | null;
  setSelectedAccount: (account: CombinedLinkedInAccount | null) => void;
  refreshAccounts: () => Promise<void>;
  syncAccounts: () => Promise<void>;
  ensureAccountInSupabase: (
    account: CombinedLinkedInAccount
  ) => Promise<CombinedLinkedInAccount>;
  isLoading: boolean;
  user: User | null;
}
const handleError = (error: any, customMessage: string) => {
  console.error(customMessage, error);
  throw new Error(`${customMessage}: ${error.message}`);
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [accounts, setAccounts] = useState<CombinedLinkedInAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<CombinedLinkedInAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user found");
      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      setUser(existingUser);
      if (existingUserError && existingUserError.code !== "PGRST116") {
        handleError(existingUserError, "Error checking existing user");
      }

      const fetchedAccounts = await getAllUnipileLinkedInAccounts();
        let combinedAccounts:CombinedLinkedInAccount[] =[]
      if(existingUser.role==="admin"){
         combinedAccounts= fetchedAccounts.map(
          (account) => ({
            ...account,
            user_id: user.id,
            sources: account.sources || [],
          })
        );
      }else{
        combinedAccounts = fetchedAccounts
        .filter((account) => {
          return account.id === existingUser.unipile_id;
        })
        .map((account) => ({
          ...account,
          user_id: user.id,
          sources: account.sources || [],
        }));
      }
      setAccounts(combinedAccounts);
      if (combinedAccounts.length > 0 && !selectedAccount) {
        setSelectedAccount(combinedAccounts[2]);
      }
      if (combinedAccounts.length === 1 && !selectedAccount) {
        setSelectedAccount(combinedAccounts[0]);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
      setSelectedAccount(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const refreshAccounts = useCallback(async () => {
    await fetchAccounts();
  }, [fetchAccounts]);

  const syncAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      // Implement your sync logic here
      // For example:
      // await syncUnipileAccounts(user.id);
      await fetchAccounts();
    } catch (error) {
      console.error("Error syncing accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAccounts]);

  const ensureAccountInSupabase = useCallback(
    async (
      account: CombinedLinkedInAccount
    ): Promise<CombinedLinkedInAccount> => {
      try {
        const { data, error } = await supabase
          .from("linkedin_accounts")
          .upsert(
            {
              user_id: account.user_id,
              unipile_id: account.id,
              name: account.name,
              status: account.status,
              provider: "LINKEDIN",
              last_synced: new Date().toISOString(),
            },
            {
              onConflict: "unipile_id",
            }
          )
          .select()
          .single();

        if (error) throw error;
        return { ...account, ...data, sources: account.sources };
      } catch (error) {
        console.error("Error ensuring account in Supabase:", error);
        throw error;
      }
    },
    []
  );

  const handleSetSelectedAccount = useCallback(
    async (account: CombinedLinkedInAccount | null) => {
      if (account) {
        try {
          const fullAccount = await getLinkedInAccount(account.id);
          setSelectedAccount({
            ...fullAccount,
            user_id: account.user_id,
            sources: account.sources,
          });
        } catch (error) {
          console.error("Error fetching full account details:", error);
          setSelectedAccount(account);
        }
      } else {
        setSelectedAccount(null);
      }
    },
    []
  );

  const value = {
    accounts,
    selectedAccount,
    setSelectedAccount: handleSetSelectedAccount,
    refreshAccounts,
    syncAccounts,
    ensureAccountInSupabase,
    isLoading,
    user,
  };

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};

export default AccountContext;
