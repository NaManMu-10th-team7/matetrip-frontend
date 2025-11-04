import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// 1. axios의 기본 설정을 만듬
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. JWT 토큰을 자동으로 추가하는 인터셉터
client.interceptors.request.use((config) => {
  // 토큰 추가 로직

  return config;
});

export default client;
