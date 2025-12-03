from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict
from ..database import get_db
from ..models_db import (
    AssetModel, GTMPlayModel, OpportunityModel, OpportunityPlayModel, 
    OpportunityStageInstanceModel, TagModel, OfferingModel, TechnologyModel, 
    SectorModel, GeoModel, StageModel
)
from .schemas_v2 import (
    Dictionary, Play, Asset, Opportunity, OpportunityInput, OpportunityPlay, PlayCreate
)
import uuid

router = APIRouter(prefix="/api/v2", tags=["v2"])

# --- Dictionary ---

@router.get("/dictionary", response_model=Dictionary)
async def get_dictionary(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    
    # Eager load technologies for offerings to avoid lazy loading issues
    offerings = (await db.execute(
        select(OfferingModel).options(selectinload(OfferingModel.technologies))
    )).scalars().all()
    
    technologies = (await db.execute(select(TechnologyModel))).scalars().all()
    stages = (await db.execute(select(StageModel))).scalars().all()
    sectors = (await db.execute(select(SectorModel))).scalars().all()
    geos = (await db.execute(select(GeoModel))).scalars().all()
    tags = (await db.execute(select(TagModel))).scalars().all()
    
    offering_to_tech = {}
    for off in offerings:
        offering_to_tech[off.name] = [t.name for t in off.technologies]

    tech_categories = {}
    for t in technologies:
        if t.category:
            tech_categories[t.name] = t.category

    return Dictionary(
        offerings=[o.name for o in offerings],
        technologies=[t.name for t in technologies],
        stages=[s.name for s in stages],
        sectors=[s.name for s in sectors],
        geos=[g.name for g in geos],
        tags=[t.name for t in tags],
        offering_to_technologies=offering_to_tech,
        technology_categories=tech_categories
    )

# --- Plays ---

@router.get("/plays", response_model=List[Play])
async def get_plays(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    # Eager load relationships to avoid MissingGreenlet
    stmt = select(GTMPlayModel).options(
        selectinload(GTMPlayModel.technologies),
        selectinload(GTMPlayModel.tags)
    )
    result = await db.execute(stmt)
    plays = result.scalars().all()
    
    # Transform DB model to Schema
    result_list = []
    for p in plays:
        play_schema = Play(
            id=str(p.id),
            title=p.title,
            summary=p.description,
            offering=p.offering,
            technologies=[t.name for t in p.technologies],
            stage_scope=p.stage_scope or [],
            stages=p.stages or [],
            sector=p.sector,
            geo=p.geo,
            tags=[t.name for t in p.tags],
            owners=p.owners or [],
            updated_at=p.updated_at
        )
        result_list.append(play_schema)
    return result_list

@router.get("/plays/{play_id}", response_model=Play)
async def get_play(play_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    try:
        pid = int(play_id)
        stmt = select(GTMPlayModel).options(
            selectinload(GTMPlayModel.technologies),
            selectinload(GTMPlayModel.tags)
        ).filter(GTMPlayModel.id == pid)
        result = await db.execute(stmt)
        play = result.scalars().first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Play ID format")
        
    if not play:
        raise HTTPException(status_code=404, detail="Play not found")
        
    return Play(
        id=str(play.id),
        title=play.title,
        summary=play.description,
        offering=play.offering,
        technologies=[t.name for t in play.technologies],
        stage_scope=play.stage_scope or [],
        stages=play.stages or [],
        sector=play.sector,
        geo=play.geo,
        tags=[t.name for t in play.tags],
        owners=play.owners or [],
        updated_at=play.updated_at
    )

# --- Assets ---

@router.get("/assets", response_model=List[Asset])
async def get_assets(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    stmt = select(AssetModel).options(
        selectinload(AssetModel.tags),
        selectinload(AssetModel.metadata_entry)
    )
    result = await db.execute(stmt)
    assets = result.scalars().all()
    
    result_list = []
    for a in assets:
        result_list.append(Asset(
            id=a.id,
            title=a.title,
            description=a.description,
            kind=a.kind,
            uri=a.uri or f"/assets/{a.file_path}", 
            purpose=a.purpose,
            default_stage=a.default_stage,
            tags=[t.name for t in a.tags],
            owners=a.owners or [],
            created_at=a.created_at,
            updated_at=a.updated_at,
            technologies=[] 
        ))
    return result_list

@router.post("/assets", response_model=Asset)
async def create_asset(asset: Asset, db: AsyncSession = Depends(get_db)):
    db_asset = AssetModel(
        id=str(uuid.uuid4()),
        title=asset.title,
        description=asset.description,
        kind=asset.kind,
        purpose=asset.purpose,
        default_stage=asset.default_stage,
        uri=asset.uri,
        owners=asset.owners,
        original_filename="placeholder", 
        file_path=f"placeholder_{uuid.uuid4()}"
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return Asset(
            id=db_asset.id,
            title=db_asset.title,
            description=db_asset.description,
            kind=db_asset.kind,
            uri=db_asset.uri,
            purpose=db_asset.purpose,
            default_stage=db_asset.default_stage,
            tags=[],
            owners=db_asset.owners or [],
            created_at=db_asset.created_at,
            updated_at=db_asset.updated_at
        )

# --- Opportunities ---

@router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpportunityModel))
    opps = result.scalars().all()
    return opps

@router.get("/opportunities/{opp_id}", response_model=Opportunity)
async def get_opportunity(opp_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OpportunityModel).filter(OpportunityModel.id == opp_id))
    opp = result.scalars().first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp

@router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(input: OpportunityInput, db: AsyncSession = Depends(get_db)):
    opp = OpportunityModel(
        id=str(uuid.uuid4()),
        name=f"New Opportunity - {input.offering}",
        account_name="New Account", 
        sales_stage=input.stage,
        region=input.geo,
        industry=input.sector,
        problem_statement=input.notes,
        status="active",
        health="green",
        tags=input.tags
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    return opp
@router.post("/plays", response_model=Play)
async def create_play(play: PlayCreate, db: AsyncSession = Depends(get_db)):
    # Create DB model
    db_play = GTMPlayModel(
        title=play.title,
        description=play.summary,
        offering=play.offering,
        sector=play.sector,
        geo=play.geo,
        stage_scope=play.stage_scope,
        stages=[s.dict() for s in play.stages] if play.stages else [],
        owners=play.owners,
        collections=play.collections
    )
    
    # Handle Technologies
    if play.technologies:
        techs = await db.execute(select(TechnologyModel).filter(TechnologyModel.name.in_(play.technologies)))
        db_play.technologies = techs.scalars().all()
        
    # Handle Tags
    if play.tags:
        tags = await db.execute(select(TagModel).filter(TagModel.name.in_(play.tags)))
        existing_tags = tags.scalars().all()
        existing_tag_names = [t.name for t in existing_tags]
        
        # Create new tags if they don't exist
        for tag_name in play.tags:
            if tag_name not in existing_tag_names:
                new_tag = TagModel(name=tag_name)
                db.add(new_tag)
                db_play.tags.append(new_tag)
            else:
                db_play.tags.append(next(t for t in existing_tags if t.name == tag_name))
    
    db.add(db_play)
    await db.commit()
    await db.refresh(db_play)
    
    # Return schema
    return Play(
        id=str(db_play.id),
        title=db_play.title,
        summary=db_play.description,
        offering=db_play.offering,
        technologies=[t.name for t in db_play.technologies],
        stage_scope=db_play.stage_scope or [],
        stages=db_play.stages or [],
        sector=db_play.sector,
        geo=db_play.geo,
        tags=[t.name for t in db_play.tags],
        owners=db_play.owners or [],
        updated_at=db_play.updated_at
    )

# --- Admin Dictionary Management ---

@router.post("/admin/dictionary/{type}")
async def add_dictionary_option(type: str, value: str, category: str = None, db: AsyncSession = Depends(get_db)):
    model_map = {
        "offerings": OfferingModel,
        "technologies": TechnologyModel,
        "stages": StageModel,
        "sectors": SectorModel,
        "geos": GeoModel,
        "tags": TagModel
    }
    
    if type not in model_map:
        raise HTTPException(status_code=400, detail="Invalid dictionary type")
    
    Model = model_map[type]
    
    # Check if exists
    existing = await db.execute(select(Model).filter(Model.name == value))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Option already exists")
        
    if type == "technologies" and category:
        new_option = Model(name=value, category=category)
    else:
        new_option = Model(name=value)
        
    db.add(new_option)
    await db.commit()
    return {"status": "success", "message": f"Added {value} to {type}"}

@router.put("/admin/dictionary/{type}/{old_value}")
async def update_dictionary_option(type: str, old_value: str, new_value: str, category: str = None, db: AsyncSession = Depends(get_db)):
    model_map = {
        "offerings": OfferingModel,
        "technologies": TechnologyModel,
        "stages": StageModel,
        "sectors": SectorModel,
        "geos": GeoModel,
        "tags": TagModel
    }
    
    if type not in model_map:
        raise HTTPException(status_code=400, detail="Invalid dictionary type")
        
    Model = model_map[type]
    
    result = await db.execute(select(Model).filter(Model.name == old_value))
    option = result.scalars().first()
    
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")
        
    option.name = new_value
    if type == "technologies" and category is not None:
        option.category = category
        
    await db.commit()
    return {"status": "success", "message": f"Updated {old_value} to {new_value}"}

@router.delete("/admin/dictionary/{type}/{value}")
async def delete_dictionary_option(type: str, value: str, db: AsyncSession = Depends(get_db)):
    model_map = {
        "offerings": OfferingModel,
        "technologies": TechnologyModel,
        "stages": StageModel,
        "sectors": SectorModel,
        "geos": GeoModel,
        "tags": TagModel
    }
    
    if type not in model_map:
        raise HTTPException(status_code=400, detail="Invalid dictionary type")
        
    Model = model_map[type]
    
    result = await db.execute(select(Model).filter(Model.name == value))
    option = result.scalars().first()
    
    if not option:
        raise HTTPException(status_code=404, detail="Option not found")
        
    await db.delete(option)
    await db.commit()
    return {"status": "success", "message": f"Deleted {value} from {type}"}

# Special endpoint for Offering -> Technology mapping
@router.post("/admin/dictionary/mapping/offering-technology")
async def map_offering_technology(offering: str, technology: str, action: str = "add", db: AsyncSession = Depends(get_db)):
    # action: 'add' or 'remove'
    
    off_result = await db.execute(select(OfferingModel).filter(OfferingModel.name == offering))
    off_obj = off_result.scalars().first()
    
    tech_result = await db.execute(select(TechnologyModel).filter(TechnologyModel.name == technology))
    tech_obj = tech_result.scalars().first()
    
    if not off_obj or not tech_obj:
        raise HTTPException(status_code=404, detail="Offering or Technology not found")
        
    if action == "add":
        tech_obj.offering_id = off_obj.id
    elif action == "remove":
        if tech_obj.offering_id == off_obj.id:
            tech_obj.offering_id = None
            
    await db.commit()
    return {"status": "success"}
