import { tool } from "ai";
import { z } from "zod";

// Web search tool - configure with Tavily, Serper, or other search API
export const webSearchTool = tool({
  description: "Search the web for information",
  parameters: z.object({
    query: z.string().describe("The search query"),
    numResults: z
      .number()
      .optional()
      .default(5)
      .describe("Number of results to return"),
  }),
  execute: async ({ query, numResults }) => {
    // Use Tavily search if configured
    const tavilyApiKey = process.env.TAVILY_API_KEY;

    if (!tavilyApiKey) {
      return {
        results: [],
        error:
          "Web search not configured. Set TAVILY_API_KEY to enable web search.",
      };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        max_results: numResults,
        search_depth: "basic",
      }),
    });

    if (!response.ok) {
      return {
        results: [],
        error: `Search failed: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      results: data.results.map(
        (r: { title: string; url: string; content: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
        })
      ),
    };
  },
});

// Calculator tool
export const calculatorTool = tool({
  description: "Perform mathematical calculations",
  parameters: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),
  execute: ({ expression }) => {
    try {
      // Simple and safe math expression evaluation
      // In production, use a proper math parser like mathjs
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
      const result = Function(`'use strict'; return (${sanitized})`)();
      return { result: Number(result) };
    } catch {
      return { error: "Invalid mathematical expression" };
    }
  },
});

// Current date/time tool
export const dateTimeTool = tool({
  description: "Get the current date and time",
  parameters: z.object({
    timezone: z
      .string()
      .optional()
      .describe("Timezone (e.g., 'America/New_York')"),
    format: z.enum(["iso", "human"]).optional().default("human"),
  }),
  execute: ({ timezone, format }) => {
    const now = new Date();

    if (format === "iso") {
      return { datetime: now.toISOString() };
    }

    const options: Intl.DateTimeFormatOptions = {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: timezone ?? "UTC",
    };

    return {
      datetime: now.toLocaleString("en-US", options),
      timezone: timezone ?? "UTC",
    };
  },
});

// JSON formatter tool
export const jsonFormatterTool = tool({
  description: "Format or validate JSON data",
  parameters: z.object({
    json: z.string().describe("JSON string to format"),
    action: z.enum(["format", "validate", "minify"]).default("format"),
  }),
  execute: ({ json, action }) => {
    try {
      const parsed = JSON.parse(json);

      switch (action) {
        case "format":
          return { result: JSON.stringify(parsed, null, 2) };
        case "minify":
          return { result: JSON.stringify(parsed) };
        case "validate":
          return { valid: true, message: "Valid JSON" };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
      };
    }
  },
});

// Text summarization parameters (used with LLM)
export const summarizeSchema = z.object({
  text: z.string().describe("Text to summarize"),
  maxLength: z
    .number()
    .optional()
    .describe("Maximum length of summary in words"),
  style: z
    .enum(["brief", "detailed", "bullet-points"])
    .optional()
    .default("brief"),
});

// Export all tools in a collection
export const defaultTools = {
  webSearch: webSearchTool,
  calculator: calculatorTool,
  dateTime: dateTimeTool,
  jsonFormatter: jsonFormatterTool,
};

export type DefaultTools = typeof defaultTools;
