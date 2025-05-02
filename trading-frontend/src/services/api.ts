import axios from 'axios'

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
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