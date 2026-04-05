export interface ServerConfig {
  FOOTBALL_DATA_API_KEY: string | null;
  OPENAI_API_KEY: string | null;
  ANTHROPIC_API_KEY: string | null;
  NEXT_PUBLIC_ATG_API: boolean;
}

function cleanEnv(value: string | undefined): string | null {
  return value?.trim().replace(/^['"]|['"]$/g, "") || null;
}

export function getServerConfig(): ServerConfig {
  return {
    FOOTBALL_DATA_API_KEY: cleanEnv(process.env.FOOTBALL_DATA_API_KEY),
    OPENAI_API_KEY: cleanEnv(process.env.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: cleanEnv(process.env.ANTHROPIC_API_KEY),
    NEXT_PUBLIC_ATG_API: cleanEnv(process.env.NEXT_PUBLIC_ATG_API) === "true",
  };
}

export function getAiApiKey(): {
  apiKey: string;
  provider: "openai" | "anthropic";
} | null {
  const env = getServerConfig();
  const openaiKey = env.OPENAI_API_KEY;
  const anthropicKey = env.ANTHROPIC_API_KEY;

  if (openaiKey?.startsWith("sk-ant") || anthropicKey?.startsWith("sk-ant")) {
    return {
      apiKey: openaiKey?.startsWith("sk-ant") ? openaiKey : anthropicKey!,
      provider: "anthropic",
    };
  }

  if (openaiKey) {
    return { apiKey: openaiKey, provider: "openai" };
  }

  if (anthropicKey) {
    return { apiKey: anthropicKey, provider: "anthropic" };
  }

  return null;
}
