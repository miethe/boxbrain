from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Table, Text, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

# Association table for many-to-many relationship between Assets and Tags
asset_tags = Table(
    'asset_tags',
    Base.metadata,
    Column('asset_id', String, ForeignKey('assets.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

# Association table for many-to-many relationship between Plays and Tags
play_tags = Table(
    'play_tags',
    Base.metadata,
    Column('play_id', Integer, ForeignKey('gtm_plays.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

# Association table for many-to-many relationship between Opportunities and Technologies
opportunity_technologies = Table(
    'opportunity_technologies',
    Base.metadata,
    Column('opportunity_id', String, ForeignKey('opportunities.id'), primary_key=True),
    Column('technology_id', Integer, ForeignKey('technologies.id'), primary_key=True)
)

# Association table for many-to-many relationship between Plays and Technologies
play_technologies = Table(
    'play_technologies',
    Base.metadata,
    Column('play_id', Integer, ForeignKey('gtm_plays.id'), primary_key=True),
    Column('technology_id', Integer, ForeignKey('technologies.id'), primary_key=True)
)

# Association table for many-to-many relationship between Offerings and Technologies
offering_technologies = Table(
    'offering_technologies',
    Base.metadata,
    Column('offering_id', Integer, ForeignKey('offerings.id'), primary_key=True),
    Column('technology_id', Integer, ForeignKey('technologies.id'), primary_key=True)
)

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False, unique=True) # Path relative to assets/ dir
    mime_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # V2 Fields
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    kind = Column(String, nullable=False, default='other') # deck, doc, guide, etc.
    purpose = Column(String, nullable=True)
    default_stage = Column(String, nullable=True)
    uri = Column(String, nullable=True) # For external links or full URI
    owners = Column(JSON, nullable=True) # List of strings
    
    # New V2 Fields
    links = Column(JSON, nullable=True) # List of AssetLink objects
    linked_opportunity_ids = Column(JSON, nullable=True) # List of strings
    linked_asset_ids = Column(JSON, nullable=True) # List of strings
    offerings = Column(JSON, nullable=True) # List of strings
    linked_play_ids = Column(JSON, nullable=True) # List of strings
    technologies = Column(JSON, nullable=True) # List of strings
    
    # One-to-one relationship with metadata (Legacy V1, keeping for now but merging fields into AssetModel for V2 simplicity)
    metadata_entry = relationship("AssetMetadataModel", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    
    # Many-to-many relationship with tags
    tags = relationship("TagModel", secondary=asset_tags, back_populates="assets")
    
    # Many-to-many relationship with GTM Plays through association object
    gtm_play_associations = relationship("AssetGTMPlayAssociation", back_populates="asset", cascade="all, delete-orphan")

class AssetMetadataModel(Base):
    __tablename__ = "asset_metadata"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String, ForeignKey('assets.id'), unique=True, nullable=False)
    
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    author = Column(String, nullable=True)
    type = Column(String, nullable=False) # e.g., 'win_story', 'play'
    category = Column(String, nullable=False) # e.g., 'sales', 'technical'
    confidentiality = Column(String, nullable=False) # e.g., 'internal-only'
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    asset = relationship("AssetModel", back_populates="metadata_entry")

class TagModel(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    
    assets = relationship("AssetModel", secondary=asset_tags, back_populates="tags")
    plays = relationship("GTMPlayModel", secondary=play_tags, back_populates="tags")


class GTMPlayModel(Base):
    __tablename__ = "gtm_plays"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True) # Mapped to 'summary' in V2
    
    # Metadata
    offering = Column(String, nullable=True) 
    sector = Column(String, nullable=True) # V2
    geo = Column(String, nullable=True) # V2
    sales_stage = Column(String, nullable=True) # Legacy V1? V2 uses stage_scope
    stage_scope = Column(JSON, nullable=True) # V2: List of strings
    stages = Column(JSON, nullable=True) # V2: Detailed stage definitions
    owners = Column(JSON, nullable=True) # V2: List of strings
    collections = Column(JSON, nullable=True) # V2: List of strings (collection IDs or names)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    asset_associations = relationship("AssetGTMPlayAssociation", back_populates="play", cascade="all, delete-orphan")
    tags = relationship("TagModel", secondary=play_tags, back_populates="plays")
    technologies = relationship("TechnologyModel", secondary=play_technologies, back_populates="plays")

class OfferingModel(Base):
    __tablename__ = "offerings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    technologies = relationship("TechnologyModel", secondary=offering_technologies, back_populates="offerings")

class TechnologyModel(Base):
    __tablename__ = "technologies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=True) # e.g. 'Cloud', 'DevOps', 'Security'
    category = Column(String, nullable=True) # e.g. 'Cloud', 'DevOps', 'Security'
    # Deprecated: offering_id is replaced by many-to-many relationship
    offering_id = Column(Integer, ForeignKey('offerings.id'), nullable=True)
    offerings = relationship("OfferingModel", secondary=offering_technologies, back_populates="technologies")
    plays = relationship("GTMPlayModel", secondary=play_technologies, back_populates="technologies")
    opportunities = relationship("OpportunityModel", secondary=opportunity_technologies, back_populates="primary_technologies")

class SectorModel(Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class GeoModel(Base):
    __tablename__ = "geos"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class StageModel(Base):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class AssetCollectionModel(Base):
    __tablename__ = "asset_collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

class AssetGTMPlayAssociation(Base):
    __tablename__ = "asset_gtm_plays"
    
    asset_id = Column(String, ForeignKey('assets.id'), primary_key=True)
    play_id = Column(Integer, ForeignKey('gtm_plays.id'), primary_key=True)
    phase = Column(String, nullable=False) # e.g., 'Awareness', 'Consideration', 'Decision', 'Delivery'
    purpose = Column(String, nullable=True)
    collection_id = Column(Integer, ForeignKey('asset_collections.id'), nullable=True)
    
    asset = relationship("AssetModel", back_populates="gtm_play_associations")
    play = relationship("GTMPlayModel", back_populates="asset_associations")
    collection = relationship("AssetCollectionModel")

# --- V2 Opportunity Models ---

class OpportunityModel(Base):
    __tablename__ = "opportunities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    account_id = Column(String, nullable=True)
    sales_stage = Column(String, nullable=True)
    estimated_value = Column(String, nullable=True)
    close_date = Column(DateTime(timezone=True), nullable=True)
    region = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    
    problem_statement = Column(Text, nullable=True)
    key_personas = Column(JSON, nullable=True) # List of strings
    tags = Column(JSON, nullable=True) # List of strings
    status = Column(String, nullable=False, default='active') # active, parked, closed_won, closed_lost, archived
    health = Column(String, nullable=False, default='green') # green, yellow, red
    
    sales_owner_user_id = Column(String, nullable=True)
    technical_lead_user_id = Column(String, nullable=True)
    team_member_user_ids = Column(JSON, nullable=True) # List of strings
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    integrations = Column(JSON, nullable=True) # List of IntegrationLink objects
    
    # Relationships
    primary_play_id = Column(Integer, ForeignKey('gtm_plays.id'), nullable=True)
    primary_play = relationship("GTMPlayModel")
    
    opportunity_plays = relationship("OpportunityPlayModel", back_populates="opportunity", cascade="all, delete-orphan", lazy="selectin")
    primary_technologies = relationship("TechnologyModel", secondary=opportunity_technologies, back_populates="opportunities")

class OpportunityPlayModel(Base):
    __tablename__ = "opportunity_plays"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id = Column(String, ForeignKey('opportunities.id'), nullable=False)
    play_id = Column(Integer, ForeignKey('gtm_plays.id'), nullable=False)
    
    alias_name = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False)
    selected_technology_ids = Column(JSON, nullable=True) # List of strings
    is_active = Column(Boolean, default=True)
    
    opportunity = relationship("OpportunityModel", back_populates="opportunity_plays")
    play = relationship("GTMPlayModel")
    
    stage_instances = relationship("OpportunityStageInstanceModel", back_populates="opportunity_play", cascade="all, delete-orphan", lazy="selectin")

class OpportunityStageInstanceModel(Base):
    __tablename__ = "opportunity_stage_instances"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_play_id = Column(String, ForeignKey('opportunity_plays.id'), nullable=False)
    
    play_stage_key = Column(String, nullable=False)
    status = Column(String, nullable=False, default='not_started') # not_started, in_progress, completed, skipped
    
    start_date = Column(DateTime(timezone=True), nullable=True)
    target_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    
    summary_note = Column(Text, nullable=True)
    checklist_item_statuses = Column(JSON, nullable=True) # Dict
    custom_checklist_items = Column(JSON, nullable=True) # List of objects
    risk_flags = Column(JSON, nullable=True) # List of strings
    
    opportunity_play = relationship("OpportunityPlayModel", back_populates="stage_instances")

