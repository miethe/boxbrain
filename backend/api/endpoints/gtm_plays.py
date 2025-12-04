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
        sector=play.industry, # Map industry -> sector
        geo=play.region,      # Map region -> geo
        sales_stage=play.sales_stage
    )
    db.add(db_play)
    await db.commit()
    await db.refresh(db_play)
    return GTMPlay(
        id=db_play.id,
        title=db_play.title,
        description=db_play.description,
        offering=db_play.offering,
        industry=db_play.sector, # Map sector -> industry
        region=db_play.geo,      # Map geo -> region
        sales_stage=db_play.sales_stage,
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
                    stage=assoc.phase, # Overloading stage field to pass phase
                    purpose=assoc.purpose,
                    collection_id=assoc.collection_id
                ))
        
        response.append(GTMPlay(
            id=play.id,
            title=play.title,
            description=play.description,
            offering=play.offering,
            industry=play.industry,
            region=play.region,
            sales_stage=play.sales_stage,
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
        existing.purpose = link.purpose
        existing.collection_id = link.collection_id
    else:
        new_assoc = AssetGTMPlayAssociation(
            asset_id=link.asset_id,
            play_id=link.play_id,
            phase=link.phase,
            purpose=link.purpose,
            collection_id=link.collection_id
        )
        db.add(new_assoc)
    
    await db.commit()
    return link

@router.put("/{play_id}", response_model=GTMPlay)
async def update_play(play_id: int, play: GTMPlayCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GTMPlayModel).where(GTMPlayModel.id == play_id))
    db_play = result.scalars().first()
    
    if not db_play:
        raise HTTPException(status_code=404, detail="Play not found")
    
    db_play.title = play.title
    db_play.description = play.description
    db_play.offering = play.offering
    db_play.industry = play.industry
    db_play.region = play.region
    db_play.sales_stage = play.sales_stage
    
    await db.commit()
    await db.refresh(db_play)
    
    return GTMPlay(
        id=db_play.id,
        title=db_play.title,
        description=db_play.description,
        offering=db_play.offering,
        industry=db_play.industry,
        region=db_play.region,
        sales_stage=db_play.sales_stage,
        assets=[] # We don't return assets here for simplicity
    )

@router.post("/match", response_model=List[GTMPlay])
async def match_plays(
    offering: Optional[List[str]] = None,
    industry: Optional[str] = None,
    region: Optional[str] = None,
    stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Fetch all plays and do in-memory matching for flexibility
    # In a real app, we would use more SQL filtering
    query = select(GTMPlayModel).options(selectinload(GTMPlayModel.asset_associations).selectinload(AssetGTMPlayAssociation.asset).selectinload(AssetModel.metadata_entry))
    
    result = await db.execute(query)
    plays = result.scalars().all()
    
    matched_plays = []
    for play in plays:
        score = 0
        total_criteria = 0
        
        # 1. Offering Match (High Weight)
        if offering:
            total_criteria += 3
            if play.offering:
                play_offerings = [o.strip().lower() for o in play.offering.split(',')]
                # Check if ANY of the requested offerings match ANY of the play's offerings
                match_count = sum(1 for off in offering if any(off.lower() in po for po in play_offerings))
                if match_count > 0:
                    score += 3 # Full points if at least one matches
        
        # 2. Industry Match (Medium Weight)
        if industry and industry != 'X-SECTOR':
            total_criteria += 2
            if play.industry:
                # Handle "Cross-sector" or "All" logic
                if play.industry.lower() in ['all', 'cross-sector', 'x-sector'] or industry.lower() in play.industry.lower():
                    score += 2
        
        # 3. Region Match (Medium Weight)
        if region and region != 'GLOBAL':
            total_criteria += 2
            if play.region:
                if play.region.lower() in ['global', 'all'] or region.lower() in play.region.lower():
                    score += 2
        
        # 4. Stage Match (Low Weight)
        if stage:
            total_criteria += 1
            if play.sales_stage:
                if stage.lower() in play.sales_stage.lower() or play.sales_stage.lower() == 'all':
                    score += 1
        
        # Calculate Percentage
        # If no criteria provided, return 0 or maybe all? Let's return 0 match if no criteria.
        # But if criteria provided, calculate %.
        
        final_score = 0
        if total_criteria > 0:
            final_score = int((score / total_criteria) * 100)
        elif not offering and not industry and not region and not stage:
             # If no filters, maybe just list them all with 100%? Or 0?
             # Let's say 100% if browsing without filters (though this endpoint is for matching)
             final_score = 100

        # Threshold: Only return if > 0% match
        if final_score > 0:
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
                        stage=assoc.phase,
                        purpose=assoc.purpose,
                        collection_id=assoc.collection_id
                    ))
            
            matched_plays.append(GTMPlay(
                id=play.id,
                title=play.title,
                description=play.description,
                offering=play.offering,
                industry=play.industry,
                region=play.region,
                sales_stage=play.sales_stage,
                match_score=final_score,
                assets=assets
            ))
            
    # Sort by match score descending
    matched_plays.sort(key=lambda x: x.match_score or 0, reverse=True)
            
    return matched_plays
