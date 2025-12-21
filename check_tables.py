import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

api_url = f"{url}/rest/v1/"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

print(f"Fetching schema info from: {api_url}")
try:
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        # The root endpoint usually returns the OpenAPI/Swagger definition in JSON
        # keys in 'definitions' or paths usually reveal tables
        data = response.json()
        print("Successfully connected!")
        
        # Check definitions if available (Swagger 2.0)
        if "definitions" in data:
            print("Tables found in 'definitions':")
            for table_name in data["definitions"].keys():
                print(f" - {table_name}")
        
        # Check paths (OpenAPI 3.0)
        elif "paths" in data:
             print("Tables inferred from paths:")
             tables = set()
             for path in data["paths"].keys():
                 # /table_name or /table_name/{id}
                 parts = path.strip("/").split("/")
                 if parts:
                     tables.add(parts[0])
             for t in tables:
                 print(f" - {t}")
        else:
            print("Could not parse table names. Response keys:", data.keys())
            
    else:
        print(f"Failed to fetch schema. Status: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
