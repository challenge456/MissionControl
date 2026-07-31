export type LocalInferenceProvider = "OLLAMA" | "LM_STUDIO" | "MLX" | "VLLM";

export type DiscoveredLocalModel = {
  modelId: string;
  displayName: string;
  capabilities: string[];
  supportsTools: boolean;
  contextWindow: number;
};

export type LocalProviderDiscovery = {
  provider: LocalInferenceProvider;
  baseUrl: string;
  status: "HEALTHY" | "UNAVAILABLE";
  models: DiscoveredLocalModel[];
  error?: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function trimBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function capabilitiesFromOllama(value: unknown) {
  const capabilities = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
  return {
    capabilities: ["text", ...(capabilities.includes("vision") ? ["vision"] : []), ...(capabilities.includes("tools") ? ["code"] : [])],
    supportsTools: capabilities.includes("tools"),
  };
}

async function discoverOllama(fetcher: FetchLike, baseUrl: string): Promise<LocalProviderDiscovery> {
  const response = await fetcher(`${baseUrl}/api/tags`);
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
  const payload = await response.json() as { models?: Array<{ name?: string }> };
  const models = await Promise.all((payload.models ?? []).slice(0, 50).map(async ({ name }) => {
    if (!name) return null;
    let capabilities = { capabilities: ["text"], supportsTools: false };
    try {
      const details = await fetcher(`${baseUrl}/api/show`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: name }),
      });
      if (details.ok) {
        const show = await details.json() as { capabilities?: unknown };
        capabilities = capabilitiesFromOllama(show.capabilities);
      }
    } catch {
      // Tags still prove the model exists; capability discovery is best effort.
    }
    return { modelId: name, displayName: name, ...capabilities, contextWindow: 32_768 };
  }));
  return { provider: "OLLAMA", baseUrl, status: "HEALTHY", models: models.filter(Boolean) as DiscoveredLocalModel[] };
}

async function discoverOpenAiCompatible(
  fetcher: FetchLike,
  provider: "LM_STUDIO" | "MLX" | "VLLM",
  baseUrl: string,
): Promise<LocalProviderDiscovery> {
  const response = await fetcher(`${baseUrl}/v1/models`);
  if (!response.ok) throw new Error(`${provider} returned ${response.status}`);
  const payload = await response.json() as { data?: Array<{ id?: string }> };
  return {
    provider,
    baseUrl,
    status: "HEALTHY",
    models: (payload.data ?? [])
      .filter((model): model is { id: string } => typeof model.id === "string")
      .map((model) => ({
        modelId: model.id,
        displayName: model.id.split("/").filter(Boolean).at(-1) ?? model.id,
        capabilities: ["text", ...(/qwen|coder|code/i.test(model.id) ? ["code"] : [])],
        supportsTools: false,
        contextWindow: 32_768,
      })),
  };
}

export async function discoverLocalInference(
  fetcher: FetchLike = fetch,
  endpoints = {
    ollama: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
    lmStudio: process.env.LM_STUDIO_BASE_URL ?? "http://127.0.0.1:1234",
    mlx: process.env.MLX_BASE_URL ?? "http://127.0.0.1:11435",
    vllm: process.env.VLLM_BASE_URL,
  },
): Promise<LocalProviderDiscovery[]> {
  const probes: Array<Promise<LocalProviderDiscovery>> = [
    discoverOllama(fetcher, trimBaseUrl(endpoints.ollama)),
    discoverOpenAiCompatible(fetcher, "LM_STUDIO", trimBaseUrl(endpoints.lmStudio)),
    discoverOpenAiCompatible(fetcher, "MLX", trimBaseUrl(endpoints.mlx)),
  ];
  if (endpoints.vllm) probes.push(discoverOpenAiCompatible(fetcher, "VLLM", trimBaseUrl(endpoints.vllm)));
  return Promise.all(probes.map(async (probe) => {
    try {
      return await probe;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider unavailable";
      const provider = probe === probes[0] ? "OLLAMA" : probe === probes[1] ? "LM_STUDIO" : probe === probes[2] ? "MLX" : "VLLM";
      const baseUrl = provider === "OLLAMA" ? trimBaseUrl(endpoints.ollama) : provider === "LM_STUDIO" ? trimBaseUrl(endpoints.lmStudio) : provider === "MLX" ? trimBaseUrl(endpoints.mlx) : trimBaseUrl(endpoints.vllm!);
      return { provider, baseUrl, status: "UNAVAILABLE", models: [], error: message };
    }
  }));
}
