"""
Frame change detection using SSIM and absolute difference.
"""
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from PIL import Image
from typing import Optional, Tuple


class FrameChangeDetector:
    """Detects visual changes between consecutive frames."""
    
    def __init__(self, threshold: float = 0.12, method: str = "ssim"):
        """
        Initialize frame change detector.
        
        Args:
            threshold: Change threshold (0.0-1.0). Lower values = more sensitive.
            method: Detection method ("ssim" or "absdiff")
        """
        self.threshold = threshold
        self.method = method
        self.previous_frame: Optional[np.ndarray] = None
    
    def detect_change(self, current_frame: np.ndarray) -> Tuple[bool, float]:
        """
        Detect if current frame has significant changes from previous frame.
        
        Args:
            current_frame: Current frame as numpy array (grayscale)
            
        Returns:
            Tuple of (has_change, change_score)
        """
        if self.previous_frame is None:
            # First frame - always consider it as changed
            self.previous_frame = current_frame.copy()
            return True, 1.0
        
        if self.method == "ssim":
            similarity = self._compute_ssim(self.previous_frame, current_frame)
            # SSIM returns similarity (1.0 = identical, 0.0 = completely different)
            # Convert to difference for consistency
            change_score = 1.0 - similarity
            # We want to detect changes, so we check if difference is above threshold
            has_change = change_score >= self.threshold
        else:  # absdiff
            change_score = self._compute_absdiff(self.previous_frame, current_frame)
            # absdiff returns difference (higher = more different)
            has_change = change_score >= self.threshold
        
        if has_change:
            self.previous_frame = current_frame.copy()
        
        return has_change, change_score
    
    def _compute_ssim(self, frame1: np.ndarray, frame2: np.ndarray) -> float:
        """
        Compute SSIM (Structural Similarity Index) between two frames.
        
        Args:
            frame1: First frame
            frame2: Second frame
            
        Returns:
            SSIM score (0.0-1.0, higher = more similar)
        """
        # Ensure frames have same shape
        if frame1.shape != frame2.shape:
            # Resize frame2 to match frame1
            frame2 = cv2.resize(frame2, (frame1.shape[1], frame1.shape[0]))
        
        # Compute SSIM
        score = ssim(frame1, frame2, data_range=255)
        return float(score)
    
    def _compute_absdiff(self, frame1: np.ndarray, frame2: np.ndarray) -> float:
        """
        Compute absolute difference between two frames.
        
        Args:
            frame1: First frame
            frame2: Second frame
            
        Returns:
            Normalized difference score (0.0-1.0, higher = more different)
        """
        # Ensure frames have same shape
        if frame1.shape != frame2.shape:
            frame2 = cv2.resize(frame2, (frame1.shape[1], frame1.shape[0]))
        
        # Compute absolute difference
        diff = cv2.absdiff(frame1, frame2)
        # Normalize to 0-1 range
        normalized_diff = np.sum(diff) / (frame1.shape[0] * frame1.shape[1] * 255.0)
        return float(normalized_diff)
    
    def reset(self):
        """Reset the detector (clear previous frame)."""
        self.previous_frame = None
    
    def image_to_grayscale(self, image: Image.Image) -> np.ndarray:
        """
        Convert PIL Image to grayscale numpy array.
        
        Args:
            image: PIL Image
            
        Returns:
            Grayscale numpy array
        """
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Convert to grayscale
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        return gray

