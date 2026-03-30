import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  return <>{children}</>;
}
