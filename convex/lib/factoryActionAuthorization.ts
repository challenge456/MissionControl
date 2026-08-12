import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { FactoryPermission } from "./companyAccess";

export async function requireFactoryActionWithAudit(
  ctx: {
    runQuery: (reference: any, args: any) => Promise<any>;
    runMutation: (reference: any, args: any) => Promise<any>;
  },
  args: {
    projectId: Id<"projects">;
    permission: FactoryPermission;
    operation: string;
  }
) {
  const decision = await ctx.runQuery(
    internal.companyContext.evaluateFactoryAction,
    { projectId: args.projectId, permission: args.permission }
  );
  if (decision.allowed) return decision;

  if (decision.projectExists) {
    await ctx.runMutation(internal.companyContext.recordFactoryActionDenial, {
      projectId: args.projectId,
      permission: args.permission,
      operation: args.operation,
      actorId: decision.actorId,
      attemptId: crypto.randomUUID(),
      reasonCode: decision.reasonCode,
    });
  }
  throw new Error("This factory operation is unavailable or unauthorized.");
}
