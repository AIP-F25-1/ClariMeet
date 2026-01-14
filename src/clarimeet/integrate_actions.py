import os
from services.nlp.action_extractor import extract_action_items
from services.integrations.jira_client import create_jira_task
from services.integrations.trello_client import create_trello_card

def process_meeting_for_integration(session_dir):
    transcript = os.path.join(session_dir, "transcript.txt")
    actions_json = os.path.join(session_dir, "actions.json")

    # Step 1: Extract action items from transcript
    actions = extract_action_items(transcript, actions_json)
    if not actions:
        print("⚠️ No action items found.")
        return

    # Step 2: Push each action item to Jira & Trello
    for action in actions:
        summary = action.get("title", "Untitled Action")
        details = action.get("details", "No details available.")

        create_jira_task(summary, details)
        create_trello_card(summary, details)