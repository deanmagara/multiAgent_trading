from flask import Flask, request, jsonify
from agents import run_agent
from env import make_env

app = Flask(__name__)

@app.route('/run-agent', methods=['POST'])
def run_rl_agent():
    try:
        data = request.json
        agent_type = data.get('agent_type')
        env = make_env()
        rewards = run_agent(agent_type, env)
        return jsonify({'rewards': rewards})
    except Exception as e:
        import traceback
        print(traceback.format_exc())  # This will show the error in your terminal
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return "RL Agent API is running!"

if __name__ == '__main__':
    app.run(port=5000)