import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface GherkinStudioViewProps {
  projectId: Id<"projects"> | null;
}

export function GherkinStudioView(_props: GherkinStudioViewProps) {
  const [scenarioName, setScenarioName] = useState("Checkout journey");
  const [eventsJson, setEventsJson] = useState(
    '[{"eventType":"navigate","data":{"url":"/checkout"}},{"eventType":"click","data":{"selector":"#pay"}}]'
  );
  const [gherkinText, setGherkinText] = useState("");
  const [parsed, setParsed] = useState<string[]>([]);

  const generateFromRecording = useAction((api as any).gherkin.generateFromRecording);
  const parse = useAction((api as any).gherkin.parse);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-6">
      <header>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">Gherkin Studio</h1>
        <p className="mt-1.5 text-[14px] text-ink-secondary">Generate and parse BDD features from recorded events.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
        <input
          className="h-9 w-full rounded-lg border border-line bg-surface-1 px-3 text-[13.5px] text-ink placeholder:text-ink-muted"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="Scenario name"
        />
        <textarea
          className="min-h-[120px] w-full rounded-lg border border-line bg-surface-1 px-3 py-2 font-mono text-[12px] text-ink placeholder:text-ink-muted"
          value={eventsJson}
          onChange={(e) => setEventsJson(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              const result = await generateFromRecording({ name: scenarioName, events: JSON.parse(eventsJson) });
              setGherkinText(result.gherkin);
            }}
          >
            Generate Gherkin
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const result = await parse({ gherkin: gherkinText });
              setParsed(result.steps ?? []);
            }}
          >
            Parse Steps
          </Button>
        </div>
      </section>

      {gherkinText && (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="text-[15px] font-semibold text-ink">Generated Feature</h2>
          <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-ink-secondary">{gherkinText}</pre>
        </section>
      )}

      {parsed.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="text-[15px] font-semibold text-ink">Parsed Steps</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[13.5px] text-ink-secondary">
            {parsed.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
