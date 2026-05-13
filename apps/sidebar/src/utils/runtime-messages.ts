import type { PageData } from "../main/utils/types";

export type VouchSelectedClaimMessage = {
  type: "VOUCH_SELECTED_CLAIM";
  text: string;
};

export type DataReadyMessage = {
  type: "DATA_READY";
  payload: PageData;
};

export type GetPageDataMessage = {
  type: "GET_PAGE_DATA";
  tabId: number;
};

export type HighlightRequestMessage = {
  type: "HIGHLIGHT_REQUEST";
  tabId: number;
  text: string;
};

export type SidebarRuntimeMessage =
  | VouchSelectedClaimMessage
  | DataReadyMessage
  | GetPageDataMessage
  | HighlightRequestMessage;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSidebarRuntimeMessage(raw: unknown): SidebarRuntimeMessage | null {
  if (!isObject(raw) || typeof raw.type !== "string") return null;

  if (raw.type === "VOUCH_SELECTED_CLAIM" && typeof raw.text === "string") {
    return { type: "VOUCH_SELECTED_CLAIM", text: raw.text };
  }

  if (raw.type === "DATA_READY" && isObject(raw.payload) && typeof raw.payload.textContent === "string") {
    return { type: "DATA_READY", payload: raw.payload as PageData };
  }

  if (raw.type === "GET_PAGE_DATA" && typeof raw.tabId === "number") {
    return { type: "GET_PAGE_DATA", tabId: raw.tabId };
  }

  if (raw.type === "HIGHLIGHT_REQUEST" && typeof raw.tabId === "number" && typeof raw.text === "string") {
    return { type: "HIGHLIGHT_REQUEST", tabId: raw.tabId, text: raw.text };
  }

  return null;
}

export function sendRuntimeMessage(message: SidebarRuntimeMessage) {
  chrome.runtime.sendMessage(message);
}

export function requestPageData(tabId: number): Promise<PageData | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_PAGE_DATA", tabId }, (response: PageData | null) => {
      resolve(response?.textContent ? response : null);
    });
  });
}