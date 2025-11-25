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

# Singleton instance
# Base path is relative to the project root, assuming running from there or configured correctly.
# We'll use the same path as main.py: "assets"
storage = LocalFileSystemStorage(base_path="assets")
