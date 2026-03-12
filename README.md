# AI Trading Platform with Local LLM Assistant

A full-stack algorithmic trading system combining reinforcement learning agents with natural language analysis, running entirely locally.

## Key Features

- 🚀 **Multi-Agent Trading System**: 3 RL strategies (PPO/DQN/A2C) with dynamic capital allocation
- 💬 **Local AI Assistant**: Ollama-powered chatbot for strategy Q&A and adjustments
- 📊 **Interactive Dashboard**: Real-time performance visualization with React/Three.js
- ⚡ **Backtesting Engine**: Backtrader integration with walk-forward optimization
- 🔒 **Privacy-First**: All data processing and AI runs locally (no cloud dependencies)

## Tech Stack

| Component          | Technologies                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Frontend**       | React (TypeScript), Material-UI, Recharts, Three.js, Vite                   |
| **Backend**        | Python (FastAPI), Stable Baselines3, Backtrader, TA-Lib                     |
| **AI/NLP**         | Ollama (Mistral 7B), ChromaDB (RAG), Custom prompt engineering              |
| **Infrastructure** | Docker, WebSockets, Pandas (vectorized calculations)                        |

## Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/ai-trading-platform.git
   cd ai-trading-platform
