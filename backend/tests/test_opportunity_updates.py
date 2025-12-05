import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from boxbrain.backend.models_db import OpportunityModel, GTMPlayModel, OpportunityPlayModel, OpportunityStageInstanceModel
import uuid
from datetime import datetime

@pytest.mark.asyncio
async def test_update_opportunity_stage(async_client: AsyncClient, db_session: AsyncSession):
    # 1. Setup Data
    # Create a Play
    play = GTMPlayModel(
        title="Test Play",
        stages=[
            {"key": "stage1", "label": "Stage 1", "checklist_items": ["Item 1"]}
        ]
    )
    db_session.add(play)
    await db_session.commit()
    await db_session.refresh(play)

    # Create Opportunity
    opp_id = str(uuid.uuid4())
    opp = OpportunityModel(
        id=opp_id,
        name="Test Opp",
        account_name="Test Account",
        status="active",
        health="green"
    )
    db_session.add(opp)
    
    # Create OpportunityPlay
    opp_play_id = str(uuid.uuid4())
    opp_play = OpportunityPlayModel(
        id=opp_play_id,
        opportunity_id=opp_id,
        play_id=play.id,
        is_active=True
    )
    db_session.add(opp_play)
    
    # Create Stage Instance
    stage_instance = OpportunityStageInstanceModel(
        id=str(uuid.uuid4()),
        opportunity_play_id=opp_play_id,
        play_stage_key="stage1",
        status="not_started",
        checklist_item_statuses={}
    )
    db_session.add(stage_instance)
    await db_session.commit()

    # 2. Test Update Status
    update_payload = {
        "status": "in_progress",
        "summary_note": "Working on it",
        "checklist_item_statuses": {"Item 1": "done"}
    }
    
    response = await async_client.patch(
        f"/api/v2/opportunities/{opp_id}/play/{play.id}/stage/stage1",
        json=update_payload
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"
    assert data["summary_note"] == "Working on it"
    assert data["checklist_item_statuses"]["Item 1"] == "done"

    # 3. Verify Persistence
    await db_session.refresh(stage_instance)
    assert stage_instance.status == "in_progress"
    assert stage_instance.summary_note == "Working on it"
    assert stage_instance.checklist_item_statuses["Item 1"] == "done"
