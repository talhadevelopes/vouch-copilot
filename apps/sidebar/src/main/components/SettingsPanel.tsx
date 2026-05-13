import React from 'react';
import { ExtensionAccountPanel } from './ExtensionAccountPanel';

interface SettingsPanelProps {
  verifyEnabled: boolean;
  onVerifyToggle: () => void;
  onBack: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  verifyEnabled,
  onVerifyToggle,
  onBack,
}) => {
  return (
    <div className="v-settings">
      <div>
        <h3 className="v-settings-section-title">Preferences</h3>
        <div className="v-settings-row">
          <div>
            <div className="v-settings-row-label">Verification</div>
            <div className="v-settings-row-sub">Enable to run Verify + Bias.</div>
          </div>
          <button
            onClick={onVerifyToggle}
            className={`v-toggle ${verifyEnabled ? 'active' : ''}`}
            title="Toggle verification"
          >
            <div className="v-toggle-knob" />
          </button>
        </div>

        <div className="v-about-box">
          <p className="v-about-label">About Vouch</p>
          <p className="v-about-text">
            Vouch Web Copilot uses Gemini AI to provide real-time insights.
            Verification results are cached locally to minimize API usage.
          </p>
        </div>
        <ExtensionAccountPanel />
      </div>

      <button onClick={onBack} className="v-btn-primary">
        Back to Chat
      </button>
    </div>
  );
};