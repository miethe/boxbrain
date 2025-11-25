from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Table, Text
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

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False, unique=True) # Path relative to assets/ dir
    mime_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # One-to-one relationship with metadata
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

class AssetGTMPlayAssociation(Base):
    __tablename__ = "asset_gtm_plays"
    
    asset_id = Column(String, ForeignKey('assets.id'), primary_key=True)
    play_id = Column(Integer, ForeignKey('gtm_plays.id'), primary_key=True)
    phase = Column(String, nullable=False) # e.g., 'Awareness', 'Consideration', 'Decision', 'Delivery'
    
    asset = relationship("AssetModel", back_populates="gtm_play_associations")
    play = relationship("GTMPlayModel", back_populates="asset_associations")

class GTMPlayModel(Base):
    __tablename__ = "gtm_plays"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Metadata for fuzzy matching
    offering = Column(String, nullable=True) # Comma-separated or JSON string if needed, sticking to simple string for now
    industry = Column(String, nullable=True)
    region = Column(String, nullable=True)
    
    asset_associations = relationship("AssetGTMPlayAssociation", back_populates="play", cascade="all, delete-orphan")

