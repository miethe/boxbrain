
import { Asset, AssetType, AssetCategory, Confidentiality, Schema } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'win-1',
    title: 'RHOV at scale for critical apps',
    type: AssetType.WinStory,
    category: AssetCategory.Technical,
    industry: 'ENERGY',
    region: 'AMER',
    offering: 'RHOV',
    stage: 'won',
    confidentiality: Confidentiality.InternalOnly,
    summary: 'Migrated 420 hosts; consolidated 3→1 DC; zero P1s post-cutover.',
    tags: ['OpenShift', 'Virtualization', 'Migration'],
    owners: ['boxboat-practice@ibm.com'],
    author: 'Nathan Miethe',
    related_technologies: ['OpenShift', 'KubeVirt', 'Ansible'],
    path: 'win_story/2025/utility-rhov/metadata.yaml',
    created_at: '2025-11-12T10:00:00Z',
    updated_at: '2025-11-12T10:00:00Z',
    commit_sha: 'a1b2c3d',
    customer_real: 'ACME Power',
    customer_anonymized: 'Major US Utility',
    artifacts: [{ name: 'Exec Deck', kind: 'deck', uri: '#' }],
    last_verified: '2025-11-12'
  },
  {
    id: 'play-1',
    title: 'Telco Day-0 Automation Playbook',
    type: AssetType.Play,
    category: AssetCategory.Technical,
    industry: 'TELCO',
    region: 'EMEA',
    offering: 'Automation',
    stage: 'delivered',
    confidentiality: Confidentiality.ClientSafe,
    summary: 'Complete guide for setting up Day-0 clusters with ArgoCD.',
    tags: ['ArgoCD', 'GitOps', 'Telco'],
    owners: ['telco-practice@ibm.com'],
    author: 'Sarah Jenkins',
    related_technologies: ['ArgoCD', 'Helm', 'OpenShift'],
    path: 'play/automation-telco/metadata.yaml',
    created_at: '2025-10-05T14:30:00Z',
    updated_at: '2025-10-10T09:15:00Z',
    commit_sha: 'e5f6g7h',
    artifacts: [
      { name: 'Deployment Guide', kind: 'runbook', uri: '#' },
      { name: 'Demo Video', kind: 'video', uri: '#' }
    ],
    last_verified: '2025-10-10'
  },
  {
    id: 'code-1',
    title: 'Terraform Module for AWS EKS',
    type: AssetType.CodeRef,
    category: AssetCategory.Technical,
    industry: 'X-SECTOR',
    region: 'GLOBAL',
    offering: 'Cloud',
    stage: 'won',
    confidentiality: Confidentiality.ClientSafe,
    summary: 'Standardized EKS module with security hardening.',
    tags: ['Terraform', 'AWS', 'EKS', 'Security'],
    owners: ['cloud-center@ibm.com'],
    author: 'DevOps Team',
    related_technologies: ['Terraform', 'AWS', 'Kubernetes'],
    path: 'code_ref/aws/eks-hardened/metadata.yaml',
    created_at: '2025-09-20T11:00:00Z',
    updated_at: '2025-11-01T16:45:00Z',
    commit_sha: 'i8j9k0l',
    artifacts: [{ name: 'Source Repo', kind: 'code', uri: '#' }],
    last_verified: '2025-11-01'
  },
  {
    id: 'tmpl-1',
    title: 'Presales One-Pager Template',
    type: AssetType.Template,
    category: AssetCategory.Sales,
    industry: 'X-SECTOR',
    region: 'GLOBAL',
    offering: 'Sales',
    stage: 'qual',
    confidentiality: Confidentiality.ClientSafe,
    summary: 'Standard one-pager for initial client meetings.',
    tags: ['Sales', 'Template', 'Word'],
    owners: ['sales-ops@ibm.com'],
    author: 'Marketing Ops',
    related_technologies: [],
    path: 'template/presales/one-pager/metadata.yaml',
    created_at: '2025-08-15T08:00:00Z',
    updated_at: '2025-08-15T08:00:00Z',
    commit_sha: 'm1n2o3p',
    artifacts: [{ name: 'Template Doc', kind: 'doc', uri: '#' }],
    last_verified: '2025-08-15'
  },
  {
    id: 'win-2',
    title: 'Global Bank Cloud Transformation',
    type: AssetType.WinStory,
    category: AssetCategory.Sales,
    industry: 'FINANCE',
    region: 'GLOBAL',
    offering: 'Cloud',
    stage: 'won',
    confidentiality: Confidentiality.ClientSafe,
    summary: 'High-level executive presentation on banking cloud ROI.',
    tags: ['Finance', 'ROI', 'Cloud'],
    owners: ['finance-sales@ibm.com'],
    author: 'James Wilson',
    related_technologies: ['Azure', 'Red Hat'],
    path: 'win_story/2025/bank-cloud/metadata.yaml',
    created_at: '2025-07-01T09:00:00Z',
    updated_at: '2025-07-01T09:00:00Z',
    commit_sha: 'x9y8z7',
    customer_real: 'Global Bank Corp',
    customer_anonymized: 'Top 10 Global Bank',
    artifacts: [{ name: 'Exec Deck', kind: 'deck', uri: '#' }],
    last_verified: '2025-07-01'
  }
];

// Common fields to append to schemas
const COMMON_FIELDS = [
  { name: 'author', label: 'Author / Creator', type: 'text' as const, required: true },
  { name: 'related_technologies', label: 'Related Technologies', type: 'multiselect' as const, description: 'Specific tools/libs used (e.g. React, Terraform, Kafka)' }
];

export const SCHEMAS: Record<AssetType, Schema> = {
  [AssetType.WinStory]: {
    id: AssetType.WinStory,
    label: 'Win Story',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['technical', 'sales'], required: true },
      { name: 'summary', label: 'Executive Summary', type: 'textarea', required: true },
      { name: 'industry', label: 'Industry', type: 'select', options: ['ENERGY', 'TELCO', 'FINANCE', 'HEALTH', 'X-SECTOR'], required: true },
      { name: 'region', label: 'Region', type: 'select', options: ['AMER', 'EMEA', 'APAC', 'GLOBAL'], required: true },
      { name: 'stage', label: 'Deal Stage', type: 'select', options: ['won', 'delivered', 'lost'], required: true },
      { name: 'offering', label: 'Primary Offering', type: 'creatable-select', required: true },
      ...COMMON_FIELDS,
      { name: 'customer_real', label: 'Customer Name (Internal)', type: 'text', required: true },
      { name: 'customer_anonymized', label: 'Customer Alias (Public)', type: 'text', required: true },
      { name: 'tags', label: 'Tags', type: 'multiselect' },
    ]
  },
  [AssetType.Play]: {
    id: AssetType.Play,
    label: 'Play / Solution',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['technical', 'sales'], required: true },
      { name: 'summary', label: 'Description', type: 'textarea', required: true },
      { name: 'industry', label: 'Target Industry', type: 'select', options: ['ENERGY', 'TELCO', 'FINANCE', 'HEALTH', 'X-SECTOR'] },
      { name: 'offering', label: 'Technology', type: 'creatable-select', required: true },
      ...COMMON_FIELDS,
      { name: 'tags', label: 'Tags', type: 'multiselect' },
    ]
  },
  [AssetType.Template]: {
    id: AssetType.Template,
    label: 'Template',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['technical', 'sales'], required: true },
      { name: 'summary', label: 'Usage Instructions', type: 'textarea' },
      ...COMMON_FIELDS,
      { name: 'tags', label: 'Tags', type: 'multiselect' },
    ]
  },
  [AssetType.CodeRef]: {
    id: AssetType.CodeRef,
    label: 'Code Reference',
    fields: [
      { name: 'title', label: 'Repo/Module Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['technical', 'sales'], required: true },
      { name: 'summary', label: 'Description', type: 'textarea' },
      { name: 'offering', label: 'Tech Stack', type: 'creatable-select' },
      ...COMMON_FIELDS,
      { name: 'tags', label: 'Tags', type: 'multiselect' },
    ]
  }
};

export const INDUSTRIES = ['ENERGY', 'TELCO', 'FINANCE', 'HEALTH', 'RETAIL', 'X-SECTOR'];
export const REGIONS = ['AMER', 'EMEA', 'APAC', 'GLOBAL'];
export const STAGES = ['lead', 'qual', 'prop', 'neg', 'won', 'lost', 'delivered'];
