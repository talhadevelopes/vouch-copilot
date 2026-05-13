import { useState } from "react";
import type { Tab } from "../utils/types";
import { DEFAULT_TAB } from "../utils/constants";

export function useSidebarUiState() {
  const [activeTab, setActiveTab] = useState<Tab>(DEFAULT_TAB);
  const [showSettings, setShowSettings] = useState(false);

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);
  const toggleSettings = () => setShowSettings((prev) => !prev);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setShowSettings(false);
  };

  return {
    activeTab,
    setActiveTab,
    showSettings,
    openSettings,
    closeSettings,
    toggleSettings,
    switchTab,
  };
}
