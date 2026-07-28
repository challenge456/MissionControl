/**
 * Template Renderer
 * 
 * Renders step input templates with context variables using Mustache syntax.
 * Supports {{variable}} substitution for passing data between workflow steps.
 */

export interface RenderContext {
  [key: string]: unknown;
}

/**
 * Render a template string with context variables
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param context - Context object with variable values
 * @returns Rendered string
 * 
 * @example
 * render("Hello {{name}}", { name: "World" })
 * // => "Hello World"
 * 
 * render("{{planOutput}}\n\nImplement: {{task}}", {
 *   planOutput: "Stories defined",
 *   task: "Add OAuth"
 * })
 * // => "Stories defined\n\nImplement: Add OAuth"
 */
function resolveVariable(context: RenderContext, variable: string): unknown {
  return variable.split(".").reduce<unknown>((current, key) => {
    if (current == null || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, context);
}

export function render(template: string, context: RenderContext): string {
  // Minimal Mustache-compatible variable substitution for workflow prompts.
  // Missing variables render as an empty string, matching Mustache behavior.
  // Dotted names are intentionally supported because workflow YAML uses
  // nested context references such as {{coverageThresholds.unit}}.
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, variable: string) => {
    const value = resolveVariable(context, variable.trim());
    return value == null ? "" : String(value);
  });
}

/**
 * Extract all variable names from a template
 * 
 * @param template - Template string with {{variable}} placeholders
 * @returns Array of variable names
 * 
 * @example
 * extractVariables("Hello {{name}}, your score is {{score}}")
 * // => ["name", "score"]
 */
export function extractVariables(template: string): string[] {
  const variables = new Set<string>();
  const regex = /\{\{([^}]+)\}\}/g;
  let match;
  
  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1].trim());
  }
  
  return Array.from(variables);
}

/**
 * Validate that all required variables are present in context
 * 
 * @param template - Template string with {{variable}} placeholders
 * @param context - Context object with variable values
 * @returns Array of missing variable names (empty = valid)
 */
export function validateContext(template: string, context: RenderContext): string[] {
  const required = extractVariables(template);
  const missing: string[] = [];
  
  for (const variable of required) {
    if (resolveVariable(context, variable) === undefined) {
      missing.push(variable);
    }
  }
  
  return missing;
}
