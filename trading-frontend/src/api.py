# api.py
from flask import Flask, request, jsonify
from ollama_service import TradingChatbot

app = Flask(__name__)
chatbot = TradingChatbot()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    response = chatbot.query(data['query'])
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(port=5000)