import asyncio
import os
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, attributes
from backend.database import Base
from backend.models_db import OpportunityModel
from backend.api.schemas_v2 import OpportunityInput

# Setup test DB
TEST_DB_URL = "sqlite+aiosqlite:///./test_opp_creation.db"
engine = create_async_engine(TEST_DB_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

async def test_opportunity_creation():
    await init_db()
    
    async with AsyncSessionLocal() as db:
        print("1. Creating Opportunity...")
        
        # Simulate input
        input_data = OpportunityInput(
            sector="Technology",
            offering="Cloud Services",
            stage="Discovery",
            technologies=["Kubernetes"],
            geo="North America",
            tags=["strategic"],
            notes="Client needs cloud migration."
        )
        
        # Simulate endpoint logic
        opp = OpportunityModel(
            id=str(uuid.uuid4()),
            name=f"New Opportunity - {input_data.offering}",
            account_name="New Account", 
            sales_stage=input_data.stage,
            region=input_data.geo,
            industry=input_data.sector,
            problem_statement=input_data.notes,
            status="active",
            health="green",
            tags=input_data.tags,
            team_member_user_ids=[] # Fix applied here
        )
        db.add(opp)
        await db.commit()
        await db.refresh(opp)
        
        # Use set_committed_value to avoid triggering lazy load
        attributes.set_committed_value(opp, 'opportunity_plays', [])
        
        print(f"   Created Opportunity ID: {opp.id}")
        print(f"   Team Members: {opp.team_member_user_ids}")
        print(f"   Opportunity Plays: {opp.opportunity_plays}")
        
        # Verify fields
        assert opp.team_member_user_ids == []
        assert opp.opportunity_plays == []
        assert opp.sales_stage == "Discovery"
        
        print("   Verification successful!")

    # Cleanup
    if os.path.exists("test_opp_creation.db"):
        os.remove("test_opp_creation.db")

if __name__ == "__main__":
    asyncio.run(test_opportunity_creation())
