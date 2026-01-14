import re
import json
import os

def extract_action_items(transcript_path, output_path):
    """
    Reads transcript.txt and extracts possible action items.
    Saves them to actions.json.
    """
    if not os.path.exists(transcript_path):
        print(f"❌ Transcript not found: {transcript_path}")
        return []

    with open(transcript_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Simple pattern-based extraction (can later replace with NLP model)
    action_patterns = [
        r"\b(we|let's|let us|someone|you|i)\s+(need to|should|have to|must)\s+(.*?)[\.\n]",
        r"\b(assign|prepare|complete|finish|schedule|send|update|review|create)\b(.*?)[\.\n]"
    ]

    items = []
    for pattern in action_patterns:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            item = match.group(0).strip()
            items.append({
                "title": item[:80] + ("..." if len(item) > 80 else ""),
                "details": item
            })

    # Save extracted items
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=4)

    print(f"✅ Extracted {len(items)} action items → {output_path}")
    return items