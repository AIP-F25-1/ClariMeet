"""
Storage handler for saving whiteboard snapshots and metadata.
"""
import json
import os
from pathlib import Path
from typing import Optional
from PIL import Image
import io


class StorageHandler:
    """Handles file storage operations for whiteboard snapshots."""
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize storage handler.
        
        Args:
            base_path: Base storage path. If None, uses CLARIMEET_STORAGE env var.
        """
        if base_path is None:
            base_path = os.getenv("CLARIMEET_STORAGE", "storage")
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def get_whiteboard_path(self, org_id: str, meeting_id: str) -> Path:
        """
        Get the storage path for a specific meeting's whiteboard.
        
        Args:
            org_id: Organization ID
            meeting_id: Meeting ID
            
        Returns:
            Path to whiteboard directory
        """
        path = self.base_path / org_id / meeting_id / "whiteboard"
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def save_snapshot(self, org_id: str, meeting_id: str, frame_number: int, 
                     image: Image.Image, metadata: dict) -> tuple[str, str]:
        """
        Save a snapshot image and its metadata JSON.
        
        Args:
            org_id: Organization ID
            meeting_id: Meeting ID
            frame_number: Frame number for filename
            image: PIL Image to save
            metadata: Metadata dictionary to save as JSON
            
        Returns:
            Tuple of (image_path, json_path) relative to base_path
        """
        whiteboard_path = self.get_whiteboard_path(org_id, meeting_id)
        
        # Save image
        image_filename = f"frame_{frame_number}.png"
        image_path = whiteboard_path / image_filename
        image.save(image_path, "PNG")
        
        # Save metadata JSON
        json_filename = f"frame_{frame_number}.json"
        json_path = whiteboard_path / json_filename
        with open(json_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Return relative paths
        rel_image_path = str(image_path.relative_to(self.base_path))
        rel_json_path = str(json_path.relative_to(self.base_path))
        
        return rel_image_path, rel_json_path
    
    def list_snapshots(self, org_id: str, meeting_id: str) -> list[dict]:
        """
        List all snapshots for a meeting.
        
        Args:
            org_id: Organization ID
            meeting_id: Meeting ID
            
        Returns:
            List of snapshot metadata dictionaries
        """
        whiteboard_path = self.get_whiteboard_path(org_id, meeting_id)
        
        snapshots = []
        if not whiteboard_path.exists():
            return snapshots
        
        # Find all JSON files and load their metadata
        for json_file in sorted(whiteboard_path.glob("frame_*.json")):
            try:
                with open(json_file, 'r') as f:
                    metadata = json.load(f)
                    # Backfill image_path if missing (older snapshots)
                    if "image_path" not in metadata:
                        png_path = json_file.with_suffix('.png')
                        if png_path.exists():
                            rel_image_path = str(png_path.relative_to(self.base_path))
                            metadata["image_path"] = rel_image_path
                    snapshots.append(metadata)
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
        
        return snapshots
    
    def load_image_from_bytes(self, image_bytes: bytes) -> Image.Image:
        """
        Load PIL Image from bytes.
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            PIL Image object
        """
        return Image.open(io.BytesIO(image_bytes))

