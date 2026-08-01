import { createContext, useContext, type ReactNode } from "react";
import type { AuthMode } from "./authMode";

interface AuthRuntimeValue {
  mode: Exclude<AuthMode, "invalid">;
  externalUserId?: string;
  userControl?: ReactNode;
}

const AuthRuntimeContext = createContext<AuthRuntimeValue>({ mode: "legacy" });

export function AuthRuntimeProvider({
  value,
  children,
}: {
  value: AuthRuntimeValue;
  children: ReactNode;
}) {
  return (
    <AuthRuntimeContext.Provider value={value}>
      {children}
    </AuthRuntimeContext.Provider>
  );
}

export function useAuthRuntime(): AuthRuntimeValue {
  return useContext(AuthRuntimeContext);
}
