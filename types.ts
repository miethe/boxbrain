
export enum AssetType {
  WinStory = 'win_story',
  Play = 'play',
  CodeRef = 'code_ref',
  Template = 'template'
}

export enum AssetCategory {
  Technical = 'technical',
  Sales = 'sales'
}

export enum Confidentiality {
  InternalOnly = 'internal-only',
  ClientSafe = 'client-safe'
}

export interface Artifact {
  name: string;
  kind: string;
  uri: string;
}

export interface Metric {
  name: string;
  value: string;
}

export interface Note {
  content: string;
  isPrivate: boolean;
  updatedAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Asset {
  id: string;
  title: string;
  type: AssetType;
  category: AssetCategory;
  industry?: string;
  region?: string;
  offering?: string;
  stage?: string;
  confidentiality: Confidentiality;
  summary: string;
  tags?: string[];
  owners: string[];
  author: string;
  related_technologies?: string[];
  path: string;
  created_at: string;
  updated_at: string;
  commit_sha: string;
  customer_real?: string;
  customer_anonymized?: string;
  artifacts?: Artifact[];
  last_verified?: string;
  metrics?: Metric[];
  content?: string; // Markdown content body
  notes?: Note;
  comments?: Comment[];
}

export type AssetMetadata = Partial<Asset>;

export interface SchemaField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'creatable-select' | 'multiselect' | 'tags';
  required?: boolean;
  options?: string[];
  description?: string;
}

export interface Schema {
  id: AssetType;
  label: string;
  fields: SchemaField[];
}

export interface InboxItem {
  id: string;
  source: 'slack' | 'email';
  sender: string;
  timestamp: string;
  content: string;
  suggestedMetadata: Partial<AssetMetadata> & { artifacts?: Artifact[] };
}

export interface NavSection {
  label: string;
  items: { label: string; href: string; icon: any }[];
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface Facets {
  offering?: FacetItem[];
  related_technologies?: FacetItem[];
  tags?: FacetItem[];
}
