import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

export interface WorkspaceScopeValue {
  projectId: Id<"projects"> | null;
  setProjectId: Dispatch<SetStateAction<Id<"projects"> | null>>;
  project: Doc<"projects"> | null | undefined;
}

const WorkspaceScopeContext = createContext<WorkspaceScopeValue | null>(null);

export function WorkspaceScopeProvider({
  value,
  children,
}: {
  value: WorkspaceScopeValue;
  children: ReactNode;
}): JSX.Element {
  return (
    <WorkspaceScopeContext.Provider value={value}>
      {children}
    </WorkspaceScopeContext.Provider>
  );
}

export function useWorkspaceScope(): WorkspaceScopeValue {
  const value = useContext(WorkspaceScopeContext);
  if (!value) {
    throw new Error("useWorkspaceScope must be used inside WorkspaceScopeProvider");
  }
  return value;
}
