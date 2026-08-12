import { Command } from "commander";
import { ConvexHttpClient } from "convex/browser";
import { anyApi as api } from "convex/server";
import chalk from "chalk";
import Table from "cli-table3";

const CONVEX_URL = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) throw new Error("CONVEX_URL or VITE_CONVEX_URL is required for Work Order commands.");
const client = new ConvexHttpClient(CONVEX_URL);

export const workOrderCommand = new Command("work-order")
  .description("Inspect governed Work Orders and verification evidence")
  .addCommand(inspectCommand());

function inspectCommand() {
  return new Command("inspect")
    .description("Show the executable specification and latest independent verification receipt")
    .argument("<work-order-id>", "Convex Work Order ID")
    .option("--json", "Print the complete JSON record")
    .action(async (workOrderId, options) => {
      const detail = await client.query(api.workOrders.get, { workOrderId: workOrderId as any }) as any;
      if (!detail) throw new Error(`Work Order not found: ${workOrderId}`);
      if (options.json) {
        console.log(JSON.stringify(detail, null, 2));
        return;
      }
      const workOrder = detail.workOrder;
      const receipt = (detail.verificationReceipts ?? [])
        .filter((item: any) => item.receiptScope === "WORK_ORDER")
        .sort((a: any, b: any) => (b.recordedAt ?? 0) - (a.recordedAt ?? 0))[0];
      const verdictColor = receipt?.verdict === "VERIFIED"
        ? chalk.green
        : receipt?.verdict === "REQUIRES_HUMAN_REVIEW"
          ? chalk.yellow
          : chalk.red;
      console.log(chalk.bold(workOrder.title));
      console.log(`${chalk.gray("State")} ${workOrder.state}  ${chalk.gray("Risk")} ${workOrder.riskLevel}  ${chalk.gray("Spec")} v${workOrder.specificationVersion ?? 1}`);
      console.log(`${chalk.gray("Verdict")} ${receipt ? verdictColor(receipt.verdict ?? "NOT_VERIFIED") : chalk.yellow("NO RECEIPT")}`);
      if (receipt?.verdictReasons?.length) console.log(`${chalk.gray("Reason")} ${receipt.verdictReasons.join(" ")}`);
      console.log("");
      const table = new Table({
        head: [chalk.cyan("Check"), chalk.cyan("Category"), chalk.cyan("Required"), chalk.cyan("Status"), chalk.cyan("Evidence")],
        style: { head: [], border: [] },
      });
      for (const check of receipt?.checks ?? workOrder.verificationContract?.checks ?? []) {
        table.push([
          check.name,
          check.category,
          check.mandatory ? "yes" : "no",
          check.status ?? "NOT RUN",
          String(check.evidenceIds?.length ?? 0),
        ]);
      }
      console.log(table.toString());
      if (!receipt) console.log(chalk.yellow("No Work Order-level independent verification receipt has been recorded."));
      if (receipt?.violations?.length) {
        console.log(chalk.red("\nViolations"));
        for (const violation of receipt.violations) console.log(`- ${violation}`);
      }
    });
}
