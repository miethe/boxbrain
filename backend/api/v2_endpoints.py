from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
    Dictionary, Play, Asset, AssetCreate, Opportunity, OpportunityInput, OpportunityPlay, PlayCreate, StageUpdate, OpportunityStageInstance
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

@router.delete("/plays/{play_id}")
async def delete_play(play_id: str, db: AsyncSession = Depends(get_db)):
    try:
        pid = int(play_id)
        stmt = select(GTMPlayModel).filter(GTMPlayModel.id == pid)
        result = await db.execute(stmt)
        play = result.scalars().first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Play ID format")

    if not play:
        raise HTTPException(status_code=404, detail="Play not found")

    await db.delete(play)
    await db.commit()
    return {"status": "success", "message": "Play deleted"}

@router.put("/plays/{play_id}", response_model=Play)
async def update_play(play_id: str, play_update: PlayCreate, db: AsyncSession = Depends(get_db)):
    # Note: Using PlayCreate schema for update for simplicity, assuming full replace or we map fields
    try:
        pid = int(play_id)
        stmt = select(GTMPlayModel).options(
            selectinload(GTMPlayModel.technologies),
            selectinload(GTMPlayModel.tags)
        ).filter(GTMPlayModel.id == pid)
        result = await db.execute(stmt)
        db_play = result.scalars().first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Play ID format")
    
    if not db_play:
        raise HTTPException(status_code=404, detail="Play not found")
        
    # Update Fields
    # For now, simplistic mapping of some key fields
    db_play.title = play_update.title
    db_play.description = play_update.summary
    db_play.offering = play_update.offering
    db_play.sector = play_update.sector
    db_play.geo = play_update.geo
    db_play.stage_scope = play_update.stage_scope
    db_play.stage_scope = play_update.stage_scope
    
    # Auto-populate stages if missing but scope is provided
    final_stages = [s.dict() for s in play_update.stages] if play_update.stages else []
    if not final_stages and play_update.stage_scope:
        final_stages = _populate_stages_from_scope(play_update.stage_scope)
        
    db_play.stages = final_stages
    db_play.owners = play_update.owners
    db_play.collections = play_update.collections
    
    # Update Technologies (Full Replace)
    if play_update.technologies is not None:
        techs = await db.execute(select(TechnologyModel).filter(TechnologyModel.name.in_(play_update.technologies)))
        db_play.technologies = techs.scalars().all()
        
    # Update Tags (Full Replace logic similar to create)
    if play_update.tags is not None:
        db_play.tags = [] # Clear existing
        tags = await db.execute(select(TagModel).filter(TagModel.name.in_(play_update.tags)))
        existing_tags = tags.scalars().all()
        existing_tag_names = [t.name for t in existing_tags]
        
        for tag_name in play_update.tags:
            if tag_name not in existing_tag_names:
                new_tag = TagModel(name=tag_name)
                db.add(new_tag)
                db_play.tags.append(new_tag)
            else:
                db_play.tags.append(next(t for t in existing_tags if t.name == tag_name))

    await db.commit()
    await db.refresh(db_play)
    
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
async def create_asset(asset: AssetCreate, db: AsyncSession = Depends(get_db)):
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
        file_path=f"placeholder_{uuid.uuid4()}",
        links=[l.dict() for l in asset.links] if asset.links else [],
        linked_opportunity_ids=asset.linked_opportunity_ids,
        linked_asset_ids=asset.linked_asset_ids,
        offerings=asset.offerings,
        linked_play_ids=asset.linked_play_ids,
        technologies=asset.technologies
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
            updated_at=db_asset.updated_at,
            links=[AssetLink(**l) for l in db_asset.links] if db_asset.links else [],
            linked_opportunity_ids=db_asset.linked_opportunity_ids or [],
            linked_asset_ids=db_asset.linked_asset_ids or [],
            offerings=db_asset.offerings or [],
            linked_play_ids=db_asset.linked_play_ids or [],
            technologies=db_asset.technologies or []
        )

@router.get("/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    stmt = select(AssetModel).options(
        selectinload(AssetModel.tags),
        selectinload(AssetModel.metadata_entry)
    ).filter(AssetModel.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return Asset(
        id=asset.id,
        title=asset.title,
        description=asset.description,
        kind=asset.kind,
        uri=asset.uri or f"/assets/{asset.file_path}", 
        purpose=asset.purpose,
        default_stage=asset.default_stage,
        tags=[t.name for t in asset.tags],
        owners=asset.owners or [],
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        links=[AssetLink(**l) for l in asset.links] if asset.links else [],
        linked_opportunity_ids=asset.linked_opportunity_ids or [],
        linked_asset_ids=asset.linked_asset_ids or [],
        offerings=asset.offerings or [],
        linked_play_ids=asset.linked_play_ids or [],
        technologies=asset.technologies or []
    )

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(AssetModel).filter(AssetModel.id == asset_id)
    result = await db.execute(stmt)
    asset = result.scalars().first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    await db.delete(asset)
    await db.commit()
    return {"status": "success", "message": "Asset deleted"}

@router.put("/assets/{asset_id}", response_model=Asset)
async def update_asset(asset_id: str, asset_update: AssetCreate, db: AsyncSession = Depends(get_db)):
    # Helper to clean up imports if needed, but they are top level
    from sqlalchemy.orm import selectinload
    stmt = select(AssetModel).options(selectinload(AssetModel.tags)).filter(AssetModel.id == asset_id)
    result = await db.execute(stmt)
    db_asset = result.scalars().first()
    
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db_asset.title = asset_update.title
    db_asset.description = asset_update.description
    db_asset.kind = asset_update.kind
    db_asset.purpose = asset_update.purpose
    db_asset.default_stage = asset_update.default_stage
    db_asset.uri = asset_update.uri
    db_asset.owners = asset_update.owners
    db_asset.offerings = asset_update.offerings
    db_asset.technologies = asset_update.technologies
    
    # Note: Not handling linked_* lists deeply here for brevity, assume simplistic update
    
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
        tags=[t.name for t in db_asset.tags],
        owners=db_asset.owners or [],
        created_at=db_asset.created_at,
        updated_at=db_asset.updated_at,
        technologies=db_asset.technologies or []
    )

# --- Opportunities ---

@router.get("/opportunities", response_model=List[Opportunity])
async def get_opportunities(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(OpportunityModel).options(selectinload(OpportunityModel.opportunity_plays))
    )
    opps = result.scalars().all()
    
    # Handle None values for list fields to match schema
    for opp in opps:
        if opp.team_member_user_ids is None:
            opp.team_member_user_ids = []
            
    return opps

@router.get("/opportunities/{opp_id}", response_model=Opportunity)
async def get_opportunity(opp_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(OpportunityModel)
        .options(selectinload(OpportunityModel.opportunity_plays))
        .filter(OpportunityModel.id == opp_id)
    )
    opp = result.scalars().first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    if opp.team_member_user_ids is None:
        opp.team_member_user_ids = []
        
    return opp

@router.post("/opportunities", response_model=Opportunity)
async def create_opportunity(input: OpportunityInput, db: AsyncSession = Depends(get_db)):
    opp = OpportunityModel(
        id=str(uuid.uuid4()),
        name=input.name or f"New Opportunity - {input.offering}",
        account_name=input.account_name or "New Account", 
        sales_stage=input.stage,
        region=input.geo,
        industry=input.sector,
        problem_statement=input.notes,
        status="active",
        health="green",
        tags=input.tags,
        team_member_user_ids=[] # Initialize to empty list to satisfy schema
    )
    db.add(opp)
    await db.commit()
    await db.refresh(opp)
    from sqlalchemy.orm import attributes
    
    # Explicitly set empty list to avoid MissingGreenlet on lazy load
    attributes.set_committed_value(opp, 'opportunity_plays', [])
    
    # Handle Plays
    if input.plays:
        for play_id in input.plays:
            # Verify play exists
            play_result = await db.execute(select(GTMPlayModel).filter(GTMPlayModel.id == int(play_id)))
            play = play_result.scalars().first()
            
            if play:
                # Create OpportunityPlay
                opp_play_id = str(uuid.uuid4())
                opp_play = OpportunityPlayModel(
                    id=opp_play_id,
                    opportunity_id=opp.id,
                    play_id=play.id, # Use play.id from the fetched play
                    is_primary=False, # You might want to logic this
                    is_active=True
                )
                
                # Initialize stage instances for this play
                if play.stages:
                    for stage in play.stages:
                        # Ensure stage is a dict (it might be a Pydantic model if coming from internal call, but here it's from DB model which is JSON)
                        # DB model stages is JSON, so it's a list of dicts.
                        
                        stage_instance = OpportunityStageInstanceModel(
                            id=str(uuid.uuid4()),
                            opportunity_play_id=opp_play_id,
                            play_stage_key=stage['key'],
                            status="not_started",
                            checklist_item_statuses={}
                        )
                        opp_play.stage_instances.append(stage_instance)
                
                opp.opportunity_plays.append(opp_play)
    
    await db.commit()
    
    # Re-fetch the opportunity to ensure everything is loaded and fresh
    from sqlalchemy.orm import selectinload, joinedload
    result = await db.execute(
        select(OpportunityModel)
        .options(
            selectinload(OpportunityModel.opportunity_plays)
            .selectinload(OpportunityPlayModel.stage_instances),
            selectinload(OpportunityModel.primary_play),
            selectinload(OpportunityModel.primary_technologies)
        )
        .filter(OpportunityModel.id == opp.id)
    )
    opp = result.scalars().unique().first()
    
    if opp.team_member_user_ids is None:
        opp.team_member_user_ids = []
    
    return opp

@router.delete("/opportunities/{opp_id}")
async def delete_opportunity(opp_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(OpportunityModel).filter(OpportunityModel.id == opp_id)
    result = await db.execute(stmt)
    opp = result.scalars().first()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    await db.delete(opp)
    await db.commit()
    return {"status": "success", "message": "Opportunity deleted"}

@router.put("/opportunities/{opp_id}", response_model=Opportunity)
async def update_opportunity(opp_id: str, opp_update: OpportunityInput, db: AsyncSession = Depends(get_db)):
    stmt = select(OpportunityModel).options(selectinload(OpportunityModel.opportunity_plays)).filter(OpportunityModel.id == opp_id)
    result = await db.execute(stmt)
    opp = result.scalars().first()
    
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    opp.name = opp_update.name or opp.name
    opp.account_name = opp_update.account_name or opp.account_name
    opp.sales_stage = opp_update.stage or opp.sales_stage
    opp.region = opp_update.geo or opp.region
    opp.industry = opp_update.sector or opp.industry
    opp.problem_statement = opp_update.notes or opp.problem_statement
    
    # Simplistic update for other fields
    # Simplistic update for other fields
    if opp_update.tags:
        opp.tags = opp_update.tags

    if opp_update.team_member_user_ids is not None:
        opp.team_member_user_ids = opp_update.team_member_user_ids
        
    # Validating and Adding Plays (Additive only for safety)
    if opp_update.plays is not None:
        current_play_ids = {op.play_id for op in opp.opportunity_plays}
        # input plays are strings, model uses int
        new_play_ids = set(int(p_id) for p_id in opp_update.plays)
        
        to_add = new_play_ids - current_play_ids
        
        for play_id in to_add:
            play_result = await db.execute(select(GTMPlayModel).filter(GTMPlayModel.id == play_id))
            play = play_result.scalars().first()
            
            if play:
                opp_play_id = str(uuid.uuid4())
                opp_play = OpportunityPlayModel(
                    id=opp_play_id,
                    opportunity_id=opp.id,
                    play_id=play.id,
                    is_active=True
                )
                
                if play.stages:
                    for stage in play.stages:
                         stage_instance = OpportunityStageInstanceModel(
                            id=str(uuid.uuid4()),
                            opportunity_play_id=opp_play_id,
                            play_stage_key=stage['key'],
                            status="not_started",
                            checklist_item_statuses={}
                        )
                         opp_play.stage_instances.append(stage_instance)
                
                opp.opportunity_plays.append(opp_play)
        
    await db.commit()
    await db.refresh(opp)
    
    if opp.team_member_user_ids is None:
        opp.team_member_user_ids = []
    
    return opp

@router.patch("/opportunities/{opp_id}/play/{play_id}/stage/{stage_key}", response_model=OpportunityStageInstance)
async def update_opportunity_stage(
    opp_id: str, 
    play_id: str, 
    stage_key: str, 
    update_data: StageUpdate, 
    db: AsyncSession = Depends(get_db)
):
    # Find the OpportunityPlay
    # Note: play_id in URL might be the GTM Play ID (int) or the OpportunityPlay ID (uuid).
    # The UI typically knows the Play ID. Let's assume it's the GTM Play ID for now as that's what we used in the URL structure design.
    # However, an opportunity can have multiple instances of the same play? 
    # For V2, let's assume one instance of a play per opportunity for simplicity, OR we need the OpportunityPlay ID.
    # Looking at the frontend, we have `activePlayId` which is the GTM Play ID.
    # But `opportunity.opportunity_plays` has `play_id` (GTM Play ID) and `id` (OpportunityPlay ID).
    # To be safe and support multiple same-plays, we should probably use OpportunityPlay ID, but the URL says `play_id`.
    # Let's try to find the OpportunityPlay by (opp_id, play_id).
    
    stmt = select(OpportunityPlayModel).filter(
        OpportunityPlayModel.opportunity_id == opp_id,
        OpportunityPlayModel.play_id == int(play_id)
    )
    result = await db.execute(stmt)
    opp_play = result.scalars().first()
    
    if not opp_play:
        raise HTTPException(status_code=404, detail="Opportunity Play not found")
        
    # Find the Stage Instance
    # We need to load stage instances
    await db.refresh(opp_play, attribute_names=['stage_instances'])
    
    stage_instance = next((si for si in opp_play.stage_instances if si.play_stage_key == stage_key), None)
    
    if not stage_instance:
        # If it doesn't exist (maybe added to play definition later), create it?
        # For now, assume it exists as we create them on opp creation.
        raise HTTPException(status_code=404, detail="Stage Instance not found")
        
    # Update fields
    if update_data.status is not None:
        stage_instance.status = update_data.status
    if update_data.summary_note is not None:
        stage_instance.summary_note = update_data.summary_note
    if update_data.checklist_item_statuses is not None:
        # Merge or replace? Let's replace for simplicity, frontend sends full state.
        # But wait, frontend might send partial updates? 
        # Pydantic model has it as Optional. If sent, we replace.
        # Ensure we don't lose existing keys if we want merge behavior, but usually full object replace is safer for sync.
        # Actually, let's do a merge if it's a dict, to be safe? 
        # No, let's trust the frontend to send what it wants to persist.
        # However, JSON columns in SQLA sometimes need explicit reassignment to trigger change detection.
        current = dict(stage_instance.checklist_item_statuses or {})
        current.update(update_data.checklist_item_statuses)
        stage_instance.checklist_item_statuses = current
        
    if update_data.custom_checklist_items is not None:
        stage_instance.custom_checklist_items = update_data.custom_checklist_items
        
    if update_data.start_date is not None:
        stage_instance.start_date = update_data.start_date
    if update_data.target_date is not None:
        stage_instance.target_date = update_data.target_date
    if update_data.completed_date is not None:
        stage_instance.completed_date = update_data.completed_date
        
    await db.commit()
    await db.refresh(stage_instance)
    
    return stage_instance
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

        stages=[s.dict() for s in play.stages] if play.stages else _populate_stages_from_scope(play.stage_scope),
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
    
    # Re-fetch with eager loading
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(GTMPlayModel)
        .options(
            selectinload(GTMPlayModel.technologies),
            selectinload(GTMPlayModel.tags)
        )
        .filter(GTMPlayModel.id == db_play.id)
    )
    db_play = result.scalars().first()
    
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
        
    # Ensure offerings collection is loaded
    await db.refresh(tech_obj, attribute_names=['offerings'])
    
    if action == "add":
        if off_obj not in tech_obj.offerings:
            tech_obj.offerings.append(off_obj)
    elif action == "remove":
        if off_obj in tech_obj.offerings:
            tech_obj.offerings.remove(off_obj)
            
    await db.commit()
    return {"status": "success", "message": f"{action}ed {offering} to/from {technology}"}

# --- Constants ---

DEFAULT_STAGES = [
    {
        "key": "Discovery",
        "label": "Discovery",
        "objective": "Understand the client's current landscape and business drivers.",
        "guidance": "Focus on open-ended questions. Identify the key stakeholders and the budget holder. Don't pitch solution yet.",
        "checklist_items": ["Identify Executive Sponsor", "Map current technical landscape", "Define success criteria"]
    },
    {
        "key": "Qualification",
        "label": "Qualification",
        "objective": "Confirm budget, authority, need, and timeline (BANT).",
        "guidance": "Use the TCO calculator to establish a baseline. Ensure technical fit.",
        "checklist_items": ["Verify budget allocation", "Confirm technical feasibility", "Sign NDA"]
    },
    {
        "key": "Solutioning",
        "label": "Solutioning",
        "objective": "Design the technical architecture and migration plan.",
        "guidance": "Collaborate with the client's architects. Use the standard Reference Architectures.",
        "checklist_items": ["Draft HLD", "Review with Practice Lead", "Present initial solution"]
    },
    {
        "key": "Validation",
        "label": "Validation",
        "objective": "Prove the solution works via POC or deep dive.",
        "guidance": "Keep scope small and time-boxed.",
        "checklist_items": ["Execute POC", "Sign off on success criteria"]
    },
    {
        "key": "Closing",
        "label": "Closing",
        "objective": "Finalize commercial and legal terms.",
        "guidance": "Ensure all stakeholders are aligned. Review SOW details.",
        "checklist_items": ["Finalize commercial proposal", "Legal review", "Sign contract"]
    },
    {
        "key": "Delivery",
        "label": "Delivery",
        "objective": "Handover to delivery team for implementation.",
        "guidance": "Ensure all documentation is up to date in the repository.",
        "checklist_items": ["Conduct handover workshop", "Finalize SOW"]
    }
]

def _populate_stages_from_scope(stage_scope: List[str], existing_stages: List[Dict] = None) -> List[Dict]:
    """Helper to populate detailed stage definitions from a list of stage keys."""
    if existing_stages and len(existing_stages) > 0:
        return existing_stages
        
    if not stage_scope:
        return []
        
    result_stages = []
    # Filter DEFAULT_STAGES based on scope match
    for default in DEFAULT_STAGES:
        if default["key"] in stage_scope:
            result_stages.append(default)
            
    # If a scope item is not in defaults, create a generic one
    existing_keys = [s["key"] for s in result_stages]
    for scope_item in stage_scope:
        if scope_item not in existing_keys:
            result_stages.append({
                "key": scope_item,
                "label": scope_item,
                "objective": f"Complete the {scope_item} stage.",
                "guidance": "No specific guidance available.",
                "checklist_items": ["Complete key deliverables"]
            })
            
    # Sort according to stage_scope order? Or keep default order?
    # Let's sort by stage_scope order to respect user selection order if possible, 
    # but stage_scope usually comes from multiselect which might be arbitrary. 
    # Let's trust DEFAULT_STAGES order for standard ones, and append others.
    return result_stages



# --- Import ---

@router.post("/admin/import/{type}")
async def import_dictionary_items(
    type: str, 
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db)
):
    import json
    import yaml
    import csv
    import io

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
    
    content = await file.read()
    filename = file.filename.lower()
    
    items_to_add = []
    
    try:
        if filename.endswith('.json'):
            data = json.loads(content)
            if isinstance(data, list):
                items_to_add = data
            elif isinstance(data, dict) and 'items' in data:
                items_to_add = data['items']
            else:
                raise ValueError("JSON must be a list or object with 'items' key")
                
        elif filename.endswith(('.yaml', '.yml')):
            data = yaml.safe_load(content)
            if isinstance(data, list):
                items_to_add = data
            elif isinstance(data, dict) and 'items' in data:
                items_to_add = data['items']
            else:
                raise ValueError("YAML must be a list or object with 'items' key")
                
        elif filename.endswith('.csv'):
            # Decode bytes to string
            text_content = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(text_content))
            for row in csv_reader:
                # Expect 'value' column, optional 'category'
                if 'value' in row:
                    item = {'value': row['value']}
                    if 'category' in row:
                        item['category'] = row['category']
                    items_to_add.append(item)
                elif 'name' in row: # Allow 'name' as alias for 'value'
                    item = {'value': row['name']}
                    if 'category' in row:
                        item['category'] = row['category']
                    items_to_add.append(item)
                    
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use JSON, YAML, or CSV.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    # Process items
    added_count = 0
    errors = []
    
    for item in items_to_add:
        # Normalize item structure
        if isinstance(item, str):
            value = item
            category = None
        elif isinstance(item, dict):
            value = item.get('value') or item.get('name')
            category = item.get('category')
        else:
            continue
            
        if not value:
            continue
            
        # Check existence
        existing = await db.execute(select(Model).filter(Model.name == value))
        if existing.scalars().first():
            continue # Skip duplicates
            
        try:
            if type == "technologies" and category:
                new_option = Model(name=value, category=category)
            else:
                new_option = Model(name=value)
            
            db.add(new_option)
            added_count += 1
        except Exception as e:
            errors.append(f"Failed to add {value}: {str(e)}")
            
    await db.commit()
    
    return {
        "status": "success", 
        "added": added_count, 
        "total_processed": len(items_to_add),
        "errors": errors
    }
