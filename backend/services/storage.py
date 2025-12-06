import abc
import os
import shutil
from pathlib import Path
from fastapi import UploadFile

class StorageProvider(abc.ABC):
    @abc.abstractmethod
    async def save(self, file: UploadFile, directory: str) -> str:
        """Save a file and return its relative path or identifier."""
        pass

    @abc.abstractmethod
    def get_url(self, path: str) -> str:
        """Get the access URL for a file."""
        pass

    @abc.abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file."""
        pass

class LocalFileSystemStorage(StorageProvider):
    def __init__(self, base_path: str, base_url: str = "/assets"):
        self.base_path = Path(base_path)
        self.base_url = base_url
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, directory: str = "") -> str:
        # Create target directory if it doesn't exist
        target_dir = self.base_path / directory
        target_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate a safe filename (you might want to use UUIDs here in production)
        # For now, we'll stick to the original filename but ensure it's unique-ish or just overwrite
        # Ideally, the caller handles naming. Let's assume the caller might want to organize by ID.
        
        file_path = target_dir / file.filename
        
        # Save the file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return path relative to base_path
        return str(file_path.relative_to(self.base_path))

    def get_url(self, path: str) -> str:
        # Ensure path doesn't start with / to avoid double slashes if base_url ends with /
        clean_path = path.lstrip("/")
        return f"{self.base_url}/{clean_path}"

    def delete(self, path: str) -> bool:
        full_path = self.base_path / path
        if full_path.exists():
            os.remove(full_path)
            return True
        return False


from .s3_storage import S3StorageProvider

class DelegatingStorageProvider(StorageProvider):
    def __init__(self, local_storage: LocalFileSystemStorage):
        self._local_storage = local_storage
        self._s3_provider: dict[str, S3StorageProvider] = {} # Cache S3 provider
        self._active_provider_type = "local" # Default
        self._s3_config = {}

    def configure(self, provider_type: str, s3_config: dict = None):
        self._active_provider_type = provider_type
        if s3_config:
            self._s3_config = s3_config
            # Re-init S3 provider with new config
            self._s3_provider = {}

    def _get_provider(self) -> StorageProvider:
        if self._active_provider_type == "s3":
            # Lazy init S3
            if not self._s3_provider:
                self._s3_provider = S3StorageProvider(
                    bucket_name=self._s3_config.get("bucket"),
                    region_name=self._s3_config.get("region"),
                    aws_access_key_id=self._s3_config.get("access_key"),
                    aws_secret_access_key=self._s3_config.get("secret_key")
                )
            return self._s3_provider
        return self._local_storage

    async def save(self, file: UploadFile, directory: str) -> str:
        return await self._get_provider().save(file, directory)

    def get_url(self, path: str) -> str:
        # Check if path looks like S3 url? Or just delegate?
        # If we switched providers, old assets might still be local.
        # Ideally we store the provider type in the asset metadata too, but for now let's try to infer or just delegate.
        # If the path doesn't start with assets/ it might be S3? 
        # Actually LocalFileSystemStorage returns "assets/..."
        # S3 returned just the key.
        return self._get_provider().get_url(path)

    def delete(self, path: str) -> bool:
        return self._get_provider().delete(path)

# Singleton instance
# Base path is relative to the project root, assuming running from there or configured correctly.
# We'll use the same path as main.py: "assets"
local_storage_instance = LocalFileSystemStorage(base_path="assets")
storage = DelegatingStorageProvider(local_storage_instance)
