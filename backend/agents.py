from stable_baselines3 import PPO, DQN, A2C

def train_agent(agent_type, env, **kwargs):
    if agent_type == "PPO":
        model = PPO("MlpPolicy", env, **kwargs)
    elif agent_type == "DQN":
        model = DQN("MlpPolicy", env, **kwargs)
    elif agent_type == "A2C":
        model = A2C("MlpPolicy", env, **kwargs)
    else:
        raise ValueError("Unknown agent type")
    model.learn(total_timesteps=kwargs.get("timesteps", 10000))
    return model

def run_agent(agent_type, env, **kwargs):
    model = train_agent(agent_type, env, **kwargs)
    obs = env.reset()
    done = False
    rewards = []
    while not done:
        action, _ = model.predict(obs)
        obs, reward, done, info = env.step(action)
        rewards.append(reward)
    return rewards