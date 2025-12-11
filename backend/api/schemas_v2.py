from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# --- Base Models ---

class AssetLink(BaseModel):
    id: str
    title: str
    url: str
    type: str # 'preview' | 'source' | 'reference' | 'other'

class Asset(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    kind: str # 'deck' | 'doc' | 'guide' | 'runbook' | 'diagram' | 'video' | 'link' | 'coderef' | 'other'
    uri: Optional[str] = None
    links: Optional[List[AssetLink]] = []
    purpose: Optional[str] = None
    default_stage: Optional[str] = None
    collections: Optional[List[str]] = []
    offerings: Optional[List[str]] = []
    linked_play_ids: Optional[List[str]] = []
    tags: List[str] = []
    owners: Optional[List[str]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    technologies: Optional[List[str]] = []
    linked_opportunity_ids: Optional[List[str]] = []
    linked_asset_ids: Optional[List[str]] = []
    
    class Config:
        from_attributes = True

class AssetCreate(BaseModel):
    title: str
    description: Optional[str] = None
    kind: str = 'other'
    uri: Optional[str] = None
    purpose: Optional[str] = None
    default_stage: Optional[str] = None
    collections: Optional[List[str]] = []
    offerings: Optional[List[str]] = []
    linked_play_ids: Optional[List[str]] = []
    tags: List[str] = []
    owners: Optional[List[str]] = []
    technologies: Optional[List[str]] = []
    links: Optional[List[AssetLink]] = []
    linked_opportunity_ids: Optional[List[str]] = []
    linked_asset_ids: Optional[List[str]] = []

class PlayStageDefinition(BaseModel):
    key: str
    label: str
    objective: str
    guidance: str
    checklist_items: List[str]

class Play(BaseModel):
    id: Union[str, int] # V1 uses int, V2 uses string. We'll handle both.
    title: str
    summary: Optional[str] = None
    offering: Optional[str] = None
    technologies: List[str] = []
    stage_scope: Optional[List[str]] = []
    stages: Optional[List[PlayStageDefinition]] = []
    sector: Optional[str] = None
    geo: Optional[str] = None
    tags: List[str] = []
    owners: Optional[List[str]] = []
    updated_at: Optional[datetime] = None
    matchScore: Optional[float] = None
    default_team_members: Optional[List[str]] = []

    class Config:
        from_attributes = True

class PlayCreate(BaseModel):
    title: str
    summary: Optional[str] = None
    offering: Optional[str] = None
    technologies: List[str] = []
    stage_scope: Optional[List[str]] = []
    stages: Optional[List[PlayStageDefinition]] = []
    sector: Optional[str] = None
    geo: Optional[str] = None
    tags: List[str] = []
    owners: Optional[List[str]] = []
    collections: Optional[List[str]] = []
    default_team_members: Optional[List[str]] = []

class Dictionary(BaseModel):
    offerings: List[str]
    technologies: List[str]
    stages: List[str]
    sectors: List[str]
    geos: List[str]
    tags: List[str]
    offering_to_technologies: Dict[str, List[str]]
    technology_categories: Optional[Dict[str, str]] = {}

# --- Opportunity Models ---

class IntegrationLink(BaseModel):
    id: str
    opportunity_id: str
    type: str
    label: str
    url: str
    notes: Optional[str] = None

class StageNote(BaseModel):
    id: str
    stage_instance_id: str
    content: str
    is_private: bool
    author_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StageNoteCreate(BaseModel):
    stage_instance_id: str
    content: str
    is_private: bool = False
    author_id: Optional[str] = None

class OpportunityStageInstance(BaseModel):
    id: str
    opportunity_play_id: str
    play_stage_key: str
    status: str # 'not_started' | 'in_progress' | 'completed' | 'skipped'
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    summary_note: Optional[str] = None
    checklist_item_statuses: Optional[Dict[str, str]] = {}
    custom_checklist_items: Optional[List[Dict[str, Any]]] = []
    risk_flags: Optional[List[str]] = []
    notes: List[StageNote] = []
    
    class Config:
        from_attributes = True

class StageUpdate(BaseModel):
    status: Optional[str] = None # 'not_started' | 'in_progress' | 'completed' | 'skipped'
    summary_note: Optional[str] = None
    checklist_item_statuses: Optional[Dict[str, str]] = None
    custom_checklist_items: Optional[List[Dict[str, Any]]] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None

class OpportunityPlay(BaseModel):
    id: str
    opportunity_id: str
    play_id: Union[str, int]
    alias_name: Optional[str] = None
    is_primary: bool
    selected_technology_ids: Optional[List[str]] = []
    is_active: bool
    stage_instances: List[OpportunityStageInstance] = []
    
    class Config:
        from_attributes = True

class Opportunity(BaseModel):
    id: str
    name: str
    account_name: str
    account_id: Optional[str] = None
    sales_stage: Optional[str] = None
    estimated_value: Optional[str] = None
    close_date: Optional[datetime] = None
    region: Optional[str] = None
    industry: Optional[str] = None
    primary_play_id: Optional[Union[str, int]] = None
    opportunity_plays: List[OpportunityPlay] = []
    primary_technology_ids: List[str] = []
    problem_statement: Optional[str] = None
    key_personas: Optional[List[str]] = []
    tags: List[str] = []
    status: str
    current_stage_key: Optional[str] = None
    health: str
    sales_owner_user_id: Optional[str] = None
    technical_lead_user_id: Optional[str] = None
    team_member_user_ids: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    integrations: Optional[List[IntegrationLink]] = []

    class Config:
        from_attributes = True

class OpportunityInput(BaseModel):
    sector: str
    offering: str
    stage: str
    technologies: List[str]
    geo: str
    tags: List[str]
    notes: str
    plays: Optional[List[str]] = []
    name: Optional[str] = None
    account_name: Optional[str] = None
    team_member_user_ids: Optional[List[str]] = []

class OpportunityUpdate(BaseModel):
    sector: Optional[str] = None
    offering: Optional[str] = None
    stage: Optional[str] = None
    technologies: Optional[List[str]] = None
    geo: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    plays: Optional[List[str]] = None
    name: Optional[str] = None
    account_name: Optional[str] = None
    team_member_user_ids: Optional[List[str]] = None
