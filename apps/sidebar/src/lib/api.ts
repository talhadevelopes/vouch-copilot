import { createApiClient, createBrowserAuthStorage } from "@vouch/sdk";
import type { AnalysisResult, VerificationResult } from "../main/utils/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const authStorage = createBrowserAuthStorage("vouch");
const client = createApiClient(API_URL, authStorage);

export async function exchangeExtensionCode(code: string) {
  const data = await client.apiFetch<{
    user: { id: string; email: string; name: string };
    accessToken: string;
    refreshToken: string;
  }>("/auth/extension/link-code/exchange", {
    method: "POST",
    body: { code },
  });
  authStorage.setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data.user;
}

export function clearExtensionAuth() {
  authStorage.clearTokens();
}

export function hasExtensionAuth() {
  return Boolean(authStorage.getAccessToken() && authStorage.getRefreshToken());
}

export const verifyPage = async (pageContent: string, pageUrl: string) => {
  const data = await client.apiFetch<VerificationResult[] | string>("/verify", {
    method: "POST",
    body: { pageContent, pageUrl },
  });
  return { data };
};

export const analyzePage = async (pageContent: string, pageUrl: string) => {
  const data = await client.apiFetch<AnalysisResult>("/analyze", {
    method: "POST",
    body: { pageContent, pageUrl },
  });
  return { data };
};

export const scanFullPage = async (pageContent: string, pageUrl: string) => {
  const data = await client.apiFetch<{
    claims: VerificationResult[];
    analysis: AnalysisResult;
  }>("/scan", {
    method: "POST",
    body: { pageContent, pageUrl },
  });
  return { data };
};

export async function authFetch(path: string, init: RequestInit = {}) {
  const accessToken = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();

  const request = (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let response = await request(accessToken);
  if (response.status !== 401 || !refreshToken || path === "/auth/refresh") {
    return response;
  }

  const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) {
    return response;
  }

  const payload = await refreshResponse.json();
  const newAccess = payload?.data?.accessToken;
  const newRefresh = payload?.data?.refreshToken;
  if (!newAccess || !newRefresh) {
    return response;
  }

  authStorage.setTokens({ accessToken: newAccess, refreshToken: newRefresh });
  response = await request(newAccess);
  return response;
}

export async function updateAnalysis(id: string, data: any) {
  return authFetch(`/dashboard/analysis/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}