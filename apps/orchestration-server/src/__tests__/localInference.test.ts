import { describe, expect, it } from "vitest";
import { discoverLocalInference } from "../localInference.js";

describe("discoverLocalInference", () => {
  it("discovers MLX models from an OpenAI-compatible endpoint", async () => {
    const fetcher = async (input: string) => {
      if (input.includes("11435/v1/models")) {
        return new Response(JSON.stringify({ data: [
          { id: "Qwen/Qwen3.5-9B" },
          { id: "/Users/test/jay-assistant-mlx" },
        ] }), { status: 200 });
      }
      return new Response("unavailable", { status: 503 });
    };

    const result = await discoverLocalInference(fetcher, {
      ollama: "http://127.0.0.1:11434",
      lmStudio: "http://127.0.0.1:1234",
      mlx: "http://127.0.0.1:11435",
      vllm: undefined,
    });

    expect(result).toContainEqual(expect.objectContaining({
      provider: "MLX",
      status: "HEALTHY",
      models: [
        expect.objectContaining({ modelId: "Qwen/Qwen3.5-9B", displayName: "Qwen3.5-9B" }),
        expect.objectContaining({ modelId: "/Users/test/jay-assistant-mlx", displayName: "jay-assistant-mlx" }),
      ],
    }));
  });
});
