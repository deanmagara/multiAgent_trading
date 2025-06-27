import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


def test_gemini_api():
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')

    if not api_key:
        print("❌ Error: GEMINI_API_KEY environment variable not found.")
        return False
    
    try:
        genai.configure(api_key=api_key)
        
        # --- SOLUTION IS HERE ---
        # Update the model name to a currently supported version
        # You can try 'gemini-1.5-pro-latest' or 'gemini-1.5-flash-latest'
        model_name = 'gemini-1.5-flash-latest' # A good, fast model to start with
        model = genai.GenerativeModel(model_name)
        
        print(f"✅ Attempting to use model: {model_name}")

        response = model.generate_content("Hello, can you respond with 'Gemini API is working'?")
        
        print("✅ Gemini API Test Succeeded:", response.text)
        return True
    except Exception as e:
        print("❌ Gemini API Test Failed:", e)
        return False

def test_news_api():
    import requests
    try:
        api_key = os.getenv('NEWS_API_KEY')
        url = "https://newsapi.org/v2/everything"
        params = {
            'q': 'forex',
            'apiKey': api_key,
            'pageSize': 1
        }
        response = requests.get(url, params=params)
        if response.status_code == 200:
            print("✅ News API Test: Success")
            return True
        else:
            print("❌ News API Test Failed:", response.status_code)
            return False
    except Exception as e:
        print("❌ News API Test Failed:", e)
        return False

if __name__ == "__main__":
    print("Testing APIs...")
    gemini_ok = test_gemini_api()
    news_ok = test_news_api()
    
    if gemini_ok and news_ok:
        print("\n🎉 All APIs are working!")
    else:
        print("\n⚠️  Some APIs failed. Check your environment variables.") 