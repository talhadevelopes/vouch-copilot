import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://vouch-server.fly.dev';

const api = axios.create({
  baseURL: API_URL,
});

export const verifyPage = (pageContent: string, pageUrl: string) =>
  api.post('/verify', { pageContent, pageUrl });

export const verifyClaim = (claim: string) =>
  api.post('/verify', { claim });

export const analyzePage = (pageContent: string, pageUrl: string) =>
  api.post('/analyze', { pageContent, pageUrl });

export const chat = (message: string, pageContent: string) =>
  api.post('/chat', { message, pageContent });

export default api;
