from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from ..models import Asset, AssetMetadata, InboxItem, Facets, FacetItem
import uuid
from datetime import datetime
from .endpoints import assets, gtm_plays, metadata, settings

router = APIRouter()
router.include_router(assets.router, prefix="/assets", tags=["assets"])
router.include_router(gtm_plays.router, prefix="/plays", tags=["plays"])
router.include_router(metadata.router, prefix="/metadata", tags=["metadata"])
router.include_router(settings.router, prefix="/settings", tags=["settings"])

# In-memory storage for MVP
ASSETS: List[AssetMetadata] = []
INBOX: List[InboxItem] = []

# Seed some data
def seed_data():
    if not ASSETS:
        ASSETS.append(AssetMetadata(
            id="1",
            title="OpenShift Virtualization Architecture",
            type="play",
            category="technical",
            summary="Reference architecture for deploying VMs on OpenShift.",
            author="Jane Doe",
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            last_verified=datetime.now().isoformat(),
            confidentiality="internal-only",
            owners=["jane.doe@example.com"],
            tags=["openshift", "virtualization", "kubernetes"],
            related_technologies=["OpenShift", "KubeVirt"],
            region="NA",
            stage="GA"
        ))

seed_data()

# Legacy in-memory assets endpoints removed in favor of /api/assets router
# See endpoints/assets.py

@router.get("/facets", response_model=Facets)
async def get_facets():
    # Mock implementation
    return Facets(
        offering=[FacetItem(value="OpenShift", count=10)],
        related_technologies=[FacetItem(value="Kubernetes", count=5)],
        tags=[FacetItem(value="cloud", count=8)]
    )

@router.get("/inbox", response_model=List[InboxItem])
async def get_inbox():
    return INBOX

@router.post("/extract")
async def extract_metadata(file: UploadFile = File(...)):
    # Mock extraction
    return {
        "title": file.filename,
        "summary": "Extracted summary from " + file.filename,
        "type": "template",
        "category": "technical"
    }
