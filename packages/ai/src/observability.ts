import { Langfuse } from "langfuse";

// Initialize Langfuse for AI observability
let langfuseInstance: Langfuse | null = null;

export function getLangfuse(): Langfuse {
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
    });
  }
  return langfuseInstance;
}

// Observability wrapper for tracing
export const observability = {
  // Create a new trace
  trace(params: {
    name: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
  }) {
    return getLangfuse().trace({
      name: params.name,
      userId: params.userId,
      sessionId: params.sessionId,
      metadata: params.metadata,
      tags: params.tags,
    });
  },

  // Create a span within a trace
  span(
    trace: ReturnType<Langfuse["trace"]>,
    params: {
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }
  ) {
    return trace.span({
      name: params.name,
      input: params.input,
      metadata: params.metadata,
    });
  },

  // Record a generation (LLM call)
  generation(
    parent:
      | ReturnType<Langfuse["trace"]>
      | ReturnType<ReturnType<Langfuse["trace"]>["span"]>,
    params: {
      name: string;
      model: string;
      input: unknown;
      output?: unknown;
      usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      };
      metadata?: Record<string, unknown>;
    }
  ) {
    return parent.generation({
      name: params.name,
      model: params.model,
      input: params.input,
      output: params.output,
      usage: params.usage,
      metadata: params.metadata,
    });
  },

  // Flush traces (call before shutdown)
  async flush() {
    if (langfuseInstance) {
      await langfuseInstance.shutdownAsync();
    }
  },

  // Score a trace or span
  score(params: {
    traceId: string;
    name: string;
    value: number;
    comment?: string;
    observationId?: string;
  }) {
    return getLangfuse().score({
      traceId: params.traceId,
      name: params.name,
      value: params.value,
      comment: params.comment,
      observationId: params.observationId,
    });
  },
};

// Helper to trace LLM calls with the Vercel AI SDK
export async function traceLLM<T>(
  params: {
    name: string;
    userId?: string;
    sessionId?: string;
    model: string;
    input: unknown;
    tags?: string[];
  },
  fn: () => Promise<T>
): Promise<T> {
  const trace = observability.trace({
    name: params.name,
    userId: params.userId,
    sessionId: params.sessionId,
    tags: params.tags,
  });

  const generation = trace.generation({
    name: "llm-call",
    model: params.model,
    input: params.input,
  });

  try {
    const result = await fn();

    generation.end({
      output: result,
    });

    return result;
  } catch (error) {
    generation.end({
      output: error instanceof Error ? error.message : "Unknown error",
      level: "ERROR",
    });
    throw error;
  }
}

export { getLangfuse as langfuse };
