import requests
import json

def test_market_data_api():
    try:
        response = requests.get("http://localhost:8000/api/market-data")
        if response.status_code == 200:
            data = response.json()
            print("✅ Market Data API Test: Success")
            print("Data received:", json.dumps(data, indent=2))
            return True
        else:
            print(f"❌ Market Data API Test Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Market Data API Test Failed: {e}")
        return False

if __name__ == "__main__":
    test_market_data_api() 