from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from openai import AzureOpenAI
import json
from dotenv import load_dotenv
from outlook_connector import fetch_outlook_data, get_access_token

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://executive-twin-frontend.vercel.app/", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# THE BRAIN: System Prompt with Crisis Protocol
SYSTEM_PROMPT = """
You are the Executive Twin for Dr. Arokia.
ROLE: Chief of Staff. Insecurity-Free. Authoritative.

GOAL: Generate a "Monday Morning Strategic Briefing" based on the input data.

RULES (THE FILTER):
0. **CRISIS PROTOCOL (OVERRIDE ALL):**
   - If an input contains "URGENT", "CRITICAL", "Legal Threat", or "Press Inquiry" regarding reputation:
   - Rank this as **PRIORITY #0 (IMMEDIATE ACTION)**.
   - Flag it with a "🚨" emoji.
   - Reasoning: "Existential Threat to Authority."

1. **The 'Hell No' List:** Ignore/Archive anything related to:
   - Invoices/Accounts/Payments.
   - Formatting/Grammar questions.
   - Low-value media (hype podcasts).
   - "Intro chats" with vendors.

2. **Strategic Hierarchy (Prioritize strictly in this order):**
   - Priority 1: Clinical Authority (Research, Cohorts, Validated Tools).
   - Priority 2: $1M ARR (Enterprise Contracts, Revenue).
   - Priority 3: Legacy (Patient Impact).

3. **Output Format (CRITICAL - MUST RETURN VALID JSON):**
   - Return ONLY a valid JSON object, no additional text.
   - Use this exact structure:
   {
     "strategic_briefing": [
       {
         "priority_rank": 0,
         "goal_category": "Crisis",
         "task": "Task description",
         "time_estimate": "30 mins",
         "reasoning": "Why this matters",
         "emoji": "🚨"
       }
     ],
     "noise_filtered": [
       "Item description (Reason)"
     ]
   }
   - Tone: Clinical conviction. No fluff.
"""

class BriefingRequest(BaseModel):
    pass  # No parameters needed - always uses live data

@app.post("/api/authenticate")
async def authenticate():
    """
    Trigger Microsoft OAuth authentication flow.
    This will open a browser window for the user to sign in.
    """
    try:
        print("🔐 Initiating Microsoft OAuth authentication...")
        access_token = get_access_token()
        if access_token:
            print("✅ Authentication successful")
            return {
                "success": True,
                "message": "Authentication successful"
            }
        else:
            print("❌ Authentication failed - no token received")
            raise HTTPException(status_code=401, detail="Authentication failed")
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@app.post("/api/monday-briefing")
async def generate_briefing(request: BriefingRequest = None):
    try:
        # Always fetch live data from Outlook
        print("📧 Fetching LIVE data from Microsoft Outlook...")
        
        try:
            live_data = fetch_outlook_data(email_limit=15, calendar_limit=10)
            
            if not live_data["emails"] and not live_data["calendar"]:
                return {
                    "success": False,
                    "error": "No data received from Outlook",
                    "message": "Failed to connect to Outlook. Please ensure you have granted permissions and are signed in."
                }
            
            data_to_use = live_data
            print(f"✅ Using live data: {len(live_data['emails'])} emails, {len(live_data['calendar'])} events")
            
        except Exception as e:
            print(f"❌ Error fetching live data: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to fetch Outlook data: {str(e)}"
            }
        
        # Check if environment variables are set
        api_key = os.getenv("AZURE_OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        
        if not api_key or not endpoint:
            return {
                "success": False,
                "error": "Missing Azure OpenAI credentials",
                "message": "Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in your .env file"
            }
        
        print(f"🔄 Generating briefing from live Outlook data...")
        
        # SETUP: Use Azure OpenAI
        client = AzureOpenAI(
            api_key=api_key,
            api_version=os.getenv("AZURE_OPENAI_VERSION", "2023-05-15"),
            azure_endpoint=endpoint
        )
        
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o"),  # Use deployment name from .env
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Here is the raw data: {json.dumps(data_to_use)}"}
            ],
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        if response and response.choices and len(response.choices) > 0:
            briefing_data = json.loads(response.choices[0].message.content)
        else:
            raise Exception("No response received from OpenAI API")
        
        print(f"✅ Briefing generated successfully")
        
        return {
            "success": True,
            "data_source": "live_outlook",
            "data": briefing_data
        }
    
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error: {error_msg}")
        
        # Provide more specific error messages
        if "authentication" in error_msg.lower() or "unauthorized" in error_msg.lower():
            message = "Invalid Azure OpenAI API key. Please check your AZURE_OPENAI_KEY in .env"
        elif "not found" in error_msg.lower() or "404" in error_msg:
            message = "Model 'gpt-4o' not found. Check your Azure deployment name or endpoint URL"
        elif "endpoint" in error_msg.lower():
            message = "Invalid endpoint URL. Please check your AZURE_OPENAI_ENDPOINT in .env"
        else:
            message = f"Failed to generate briefing: {error_msg}"
        
        return {
            "success": False,
            "error": error_msg,
            "message": message
        }

@app.get("/")
async def root():
    return {"message": "Executive Twin API is running", "status": "healthy"}

@app.get("/api/test-config")
async def test_config():
    """Test endpoint to verify Azure OpenAI configuration"""
    api_key = os.getenv("AZURE_OPENAI_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    
    return {
        "azure_openai_key_set": bool(api_key),
        "azure_openai_key_length": len(api_key) if api_key else 0,
        "azure_openai_endpoint_set": bool(endpoint),
        "azure_openai_endpoint": endpoint if endpoint else "Not set",
        "message": "If both values are set, your .env file is loaded correctly"
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Executive Twin API...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("\nPress CTRL+C to stop the server\n")
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
