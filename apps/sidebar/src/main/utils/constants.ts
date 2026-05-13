import type { Tab } from "./types";

export const ALL_TABS: Tab[] = ["chat", "facts", "bias", "claim", "history"];

export const DEFAULT_TAB: Tab = "chat";

export const TAB_LABEL: Record<Tab, string> = {
  chat: "Chat",
  facts: "Verify",
  bias: "Bias",
  claim: "Vouch",
  history: "History",
};
