import streamlit as st
import plotly.express as px

def show_dashboard(backtest_results):
    st.title("Trading System Dashboard")
    
    # Portfolio Value Over Time
    fig = px.line(backtest_results['portfolio_value'], title="Portfolio Value")
    st.plotly_chart(fig)
    
    # Performance Metrics
    col1, col2, col3 = st.columns(3)
    col1.metric("Total Return", f"{backtest_results['total_return']}%")
    col2.metric("Sharpe Ratio", backtest_results['sharpe'])
    col3.metric("Max Drawdown", f"{backtest_results['max_dd']}%")
    
    # Agent Decisions Visualization
    st.subheader("Agent Decision Breakdown")
    st.bar_chart(backtest_results['agent_contributions'])