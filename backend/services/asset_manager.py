import shutil
import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from ..models_db import AssetModel, AssetMetadataModel, TagModel
from ..models import AssetMetadata as PydanticAssetMetadata

from .storage import LocalFileSystemStorage

# Initialize storage (could be injected)
# Base path is relative to the project root, assuming running from there or configured correctly.
# We'll use the same path as main.py: "assets"
storage = LocalFileSystemStorage(base_path="assets")

async def save_asset_file(file: UploadFile, asset_id: str) -> str:
    # Use storage service to save file
    # We organize by asset_id to keep things clean
    return await storage.save(file, directory=asset_id)

async def create_asset_entry(
    db: AsyncSession, 
    file: UploadFile, 
    metadata: PydanticAssetMetadata
) -> AssetModel:
    # Generate ID if not provided
    asset_id = metadata.id if metadata.id else str(uuid.uuid4())
    
    # 1. Save File
    relative_path = await save_asset_file(file, asset_id)
    
    # 2. Create DB Entry
    # Check for existing tags or create new ones
    tags = []
    for tag_name in metadata.tags:
        result = await db.execute(select(TagModel).where(TagModel.name == tag_name))
        tag = result.scalars().first()
        if not tag:
            tag = TagModel(name=tag_name)
            db.add(tag)
        tags.append(tag)
        
    db_asset = AssetModel(
        id=asset_id,
        original_filename=file.filename,
        file_path=relative_path,
        mime_type=file.content_type,
        size_bytes=file.size if file.size else 0, # file.size might be None depending on spooling
    )
    
    db_metadata = AssetMetadataModel(
        asset_id=asset_id,
        title=metadata.title,
        summary=metadata.summary,
        author=metadata.author,
        type=metadata.type.value,
        category=metadata.category.value,
        confidentiality=metadata.confidentiality.value,
        # Add other fields as needed
    )
    
    db_asset.metadata_entry = db_metadata
    db_asset.tags = tags
    
    # Handle GTM Play associations
    if metadata.gtm_plays:
        from ..models_db import AssetGTMPlayAssociation
        for play_assoc in metadata.gtm_plays:
            # Check if association already exists (shouldn't for new asset, but good practice)
            # For new asset, just add
            new_assoc = AssetGTMPlayAssociation(
                asset_id=asset_id,
                play_id=play_assoc.play_id,
                phase=play_assoc.phase
            )
            db.add(new_assoc)
    
    db.add(db_asset)
    await db.commit()
    
    # Reload with eager loading of relationships to avoid MissingGreenlet error
    # when accessing them in the route handler
    result = await db.execute(
        select(AssetModel)
        .options(selectinload(AssetModel.metadata_entry), selectinload(AssetModel.tags), selectinload(AssetModel.gtm_play_associations))
        .where(AssetModel.id == asset_id)
    )
    return result.scalars().first()

async def update_asset_entry(
    db: AsyncSession,
    asset_id: str,
    metadata: PydanticAssetMetadata,
    file: UploadFile = None
) -> AssetModel:
    result = await db.execute(
        select(AssetModel)
        .options(selectinload(AssetModel.metadata_entry), selectinload(AssetModel.tags))
        .where(AssetModel.id == asset_id)
    )
    db_asset = result.scalars().first()
    
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Update File if provided
    if file:
        relative_path = await save_asset_file(file, asset_id)
        db_asset.original_filename = file.filename
        db_asset.file_path = relative_path
        db_asset.mime_type = file.content_type
        if file.size:
             db_asset.size_bytes = file.size
             
    # Update Tags
    tags = []
    for tag_name in metadata.tags:
        result = await db.execute(select(TagModel).where(TagModel.name == tag_name))
        tag = result.scalars().first()
        if not tag:
            tag = TagModel(name=tag_name)
            db.add(tag)
        tags.append(tag)
    db_asset.tags = tags
    
    # Update Metadata
    if db_asset.metadata_entry:
         db_asset.metadata_entry.title = metadata.title
         db_asset.metadata_entry.summary = metadata.summary
         db_asset.metadata_entry.author = metadata.author
         db_asset.metadata_entry.type = metadata.type.value
         db_asset.metadata_entry.category = metadata.category.value
         db_asset.metadata_entry.confidentiality = metadata.confidentiality.value
    
    await db.commit()
    
    result = await db.execute(
        select(AssetModel)
        .options(selectinload(AssetModel.metadata_entry), selectinload(AssetModel.tags))
        .where(AssetModel.id == asset_id)
    )
    return result.scalars().first()

async def get_asset_path(asset_id: str, db: AsyncSession) -> Path:
    result = await db.execute(select(AssetModel).where(AssetModel.id == asset_id))
    asset = result.scalars().first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # For LocalFileSystemStorage, we can reconstruct the path
    # asset.file_path is relative to the storage base path
    full_path = storage.base_path / asset.file_path
    
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Asset file not found on disk")
        
    return full_path
