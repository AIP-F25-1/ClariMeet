# services/integrations/trello_client.py
import requests
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get credentials from environment
TRELLO_KEY = os.getenv("TRELLO_KEY")
TRELLO_TOKEN = os.getenv("TRELLO_TOKEN")
TRELLO_LIST_ID = os.getenv("TRELLO_LIST_ID")

def create_trello_card(name, desc):
    """
    Create a Trello card for a meeting action item.
    """
    if not all([TRELLO_KEY, TRELLO_TOKEN, TRELLO_LIST_ID]):
        print("❌ Missing Trello credentials in .env file.")
        return

    url = "https://api.trello.com/1/cards"
    query = {
        'key': TRELLO_KEY,
        'token': TRELLO_TOKEN,
        'idList': TRELLO_LIST_ID,
        'name': name,
        'desc': desc
    }

    response = requests.post(url, params=query)

    if response.status_code == 200:
        print(f"✅ Trello Card Created: {name}")
    else:
        print(f"❌ Trello Error {response.status_code}: {response.text}")
