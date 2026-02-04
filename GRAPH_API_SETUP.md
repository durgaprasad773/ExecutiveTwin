# Microsoft Graph API Setup Guide

## Overview
This guide walks you through setting up Microsoft Graph API access for the Executive Twin to read real emails and calendar events from Outlook.

## Why Outlook/Graph API?
- ✅ **Native Azure Integration**: Everything happens in Azure Portal (no Google Cloud Console needed)
- ✅ **Single Token Access**: One authentication gives access to Email, Calendar, Teams, OneDrive
- ✅ **Enterprise Ready**: Built for Microsoft 365 organizations
- ✅ **Smooth OAuth**: Uses MSAL (Microsoft Authentication Library)

---

## Step 1: Register the App in Azure Portal

### 1.1 Create App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **"App registrations"**
3. Click **"New registration"**

### 1.2 Configure Registration
- **Name**: `Executive Twin POC`
- **Supported account types**: 
  - Select: "Accounts in this organizational directory only" (Single Tenant)
  - This is the safest option for internal POC
- **Redirect URI**: 
  - Platform: Select **"Public client/native (mobile & desktop)"**
  - URI: `http://localhost`
- Click **"Register"**

### 1.3 Copy Important IDs
From the **"Overview"** page, copy these values:
- ✅ **Application (client) ID** → Save to `.env` as `AZURE_CLIENT_ID`
- ✅ **Directory (tenant) ID** → Save to `.env` as `AZURE_TENANT_ID`

---

## Step 2: Add API Permissions

### 2.1 Request Permissions
1. In your App Registration, go to **"API Permissions"**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"** (user logs in)

### 2.2 Select Required Permissions
Check these permissions:
- ✅ **Mail.Read** - Read user's email
- ✅ **Calendars.Read** - Read user's calendar
- ✅ **User.Read** - Read user profile (basic info)

Click **"Add permissions"**

### 2.3 Grant Admin Consent (CRITICAL)
⚠️ **Important**: Click **"Grant admin consent for [Your Organization]"**

This prevents Dr. Arokia from seeing a scary permission popup during login.

---

## Step 3: Install Required Packages

```powershell
cd backend
pip install -r requirements.txt
```

This installs:
- `msal` - Microsoft Authentication Library
- `requests` - For Graph API calls

---

## Step 4: Configure .env File

Add your Microsoft Graph credentials to `.env`:

```env
# Microsoft Graph API Configuration
AZURE_CLIENT_ID=your-application-client-id-here
AZURE_TENANT_ID=your-directory-tenant-id-here
```

Your complete `.env` should look like:

```env
# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_VERSION=2025-01-01-preview

# Microsoft Graph API Configuration
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
```

---

## Step 5: Test the Outlook Connector

### 5.1 Standalone Test
```powershell
cd backend
python outlook_connector.py
```

**What happens:**
1. A browser window opens
2. You log in with Dr. Arokia's Microsoft account
3. You consent to permissions (one time only)
4. The script fetches 5 recent emails and 5 calendar events
5. Results print to terminal

### 5.2 Expected Output
```
🧪 Testing Outlook Connector...

--- Testing Email Fetch ---
🌐 Launching Browser for Outlook Login...
✅ Successfully authenticated with Microsoft Graph API
✅ Successfully fetched 5 emails from Outlook
  📧 Invoice #4029 overdue from accounts@utility.com
  📧 Draft Contract: Spire Hospital from legal@spire.com
  ...

--- Testing Calendar Fetch ---
✅ Successfully fetched 5 calendar events from Outlook
  📅 Weekly Admin Catch-up (60 mins)
  📅 Deep Work: Assessment Tool Logic (120 mins)
  ...
```

---

## Step 6: Use Live Data in the POC

### 6.1 Start Backend
```powershell
cd backend
uvicorn main:app --reload --port 8000
```

### 6.2 Start Frontend
```powershell
cd frontend
npm run dev
```

### 6.3 Enable Live Data
1. Open `http://localhost:3000`
2. Toggle **"Data Source"** to **"📧 Live Outlook"**
3. Click **"Initialize Monday Briefing"**
4. First time: Browser opens for authentication
5. After authentication: Real data flows through!

---

## How It Works

### Authentication Flow
```
1. User clicks button with "Live Outlook" enabled
2. Backend calls outlook_connector.py
3. MSAL checks for cached token
4. If no token: Opens browser for OAuth login
5. User authenticates with Microsoft
6. MSAL caches token for future use
7. Token sent to Graph API
8. Real emails + calendar fetched
9. Data sent to GPT-4o for prioritization
10. Frontend displays results
```

### API Endpoints Used
- **Emails**: `https://graph.microsoft.com/v1.0/me/messages`
- **Calendar**: `https://graph.microsoft.com/v1.0/me/events`

---

## Troubleshooting

### Error: "AZURE_CLIENT_ID must be set"
- Make sure `.env` file exists in `backend/` folder
- Check variable names exactly match: `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`
- Restart backend after editing `.env`

### Error: "AADSTS7000218: The request body must contain client_assertion"
- In Azure Portal, make sure you selected **"Public client/native"** redirect type
- Not "Web" or "SPA"

### Error: "AADSTS65001: User or administrator has not consented"
- Go to Azure Portal → Your App → API Permissions
- Click **"Grant admin consent for [Org]"**

### Browser doesn't open for login
- Make sure port 8000 is not blocked by firewall
- Try manually visiting: `http://localhost:8000/api/test-config`

### Token expired
- MSAL automatically refreshes tokens
- If issues persist, delete cached credentials and re-authenticate

---

## Next Steps: Production Deployment

For production deployment, you would:

1. **Switch to Web App flow** instead of interactive browser
2. **Add token caching** to database/Redis
3. **Implement refresh token rotation**
4. **Set up service principal** for background processing
5. **Add Teams + OneDrive** permissions for full executive context

---

## Quick Reference

### Scopes Required
```python
SCOPES = ["Mail.Read", "Calendars.Read", "User.Read"]
```

### Graph API Endpoints
- Emails: `/v1.0/me/messages`
- Calendar: `/v1.0/me/events`
- User Info: `/v1.0/me`

### Environment Variables
```env
AZURE_CLIENT_ID=<from App Registration>
AZURE_TENANT_ID=<from App Registration>
```

---

## Demo Script

**Show Mock Data:**
> "This is working with sample data. Now watch what happens when we connect to her real Outlook..."

**Toggle Live Data:**
> *Browser opens, authenticate, close browser*

**The Reveal:**
> "Now the AI is reading her actual inbox. These are real emails from today. The 'Hell No' filter just archived 8 noise emails automatically."

**The Impact:**
> "This isn't a demo. This is her actual Monday morning."

---

Built with ❤️ for Dr. Arokia's Executive Twin POC
