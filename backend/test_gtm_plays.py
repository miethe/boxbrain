import asyncio
import os
import shutil
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.models_db import GTMPlayModel, AssetGTMPlayAssociation, AssetModel, AssetMetadataModel
from backend.services import asset_manager
from fastapi import UploadFile
import uuid

# Setup test DB
TEST_DB_URL = "sqlite+aiosqlite:///./test_gtm.db"
engine = create_async_engine(TEST_DB_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

async def test_gtm_plays():
    await init_db()
    
    async with AsyncSessionLocal() as db:
        print("1. Creating GTM Play...")
        play = GTMPlayModel(
            title="Cloud Migration",
            description="Move to the cloud",
            offering="Cloud",
            industry="X-SECTOR",
            region="GLOBAL"
        )
        db.add(play)
        await db.commit()
        await db.refresh(play)
        play_id = play.id
        print(f"   Created Play ID: {play_id}")
        
        print("2. Creating Asset...")
        asset_id = str(uuid.uuid4())
        # Mock file creation
        with open("test_asset.txt", "w") as f:
            f.write("test content")
            
        # Manually create asset entry since we can't easily mock UploadFile fully here without fastapi context
        # But we can use the models directly
        asset = AssetModel(
            id=asset_id,
            original_filename="test_asset.txt",
            file_path=f"test_asset_{asset_id}.txt",
            mime_type="text/plain",
            size_bytes=12
        )
        metadata = AssetMetadataModel(
            asset_id=asset_id,
            title="Migration Guide",
            type="play",
            category="technical",
            confidentiality="internal-only",
            summary="How to migrate"
        )
        asset.metadata_entry = metadata
        db.add(asset)
        await db.commit()
        print(f"   Created Asset ID: {asset_id}")
        
        print("3. Associating Asset to Play...")
        assoc = AssetGTMPlayAssociation(
            asset_id=asset_id,
            play_id=play_id,
            phase="Decision"
        )
        db.add(assoc)
        await db.commit()
        print("   Association created.")
        
        print("4. Verifying Association...")
        # Re-fetch play with associations
        from sqlalchemy.future import select
        from sqlalchemy.orm import selectinload
        
        result = await db.execute(
            select(GTMPlayModel)
            .options(selectinload(GTMPlayModel.asset_associations).selectinload(AssetGTMPlayAssociation.asset).selectinload(AssetModel.metadata_entry))
            .where(GTMPlayModel.id == play_id)
        )
        play_fetched = result.scalars().first()
        
        assert len(play_fetched.asset_associations) == 1
        assert play_fetched.asset_associations[0].asset_id == asset_id
        assert play_fetched.asset_associations[0].phase == "Decision"
        assert play_fetched.asset_associations[0].asset.metadata_entry.title == "Migration Guide"
        print("   Association verified successfully.")
        
        print("5. Testing Fuzzy Match Logic...")
        # Simulate match logic
        offering_filter = ["Cloud"]
        
        # Simple match check
        play_offerings = [o.strip().lower() for o in play_fetched.offering.split(',')]
        match = False
        for off in offering_filter:
            if any(off.lower() in po for po in play_offerings):
                match = True
                break
        
        assert match == True
        print("   Fuzzy match logic verified.")

    # Cleanup
    if os.path.exists("test_asset.txt"):
        os.remove("test_asset.txt")
    if os.path.exists("test_gtm.db"):
        os.remove("test_gtm.db")

if __name__ == "__main__":
    asyncio.run(test_gtm_plays())
