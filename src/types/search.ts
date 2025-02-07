// Basic type definitions
export type StringOrStringArray = string | string[];
export type RangeValue = { min: number; max: number };

// Filter change handler type
export type FilterChangeHandler = {
  (filterName: keyof Filters | 'reset', value: string | string[] | RangeValue | boolean): void;
};

// Filter value types
export type FilterValue =
  | { type: 'string'; value: string }
  | { type: 'stringArray'; value: string[] }
  | { type: 'range'; value: RangeValue }
  | { type: 'boolean'; value: boolean };


// Search parameters for API
export interface AdditionalData {
  category: string;
  // Add any other properties you need
}

export interface SearchParameters {
  id: string;
  title: string;
  additional_data?: {category:string}
}


export interface SearchParametersData {
  items: SearchParameters[];
}
export interface SearchParams {
  api: 'classic' | 'sales_navigator';
  category: 'people'|'company';
  keywords?: string;
  saved_search?: string;
  recent_search?: string;
  location?: string[] | { include?: string[]; exclude?: string[] };
  industry?: string[] | { include?: string[]; exclude?: string[] };
  first_name?: string;
  last_name?: string;
  tenure?: Array<{ min?: number; max?: number }>;
  groups?: string[];
  school?: string[] | { include?: string[]; exclude?: string[] };
  profile_language?: string[];
  company?: string[] | { include?: string[]; exclude?: string[] };
  company_headcount?: Array<{ min?: number; max?: number }>;
  company_type?: string[];
  company_location?: { include?: string[]; exclude?: string[] };
  tenure_at_company?: Array<{ min?: number; max?: number }>;
  job_function?: { include?: string[]; exclude?: string[] };
  past_company?: string[] | { include?: string[]; exclude?: string[] };
  function?: { include?: string[]; exclude?: string[] };
  role?: { include?: string[]; exclude?: string[] };
  tenure_at_role?: Array<{ min?: number; max?: number }>;
  seniority?: { include?: string[]; exclude?: string[] };
  past_role?: { include?: string[]; exclude?: string[] };
  following_your_company?: boolean;
  viewed_your_profile_recently?: boolean;
  network_distance?: (string | number)[];
  connections_of?: string[];
  followers_of?: string[];
  past_colleague?: boolean;
  shared_experiences?: boolean;
  changed_jobs?: boolean;
  posted_on_linkedin?: boolean;
  mentionned_in_news?: boolean;
  persona?: string[];
  account_lists?: {
    lead_lists?: {
      viewed_profile_recently?: boolean;
      messaged_recently?: boolean;
      include_saved_leads?: boolean;
      include_saved_accounts?: boolean;
    };
  };
  open_to?: string[];
  service?: string[];
  advanced_keywords?: {
    first_name?: string;
    last_name?: string;
    title?: string;
    company?: string;
    school?: string;
  };
  viewed_profile_recently?: boolean;
  messaged_recently?: boolean;
  include_saved_leads?: boolean;
  limit?: number;
  page?: number;
}

// Search result interface
export interface SearchResult {
  logo: string;
  followers_count: number;
  industry: string;
  summary: string;
  id: string;
  name: string;
  public_identifier: string;
  profile_url: string;
  public_profile_url: string;
  profile_picture_url: string;
  network_distance: string;
  location: string;
  headline: string;
}

// Filter interface for all filter types
export interface Filters {
  // String filters
  keywords: string;
  first_name: string;
  last_name: string;
  recent_search: string;
  saved_search: string;
  // String array filters
  network_distance: ('1' | '2' | '3' | 'GROUP')[];
  profile_language: string[];
  company_type: string[];
  open_to: string[];
  service: string[];
  people: string[];

  // String or string array filters
  location: StringOrStringArray;
  company: StringOrStringArray;
  school: StringOrStringArray;
  industry: string[];
  job_function: StringOrStringArray;
  role: StringOrStringArray;
  past_company: StringOrStringArray;
  seniority: StringOrStringArray;
  company_location: StringOrStringArray;
  function: StringOrStringArray;
  past_role: StringOrStringArray;
  connections_of: StringOrStringArray;

  // Range filters
  company_headcount?: RangeValue[];
  followers_count?:{min?:number,max?:number};
  tenure?: RangeValue[];
  tenure_at_company?: RangeValue[];
  tenure_at_role?: RangeValue[];
  headcount?: {min?:number,max?:number};

  // Boolean filters
  following_your_company: boolean;
  viewed_your_profile_recently: boolean;
  viewed_profile_recently: boolean;
  messaged_recently: boolean;
  include_saved_leads: boolean;
  search_url?: string;
  has_job_offers?: string|boolean;
  headcount_growth?:{ min: number; max: number };
  fortune?:RangeValue[]
  technologies?: string[];
  recent_activities?:string[];
  saved_accounts?:string[];
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
  annual_revenue?:{
    currency:string;
    min:number;
    max:number;
  },
  account_lists?: {
    include: string[]; 
    exclude: string[]; 
  }
}

// Component prop types
export interface FilterSectionProps {
  title: string;
  filterName: keyof Filters;
  filters: Filters;
  handleFilterChange: FilterChangeHandler;
  onFilterInputChange: (value: string) => void;
  options: { label: string; value: string }[];
}

export interface EnhancedDropdownFilterProps {
  title: string;
  placeholder?: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onInputChange: (value: string) => void;
  options: DropdownOption[];
  allowMultiple?: boolean;
  showSearch?: boolean;
  maxHeight?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isLoading?: boolean;
  noOptionsMessage?: string;
  grouped?: boolean;
}

export interface DropdownOption {
  label: string;
  value: string;
  count?: number;
  group?: string;
}

export interface SearchResultsProps {
  searchResults: SearchResult[];
  selectedProfiles: string[];
  setSelectedProfiles: React.Dispatch<React.SetStateAction<string[]>>;
  totalResults: number;
  currentPage: number;
  isSearching: boolean;
  handlePageChange: (newPage: number) => void;
  hasNextPage: boolean;  // Add this new prop
}

// Search state interface
export interface SearchState {
  results: SearchResult[];
  isSearching: boolean;
  totalResults: number;
  currentPage: number;
  error: string | null;
}

// Response types
export interface SearchApiResponse<T> {
  items: T[];
  total: number;
}

export interface SearchParameters {
  id: string;
  title: string;
  count?: number;
}

// Parameter types for API
export type ParameterType = 
  | 'LOCATION'
  | 'PEOPLE'
  | 'COMPANY'
  | 'SCHOOL'
  | 'SERVICE'
  | 'DEPARTMENT'
  | 'JOB_TITLE'
  | 'INDUSTRY'
  | 'KEYWORDS'
  | 'SAVED_SEARCHES'
  | 'RECENT_SEARCHES'
  | 'FOLLOWERS'
  | 'CONNECTIONS';