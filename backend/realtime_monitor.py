import asyncio
from datetime import datetime
from .ml_signal_generator import MLSignalGenerator
from .signal_generator import SignalGenerator
from .data import data_handler
from .websocket_broadcast import broadcast_signal
import json
import os

def log_signal(signal):
    with open("signal_log.jsonl", "a") as f:
        f.write(json.dumps(signal) + "\n")

signal_generator = SignalGenerator()
ml_gen = MLSignalGenerator()

# Try to load ML model, but don't fail if it doesn't exist
try:
    ml_gen.load()
    print("✅ ML model loaded successfully")
except FileNotFoundError:
    print("⚠️ ML model not found. Using technical signals only.")
    ml_gen = None

async def real_time_monitor():
    pairs = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "AUDUSD=X", "USDCAD=X", "NZDUSD=X"]
    print(" Starting real-time monitor...")
    
    while True:
        for pair in pairs:
            try:
                df = data_handler.fetch_intraday_data(pair, interval="1m", period="1d")
                if df is not None and not df.empty:
                    # ML Signal (if available)
                    if ml_gen:
                        ml_signal = ml_gen.predict(df)
                        print(f"ML Signal for {pair}: {ml_signal}")
                    else:
                        ml_signal = {"signal": "hold", "confidence": 0.5}
                    
                    # Technical signals
                    tech_signals = signal_generator.generate_signals_for_pair(pair)
                    tech_signal = tech_signals[0] if tech_signals else {"direction": "hold", "confidence": 0.0}
                    print(f"Technical signals for {pair}: {tech_signal}")
                    
                    # Combine signals
                    combined = combine_signals(ml_signal, tech_signal)
                    
                    # Create signal payload
                    signal_payload = {
                        "pair": pair,
                        "timestamp": datetime.now().isoformat(),
                        "ml_signal": ml_signal,
                        "tech_signal": tech_signal,
                        "combined_signal": combined
                    }
                    
                    # Broadcast and log
                    await broadcast_signal(signal_payload)
                    log_signal(signal_payload)
                    print(f" Broadcasted signal for {pair}: {combined}")
                    
            except Exception as e:
                print(f"❌ Error processing {pair}: {e}")
                
        print("⏰ Waiting 60 seconds before next update...")
        await asyncio.sleep(60)  # Wait 1 minute

def combine_signals(ml_signal, tech_signal):
    """Combine ML and technical signals"""
    if ml_signal['signal'] == tech_signal['direction']:
        final_signal = ml_signal['signal']
        confidence = (ml_signal['confidence'] + tech_signal['confidence']) / 2 + 0.1
    else:
        final_signal = 'hold'
        confidence = min(ml_signal['confidence'], tech_signal['confidence']) / 2
    return {"signal": final_signal, "confidence": confidence}

if __name__ == "__main__":
    asyncio.run(real_time_monitor())