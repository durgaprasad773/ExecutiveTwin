from outlook_connector import fetch_outlook_data

print("Testing Outlook connector...")
data = fetch_outlook_data(email_limit=5, calendar_limit=5)
print(f"Emails fetched: {len(data['emails'])}")
print(f"Calendar events fetched: {len(data['calendar'])}")
