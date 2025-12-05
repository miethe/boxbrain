import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from boxbrain.backend.main import app
from boxbrain.backend.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from boxbrain.backend.models_db import GTMPlayModel, OpportunityModel

@pytest.mark.asyncio
async def test_create_opportunity_with_plays():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Create a Play first
        play_payload = {
            "title": "Test Play for Opp",
            "summary": "A test play",
            "offering": "Cloud",
            "technologies": [],
            "stage_scope": ["Discovery"],
            "stages": [{"key": "s1", "label": "Stage 1", "objective": "Obj", "guidance": "Guide", "checklist_items": []}],
            "sector": "Tech",
            "geo": "US",
            "tags": [],
            "owners": []
        }
        response = await ac.post("/api/v2/plays", json=play_payload)
        assert response.status_code == 200
        play_id = response.json()["id"]

        # 2. Create Opportunity with this Play
        opp_payload = {
            "sector": "Tech",
            "offering": "Cloud",
            "stage": "Discovery",
            "technologies": [],
            "geo": "US",
            "tags": [],
            "notes": "Test notes",
            "account_name": "Test Account Corp",
            "name": "Cloud Deal for Test Account",
            "plays": [play_id]
        }
        
        response = await ac.post("/api/v2/opportunities", json=opp_payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["account_name"] == "Test Account Corp"
        assert data["name"] == "Cloud Deal for Test Account"
        assert len(data["opportunity_plays"]) == 1
        assert data["opportunity_plays"][0]["play_id"] == int(play_id)
        assert data["opportunity_plays"][0]["stage_instances"][0]["play_stage_key"] == "s1"

        print("\nSuccessfully verified Opportunity creation with Play attachment!")
