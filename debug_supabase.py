import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

print("Attempting to access student_scores...")
try:
    response = supabase.table("student_scores").select("*").limit(1).execute()
    print("Success! Data:", response.data)
except Exception as e:
    print("Error accessing table:", e)

print("\nListing all tables is not directly possible via client without specific permissions.")
