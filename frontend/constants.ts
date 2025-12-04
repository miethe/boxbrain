
import { Asset, Dictionary, Play, Opportunity } from "./types";

export const MOCK_DICTIONARY: Dictionary = {
  offerings: ["Cloud Migration", "Data & AI", "Cybersecurity", "App Modernization"],
  technologies: ["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Python", "Snowflake", "Databricks", "React"],
  stages: ["Discovery", "Qualification", "Solutioning", "Validation", "Closing", "Delivery"],
  sectors: ["Financial Services", "Healthcare", "Retail", "Manufacturing", "Public Sector", "Cross-sector"],
  geos: ["Americas", "EMEA", "APAC"],
  tags: ["Executive", "Technical", "Compliance", "Architecture", "Pricing", "Case Study"],
  offering_to_technologies: {
    "Cloud Migration": ["AWS", "Azure", "GCP", "Terraform"],
    "Data & AI": ["Snowflake", "Databricks", "Python", "Azure"],
    "App Modernization": ["Kubernetes", "React", "AWS", "Azure"],
    "Cybersecurity": ["Azure", "AWS"]
  }
};

const DEFAULT_STAGES = [
    {
        key: "Discovery",
        label: "Discovery",
        objective: "Understand the client's current landscape and business drivers.",
        guidance: "Focus on open-ended questions. Identify the key stakeholders and the budget holder. Don't pitch solution yet.",
        checklist_items: ["Identify Executive Sponsor", "Map current technical landscape", "Define success criteria"]
    },
    {
        key: "Qualification",
        label: "Qualification",
        objective: "Confirm budget, authority, need, and timeline (BANT).",
        guidance: "Use the TCO calculator to establish a baseline. Ensure technical fit.",
        checklist_items: ["Verify budget allocation", "Confirm technical feasibility", "Sign NDA"]
    },
    {
        key: "Solutioning",
        label: "Solutioning",
        objective: "Design the technical architecture and migration plan.",
        guidance: "Collaborate with the client's architects. Use the standard Reference Architectures.",
        checklist_items: ["Draft HLD", "Review with Practice Lead", "Present initial solution"]
    },
    {
        key: "Validation",
        label: "Validation",
        objective: "Prove the solution works via POC or deep dive.",
        guidance: "Keep scope small and time-boxed.",
        checklist_items: ["Execute POC", "Sign off on success criteria"]
    },
    {
        key: "Delivery",
        label: "Delivery",
        objective: "Handover to delivery team for implementation.",
        guidance: "Ensure all documentation is up to date in the repository.",
        checklist_items: ["Conduct handover workshop", "Finalize SOW"]
    }
];

export const MOCK_PLAYS: Play[] = [
  {
    id: "play-001",
    title: "Retail Cloud Migration Accelerator",
    summary: "Standard approach for lifting and shifting retail legacy ERPs to Azure.",
    offering: "Cloud Migration",
    technologies: ["Azure", "Terraform"],
    stage_scope: ["Discovery", "Solutioning", "Validation", "Delivery"],
    stages: DEFAULT_STAGES.filter(s => ["Discovery", "Solutioning", "Validation", "Delivery"].includes(s.key)),
    sector: "Retail",
    geo: "Americas",
    tags: ["Architecture", "Case Study"],
    owners: ["alice@example.com"],
    updated_at: "2023-10-15"
  },
  {
    id: "play-002",
    title: "Financial Services Data Mesh",
    summary: "Implementing a federated data governance model using Snowflake.",
    offering: "Data & AI",
    technologies: ["Snowflake", "Python"],
    stage_scope: ["Solutioning", "Validation"],
    stages: DEFAULT_STAGES.filter(s => ["Solutioning", "Validation"].includes(s.key)),
    sector: "Financial Services",
    geo: "EMEA",
    tags: ["Technical", "Compliance"],
    owners: ["bob@example.com"],
    updated_at: "2023-11-02"
  },
  {
    id: "play-003",
    title: "Global App Mod Playbook",
    summary: "Containerization strategy for global enterprise applications.",
    offering: "App Modernization",
    technologies: ["Kubernetes", "AWS"],
    stage_scope: ["Discovery", "Qualification", "Solutioning"],
    stages: DEFAULT_STAGES.filter(s => ["Discovery", "Qualification", "Solutioning"].includes(s.key)),
    sector: "Cross-sector",
    geo: "APAC",
    tags: ["Executive", "Technical"],
    owners: ["charlie@example.com"],
    updated_at: "2023-09-20"
  },
  {
    id: "play-004",
    title: "Healthcare Security Compliance",
    summary: "HIPAA compliant landing zone setup.",
    offering: "Cybersecurity",
    technologies: ["AWS"],
    stage_scope: ["Validation", "Delivery"],
    stages: DEFAULT_STAGES.filter(s => ["Validation", "Delivery"].includes(s.key)),
    sector: "Healthcare",
    geo: "Americas",
    tags: ["Compliance", "Technical"],
    owners: ["diana@example.com"],
    updated_at: "2023-12-01"
  }
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: "asset-101",
    title: "Migration Kickoff Deck",
    description: "Standard slide deck for kicking off the migration assessment phase. Includes agenda, key stakeholder matrix, and initial discovery questions.",
    kind: "deck",
    uri: "s3://bucket/migration-kickoff.pptx",
    purpose: "Client Workshop",
    default_stage: "Discovery",
    collections: ["Discovery Kit", "Retail Accelerator"],
    offerings: ["Cloud Migration"],
    linked_play_ids: ["play-001"],
    tags: ["Executive"],
    owners: ["alice@example.com"],
    created_at: "2023-01-10",
    updated_at: "2023-10-10",
    links: [
      { id: 'l1', title: 'SharePoint View', url: 'https://sharepoint.com/view/123', type: 'preview' }
    ],
    technologies: ["Azure"]
  },
  {
    id: "asset-102",
    title: "Terraform Landing Zone Modules",
    description: "Repository containing baseline Terraform modules for LZ creation. Includes VNET, Subnet, and NSG templates.",
    kind: "coderef",
    uri: "git://repo/tf-landing-zone",
    purpose: "Implementation",
    default_stage: "Delivery",
    collections: ["Technical Deep Dive"],
    offerings: ["Cloud Migration", "App Modernization"],
    linked_play_ids: ["play-001", "play-003"],
    tags: ["Technical"],
    owners: ["devops@example.com"],
    created_at: "2023-03-15",
    updated_at: "2023-10-12",
    links: [
        { id: 'l2', title: 'GitHub Repo', url: 'https://github.com/org/repo', type: 'source' },
        { id: 'l3', title: 'CI/CD Pipeline', url: 'https://jenkins.com/job/123', type: 'reference' }
    ],
    technologies: ["Terraform", "Azure", "AWS"]
  },
  {
    id: "asset-103",
    title: "Data Mesh Whitepaper",
    description: "Detailed explanation of the Data Mesh principles and architecture.",
    kind: "doc",
    uri: "https://sharepoint/data-mesh-wp.docx",
    purpose: "Education",
    default_stage: "Qualification",
    collections: ["FinServ Modernization"],
    offerings: ["Data & AI"],
    linked_play_ids: ["play-002"],
    tags: ["Architecture"],
    owners: ["bob@example.com"],
    created_at: "2023-06-20",
    updated_at: "2023-11-01",
    technologies: ["Snowflake", "Databricks"]
  },
  {
    id: "asset-104",
    title: "App Modernization Cost Estimator",
    description: "Excel sheet for calculating TCO reduction.",
    kind: "other",
    uri: "s3://bucket/cost-estimator.xlsx",
    purpose: "Business Case",
    default_stage: "Qualification",
    collections: ["Sales Enablement"],
    offerings: ["App Modernization"],
    linked_play_ids: ["play-003"],
    tags: ["Pricing", "Executive"],
    owners: ["salesops@example.com"],
    created_at: "2023-08-05",
    updated_at: "2023-09-15",
    technologies: ["AWS"]
  },
  {
    id: "asset-105",
    title: "Competitive Intelligence: Cloud Providers",
    description: "External link to Gartner Magic Quadrant report.",
    kind: "link",
    uri: "https://gartner.com/mq/cloud",
    purpose: "Market Research",
    default_stage: "Discovery",
    collections: ["Sales Enablement"],
    offerings: ["Cloud Migration", "Data & AI"],
    linked_play_ids: [],
    tags: ["Sales", "Market"],
    owners: ["marketing@example.com"],
    created_at: "2023-12-05",
    updated_at: "2023-12-05",
    links: [
        { id: 'l4', title: 'Gartner Report', url: 'https://gartner.com/mq/cloud', type: 'source' }
    ],
    technologies: ["AWS", "Azure", "GCP"]
  }
];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
    {
        id: "opp-001",
        name: "Acme Corp Cloud Transformation",
        account_name: "Acme Corp",
        sales_stage: "Propose",
        estimated_value: "$1.2M",
        close_date: "2024-06-30",
        region: "Americas",
        industry: "Retail",
        primary_play_id: "play-001",
        primary_technology_ids: ["Azure", "Terraform"],
        status: "active",
        health: "green",
        sales_owner_user_id: "user-1",
        team_member_user_ids: ["user-1", "user-2"],
        created_at: "2024-01-15",
        updated_at: "2024-02-20",
        tags: ["Migration", "Azure"],
        current_stage_key: "Solutioning",
        integrations: [
            { id: "i1", opportunity_id: "opp-001", type: "salesforce_oppty", label: "SFDC-10239", url: "#" },
            { id: "i2", opportunity_id: "opp-001", type: "box_folder", label: "Acme Proposal Docs", url: "#" }
        ],
        opportunity_plays: [
            {
                id: "op-001",
                opportunity_id: "opp-001",
                play_id: "play-001",
                is_primary: true,
                is_active: true,
                selected_technology_ids: ["Azure"],
                stage_instances: [
                    { 
                        id: "osi-1", 
                        opportunity_play_id: "op-001", 
                        play_stage_key: "Discovery", 
                        status: "completed",
                        checklist_item_statuses: { "Identify Executive Sponsor": "done", "Map current technical landscape": "done" } 
                    },
                    { 
                        id: "osi-2", 
                        opportunity_play_id: "op-001", 
                        play_stage_key: "Solutioning", 
                        status: "in_progress",
                        checklist_item_statuses: { "Draft HLD": "todo", "Review with Practice Lead": "todo" } 
                    }
                ]
            }
        ]
    }
];
