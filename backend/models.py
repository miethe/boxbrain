from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class AssetType(str, Enum):
    WinStory = "win_story"
    Play = "play"
    CodeRef = "code_ref"
    Template = "template"

class AssetCategory(str, Enum):
    Sales = "sales"
    Technical = "technical"

class Confidentiality(str, Enum):
    InternalOnly = "internal-only"
    ClientSafe = "client-safe"

class Artifact(BaseModel):
    name: str
    kind: str  # pdf, pptx, code, etc.
    uri: str

class Note(BaseModel):
    content: str
    isPrivate: bool
    updatedAt: str

class Comment(BaseModel):
    id: str
    author: str
    content: str
    timestamp: str

class Metric(BaseModel):
    name: str
    value: str

class AssetGTMPlayAssociation(BaseModel):
    play_id: str
    play_title: str
    phase: str

class AssetMetadata(BaseModel):
    id: Optional[str] = None
    title: str
    type: AssetType
    category: AssetCategory
    summary: str
    author: Optional[str] = "Unknown"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_verified: Optional[str] = None
    confidentiality: Confidentiality
    owners: List[str] = []
    tags: List[str] = []
    related_technologies: List[str] = []
    region: Optional[str] = None
    stage: Optional[str] = None
    purpose: Optional[str] = None # Contextual for Play
    collection_id: Optional[int] = None # Contextual for Play
    metrics: Optional[List[Metric]] = None
    artifacts: Optional[List[Artifact]] = None
    notes: Optional[Note] = None
    comments: Optional[List[Comment]] = None
    content: Optional[str] = None  # For raw content if needed
    url: Optional[str] = None
    mime_type: Optional[str] = None
    gtm_plays: Optional[List[AssetGTMPlayAssociation]] = []


class FacetItem(BaseModel):
    value: str
    count: int

class Facets(BaseModel):
    offering: List[FacetItem]
    related_technologies: List[FacetItem]
    tags: List[FacetItem]

class InboxItem(BaseModel):
    id: str
    source: str  # 'slack' | 'email'
    sender: str
    content: str
    timestamp: str
    suggestedMetadata: AssetMetadata




class GTMPlay(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    offering: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    sales_stage: Optional[str] = None
    match_score: Optional[int] = None # For matching results
    assets: List[AssetMetadata] = [] # For returning full asset details

class GTMPlayCreate(BaseModel):
    title: str
    description: Optional[str] = None
    offering: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    sales_stage: Optional[str] = None

class AssetGTMPlayLink(BaseModel):
    asset_id: str
    play_id: int
    phase: str
    purpose: Optional[str] = None
    collection_id: Optional[int] = None

Asset = AssetMetadata

