import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mc.privacy_mode";

interface PrivacyContextType {
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  privacyMode: false,
  setPrivacyMode: () => {},
  togglePrivacyMode: () => {},
});

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacy must be used within PrivacyProvider");
  return ctx;
}

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyModeState] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, privacyMode ? "1" : "0");
    }
  }, [privacyMode]);

  const setPrivacyMode = useCallback((value: boolean) => setPrivacyModeState(value), []);
  const togglePrivacyMode = useCallback(() => setPrivacyModeState((v) => !v), []);

  return (
    <PrivacyContext.Provider value={{ privacyMode, setPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}
