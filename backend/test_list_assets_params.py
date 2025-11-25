import urllib.request
import urllib.error
import json

API_URL = "http://localhost:8000/api/assets/?category=technical"

def test_list():
    print(f"Sending GET to {API_URL}...")
    try:
        with urllib.request.urlopen(API_URL) as response:
            print(f"Status Code: {response.status}")
            content = response.read().decode('utf-8')
            print(f"Response: {content}")
            
            assets = json.loads(content)
            if isinstance(assets, list):
                print(f"SUCCESS: Retrieved {len(assets)} assets.")
            else:
                print("FAILURE: Response is not a list.")
                exit(1)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")
        exit(1)
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == "__main__":
    test_list()
