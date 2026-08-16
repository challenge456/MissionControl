import type { Id } from "../../../convex/_generated/dataModel";
import { ProgressiveFactoryView } from "./factoryExperience/ProgressiveFactoryView";

interface FactoryViewProps {
  projectId: Id<"projects"> | null;
  onNavigate?: (view: string) => void;
}

export function FactoryView(props: FactoryViewProps) {
  return <ProgressiveFactoryView {...props} />;
}
