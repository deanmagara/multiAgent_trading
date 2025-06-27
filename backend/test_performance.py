import time
from agents import multi_agent_coordination
from env import make_env

def test_performance():
    print("Testing multi-agent performance...")
    start_time = time.time()
    
    def env_fn():
        return make_env(pair="EURUSD=X")
    
    try:
        results = multi_agent_coordination(
            ["PPO"],  # Test with just one agent first
            env_fn,
            timesteps=500  # Very small for testing
        )
        
        end_time = time.time()
        print(f"✅ Test completed in {end_time - start_time:.2f} seconds")
        print("Results:", results)
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_performance() 