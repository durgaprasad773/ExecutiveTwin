# QUICK FIX: Azure App Registration Configuration Issue

## Problem
Error: `AADSTS7000218: The request body must contain the following parameter: 'client_assertion' or 'client_secret'`

This means your Azure App Registration is configured for **Confidential Client** (web app with secrets) instead of **Public Client** (desktop/mobile app).

## Solution: Fix App Registration Settings

### Step 1: Go to Azure Portal
1. Navigate to: https://portal.azure.com
2. Search for **"App registrations"**
3. Find your app: **Executive Twin POC**
4. Click on it

### Step 2: Enable Public Client Flow
1. In the left menu, click **"Authentication"**
2. Scroll down to **"Advanced settings"**
3. Under **"Allow public client flows"**:
   - Toggle **"Enable the following mobile and desktop flows"** to **YES**
4. Click **"Save"** at the top

### Step 3: Verify Redirect URI
1. Still in **"Authentication"** section
2. Under **"Platform configurations"**, you should see **"Mobile and desktop applications"**
3. If not, click **"Add a platform"** → Select **"Mobile and desktop applications"**
4. Check these redirect URIs:
   - ✅ `https://login.microsoftonline.com/common/oauth2/nativeclient`
   - ✅ `http://localhost`
5. Click **"Configure"** then **"Save"**

### Step 4: Verify API Permissions
1. In left menu, click **"API permissions"**
2. Ensure you have:
   - Microsoft Graph → Mail.Read (Delegated)
   - Microsoft Graph → Calendars.Read (Delegated)
   - Microsoft Graph → User.Read (Delegated)
3. **CRITICAL**: Click **"Grant admin consent for [Your Organization]"**
4. Wait for checkmarks to appear (may take 30 seconds)

### Step 5: Test Again
```powershell
cd backend
python test_outlook.py
```

Expected output:
```
Testing Outlook connector...
📧 Fetching live data from Microsoft Outlook...
🌐 Launching Browser for Outlook Login...
✅ Successfully authenticated with Microsoft Graph API
✅ Successfully fetched 5 emails from Outlook
Emails fetched: 5
Calendar events fetched: 5
```

---

## Alternative: Use Device Code Flow

If the browser popup still doesn't work, the code now falls back to **Device Code Flow**:

1. You'll see a message like:
   ```
   To sign in, use a web browser to open the page https://microsoft.com/devicelogin
   and enter the code ABC123XYZ to authenticate.
   ```

2. Open that URL in any browser
3. Enter the code shown
4. Sign in with your Microsoft account
5. Return to terminal - authentication will complete

---

## Still Having Issues?

### Check your .env file has:
```env
AZURE_CLIENT_ID=e42d5416-3ccc-4bf2-9fdb-fce6f5425e1f
AZURE_TENANT_ID=14500012-acb8-476c-8e40-f225d32c70d3
```

### Try running with verbose output:
```powershell
$env:MSAL_PYTHON_LOG_LEVEL="DEBUG"
python test_outlook.py
```

This will show detailed authentication logs to help diagnose the issue.
