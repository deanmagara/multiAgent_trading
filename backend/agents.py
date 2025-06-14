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
    obs, _ = env.reset()
    done = False
    rewards = []
    while not done:
        action, _ = model.predict(obs)
        obs, reward, terminated, truncated, info = env.step(action)
        done = terminated or truncated
        rewards.append(reward)
    return rewards

def multi_agent_coordination(agent_types, env_fn, **kwargs):
    results = {}
    performances = []
    for agent_type in agent_types:
        env = env_fn()
        rewards = run_agent(agent_type, env, **kwargs)
        total_reward = sum(rewards)
        performances.append(total_reward)
        results[agent_type] = {
            "rewards": rewards,
            "total_reward": total_reward
        }
    # Capital allocation: proportional to performance
    total = sum(performances)
    allocations = {agent: perf / total if total > 0 else 1/len(agent_types)
                   for agent, perf in zip(agent_types, performances)}
    results["allocations"] = allocations
    return results