import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Jira credentials
JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")

# ADF (Atlassian Document Format) compliant issue body
issue_data = {
    "fields": {
        "project": {"key": JIRA_PROJECT_KEY},
        "summary": "Test Issue from ClariMeet",
        "description": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "text": "This is a test issue created to verify Jira integration with ClariMeet.",
                            "type": "text"
                        }
                    ]
                }
            ]
        },
        "issuetype": {"name": "Task"},
    }
}

# API request to Jira
url = f"{JIRA_BASE_URL}/rest/api/3/issue"
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

response = requests.post(
    url,
    json=issue_data,
    headers=headers,
    auth=(JIRA_EMAIL, JIRA_API_TOKEN)
)

# Handle the response
if response.status_code == 201:
    data = response.json()
    issue_key = data["key"]
    print(f"✅ Jira issue created successfully! Key: {issue_key}")
    print(f"🔗 View it here: {JIRA_BASE_URL}/browse/{issue_key}")
else:
    print(f"❌ Failed to create issue ({response.status_code})")
    print(response.text)
