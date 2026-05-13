import React from "react";
import { useExtensionAuth } from "../hooks/useExtensionAuth";

export const ExtensionAccountPanel: React.FC = () => {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const { authState, connectWithCode, logout } = useExtensionAuth();

  const onConnect = async () => {
    try {
      setError("");
      await connectWithCode(code.trim());
      setCode("");
    } catch {
      setError("Invalid or expired code");
    }
  };

  return (
    <>
      <h3 className="v-settings-section-title v-settings-section-spaced">Account</h3>
      <div className="v-settings-row v-settings-row-stack">
        <div className="v-settings-row-sub" style={{ fontWeight: 700, color: authState === "Connected" ? "#22c55e" : "#6b7280" }}>
          Status: {authState}
        </div>
        
        {authState !== "Connected" ? (
          <>
            <input
              className="v-chat-input"
              placeholder="Enter 6-digit link code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {error ? <div className="v-settings-error">{error}</div> : null}
            <div className="v-settings-actions">
              <button onClick={onConnect} className="v-btn-primary" type="button">
                Connect
              </button>
            </div>
          </>
        ) : (
          <div className="v-settings-actions">
            <button onClick={logout} className="v-btn-primary" type="button">
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
};
