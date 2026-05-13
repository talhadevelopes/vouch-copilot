import { useCallback, useEffect, useState } from "react";
import { clearExtensionAuth, exchangeExtensionCode, hasExtensionAuth } from "../../lib/api";

export function useExtensionAuth() {
  const [authState, setAuthState] = useState(hasExtensionAuth() ? "Connected" : "Not connected");

  useEffect(() => {
    const checkAuth = () => {
      setAuthState(hasExtensionAuth() ? "Connected" : "Not connected");
    };

    // Listen for storage changes (if tokens are updated in another context)
    window.addEventListener('storage', checkAuth);
    // Custom event for internal updates
    window.addEventListener('vouch-auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('vouch-auth-change', checkAuth);
    };
  }, []);

  const connectWithCode = useCallback(async (code: string) => {
    await exchangeExtensionCode(code);
    setAuthState("Connected");
    window.dispatchEvent(new Event('vouch-auth-change'));
  }, []);

  const logout = useCallback(() => {
    clearExtensionAuth();
    setAuthState("Not connected");
    window.dispatchEvent(new Event('vouch-auth-change'));
  }, []);

  return {
    authState,
    connectWithCode,
    logout,
  };
}
