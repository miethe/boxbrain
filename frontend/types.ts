

export type ViewState = 'opportunity-guide' | 'catalog' | 'assets' | 'admin' | 'opportunity-board' | 'opportunity-playbook' | 'add-asset';

export interface OpportunityInput {
  sector: string;
  offering: string;
  stage: string;
  technologies: string[];
  geo: string;
  tags: string[];
  notes: string;
  plays?: string[];
  name?: string;
  account_name?: string;
}

export interface PlayStageDefinition {
  key: string;
  label: string;
  objective: string;
  guidance: string;
  checklist_items: string[];
}

export interface Play {
  id: string;
  title: string;
  summary: string;
  offering: string;
  technologies: string[];
  stage_scope: string[];
  stages?: PlayStageDefinition[]; // Detailed stage definitions
  sector: string;
  geo: string;
  tags: string[];
  owners: string[];
  updated_at: string;
  matchScore?: number; // Runtime calculated
  default_team_members?: string[];
}

export interface AssetLink {
  id: string;
  title: string;
  url: string;
  type: 'preview' | 'source' | 'reference' | 'other';
}

export interface Asset {
  id: string;
  title: string;
  description?: string;
  kind: 'deck' | 'doc' | 'guide' | 'runbook' | 'diagram' | 'video' | 'link' | 'coderef' | 'other';
  uri: string;
  links?: AssetLink[];
  purpose: string;
  default_stage: string;
  collections?: string[]; // Names of collections this asset belongs to
  offerings?: string[]; // Related offerings
  linked_play_ids?: string[]; // IDs of related plays
  tags: string[];
  owners: string[];
  created_at: string;
  updated_at: string;
  technologies?: string[];

  linked_opportunity_ids?: string[];
  linked_asset_ids?: string[];
}

export interface Dictionary {
  offerings: string[];
  technologies: string[];
  stages: string[];
  sectors: string[];
  geos: string[];
  tags: string[];
  offering_to_technologies: Record<string, string[]>;
  technology_categories?: Record<string, string>;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string; // Initials or url
  text: string;
  date: string;
}

export interface HistoryItem {
  id: string;
  user: string;
  action: string;
  date: string;
  details?: string;
}

export interface AssetCollection {
  id: string;
  name: string;
  asset_ids: string[];
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role?: string;
  technologies: string[];
}

// --- Opportunity Entities ---

export interface IntegrationLink {
  id: string;
  opportunity_id: string;
  type: 'salesforce_oppty' | 'salesforce_account' | 'monday_board' | 'box_folder' | 'onedrive_folder' | 'slack_channel' | 'teams_channel';
  label: string;
  url: string;
  notes?: string;
}

export interface StageNote {
  id: string;
  stage_instance_id: string;
  content: string;
  is_private: boolean;
  author_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpportunityStageInstance {
  id: string;
  opportunity_play_id: string;
  play_stage_key: string; // e.g. 'Discovery'
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  summary_note?: string;
  checklist_item_statuses: Record<string, 'todo' | 'done' | 'na'>;
  custom_checklist_items?: { id: string; text: string; status: 'todo' | 'done' }[];
  risk_flags?: string[];
  notes?: StageNote[];
}

export interface OpportunityPlay {
  id: string; // unique instance id
  opportunity_id: string;
  play_id: string; // reference to template
  alias_name?: string;
  is_primary: boolean;
  selected_technology_ids: string[];
  is_active: boolean;
  stage_instances: OpportunityStageInstance[];
}

export interface Opportunity {
  id: string;
  name: string;
  account_name: string;
  account_id?: string;
  sales_stage: string;
  estimated_value?: string;
  close_date?: string;
  region: string;
  industry?: string;
  primary_play_id?: string; // ID of the main OpportunityPlay
  opportunity_plays: OpportunityPlay[];
  primary_technology_ids: string[];
  problem_statement?: string;
  key_personas?: string[];
  tags: string[];
  status: 'active' | 'parked' | 'closed_won' | 'closed_lost' | 'archived';
  current_stage_key?: string; // e.g., 'Discovery'
  health: 'green' | 'yellow' | 'red';
  sales_owner_user_id?: string;
  technical_lead_user_id?: string;
  team_member_user_ids: string[];
  created_at: string;
  updated_at: string;
  integrations?: IntegrationLink[];
}