from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ...database import get_db
from ...models_db import OfferingModel, TechnologyModel, SectorModel, GeoModel, StageModel, AssetCollectionModel

router = APIRouter()

# Pydantic Models
class MetadataItemCreate(BaseModel):
    name: str

class MetadataItem(BaseModel):
    id: int
    name: str
    class Config:
        orm_mode = True

class TechnologyCreate(BaseModel):
    name: str
    offering_ids: Optional[List[int]] = []

class TechnologyItem(BaseModel):
    id: int
    name: str
    offerings: List[MetadataItem] = []
    class Config:
        orm_mode = True

class OfferingWithTechs(MetadataItem):
    technologies: List[TechnologyItem] = []

# Generic CRUD helper
def get_all(db: Session, model):
    return db.query(model).all()

def create_item(db: Session, model, name: str):
    item = model(name=name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def delete_item(db: Session, model, item_id: int):
    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# --- Offerings ---
@router.get("/offerings", response_model=List[OfferingWithTechs])
def get_offerings(db: Session = Depends(get_db)):
    return get_all(db, OfferingModel)

@router.post("/offerings", response_model=MetadataItem)
def create_offering(item: MetadataItemCreate, db: Session = Depends(get_db)):
    return create_item(db, OfferingModel, item.name)

@router.delete("/offerings/{id}")
def delete_offering(id: int, db: Session = Depends(get_db)):
    return delete_item(db, OfferingModel, id)

# --- Technologies ---
@router.get("/technologies", response_model=List[TechnologyItem])
def get_technologies(offering_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(TechnologyModel)
    if offering_id:
        query = query.filter(TechnologyModel.offerings.any(id=offering_id))
    return query.all()

@router.post("/technologies", response_model=TechnologyItem)
def create_technology(item: TechnologyCreate, db: Session = Depends(get_db)):
    tech = TechnologyModel(name=item.name)
    if item.offering_ids:
        offerings = db.query(OfferingModel).filter(OfferingModel.id.in_(item.offering_ids)).all()
        tech.offerings = offerings
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return tech

class TechnologyUpdate(BaseModel):
    name: Optional[str] = None
    offering_ids: Optional[List[int]] = None

@router.put("/technologies/{id}", response_model=TechnologyItem)
def update_technology(id: int, item: TechnologyUpdate, db: Session = Depends(get_db)):
    tech = db.query(TechnologyModel).filter(TechnologyModel.id == id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technology not found")
    
    if item.name:
        tech.name = item.name
    
    if item.offering_ids is not None:
        offerings = db.query(OfferingModel).filter(OfferingModel.id.in_(item.offering_ids)).all()
        tech.offerings = offerings
        
    db.commit()
    db.refresh(tech)
    return tech

@router.delete("/technologies/{id}")
def delete_technology(id: int, db: Session = Depends(get_db)):
    return delete_item(db, TechnologyModel, id)

# --- Sectors ---
@router.get("/sectors", response_model=List[MetadataItem])
def get_sectors(db: Session = Depends(get_db)):
    return get_all(db, SectorModel)

@router.post("/sectors", response_model=MetadataItem)
def create_sector(item: MetadataItemCreate, db: Session = Depends(get_db)):
    return create_item(db, SectorModel, item.name)

@router.delete("/sectors/{id}")
def delete_sector(id: int, db: Session = Depends(get_db)):
    return delete_item(db, SectorModel, id)

# --- Geos ---
@router.get("/geos", response_model=List[MetadataItem])
def get_geos(db: Session = Depends(get_db)):
    return get_all(db, GeoModel)

@router.post("/geos", response_model=MetadataItem)
def create_geo(item: MetadataItemCreate, db: Session = Depends(get_db)):
    return create_item(db, GeoModel, item.name)

@router.delete("/geos/{id}")
def delete_geo(id: int, db: Session = Depends(get_db)):
    return delete_item(db, GeoModel, id)

# --- Stages ---
@router.get("/stages", response_model=List[MetadataItem])
def get_stages(db: Session = Depends(get_db)):
    return get_all(db, StageModel)

@router.post("/stages", response_model=MetadataItem)
def create_stage(item: MetadataItemCreate, db: Session = Depends(get_db)):
    return create_item(db, StageModel, item.name)

@router.delete("/stages/{id}")
def delete_stage(id: int, db: Session = Depends(get_db)):
    return delete_item(db, StageModel, id)

# --- Asset Collections ---
@router.get("/collections", response_model=List[MetadataItem])
def get_collections(db: Session = Depends(get_db)):
    return get_all(db, AssetCollectionModel)

@router.post("/collections", response_model=MetadataItem)
def create_collection(item: MetadataItemCreate, db: Session = Depends(get_db)):
    return create_item(db, AssetCollectionModel, item.name)
