from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from ...database import get_db
from ...models_db import GTMPlayModel, AssetGTMPlayAssociation, AssetModel
from ...models import GTMPlay, GTMPlayCreate, AssetGTMPlayLink, AssetMetadata, AssetGTMPlayAssociation as AssetGTMPlayAssociationSchema

router = APIRouter()

@router.post("/", response_model=GTMPlay)
async def create_play(play: GTMPlayCreate, db: AsyncSession = Depends(get_db)):
    db_play = GTMPlayModel(
        title=play.title,
        description=play.description,
        offering=play.offering,
        industry=play.industry,
        region=play.region
    )
    db.add(db_play)
    await db.commit()
    await db.refresh(db_play)
    return GTMPlay(
        id=db_play.id,
        title=db_play.title,
        description=db_play.description,
        offering=db_play.offering,
        industry=db_play.industry,
        region=db_play.region,
        assets=[]
    )

@router.get("/", response_model=List[GTMPlay])
async def list_plays(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GTMPlayModel)
        .options(selectinload(GTMPlayModel.asset_associations).selectinload(AssetGTMPlayAssociation.asset).selectinload(AssetModel.metadata_entry))
        .offset(skip)
        .limit(limit)
    )
    plays = result.scalars().all()
    
    response = []
    for play in plays:
        assets = []
        for assoc in play.asset_associations:
            if assoc.asset and assoc.asset.metadata_entry:
                assets.append(AssetMetadata(
                    id=assoc.asset.id,
                    title=assoc.asset.metadata_entry.title,
                    type=assoc.asset.metadata_entry.type,
                    category=assoc.asset.metadata_entry.category,
                    summary=assoc.asset.metadata_entry.summary,
                    author=assoc.asset.metadata_entry.author,
                    confidentiality=assoc.asset.metadata_entry.confidentiality,
                    stage=assoc.phase # Overloading stage field to pass phase for now, or could add phase to AssetMetadata
                ))
        
        response.append(GTMPlay(
            id=play.id,
            title=play.title,
            description=play.description,
            offering=play.offering,
            industry=play.industry,
            region=play.region,
            assets=assets
        ))
    return response

@router.post("/associate", response_model=AssetGTMPlayLink)
async def associate_asset_to_play(link: AssetGTMPlayLink, db: AsyncSession = Depends(get_db)):
    # Check if association already exists
    result = await db.execute(
        select(AssetGTMPlayAssociation)
        .where(AssetGTMPlayAssociation.asset_id == link.asset_id)
        .where(AssetGTMPlayAssociation.play_id == link.play_id)
    )
    existing = result.scalars().first()
    
    if existing:
        existing.phase = link.phase
    else:
        new_assoc = AssetGTMPlayAssociation(
            asset_id=link.asset_id,
            play_id=link.play_id,
            phase=link.phase
        )
        db.add(new_assoc)
    
    await db.commit()
    return link

@router.post("/match", response_model=List[GTMPlay])
async def match_plays(
    offering: Optional[List[str]] = None,
    industry: Optional[str] = None,
    region: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Simple matching logic for now
    query = select(GTMPlayModel).options(selectinload(GTMPlayModel.asset_associations).selectinload(AssetGTMPlayAssociation.asset).selectinload(AssetModel.metadata_entry))
    
    # Filter by industry if provided
    if industry:
        query = query.where(GTMPlayModel.industry == industry)
        
    # Filter by region if provided
    if region:
        query = query.where(GTMPlayModel.region == region)
        
    result = await db.execute(query)
    plays = result.scalars().all()
    
    # In-memory filtering for offering (fuzzy match)
    matched_plays = []
    for play in plays:
        score = 0
        if offering and play.offering:
            play_offerings = [o.strip().lower() for o in play.offering.split(',')]
            for off in offering:
                if any(off.lower() in po for po in play_offerings):
                    score += 1
        
        # If no offering filter, return all matching industry/region
        if not offering or score > 0:
            assets = []
            for assoc in play.asset_associations:
                if assoc.asset and assoc.asset.metadata_entry:
                    assets.append(AssetMetadata(
                        id=assoc.asset.id,
                        title=assoc.asset.metadata_entry.title,
                        type=assoc.asset.metadata_entry.type,
                        category=assoc.asset.metadata_entry.category,
                        summary=assoc.asset.metadata_entry.summary,
                        author=assoc.asset.metadata_entry.author,
                        confidentiality=assoc.asset.metadata_entry.confidentiality,
                        stage=assoc.phase
                    ))
            
            matched_plays.append(GTMPlay(
                id=play.id,
                title=play.title,
                description=play.description,
                offering=play.offering,
                industry=play.industry,
                region=play.region,
                assets=assets
            ))
            
    return matched_plays
