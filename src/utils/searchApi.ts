// src/utils/searchApi.ts

import { Filters, SearchResult } from "../types/search";
import { supabase } from "./supabase";
import { RangeValue } from "../types/search";
// Constants
const UNIPILE_BASE_URL =
  process.env.REACT_APP_UNIPILE_BASE_URL || "https://api1.unipile.com:13143";
const UNIPILE_ACCESS_TOKEN = process.env.REACT_APP_UNIPILE_ACCESS_TOKEN || "";

// Parameter Types
export type ParameterType =
  | "LOCATION"
  | "PEOPLE"
  | "COMPANY"
  | "SCHOOL"
  | "SERVICE"
  | "DEPARTMENT"
  | "JOB_TITLE"
  | "INDUSTRY"
  | "KEYWORDS"
  | "SAVED_SEARCHES"
  | "RECENT_SEARCHES"
  | "FOLLOWERS"
  | "CONNECTIONS"
  |"ACCOUNT_LISTS"
  |"TECHNOLOGIES"
  |"SAVED_ACCOUNTS";

// Base Interfaces
export interface SearchParameter {
  id: string;
  title: string;
  count?: number;
}

export interface URLSearchParams {
  api: "classic" | "sales_navigator";
  category: "people" | "companies";
  url: string;
}

export interface PagingInfo {
  start: number;
  page_count: number;
  total_count: number;
}

export interface SearchResponse {
  object: string;
  items: SearchResult[];
  config?: {
    url?: string;
  };
  paging: PagingInfo;
  cursor: string;
}

// LinkedIn API Params
export interface ClassicSearchParams {
  api: "classic";
  category: "people" | "companies";
  keywords?: string;
  industry?: string[];
  location?: string[];
  profile_language?: string[];
  network_distance?: (1 | 2 | 3 | "GROUP")[];
  company?: string[];
  past_company?: string[];
  school?: string[];
  service?: string[];
  connections_of?: string[];
  followers_of?: string[];
  open_to?: ("proBono" | "boardMember")[];
  advanced_keywords?: {
    first_name?: string;
    last_name?: string;
    title?: string;
    company?: string;
    school?: string;
  };
  url?: string;
  has_job_offers?: string | boolean;
  headcount?: Array<{ min?: number; max?: number }>;
}

export interface SalesNavigatorSearchParams {
  api: "sales_navigator";
  category: "people" | "companies";
  keywords?: string;
  location?: { include?: string[]; exclude?: string[] };
  company_location?: { include?: string[]; exclude?: string[] };
  industry?: { include?: string[]; exclude?: string[] };
  first_name?: string;
  profile_language?: string[];
  last_name?: string;
  network_distance?: (1 | 2 | 3 | "GROUP")[];
  company?: { include?: string[]; exclude?: string[] };
  past_company?: { include?: string[]; exclude?: string[] };
  school?: { include?: string[]; exclude?: string[] };
  function?: { include?: string[]; exclude?: string[] };
  role?: { include?: string[]; exclude?: string[] };
  past_role?: { include?: string[]; exclude?: string[] };
  seniority?: { include?: string[]; exclude?: string[] };
  tenure_at_role?: Array<{ min?: number; max?: number }>;
  tenure_at_company?: Array<{ min?: number; max?: number }>;
  job_function?: { include?: string[]; exclude?: string[] };
  tenure?: Array<{ min?: number; max?: number }>;
  company_headcount?: Array<{ min?: number; max?: number }>;
  following_your_company?: boolean;
  viewed_your_profile_recently?: boolean;
  viewed_profile_recently?: boolean;
  messaged_recently?: boolean;
  include_saved_leads?: boolean;
  connections_of?: string[];
  url?: string;
  saved_search_id?: string;
  saved_accounts?:string[];
  recent_search_id?: string;
  has_job_offers?: boolean | string;
  department_headcount?: {
    department: string[];
    min: number;
    max: number;
  };
  department_headcount_growth?: {
    department: string[];
    min: number;
    max: number;
  };
  annual_revenue?: {
    currency: string;
    min: number;
    max: number;
  };
  account_lists?: {
    include: string[];
  };
  headcount_growth?: { min?: number; max?: number }|{};
  fortune?: RangeValue[];
  technologies?: string[];
  followers_count?: { min?: number; max?: number }|{};
  headcount?: Array<{ min?: number; max?: number }>;
}

export type SearchParams =
  | ClassicSearchParams
  | SalesNavigatorSearchParams
  | URLSearchParams;

// Helper Functions
const isNonEmptyArray = <T>(arr: T[] | undefined | null): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

const isValidNetworkDistance = (value: number): boolean => {
  return [1, 2, 3].includes(value);
};

const isValidProfileLanguage = (value: string): boolean => {
  return typeof value === "string" && value.length === 2;
};

const filterNameToParamType = (filterName: string): ParameterType => {
  const mapping: Record<string, ParameterType> = {
    location: "LOCATION",
    people: "PEOPLE",
    company: "COMPANY",
    school: "SCHOOL",
    service: "SERVICE",
    job_function: "DEPARTMENT",
    role: "JOB_TITLE",
    past_role: "JOB_TITLE",
    industry: "INDUSTRY",
    keywords: "KEYWORDS",
    saved_search: "SAVED_SEARCHES",
    recent_search: "RECENT_SEARCHES",
    followers: "FOLLOWERS",
    connections: "CONNECTIONS",
  };
  return mapping[filterName.toLowerCase()] || "KEYWORDS";
};

// API Request Helper
const apiRequest = async <T>(
  endpoint: string,
  method: string = "GET",
  body?: any,
  queryParams?: Record<string, string>,
  cursor?: string
): Promise<T> => {
  let url = `${UNIPILE_BASE_URL}${endpoint}`;
  const params = new URLSearchParams(queryParams || {});

  if (cursor) {
    params.append("cursor", cursor);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": UNIPILE_ACCESS_TOKEN,
  };

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", {
        status: response.status,
        error: errorText,
      });
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Request Failed:", {
      endpoint,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

// Transform Functions
const transformClassicFilters = (filters: Filters): ClassicSearchParams => {
  const params: ClassicSearchParams = {
    api: "classic",
    category: "people",
  };

  // Handle URL-based search
  if ("search_url" in filters && filters.search_url) {
    params.url = filters.search_url;
    return params;
  }

  // Add basic text fields
  if (filters.keywords?.trim()) {
    params.keywords = filters.keywords.trim();
  }

  // Handle advanced keywords
  if (filters.first_name?.trim() || filters.last_name?.trim()) {
    params.advanced_keywords = {
      ...(filters.first_name?.trim() && {
        first_name: filters.first_name.trim(),
      }),
      ...(filters.last_name?.trim() && { last_name: filters.last_name.trim() }),
    };
  }

  // Handle array fields - only add if non-empty
  if (isNonEmptyArray(filters.industry)) {
    params.industry = filters.industry;
  }

  if (isNonEmptyArray(filters.network_distance)) {
    const validDistances = filters.network_distance
      .map((d) => {
        switch (d) {
          case "1":
            return 1;
          case "2":
            return 2;
          case "3":
            return 3;
          case "GROUP":
            return "GROUP";
          default:
            return undefined;
        }
      })
      .filter((d): d is 1 | 2 | 3 | "GROUP" => d !== undefined);

    if (validDistances.length > 0) {
      params.network_distance = validDistances;
    }
  }

  if (isNonEmptyArray(filters.profile_language)) {
    const validLanguages = filters.profile_language.filter(
      isValidProfileLanguage
    );
    if (validLanguages.length > 0) {
      params.profile_language = validLanguages;
    }
  }

  if (
    filters.location &&
    ((Array.isArray(filters.location) && filters.location.length > 0) ||
      (!Array.isArray(filters.location) && filters.location.trim()))
  ) {
    params.location = Array.isArray(filters.location)
      ? filters.location
      : [filters.location];
  }

  // Handle company fields
  if (
    filters.company &&
    ((Array.isArray(filters.company) && filters.company.length > 0) ||
      (!Array.isArray(filters.company) && filters.company.trim()))
  ) {
    params.company = Array.isArray(filters.company)
      ? filters.company
      : [filters.company];
  }

  if (
    filters.past_company &&
    ((Array.isArray(filters.past_company) && filters.past_company.length > 0) ||
      (!Array.isArray(filters.past_company) && filters.past_company.trim()))
  ) {
    params.past_company = Array.isArray(filters.past_company)
      ? filters.past_company
      : [filters.past_company];
  }

  // Handle school
  if (
    filters.school &&
    ((Array.isArray(filters.school) && filters.school.length > 0) ||
      (!Array.isArray(filters.school) && filters.school.trim()))
  ) {
    params.school = Array.isArray(filters.school)
      ? filters.school
      : [filters.school];
  }

  // Handle service categories
  if (isNonEmptyArray(filters.service)) {
    params.service = filters.service;
  }
  return params;
};
const transformClassicFiltersAccount = (
  filters: Filters
): ClassicSearchParams => {
  const params: ClassicSearchParams = {
    api: "classic",
    category: "companies",
  };

  // Handle URL-based search
  if ("search_url" in filters && filters.search_url) {
    params.url = filters.search_url;
    return params;
  }

  // Add basic text fields
  if (filters.keywords?.trim()) {
    params.keywords = filters.keywords.trim();
  }

  // Handle array fields - only add if non-empty
  if (isNonEmptyArray(filters.industry)) {
    params.industry = filters.industry;
  }

  if (isNonEmptyArray(filters.network_distance)) {
    const validDistances = filters.network_distance
      .map((d) => {
        switch (d) {
          case "1":
            return 1;
          case "2":
            return 2;
          case "3":
            return 3;
          case "GROUP":
            return "GROUP";
          default:
            return undefined;
        }
      })
      .filter((d): d is 1 | 2 | 3 | "GROUP" => d !== undefined);

    if (validDistances.length > 0) {
      params.network_distance = validDistances;
    }
  }

  if (
    filters.location &&
    ((Array.isArray(filters.location) && filters.location.length > 0) ||
      (!Array.isArray(filters.location) && filters.location.trim()))
  ) {
    params.location = Array.isArray(filters.location)
      ? filters.location
      : [filters.location];
  }
  if (filters.headcount && Array.isArray(filters.headcount)) {
    params.headcount = filters.headcount.map((range) => {
      const min = isNaN(range.min) ? undefined : range.min;
      const max = isNaN(range.max) ? undefined : range.max;
  
      if (min !== undefined && max !== undefined) {
        if (max < min) {
          return { min: min, max: min }; // Ensure 'max' is set to 'min'
        } else {
          return { min: min, max: max };
        }
      } else if (min !== undefined) {
        return { min: min }; // Only 'min' is given
      } else if (max !== undefined) {
        return { max: max }; // Only 'max' is given
      } else {
        return {};
      }
    });
  }
  if (filters.has_job_offers) {
    if (filters.has_job_offers === "true") {
      params.has_job_offers = true;
    } else {
      params.has_job_offers = false;
    }
  }

  return params;
};

const transformSalesNavFilters = (
  filters: Filters
): SalesNavigatorSearchParams => {
  const params: SalesNavigatorSearchParams = {
    api: "sales_navigator",
    category: "people",
  };

  // Handle URL-based search
  if ("search_url" in filters && filters.search_url) {
    params.url = filters.search_url;
    return params;
  }

  if (
    filters.connections_of &&
    ((Array.isArray(filters.connections_of) &&
      filters.connections_of.length > 0) ||
      (!Array.isArray(filters.connections_of) && filters.connections_of.trim()))
  ) {
    params.connections_of = Array.isArray(filters.connections_of)
      ? filters.connections_of
      : [filters.connections_of];
  }

  // Add basic text fields
  if (filters.keywords?.trim()) {
    params.keywords = filters.keywords.trim();
  }
  if (filters.first_name?.trim()) {
    params.first_name = filters.first_name.trim();
  }
  if (filters.last_name?.trim()) {
    params.last_name = filters.last_name.trim();
  }

  if (filters.recent_search?.trim()) {
    params.recent_search_id = filters.recent_search.trim();
  }

  if (filters.saved_search?.trim()) {
    params.saved_search_id = filters.saved_search.trim();
  }

  // Handle include/exclude objects
  if (isNonEmptyArray(filters.industry)) {
    params.industry = { include: filters.industry };
  }

  if (
    filters.job_function &&
    ((Array.isArray(filters.job_function) && filters.job_function.length > 0) ||
      (!Array.isArray(filters.job_function) && filters.job_function.trim()))
  ) {
    params.job_function = {
      include: Array.isArray(filters.job_function)
        ? filters.job_function
        : [filters.job_function],
    };
  }

  if (
    filters.location &&
    ((Array.isArray(filters.location) && filters.location.length > 0) ||
      (!Array.isArray(filters.location) && filters.location.trim()))
  ) {
    params.location = {
      include: Array.isArray(filters.location)
        ? filters.location
        : [filters.location],
    };
  }

  if (
    filters.company &&
    ((Array.isArray(filters.company) && filters.company.length > 0) ||
      (!Array.isArray(filters.company) && filters.company.trim()))
  ) {
    params.company = {
      include: Array.isArray(filters.company)
        ? filters.company
        : [filters.company],
    };
  }

  if (
    filters.past_company &&
    ((Array.isArray(filters.past_company) && filters.past_company.length > 0) ||
      (!Array.isArray(filters.past_company) && filters.past_company.trim()))
  ) {
    params.past_company = {
      include: Array.isArray(filters.past_company)
        ? filters.past_company
        : [filters.past_company],
    };
  }

  if (isNonEmptyArray(filters.network_distance)) {
    const validDistances = filters.network_distance
      .map((d) => {
        switch (d) {
          case "1":
            return 1;
          case "2":
            return 2;
          case "3":
            return 3;
          case "GROUP":
            return "GROUP";
          default:
            return undefined;
        }
      })
      .filter((d): d is 1 | 2 | 3 | "GROUP" => d !== undefined);

    if (validDistances.length > 0) {
      params.network_distance = validDistances;
    }
  }
  if (
    filters.company_location &&
    ((Array.isArray(filters.company_location) &&
      filters.company_location.length > 0) ||
      (!Array.isArray(filters.company_location) &&
        filters.company_location.trim()))
  ) {
    params.company_location = {
      include: Array.isArray(filters.company_location)
        ? filters.company_location
        : [filters.company_location],
    };
  }

  if (
    filters.role &&
    ((Array.isArray(filters.role) && filters.role.length > 0) ||
      (!Array.isArray(filters.role) && filters.role.trim()))
  ) {
    params.role = {
      include: Array.isArray(filters.role) ? filters.role : [filters.role],
    };
  }

  if (
    filters.past_role &&
    ((Array.isArray(filters.past_role) && filters.past_role.length > 0) ||
      (!Array.isArray(filters.past_role) && filters.past_role.trim()))
  ) {
    params.past_role = {
      include: Array.isArray(filters.past_role)
        ? filters.past_role
        : [filters.past_role],
    };
  }

  if (
    filters.school &&
    ((Array.isArray(filters.school) && filters.school.length > 0) ||
      (!Array.isArray(filters.school) && filters.school.trim()))
  ) {
    params.school = {
      include: Array.isArray(filters.school)
        ? filters.school
        : [filters.school],
    };
  }

  if (
    filters.seniority &&
    ((Array.isArray(filters.seniority) && filters.seniority.length > 0) ||
      (!Array.isArray(filters.seniority) && filters.seniority.trim()))
  ) {
    params.seniority = {
      include: Array.isArray(filters.seniority)
        ? filters.seniority
        : [filters.seniority],
    };
  }

  // Add boolean flags - only if true
  if (filters.following_your_company) {
    params.following_your_company = true;
  }
  if (filters.viewed_your_profile_recently) {
    params.viewed_your_profile_recently = true;
  }
  if (filters.viewed_profile_recently) {
    params.viewed_profile_recently = true;
  }
  if (filters.messaged_recently) {
    params.messaged_recently = true;
  }
  if (filters.include_saved_leads) {
    params.include_saved_leads = true;
  }

  // Handle years of experience
  if (filters.tenure && Array.isArray(filters.tenure)) {
    params.tenure = filters.tenure.map((range) => {
      if (range.max < range.min) {
        return { min: range.min };
      } else {
        return range;
      }
    });
  }

  if (filters.company_headcount && Array.isArray(filters.company_headcount)) {
    params.company_headcount = filters.company_headcount.map((range) => {
      if (range.max < range.min) {
        return { min: range.min };
      } else {
        return range;
      }
    });
  }

  if (filters.tenure_at_role && Array.isArray(filters.tenure_at_role)) {
    params.tenure_at_role = filters.tenure_at_role.map((range) => {
      if (range.max < range.min) {
        return { min: range.min };
      } else {
        return range;
      }
    });
  }

  if (filters.tenure_at_company && Array.isArray(filters.tenure_at_company)) {
    params.tenure_at_company = filters.tenure_at_company.map((range) => {
      if (range.max < range.min) {
        return { min: range.min };
      } else {
        return range;
      }
    });
  }

  if (filters.profile_language) {
    params.profile_language = filters.profile_language;
  }

  return params;
};
const transformSalesNavFiltersAccount = (
  filters: Filters
): SalesNavigatorSearchParams => {
  const params: SalesNavigatorSearchParams = {
    api: "sales_navigator",
    category: "companies",
  };

  // Handle URL-based search
  if ("search_url" in filters && filters.search_url) {
    params.url = filters.search_url;
    return params;
  }

  // Add basic text fields
  if (filters.keywords?.trim()) {
    params.keywords = filters.keywords.trim();
  }

  if (filters.recent_search?.trim()) {
    params.recent_search_id = filters.recent_search.trim();
  }

  if (filters.saved_search?.trim()) {
    params.saved_search_id = filters.saved_search.trim();
  }

  // Handle include/exclude objects
  if (isNonEmptyArray(filters.industry)) {
    params.industry = { include: filters.industry };
  }


  if (
    filters.location &&
    ((Array.isArray(filters.location) && filters.location.length > 0) ||
      (!Array.isArray(filters.location) && filters.location.trim()))
  ) {
    params.location = {
      include: Array.isArray(filters.location)
        ? filters.location
        : [filters.location],
    };
  }
  if (isNonEmptyArray(filters.network_distance)) {
    const validDistances = filters.network_distance
      .map((d) => {
        switch (d) {
          case "1":
            return 1;
          case "2":
            return 2;
          case "3":
            return 3;
          case "GROUP":
            return "GROUP";
          default:
            return undefined;
        }
      })
      .filter((d): d is 1 | 2 | 3 | "GROUP" => d !== undefined);

    if (validDistances.length > 0) {
      params.network_distance = validDistances;
    }
  }
  if (
    filters.company_location &&
    ((Array.isArray(filters.company_location) &&
      filters.company_location.length > 0) ||
      (!Array.isArray(filters.company_location) &&
        filters.company_location.trim()))
  ) {
    params.company_location = {
      include: Array.isArray(filters.company_location)
        ? filters.company_location
        : [filters.company_location],
    };
  }
  params.headcount = [];

  if (filters.headcount && Array.isArray(filters.headcount)) {
    params.headcount = filters.headcount.map((range) => {
      const min = isNaN(range.min) ? undefined : range.min;
      const max = isNaN(range.max) ? undefined : range.max;
  
      if (min !== undefined && max !== undefined) {
        if (max < min) {
          return { min: min, max: min }; // Ensure 'max' is set to 'min'
        } else {
          return { min: min, max: max };
        }
      } else if (min !== undefined) {
        return { min: min }; // Only 'min' is given
      } else if (max !== undefined) {
        return { max: max }; // Only 'max' is given
      } else {
        return {};
      }
    });
  }
  
  

  if (
    filters.headcount_growth &&
    filters.headcount_growth.min !== undefined &&
    filters.headcount_growth.max !== undefined
  ) {
    params.headcount_growth = {
      min: filters.headcount_growth.min,
      max: filters.headcount_growth.max,
    };
  }
  if (
    filters.department_headcount &&
    isNonEmptyArray(filters.department_headcount.department) &&
    filters.department_headcount.min !== undefined &&
    filters.department_headcount.max !== undefined
  ) {
    params.department_headcount = {
      department: filters.department_headcount.department,
      min: filters.department_headcount.min,
      max: filters.department_headcount.max,
    };
  }
  if (
    filters.department_headcount_growth &&
    isNonEmptyArray(filters.department_headcount_growth.department) &&
    filters.department_headcount_growth.min !== undefined &&
    filters.department_headcount_growth.max !== undefined
  ) {
    params.department_headcount_growth = {
      department: filters.department_headcount_growth.department,
      min: filters.department_headcount_growth.min,
      max: filters.department_headcount_growth.max,
    };
  }
  if (
    filters.annual_revenue &&
    filters.annual_revenue.currency &&
    typeof filters.annual_revenue.currency === 'string' &&
    filters.annual_revenue.currency.length > 0 &&
    filters.annual_revenue.min !== undefined &&
    filters.annual_revenue.max !== undefined
  ) {
    params.annual_revenue = {
      currency: filters.annual_revenue.currency,
      min: filters.annual_revenue.min,
      max: filters.annual_revenue.max,
    };
  }
  
  
  if (filters.followers_count && Array.isArray(filters.followers_count)) {
    params.followers_count = filters.followers_count.map((range) => {
      const min = range.min !== undefined ? range.min : undefined;
      const max = range.max !== undefined ? range.max : undefined;
  
      if (min !== undefined && max !== undefined) {
        if (max <= min) {
          return { min }; // Omit 'max' if it is equal to or less than 'min'
        } else {
          return { min, max };
        }
      } else if (min !== undefined) {
        return { min }; // Only 'min' is given
      } else if (max !== undefined) {
        return { max }; // Only 'max' is given
      } else {
        return {}; // Neither 'min' nor 'max' is given
      }
    });
  }
  
  console.log("Params:", JSON.stringify(params, null, 2));
  
  

  

  if (filters.fortune && Array.isArray(filters.fortune)) {
    params.fortune = filters.fortune.map((range) => {
      if (range.max !== undefined && range.max < range.min) {
        return { min: range.min, max: range.min }; // Ensure 'max' is set to 'min'
      } else {
        return range;
      }
    });
  }

  if (isNonEmptyArray(filters.technologies)) {
    params.technologies = filters.technologies;
  }
  if (isNonEmptyArray(filters.saved_accounts)) {
    params.saved_accounts = filters.saved_accounts;
  }
  if (filters.account_lists && isNonEmptyArray(filters.account_lists.include)) {
    params.account_lists = { include: filters.account_lists.include };
  }
  
  if (typeof filters.has_job_offers === "boolean") {
    params.has_job_offers = filters.has_job_offers;
  }

  return params;
};

// Main API Functions
export const performLinkedInSearch = async (
  accountId: string,
  filters: Filters | URLSearchParams,
  platform: "classic" | "sales_navigator" = "classic",
  cursor?: string,
  limit?: string
): Promise<SearchResponse> => {
  try {
    let searchParams: SearchParams;

    if ("url" in filters) {
      searchParams = {
        api: platform,
        category: "people",
        url: filters.url,
      };
    } else {
      searchParams =
        platform === "classic"
          ? transformClassicFilters(filters)
          : transformSalesNavFilters(filters);
    }

    return apiRequest(
      `/api/v1/linkedin/search`,
      "POST",
      searchParams,
      { account_id: accountId, limit: limit || "10" },
      cursor
    );
  } catch (error) {
    throw error;
  }
};
export const performLinkedInSearchAccount = async (
  accountId: string,
  filters: Filters | URLSearchParams,
  platform: "classic" | "sales_navigator" = "classic",
  cursor?: string,
  limit?: string
): Promise<SearchResponse> => {
  try {
    let searchParams: SearchParams;

    if ("url" in filters) {
      searchParams = {
        api: platform,
        category: "companies",
        url: filters.url,
      };
    } else {
      searchParams =
        platform === "classic"
          ? transformClassicFiltersAccount(filters)
          : transformSalesNavFiltersAccount(filters);
    }
    console.log(searchParams);

    return apiRequest(
      `/api/v1/linkedin/search`,
      "POST",
      searchParams,
      { account_id: accountId, limit: limit || "10" },
      cursor
    );
  } catch (error) {
    throw error;
  }
};

export const getLinkedInSearchParameters = async (
  accountId: string,
  type: ParameterType,
  query?: string
): Promise<{ items: SearchParameter[] }> => {
  const queryParams: Record<string, string> = {
    type,
    account_id: accountId,
  };
  if (query?.trim()) {
    queryParams.keywords = query.trim();
  }
  return apiRequest(
    "/api/v1/linkedin/search/parameters",
    "GET",
    null,
    queryParams
  );
};

export const getLinkedInUserProfile = async (
  accountId: string,
  identifier: string,
  useSalesNavigator: boolean = false
): Promise<any> => {
  const queryParams: Record<string, string> = {
    account_id: accountId,
  };

  if (useSalesNavigator) {
    queryParams.linkedin_api = "sales_navigator";
  }

  return apiRequest(`/api/v1/users/${identifier}`, "GET", null, queryParams);
};

export default {
  getLinkedInSearchParameters,
  performLinkedInSearch,
  getLinkedInUserProfile,
};
