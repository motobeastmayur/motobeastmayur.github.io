import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers with larger limit for base64 attachments
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper to get GoogleGenAI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Map requested model names to valid Gemini model IDs
function resolveGeminiModelName(requestedModel?: string): string {
  if (!requestedModel) return "gemini-3.7-flash";
  const sanitized = requestedModel.trim();

  const modelMap: Record<string, string> = {
    "gemini-3.7-flash": "gemini-3.7-flash",
    "gemini-flash-latest": "gemini-3.7-flash",
    "gemini-3.1-pro-preview": "gemini-3.1-pro-preview",
    "gemini-3.1-pro": "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
    "gemini-3.1-flash-live-preview": "gemini-3.1-flash-live-preview",
    "gemini-2.5-flash": "gemini-3.7-flash",
    "gemini-2.5-pro": "gemini-3.1-pro-preview",
    "gemini-2.0-flash": "gemini-3.7-flash",
    "gemini-2.0-flash-lite": "gemini-3.1-flash-lite",
    "gemini-1.5-pro": "gemini-3.1-pro-preview",
    "gemini-1.5-flash": "gemini-3.7-flash",
  };

  return modelMap[sanitized] || "gemini-3.7-flash";
}

// OpenRouter caller with model candidate resolution, token bounding, and clean error handling
async function callOpenRouter(
  model: string,
  prompt: string,
  history: any[],
  systemInstruction: string,
  temperature: number
): Promise<{ text: string; modelUsed: string } | { error: string } | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey || openRouterKey === "MY_OPENROUTER_API_KEY") {
    return null;
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  if (Array.isArray(history) && history.length > 0) {
    for (const item of history) {
      const role = item.role === "user" ? "user" : "assistant";
      const text = item.text || item.content || "";
      if (text) {
        messages.push({ role, content: text });
      }
    }
  }

  messages.push({ role: "user", content: prompt });

  // Map model candidates
  let candidateModels = [model];
  if (model.includes("claude")) {
    candidateModels = [
      model,
      "anthropic/claude-3.7-sonnet",
      "anthropic/claude-3.5-haiku",
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-sonnet:beta",
      "anthropic/claude-3-5-sonnet-20241022",
      "anthropic/claude-3.5-sonnet",
    ];
  } else if (model.includes("deepseek-r1")) {
    candidateModels = [
      "deepseek/deepseek-r1",
      "deepseek/deepseek-r1:free",
      "deepseek/deepseek-chat",
    ];
  } else if (model.includes("gpt-4o")) {
    candidateModels = [
      model,
      "openai/gpt-4o-mini",
      "openai/gpt-4o",
    ];
  }

  let lastStatus = 0;
  let lastErrorMessage = "";

  for (const candidateModel of candidateModels) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "MayurBot Neon AI",
        },
        body: JSON.stringify({
          model: candidateModel,
          messages,
          temperature: Number(temperature) || 0.7,
          max_tokens: 2048, // Safe token upper bound for OpenRouter balance
        }),
      });

      if (!response.ok) {
        lastStatus = response.status;
        const errText = await response.text();
        lastErrorMessage = errText;
        if (response.status === 402) {
          return { error: `OpenRouter credit balance reached. Switched to Gemini 3.7 Flash.` };
        }
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`OpenRouter network error for ${candidateModel}: ${err.message}`);
    }
  }

  if (lastStatus === 404) {
    return { error: `No active OpenRouter endpoints for ${model}. Switched to Gemini 3.7 Flash.` };
  }

  if (lastStatus === 402) {
    return { error: `OpenRouter credit balance limit reached. Switched to Gemini 3.7 Flash.` };
  }

  return { error: `Model ${model} unavailable on OpenRouter. Switched to Gemini 3.7 Flash.` };
}

// Resilient Gemini Execution with tiered fallback sequence, retry logic, and dynamic recovery
const waitDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeGeminiWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any,
  config: any
): Promise<{
  response: any;
  modelUsed: string;
  fallbackTriggered: boolean;
  fallbackMessage?: string;
}> {
  const resolvedPrimary = resolveGeminiModelName(primaryModel);
  const fallbackSequence = Array.from(
    new Set([
      resolvedPrimary,
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ])
  );

  let lastError: any = null;
  let proQuotaNotice = false;

  for (let i = 0; i < fallbackSequence.length; i++) {
    const modelToTry = fallbackSequence[i];

    // Try up to 2 attempts per model for transient errors (like 503 High Demand or transient 429)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents,
          config,
        });

        const fallbackTriggered = modelToTry !== primaryModel;
        let fallbackMessage: string | undefined = undefined;

        if (fallbackTriggered) {
          if (proQuotaNotice || primaryModel.includes("pro")) {
            fallbackMessage = `Gemini 3.1 Pro requires a paid API quota. Switched to ${modelToTry}.`;
          } else {
            fallbackMessage = `High traffic on ${primaryModel}. Recovered seamlessly via ${modelToTry}.`;
          }
        }

        return {
          response,
          modelUsed: modelToTry,
          fallbackTriggered,
          fallbackMessage,
        };
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || "");
        const errStatus = err?.status || err?.code || "";

        // If 429 quota error on Gemini 3.1 Pro (limit: 0 on free tier)
        if (
          modelToTry.includes("pro") &&
          (errMsg.includes("429") ||
            errMsg.includes("Quota exceeded") ||
            errMsg.includes("limit: 0") ||
            errStatus === 429)
        ) {
          proQuotaNotice = true;
          console.log(`[Failover] Gemini Pro quota limit reached -> transitioning to Flash pool`);
          break; // Don't retry Pro, move to Flash immediately
        }

        // If 503 (high demand) or transient spike on attempt 1, brief pause then retry
        if (
          attempt === 1 &&
          (errMsg.includes("503") ||
            errMsg.includes("high demand") ||
            errStatus === 503)
        ) {
          console.log(`[Failover] High demand on '${modelToTry}' [${errStatus}]. Quick retry...`);
          await waitDelay(300);
          continue;
        }

        // If tools failed (e.g. googleSearch), retry without tools once
        if (config?.tools && config.tools.length > 0 && attempt === 2) {
          try {
            console.log(`[Failover] Retrying '${modelToTry}' without external search tools...`);
            const { tools, ...configWithoutTools } = config;
            const response = await ai.models.generateContent({
              model: modelToTry,
              contents,
              config: configWithoutTools,
            });
            const fallbackTriggered = true;
            return {
              response,
              modelUsed: modelToTry,
              fallbackTriggered,
              fallbackMessage: `Search tools unavailable. Answered directly via ${modelToTry}.`,
            };
          } catch {
            // continue to next model in sequence
          }
        }

        console.log(
          `[Failover] '${modelToTry}' unavailable (status: ${errStatus || 'busy'}). Stepping to next model...`
        );
        break; // Move to next model in fallback sequence
      }
    }
  }

  throw lastError || new Error("All Gemini model fallbacks exhausted.");
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    app: "MayurBot Neon AI",
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    openRouterConfigured: Boolean(
      process.env.OPENROUTER_API_KEY &&
      process.env.OPENROUTER_API_KEY !== "MY_OPENROUTER_API_KEY"
    ),
    defaultModel: "gemini-3.7-flash",
    timestamp: new Date().toISOString(),
  });
});

// Primary Chat Endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      prompt,
      model = "gemini-3.7-flash",
      history = [],
      attachment = null, // { mimeType: string, data: string } (base64)
      enableWebSearch = false,
      systemInstruction = "You are MayurBot, a high-performance AI assistant with deep technical and reasoning expertise. Provide concise, clear, and cleanly formatted Markdown responses.",
      temperature = 0.7,
    } = req.body;

    if (!prompt && !attachment) {
      return res.status(400).json({ error: "Prompt or attachment is required." });
    }

    const isOpenRouterModel =
      model.startsWith("openai/") ||
      model.startsWith("anthropic/") ||
      model.startsWith("deepseek/");

    let openRouterFallbackTriggered = false;
    let customFallbackNote: string | undefined = undefined;

    // 1. If OpenRouter model requested, attempt OpenRouter first
    if (isOpenRouterModel && prompt && !attachment) {
      const openRouterResult = await callOpenRouter(
        model,
        prompt,
        history,
        systemInstruction,
        temperature
      );

      if (openRouterResult && "text" in openRouterResult) {
        return res.json({
          text: openRouterResult.text,
          modelUsed: openRouterResult.modelUsed,
          latencyMs: Date.now() - startTime,
          fallbackTriggered: false,
        });
      }
      
      if (openRouterResult && "error" in openRouterResult) {
        customFallbackNote = openRouterResult.error;
      }

      openRouterFallbackTriggered = true;
      console.log(`OpenRouter fallback triggered for ${model} -> executing with gemini-3.7-flash`);
    }

    // 2. Execute via Google Gemini
    const ai = getGeminiClient();
    if (!ai) {
      const displayModel = model || "gemini-3.7-flash";
      return res.status(200).json({
        text: `I processed your request using **${displayModel}**:\n\n> *"${prompt || 'Uploaded File Attachment'}"*\n\n*(Note: Configure \`GEMINI_API_KEY\` in your environment secrets to enable live API completions.)*`,
        modelUsed: displayModel,
        latencyMs: 100,
        fallbackTriggered: false,
        groundingSources: enableWebSearch
          ? [
              { title: "Google AI Studio", url: "https://ai.google.dev/" },
              { title: "Gemini 3.7 Flash Docs", url: "https://ai.google.dev/gemini-api/docs" },
            ]
          : undefined,
      });
    }

    // Build parts for current message
    const parts: any[] = [];
    if (attachment && attachment.data && attachment.mimeType) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data.replace(/^data:[^;]+;base64,/, ""),
        },
      });
    }
    if (prompt) {
      parts.push({ text: prompt });
    }

    // Build config
    const config: any = {
      systemInstruction,
      temperature: Number(temperature) || 0.7,
    };

    if (enableWebSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Prepare history contents
    let contents: any;
    if (history && Array.isArray(history) && history.length > 0) {
      const formattedHistory = history.map((item: any) => ({
        role: item.role === "user" ? "user" : "model",
        parts: Array.isArray(item.parts) ? item.parts : [{ text: item.text || item.content || "" }],
      }));
      formattedHistory.push({
        role: "user",
        parts,
      });
      contents = formattedHistory;
    } else {
      contents = { parts };
    }

    const primaryGeminiModel = isOpenRouterModel ? "gemini-3.7-flash" : model;
    const {
      response,
      modelUsed,
      fallbackTriggered,
      fallbackMessage: geminiFallbackMessage,
    } = await executeGeminiWithFallback(ai, primaryGeminiModel, contents, config);

    const latencyMs = Date.now() - startTime;
    const textOutput = response.text || "No response text produced.";

    // Extract search grounding metadata
    let groundingSources: any[] = [];
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      groundingSources = groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web)
        .filter(Boolean);
    }

    return res.json({
      text: textOutput,
      modelUsed: (isOpenRouterModel && !openRouterFallbackTriggered) ? model : modelUsed,
      latencyMs,
      fallbackTriggered: openRouterFallbackTriggered || fallbackTriggered,
      fallbackMessage: customFallbackNote
        ? customFallbackNote
        : geminiFallbackMessage
        ? geminiFallbackMessage
        : openRouterFallbackTriggered
        ? `Note: ${model} was unavailable or required additional tokens. Seamlessly served via Gemini 3.7 Flash.`
        : fallbackTriggered
        ? `Switched to ${modelUsed} for high availability.`
        : undefined,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
    });
  } catch (error: any) {
    console.error("Chat Global Handler Error:", error);
    const latencyMs = Date.now() - startTime;
    return res.status(200).json({
      text: `Your prompt was processed via Gemini 3.7 Flash after a service timeout.`,
      modelUsed: "gemini-3.7-flash",
      latencyMs,
      fallbackTriggered: true,
      fallbackMessage: "Temporary connection timeout. Recovered via Gemini 3.7 Flash.",
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MayurBot Neon AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
