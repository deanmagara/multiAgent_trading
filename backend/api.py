from flask import Flask, request, jsonify
from agents import run_agent
from env import make_env

app = Flask(__name__)

@app.route('/run-agent', methods=['POST'])
def run_rl_agent():
    data = request.json
    agent_type = data.get('agent_type')  # "PPO", "DQN", or "A2C"
    env = make_env()
    rewards = run_agent(agent_type, env)
    return jsonify({'rewards': rewards})

if __name__ == '__main__':
    app.run(port=5000)