import { useEffect } from "react";
import type { PageData } from "../utils/types";
import { parseSidebarRuntimeMessage } from "../../utils/runtime-messages";

type UseRuntimeMessagesParams = {
  onSelectedClaim: (text: string) => void;
  onDataReady: (payload: PageData) => void;
};

export function useRuntimeMessages({ onSelectedClaim, onDataReady }: UseRuntimeMessagesParams) {
  useEffect(() => {
    const listener = (rawMessage: unknown) => {
      const message = parseSidebarRuntimeMessage(rawMessage);
      if (!message) return;
      if (message.type === "VOUCH_SELECTED_CLAIM") onSelectedClaim(message.text);
      if (message.type === "DATA_READY") onDataReady(message.payload);
    };

    chrome.runtime.onMessage.addListener(listener as Parameters<typeof chrome.runtime.onMessage.addListener>[0]);
    return () => {
      chrome.runtime.onMessage.removeListener(
        listener as Parameters<typeof chrome.runtime.onMessage.addListener>[0],
      );
    };
  }, [onSelectedClaim, onDataReady]);
}
