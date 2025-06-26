import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
})

export const fetchMarketData = async () => {
  const { data } = await API.get('/market-data')
  return data
}

export const runBacktest = async (params: any) => {
  const { data } = await API.post('/backtest', {
    ...params,
    startDate: params.startDate.toISOString().split('T')[0],
    endDate: params.endDate.toISOString().split('T')[0]
  })
  return data
}

export const getPortfolioHistory = async () => {
  const { data } = await API.get('/portfolio-history')
  return data
}

export const runRLAgent = async (agentType: string) => {
  const { data } = await API.post('/run-agent', { agent_type: agentType });
  return data;
};

export async function runMultiAgent({ agent_types, pair }: { agent_types: string[], pair: string }) {
    const response = await API.post('/multi-agent', { agent_types, pair });
    return response.data;
}

export const askChatbot = async (message: string) => {
  const response = await API.post('/chat', { message });
  return response.data;
};