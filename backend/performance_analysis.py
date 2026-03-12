import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def load_signals(filename="signal_log.jsonl"):
    with open(filename, "r") as f:
        return [json.loads(line) for line in f]

def simulate_trades(signals, initial_capital=10000):
    """Simulate trades based on signals and calculate performance"""
    capital = initial_capital
    trades = []
    positions = {}  # Track open positions
    
    for signal in signals:
        pair = signal["pair"]
        combined = signal.get("combined_signal", {})
        signal_type = combined.get("signal")
        confidence = combined.get("confidence", 0)
        timestamp = signal["timestamp"]
        
        # Simple trade logic: buy/sell on signal, hold otherwise
        if signal_type in ["buy", "sell"] and confidence > 0.6:
            if pair not in positions:  # Open new position
                entry_price = 1.0  # Placeholder - you'd get this from price data
                position_size = capital * 0.02  # 2% risk per trade
                positions[pair] = {
                    "type": signal_type,
                    "entry_price": entry_price,
                    "size": position_size,
                    "entry_time": timestamp
                }
            else:  # Close existing position
                exit_price = 1.0  # Placeholder
                position = positions[pair]
                if position["type"] == "buy":
                    pnl = (exit_price - position["entry_price"]) * position["size"]
                else:
                    pnl = (position["entry_price"] - exit_price) * position["size"]
                
                capital += pnl
                trades.append({
                    "pair": pair,
                    "entry_time": position["entry_time"],
                    "exit_time": timestamp,
                    "type": position["type"],
                    "entry_price": position["entry_price"],
                    "exit_price": exit_price,
                    "pnl": pnl,
                    "capital": capital
                })
                del positions[pair]
    
    return trades, capital

def calculate_performance_metrics(trades):
    """Calculate key performance metrics"""
    if not trades:
        return {}
    
    pnls = [t["pnl"] for t in trades]
    returns = [pnl / 10000 for pnl in pnls]  # Assuming 10k initial capital
    
    # Basic metrics
    total_return = sum(pnls)
    win_rate = len([p for p in pnls if p > 0]) / len(pnls)
    avg_win = np.mean([p for p in pnls if p > 0]) if any(p > 0 for p in pnls) else 0
    avg_loss = np.mean([p for p in pnls if p < 0]) if any(p < 0 for p in pnls) else 0
    profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else float('inf')
    
    # Risk metrics
    max_drawdown = calculate_max_drawdown([t["capital"] for t in trades])
    sharpe_ratio = calculate_sharpe_ratio(returns)
    
    return {
        "total_trades": len(trades),
        "total_return": total_return,
        "win_rate": win_rate,
        "avg_win": avg_win,
        "avg_loss": avg_loss,
        "profit_factor": profit_factor,
        "max_drawdown": max_drawdown,
        "sharpe_ratio": sharpe_ratio
    }

def calculate_max_drawdown(capital_curve):
    """Calculate maximum drawdown"""
    peak = np.maximum.accumulate(capital_curve)
    drawdown = (capital_curve - peak) / peak
    return abs(np.min(drawdown))

def calculate_sharpe_ratio(returns, risk_free_rate=0.02):
    """Calculate Sharpe ratio"""
    if not returns or np.std(returns) == 0:
        return 0
    excess_returns = np.array(returns) - risk_free_rate / 252
    return np.mean(excess_returns) / np.std(excess_returns) * np.sqrt(252)

def plot_equity_curve(trades):
    """Plot equity curve from trades"""
    if not trades:
        print("No trades to plot")
        return
    
    capitals = [t["capital"] for t in trades]
    plt.figure(figsize=(10, 6))
    plt.plot(capitals, label='Equity Curve', linewidth=2)
    plt.title('Trading Performance - Equity Curve')
    plt.xlabel('Trade Number')
    plt.ylabel('Capital ($)')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()

def main():
    # Load and analyze signals
    signals = load_signals()
    if not signals:
        print("No signals found. Run the real-time monitor first.")
        return
    
    # Simulate trades
    trades, final_capital = simulate_trades(signals)
    
    # Calculate performance
    metrics = calculate_performance_metrics(trades)
    
    # Print results
    print("=== TRADING PERFORMANCE ANALYSIS ===")
    print(f"Total Trades: {metrics.get('total_trades', 0)}")
    print(f"Total Return: ${metrics.get('total_return', 0):.2f}")
    print(f"Win Rate: {metrics.get('win_rate', 0):.1%}")
    print(f"Profit Factor: {metrics.get('profit_factor', 0):.2f}")
    print(f"Max Drawdown: {metrics.get('max_drawdown', 0):.1%}")
    print(f"Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}")
    
    # Plot equity curve
    if trades:
        plot_equity_curve(trades)
    
    # Save results
    pd.DataFrame(trades).to_csv("trade_history.csv", index=False)
    print("\nTrade history saved to 'trade_history.csv'")

if __name__ == "__main__":
    main()