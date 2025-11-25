from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from typing import List
import json
from ...database import get_db
from ...models_db import AssetModel
from ...models import AssetMetadata
from ...services import asset_manager
from ...services.storage import storage
from fastapi.responses import FileResponse

router = APIRouter()

@router.post("/", response_model=AssetMetadata)
async def create_asset(
    file: UploadFile = File(...),
    metadata_json: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        metadata_dict = json.loads(metadata_json)
        metadata = AssetMetadata(**metadata_dict)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in metadata_json")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")

    db_asset = await asset_manager.create_asset_entry(db, file, metadata)
    
    # Convert back to Pydantic model for response
    # Note: This is a simplified conversion. You might want a proper helper.
    return AssetMetadata(
        id=db_asset.id,
        title=db_asset.metadata_entry.title,
        type=db_asset.metadata_entry.type,
        category=db_asset.metadata_entry.category,
        summary=db_asset.metadata_entry.summary,
        author=db_asset.metadata_entry.author,
        confidentiality=db_asset.metadata_entry.confidentiality,
        tags=[tag.name for tag in db_asset.tags],
        url=storage.get_url(db_asset.file_path),
        mime_type=db_asset.mime_type
    )

@router.get("/", response_model=List[AssetMetadata])
async def list_assets(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AssetModel)
        .options(joinedload(AssetModel.metadata_entry), selectinload(AssetModel.tags))
        .offset(skip)
        .limit(limit)
    )
    assets = result.unique().scalars().all()
    
    # This N+1 query pattern is inefficient but fine for MVP. 
    # In production, use joinedload options in the select query.
    response = []
    for asset in assets:
        if asset.metadata_entry:
            response.append(AssetMetadata(
                id=asset.id,
                title=asset.metadata_entry.title,
                type=asset.metadata_entry.type,
                category=asset.metadata_entry.category,
                summary=asset.metadata_entry.summary,
                author=asset.metadata_entry.author,
                confidentiality=asset.metadata_entry.confidentiality,
                tags=[tag.name for tag in asset.tags],
                url=storage.get_url(asset.file_path),
                mime_type=asset.mime_type
            ))
    return response

@router.get("/{asset_id}/file")
async def get_asset_file(asset_id: str, db: AsyncSession = Depends(get_db)):
    file_path = await asset_manager.get_asset_path(asset_id, db)
    return FileResponse(file_path)
