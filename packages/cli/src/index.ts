#!/usr/bin/env node

/**
 * Mission Control CLI
 * 
 * Main entry point for the mc command.
 */

import { Command } from "commander";
import { workflowCommand } from "./commands/workflow.js";
import { workOrderCommand } from "./commands/workOrder.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name("mc")
  .description("Mission Control CLI")
  .version("0.9.0");

// Register commands
program.addCommand(workflowCommand);
program.addCommand(workOrderCommand);

// Parse arguments
program.parse(process.argv);
