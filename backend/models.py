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

class AssetMetadata(BaseModel):
    id: Optional[str] = None
    title: str
    type: AssetType
    category: AssetCategory
    summary: str
    author: str
    created_at: str
    updated_at: str
    last_verified: str
    confidentiality: Confidentiality
    owners: List[str]
    tags: List[str]
    related_technologies: List[str]
    region: Optional[str] = None
    stage: Optional[str] = None
    metrics: Optional[List[Metric]] = None
    artifacts: Optional[List[Artifact]] = None
    notes: Optional[Note] = None
    comments: Optional[List[Comment]] = None
    content: Optional[str] = None  # For raw content if needed

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

Asset = AssetMetadata
