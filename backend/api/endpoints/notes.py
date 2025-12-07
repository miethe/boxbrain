from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
import uuid

from ...database import get_db
from ...models_db import StageNoteModel, OpportunityStageInstanceModel
from ..schemas_v2 import StageNote, StageNoteCreate

router = APIRouter()

@router.get("/{stage_instance_id}", response_model=List[StageNote])
async def get_notes(stage_instance_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StageNoteModel).where(StageNoteModel.stage_instance_id == stage_instance_id).order_by(StageNoteModel.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=StageNote)
async def create_note(note: StageNoteCreate, db: AsyncSession = Depends(get_db)):
    # Verify stage instance exists
    result = await db.execute(select(OpportunityStageInstanceModel).where(OpportunityStageInstanceModel.id == note.stage_instance_id))
    instance = result.scalars().first()
    if not instance:
        raise HTTPException(status_code=404, detail="Stage instance not found")

    new_note = StageNoteModel(
        stage_instance_id=note.stage_instance_id,
        content=note.content,
        is_private=note.is_private,
        author_id=note.author_id
    )
    db.add(new_note)
    # We commit in the main loop wrapper usually, but here we do it explicitly to get ID
    await db.commit()
    await db.refresh(new_note)
    return new_note

@router.delete("/{note_id}")
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StageNoteModel).where(StageNoteModel.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    await db.delete(note)
    await db.commit()
    return {"status": "ok"}

@router.put("/{note_id}", response_model=StageNote)
async def update_note(
    note_id: str, 
    content: str = Body(..., embed=True), 
    is_private: bool = Body(..., embed=True), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(StageNoteModel).where(StageNoteModel.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    note.content = content
    note.is_private = is_private
    await db.commit()
    await db.refresh(note)
    return note
