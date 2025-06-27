import ollama

def test_ollama():
    try:
        response = ollama.chat(
            model="llama2",
            messages=[
                {"role": "user", "content": "Respond with 'Ollama is working'"}
            ]
        )
        print("✅ Ollama Test:", response['message']['content'])
        return True
    except Exception as e:
        print("❌ Ollama Test Failed:", e)
        return False

if __name__ == "__main__":
    test_ollama() 