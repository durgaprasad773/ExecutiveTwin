"""
Microsoft Graph API Connector for Outlook Integration
Handles OAuth authentication and data fetching for Executive Twin
"""

import msal
import requests
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration (loaded from environment variables)
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
TENANT_ID = os.getenv("AZURE_TENANT_ID")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}" if TENANT_ID else None
SCOPES = ["Mail.Read", "Calendars.Read", "User.Read"]

def get_access_token() -> Optional[str]:
    """
    Interactively logs the user in via browser to get a Graph API Token.
    Uses MSAL (Microsoft Authentication Library) for OAuth flow.
    """
    if not CLIENT_ID or not TENANT_ID:
        print("❌ Error: AZURE_CLIENT_ID and AZURE_TENANT_ID must be set in .env")
        return None
    
    # Configure as Public Client Application with localhost redirect
    app = msal.PublicClientApplication(
        CLIENT_ID,
        authority=AUTHORITY
    )
    
    # Check if token is already cached in memory
    accounts = app.get_accounts()
    if accounts:
        print("🔄 Using cached Outlook token...")
        result = app.acquire_token_silent(SCOPES, account=accounts[0])
        if result and "access_token" in result:
            print("✅ Successfully authenticated with Microsoft Graph API")
            return result["access_token"]
    
    # No valid token, trigger browser login with device code flow as fallback
    print("🌐 Launching Browser for Outlook Login...")
    try:
        # Try interactive flow first (opens browser)
        result = app.acquire_token_interactive(
            scopes=SCOPES,
            prompt="select_account"  # Always show account picker
        )
    except Exception as e:
        print(f"⚠️ Interactive auth failed: {str(e)}")
        print("Trying device code flow instead...")
        # Fall back to device code flow
        flow = app.initiate_device_flow(scopes=SCOPES)
        if "user_code" in flow:
            print(flow["message"])
            result = app.acquire_token_by_device_flow(flow)
        else:
            result = {"error": "device_flow_failed"}
    
    if "access_token" in result:
        print("✅ Successfully authenticated with Microsoft Graph API")
        return result["access_token"]
    else:
        print(f"❌ Authentication Error: {result.get('error')}")
        print(f"Description: {result.get('error_description')}")
        return None


def fetch_recent_emails(max_results: int = 15) -> List[Dict]:
    """
    Fetches recent emails from Outlook via Microsoft Graph API.
    
    Args:
        max_results: Maximum number of emails to fetch (default: 15)
    
    Returns:
        List of email dictionaries with id, subject, sender, and snippet
    """
    token = get_access_token()
    if not token:
        return []
    
    headers = {'Authorization': 'Bearer ' + token}
    
    # Graph API Endpoint for Messages
    endpoint = (
        f"https://graph.microsoft.com/v1.0/me/messages"
        f"?$top={max_results}"
        f"&$select=id,subject,from,bodyPreview,isRead,receivedDateTime"
        f"&$orderby=receivedDateTime DESC"
    )
    
    try:
        response = requests.get(endpoint, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            clean_emails = []
            
            for msg in data.get('value', []):
                clean_emails.append({
                    "id": msg['id'],
                    "subject": msg.get('subject', '(No Subject)'),
                    "sender": msg.get('from', {}).get('emailAddress', {}).get('address', 'Unknown'),
                    "snippet": msg.get('bodyPreview', '')[:200]  # Limit snippet length
                })
            
            print(f"✅ Successfully fetched {len(clean_emails)} emails from Outlook")
            return clean_emails
        else:
            print(f"❌ Graph API Error: {response.status_code} - {response.text}")
            return []
    
    except Exception as e:
        print(f"❌ Error fetching emails: {str(e)}")
        return []


def fetch_calendar_events(max_results: int = 10) -> List[Dict]:
    """
    Fetches upcoming calendar events from Outlook via Microsoft Graph API.
    
    Args:
        max_results: Maximum number of events to fetch (default: 10)
    
    Returns:
        List of calendar event dictionaries with id, title, and duration
    """
    token = get_access_token()
    if not token:
        return []
    
    headers = {'Authorization': 'Bearer ' + token}
    
    # Graph API Endpoint for Calendar Events
    endpoint = (
        f"https://graph.microsoft.com/v1.0/me/events"
        f"?$top={max_results}"
        f"&$select=id,subject,start,end,isAllDay"
        f"&$orderby=start/dateTime"
    )
    
    try:
        response = requests.get(endpoint, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            clean_events = []
            
            for event in data.get('value', []):
                # Calculate duration
                if event.get('isAllDay'):
                    duration = "All Day"
                else:
                    # Simple duration calculation (could be enhanced)
                    duration = "60 mins"  # Default, could parse start/end times
                
                clean_events.append({
                    "id": event['id'],
                    "title": event.get('subject', '(No Title)'),
                    "duration": duration
                })
            
            print(f"✅ Successfully fetched {len(clean_events)} calendar events from Outlook")
            return clean_events
        else:
            print(f"❌ Graph API Error: {response.status_code} - {response.text}")
            return []
    
    except Exception as e:
        print(f"❌ Error fetching calendar: {str(e)}")
        return []


def fetch_outlook_data(email_limit: int = 15, calendar_limit: int = 10) -> Dict:
    """
    Fetches both emails and calendar events in one call.
    
    Args:
        email_limit: Maximum emails to fetch
        calendar_limit: Maximum calendar events to fetch
    
    Returns:
        Dictionary with 'emails' and 'calendar' keys
    """
    print("📧 Fetching live data from Microsoft Outlook...")
    
    emails = fetch_recent_emails(max_results=email_limit)
    calendar = fetch_calendar_events(max_results=calendar_limit)
    
    return {
        "emails": emails,
        "calendar": calendar
    }


# Test function
if __name__ == '__main__':
    print("🧪 Testing Outlook Connector...")
    print("\n--- Testing Email Fetch ---")
    emails = fetch_recent_emails(max_results=5)
    for email in emails:
        print(f"  📧 {email['subject']} from {email['sender']}")
    
    print("\n--- Testing Calendar Fetch ---")
    events = fetch_calendar_events(max_results=5)
    for event in events:
        print(f"  📅 {event['title']} ({event['duration']})")
    
    print("\n--- Testing Combined Fetch ---")
    data = fetch_outlook_data(email_limit=5, calendar_limit=5)
    print(f"  Total Emails: {len(data['emails'])}")
    print(f"  Total Events: {len(data['calendar'])}")
