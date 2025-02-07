export interface Action {
    id: string;
    type: string;
    config: Record<string, any>;
  }
  
  export interface Sequence {
    id: string;
    name: string;
    actions: Action[];
  }
  
  export interface Campaign {
    id: number;
    name: string;
    type: string;
    status: string;
    contacts: number;
    successful: number;
    failed: number;
    created_at: string;
    sequences: Sequence[];
  }