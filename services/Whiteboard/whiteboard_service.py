"""
Enhanced Whiteboard Service

This service integrates change detection, OCR processing, and whiteboard
summary generation. It processes both whiteboard frames and screenshots,
identifies key frames, and generates summaries for meeting reports.
"""

from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Optional
import logging
import json
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from services.whiteboard.change_detection import detect_key_frames_for_meeting, FrameChangeInfo
from services.whiteboard.ocr_service import get_ocr_service
from workers.queues import enqueue_ocr_job

log = logging.getLogger("clarimeet.whiteboard.service")


def process_whiteboard_for_meeting(
    meeting_dir: Path,
    org_id: str = "demo",
    meeting_id: Optional[str] = None,
    process_screenshots: bool = True,
    process_whiteboard_frames: bool = True,
    use_change_detection: bool = True,
    enqueue_for_async: bool = True
) -> Dict:
    """
    Process whiteboard content for a meeting.
    
    This function:
    1. Detects key frames using change detection (if enabled)
    2. Enqueues OCR jobs for key frames (if async processing enabled)
    3. Or processes OCR synchronously (if async disabled)
    4. Returns summary of processing
    
    Args:
        meeting_dir: Meeting directory path
        org_id: Organization ID
        meeting_id: Meeting ID (if None, inferred from meeting_dir)
        process_screenshots: Whether to process screenshots directory
        process_whiteboard_frames: Whether to process whiteboard/frames directory
        use_change_detection: Whether to use change detection to select key frames
        enqueue_for_async: If True, enqueue jobs for async processing. If False, process synchronously.
    
    Returns:
        Dictionary with processing results
    """
    if meeting_id is None:
        meeting_id = meeting_dir.name
    
    results = {
        "meeting_id": meeting_id,
        "org_id": org_id,
        "screenshots_processed": 0,
        "whiteboard_frames_processed": 0,
        "key_frames_detected": 0,
        "ocr_jobs_enqueued": 0,
        "errors": []
    }
    
    # Process screenshots
    if process_screenshots:
        try:
            screenshots_dir = meeting_dir / "screenshots"
            if screenshots_dir.exists():
                log.info(f"Processing screenshots for meeting: {meeting_id}")
                
                if use_change_detection:
                    # Detect key frames
                    frame_info = detect_key_frames_for_meeting(meeting_dir, source_type="screenshots")
                    key_frames = [f for f in frame_info if f.is_key_frame]
                    results["key_frames_detected"] += len(key_frames)
                    results["screenshots_processed"] = len(frame_info)
                    
                    # Process key frames
                    for frame_info_item in key_frames:
                        if enqueue_for_async:
                            # Enqueue for async processing
                            success = enqueue_ocr_job(
                                snapshot_id=frame_info_item.frame_path.stem,
                                image_path=str(frame_info_item.frame_path),
                                meeting_id=meeting_id,
                                org_id=org_id,
                                source_type="screenshot"
                            )
                            if success:
                                results["ocr_jobs_enqueued"] += 1
                        else:
                            # Process synchronously
                            try:
                                ocr_service = get_ocr_service()
                                result = ocr_service.run_ocr(frame_info_item.frame_path)
                                # Save result (similar to worker)
                                _save_ocr_result(result, meeting_dir, org_id, meeting_id, "screenshot")
                                results["ocr_jobs_enqueued"] += 1
                            except Exception as e:
                                log.error(f"Failed to process screenshot {frame_info_item.frame_path}: {e}")
                                results["errors"].append(str(e))
                else:
                    # Process all frames without change detection
                    image_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
                    screenshot_files = sorted([
                        p for p in screenshots_dir.iterdir()
                        if p.is_file() and p.suffix.lower() in image_exts
                    ])
                    results["screenshots_processed"] = len(screenshot_files)
                    
                    for screenshot_path in screenshot_files:
                        if enqueue_for_async:
                            success = enqueue_ocr_job(
                                snapshot_id=screenshot_path.stem,
                                image_path=str(screenshot_path),
                                meeting_id=meeting_id,
                                org_id=org_id,
                                source_type="screenshot"
                            )
                            if success:
                                results["ocr_jobs_enqueued"] += 1
                        else:
                            try:
                                ocr_service = get_ocr_service()
                                result = ocr_service.run_ocr(screenshot_path)
                                _save_ocr_result(result, meeting_dir, org_id, meeting_id, "screenshot")
                                results["ocr_jobs_enqueued"] += 1
                            except Exception as e:
                                log.error(f"Failed to process screenshot {screenshot_path}: {e}")
                                results["errors"].append(str(e))
        except Exception as e:
            log.error(f"Error processing screenshots: {e}", exc_info=True)
            results["errors"].append(f"Screenshots processing error: {str(e)}")
    
    # Process whiteboard frames
    if process_whiteboard_frames:
        try:
            whiteboard_dir = meeting_dir / "whiteboard" / "frames"
            if whiteboard_dir.exists():
                log.info(f"Processing whiteboard frames for meeting: {meeting_id}")
                
                if use_change_detection:
                    # Detect key frames
                    frame_info = detect_key_frames_for_meeting(meeting_dir, source_type="whiteboard")
                    key_frames = [f for f in frame_info if f.is_key_frame]
                    results["key_frames_detected"] += len(key_frames)
                    results["whiteboard_frames_processed"] = len(frame_info)
                    
                    # Process key frames
                    for frame_info_item in key_frames:
                        if enqueue_for_async:
                            success = enqueue_ocr_job(
                                snapshot_id=frame_info_item.frame_path.stem,
                                image_path=str(frame_info_item.frame_path),
                                meeting_id=meeting_id,
                                org_id=org_id,
                                source_type="whiteboard"
                            )
                            if success:
                                results["ocr_jobs_enqueued"] += 1
                        else:
                            try:
                                ocr_service = get_ocr_service()
                                result = ocr_service.run_ocr(frame_info_item.frame_path)
                                _save_ocr_result(result, meeting_dir, org_id, meeting_id, "whiteboard")
                                results["ocr_jobs_enqueued"] += 1
                            except Exception as e:
                                log.error(f"Failed to process whiteboard frame {frame_info_item.frame_path}: {e}")
                                results["errors"].append(str(e))
                else:
                    # Process all frames
                    image_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
                    frame_files = sorted([
                        p for p in whiteboard_dir.iterdir()
                        if p.is_file() and p.suffix.lower() in image_exts
                    ])
                    results["whiteboard_frames_processed"] = len(frame_files)
                    
                    for frame_path in frame_files:
                        if enqueue_for_async:
                            success = enqueue_ocr_job(
                                snapshot_id=frame_path.stem,
                                image_path=str(frame_path),
                                meeting_id=meeting_id,
                                org_id=org_id,
                                source_type="whiteboard"
                            )
                            if success:
                                results["ocr_jobs_enqueued"] += 1
                        else:
                            try:
                                ocr_service = get_ocr_service()
                                result = ocr_service.run_ocr(frame_path)
                                _save_ocr_result(result, meeting_dir, org_id, meeting_id, "whiteboard")
                                results["ocr_jobs_enqueued"] += 1
                            except Exception as e:
                                log.error(f"Failed to process whiteboard frame {frame_path}: {e}")
                                results["errors"].append(str(e))
        except Exception as e:
            log.error(f"Error processing whiteboard frames: {e}", exc_info=True)
            results["errors"].append(f"Whiteboard frames processing error: {str(e)}")
    
    log.info(
        f"Whiteboard processing complete for {meeting_id}: "
        f"{results['ocr_jobs_enqueued']} jobs enqueued, "
        f"{results['key_frames_detected']} key frames detected"
    )
    
    return results


def _save_ocr_result(result, meeting_dir: Path, org_id: str, meeting_id: str, source_type: str):
    """Save OCR result to storage (used for synchronous processing)."""
    from datetime import datetime
    
    storage_root = Path("./storage")
    ocr_dir = storage_root / org_id / meeting_id / "whiteboard" / "ocr"
    ocr_dir.mkdir(parents=True, exist_ok=True)
    
    result_file = ocr_dir / f"{result.snapshot_id}.json"
    result_data = {
        "snapshot_id": result.snapshot_id,
        "image_path": str(result.image_path),
        "full_text": result.full_text,
        "text_blocks": [
            {
                "text": block.text,
                "bbox": block.bbox,
                "confidence": block.confidence,
                "type": block.type
            }
            for block in result.text_blocks
        ],
        "ocr_engine": result.ocr_engine,
        "processing_time_sec": result.processing_time_sec,
        "raw_ocr_data": result.raw_ocr_data,
        "meeting_id": meeting_id,
        "org_id": org_id,
        "source_type": source_type,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    result_file.write_text(json.dumps(result_data, indent=2), encoding="utf-8")


def get_whiteboard_summary_for_meeting(
    meeting_dir: Path,
    org_id: str = "demo",
    meeting_id: Optional[str] = None
) -> Dict:
    """
    Get whiteboard summary for a meeting.
    
    This function loads OCR results and generates a summary structure with:
    - List of bullet points (extracted text from key frames)
    - Checklist candidates (text lines that look like TODOs/actions)
    
    Args:
        meeting_dir: Meeting directory path
        org_id: Organization ID
        meeting_id: Meeting ID (if None, inferred from meeting_dir)
    
    Returns:
        Dictionary with whiteboard summary
    """
    if meeting_id is None:
        meeting_id = meeting_dir.name
    
    summary = {
        "meeting_id": meeting_id,
        "org_id": org_id,
        "bullet_points": [],
        "checklist_candidates": [],
        "key_frames_count": 0,
        "total_text_blocks": 0
    }
    
    # Load OCR results
    ocr_dir = meeting_dir / "whiteboard" / "ocr"
    if not ocr_dir.exists():
        log.info(f"No OCR results found for meeting: {meeting_id}")
        return summary
    
    # Find all OCR result files
    ocr_files = sorted(ocr_dir.glob("*.json"))
    summary["key_frames_count"] = len(ocr_files)
    
    all_text_blocks = []
    
    for ocr_file in ocr_files:
        try:
            data = json.loads(ocr_file.read_text(encoding="utf-8"))
            full_text = data.get("full_text", "").strip()
            text_blocks = data.get("text_blocks", [])
            
            if full_text:
                # Add as bullet point
                summary["bullet_points"].append({
                    "text": full_text,
                    "snapshot_id": data.get("snapshot_id"),
                    "source_type": data.get("source_type", "unknown"),
                    "confidence": max([b.get("confidence", 0.0) for b in text_blocks] + [0.0])
                })
            
            all_text_blocks.extend(text_blocks)
        except Exception as e:
            log.warning(f"Failed to load OCR result {ocr_file}: {e}")
    
    summary["total_text_blocks"] = len(all_text_blocks)
    
    # Identify checklist candidates
    # Look for patterns like: "- [ ]", "- [x]", "TODO", numbered lists, etc.
    checklist_patterns = [
        r"^\s*[-*]\s*\[[\sx]\]",  # Markdown checkbox
        r"^\s*\d+[\.)]\s*",  # Numbered list
        r"TODO|FIXME|ACTION",  # Common action keywords
        r"^\s*[-*]\s+",  # Bullet point
    ]
    
    import re
    for bullet in summary["bullet_points"]:
        text = bullet["text"]
        lines = text.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line matches checklist patterns
            is_checklist = False
            for pattern in checklist_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    is_checklist = True
                    break
            
            if is_checklist:
                summary["checklist_candidates"].append({
                    "text": line,
                    "snapshot_id": bullet["snapshot_id"],
                    "source_type": bullet["source_type"]
                })
    
    log.info(
        f"Whiteboard summary for {meeting_id}: "
        f"{len(summary['bullet_points'])} bullet points, "
        f"{len(summary['checklist_candidates'])} checklist candidates"
    )
    
    return summary

