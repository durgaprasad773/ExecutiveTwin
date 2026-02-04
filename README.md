# Executive Twin - AI Chief of Staff POC

An intelligent AI-powered Chief of Staff system for Dr. Arokia that filters noise and prioritizes strategic work.

## Architecture

- **Frontend**: React + Vite (Port 3000)
- **Backend**: Python FastAPI (Port 8000)
- **AI Engine**: Azure OpenAI GPT-4o

## Features

- ✅ **Smart Prioritization**: Filters noise and ranks tasks by strategic impact
- 🚨 **Crisis Mode**: Automatically detects and elevates urgent threats
- 📊 **Clean JSON Output**: Structured data for easy frontend rendering
- 🎨 **Executive Dashboard**: Dark mode, distraction-free UI
- 🆕 **Live Outlook Integration**: Real email & calendar via Microsoft Graph API
- 🆕 **Mock vs Live Toggle**: Test with sample data or production data

## Setup Instructions

### 1. Backend Setup (Python FastAPI)

```powershell
# Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env

# Edit .env and add your Azure OpenAI credentials
# Get these from Azure Portal -> OpenAI Resource
```

**Configure your `.env` file:**
```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your-actual-key-here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_OPENAI_VERSION=2025-01-01-preview

# Microsoft Graph API (Optional - for live Outlook data)
AZURE_CLIENT_ID=your-client-id-here
AZURE_TENANT_ID=your-tenant-id-here
```

**For Live Outlook Integration:**
See [GRAPH_API_SETUP.md](GRAPH_API_SETUP.md) for complete setup instructions.

**Start the backend:**
```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

### 2. Frontend Setup (React)

Open a **new terminal** and run:

```powershell
# Navigate to frontend folder
cd frontend

# Install Node dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## Testing the POC

### Test 1: Normal Mode (Standard Monday)
1. Open `http://localhost:3000` in your browser
2. Click **"Initialize Monday Briefing"**
3. You should see:
   - Priority #1: Clinical Authority (Research validation)
   - Priority #2: $1M ARR (Spire contract)
   - Noise filtered: Invoices, font questions, hype podcasts

### Test 2: Crisis Mode (Bad Monday)
1. Toggle the **"Crisis Mode"** switch
2. Click **"Initialize Monday Briefing"** again
3. You should see:
   - 🚨 Priority #0: Daily Mail PR Crisis (IMMEDIATE)
   - 🚨 Priority #0: Server Down (CRITICAL)
   - Other priorities pushed down

## Project Structure

```
Poc/
├── backend/
│   ├── main.py              # FastAPI server with AI logic
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Azure OpenAI credentials
│
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main React component
    │   ├── App.css          # Executive dashboard styles
    │   └── main.jsx         # React entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## How It Works

### The "Brain" (Backend Logic)

1. **Mock Data**: Two scenarios (Normal vs Crisis) with emails and calendar
2. **System Prompt**: Pre-engineered rules for prioritization
3. **Crisis Protocol**: Overrides all priorities when urgent threats detected
4. **Structured Output**: Returns clean JSON for frontend rendering

### The "Filter" Rules

**Priority #0 (Crisis Override):**
- Legal threats
- PR crises
- System failures

**Priority #1: Clinical Authority**
- Research validation
- Clinical cohorts
- Assessment tools

**Priority #2: $1M ARR**
- Enterprise contracts
- Revenue opportunities

**Priority #3: Legacy**
- Patient impact initiatives

**"Hell No" List (Auto-filtered):**
- Invoices and payments
- Formatting questions
- Low-value media (hype podcasts)
- Intro chats with vendors

## Demo Script

**Opening:**
> "This is the Executive Twin. It's not a chatbot—it's a Chief of Staff that makes decisions."

**Show Normal Mode:**
> "Here's a typical Monday. Notice how it ranks the Assessment Tool above the $1M contract? That's because Clinical Authority is our core IP."

**Toggle Crisis Mode:**
> "But what if the Daily Mail calls with a hit piece?"

**The Reveal:**
> "Watch. The system instantly detects the existential threat and overrides everything. The contract gets pushed down. Deep work gets cancelled. This is survival mode."

**Closing:**
> "The Executive Twin doesn't just manage your schedule—it protects your reputation."

## Next Steps

- [ ] Integrate with Microsoft Graph API (Replace mock data with real Gmail/Calendar)
- [ ] Add user authentication
- [ ] Deploy to Azure App Services
- [ ] Add more priority categories
- [ ] Implement learning from user feedback

## Troubleshooting

**Backend won't start:**
- Check that Python 3.8+ is installed
- Verify Azure OpenAI credentials in `.env`
- Ensure the model name "gpt-4o" matches your Azure deployment

**Frontend can't connect:**
- Verify backend is running on port 8000
- Check CORS is enabled in `main.py`
- Ensure both servers are running simultaneously

**AI returns errors:**
- Confirm your Azure OpenAI key is valid
- Check that the endpoint URL is correct
- Verify the model deployment name matches "gpt-4o"

## Contact

Built by Durga (MERN Dev) for Dr. Arokia's Executive Twin POC.

---

**Note**: This is a POC using mock data. No real email/calendar access is required yet.
