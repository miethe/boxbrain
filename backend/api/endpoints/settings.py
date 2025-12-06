from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from pydantic import BaseModel
from ...database import get_db
from ...models_db import SystemSettingsModel
from ...services.storage import storage

router = APIRouter()

class SettingItem(BaseModel):
    key: str
    value: str
    description: str = None

class SettingsUpdate(BaseModel):
    settings: Dict[str, str]

@router.get("/", response_model=List[SettingItem])
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSettingsModel))
    settings = result.scalars().all()
    return settings

@router.post("/", response_model=Dict[str, str])
async def update_settings(update: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    # Update DB
    for key, value in update.settings.items():
        # Check if exists
        result = await db.execute(select(SystemSettingsModel).where(SystemSettingsModel.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = value
        else:
            setting = SystemSettingsModel(key=key, value=value)
            db.add(setting)
    
    await db.commit()

    # Apply configuration to storage immediately (Runtime update)
    # Fetch all relevant settings
    # We might need to refresh them to be sure
    # In a real app we might have a dedicated service for this "Applying Config" logic
    
    # Construct config dict
    s3_config = {
        "bucket": update.settings.get("storage_s3_bucket"),
        "region": update.settings.get("storage_s3_region"),
        "access_key": update.settings.get("storage_s3_access_key"),
        "secret_key": update.settings.get("storage_s3_secret_key")
    }
    
    provider_type = update.settings.get("storage_provider", "local")
    
    storage.configure(provider_type, s3_config)

    return {"status": "success", "message": "Settings updated"}

# Initialize storage on startup? 
# We need a way to load settings when app starts. 
# This might be done in main.py lifespan or here if we want to be hacky, 
# but endpoints are not the right place for startup logic.
# For now, it defaults to local, and will be updated when settings are saved.
# Note: If server restarts, it reverts to local until someone hits save? 
# That's a bug. We should load on startup. 
# For MVP, let's add a startup event in main.py or just a simple check function.

class S3Config(BaseModel):
    bucket: str
    region: str
    access_key: str
    secret_key: str

@router.post("/verify-s3")
async def verify_s3_connection(config: S3Config):
    import boto3
    from botocore.exceptions import ClientError

    try:
        s3 = boto3.client(
            's3',
            region_name=config.region,
            aws_access_key_id=config.access_key,
            aws_secret_access_key=config.secret_key
        )
        # Check if bucket exists and is accessible
        s3.head_bucket(Bucket=config.bucket)
        return {"status": "success", "message": "Connection successful"}
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_msg = e.response['Error']['Message']
        if error_code == '403':
            raise HTTPException(status_code=403, detail=f"Access denied to bucket '{config.bucket}'. Check credentials.")
        elif error_code == '404':
            raise HTTPException(status_code=404, detail=f"Bucket '{config.bucket}' not found.")
        else:
             raise HTTPException(status_code=400, detail=f"S3 Connection Failed: {error_msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")
