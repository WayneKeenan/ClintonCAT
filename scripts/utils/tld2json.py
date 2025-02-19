import os
import json
import requests

# Define file path
file_path = os.path.join("..", "..", "data", "suffix_db.json")

# Check if file exists
if not os.path.exists(file_path):
    print("File not found. Downloading...")

    # URL to fetch data from
    url = "https://publicsuffix.org/list/public_suffix_list.dat"

    try:
        # Fetch the data
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an error for HTTP issues

        # Process data into a JSON format (list of suffixes)
        suffixes = [line.strip() for line in response.text.splitlines() if line and not line.startswith("//")]

        # Save to JSON
        with open(file_path, "w") as f:
            json.dump(suffixes, f, indent=2)

        print(f"Downloaded and saved as: {file_path}")

    except requests.RequestException as error:
        print(f"Failed to download file: {error}")

else:
    print("File already exists. No action needed.")
