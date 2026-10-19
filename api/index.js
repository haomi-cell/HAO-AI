const axios = require("axios");

const BASE_URL = "https://api.jerexd.my.id";

// API key untuk pengujian.
// Setelah tes selesai, sebaiknya pindahkan ke Environment Variables Vercel.
const API_KEY =
  process.env.JEREXD_API_KEY || "jere_sTl9OLzPIyMn";

const GEMINI_DIRECT_MODELS = [
  "gemini-2.0-pro",
  "gemini-pro",
  "gemini-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
];

const COPILOT_MODELS = [
  "microsoft/copilot",
  "copilot",
];

const ALLOWED_MODELS = [
  "chatday/ai-chat",
  "openai/gpt-5.6-terra",
  "openai/gpt-5.5",
  "openai/gpt-5.4",
  "openai/gpt-5.3-chat",
  "openai/gpt-5.1-instant",
  "openai/gpt-5",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "xai/grok-4.1-fast-non-reasoning",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-sonnet-5",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-opus-4.5",
  "anthropic/claude-opus-4.6",
  "anthropic/claude-opus-4.7",
  "anthropic/claude-opus-4.8",
  "deepseek/deepseek-v4-pro",
  "deepseek/deepseek-v4-flash",
  "deepseek/deepseek-v3.2-thinking",
  "google/gemini-3.1-pro-preview",
  "google/gemini-3-pro-preview",
  "google/gemini-3.1-flash-lite",
  "gemini-2.0-pro",
  "gemini-pro",
  "gemini-flash",
  "microsoft/copilot",
  "alibaba/qwen3-max",
  "meta/llama-4-maverick",
  "moonshotai/kimi-k2.6",
];

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

function sendJson(res, statusCode, data) {
  return res.status(statusCode).json(data);
}

function getInput(req, key, fallback = "") {
  const body = req.body && typeof req.body === "object"
    ? req.body
    : {};

  const query = req.query && typeof req.query === "object"
    ? req.query
    : {};

  const value = body[key] ?? query[key] ?? fallback;

  return typeof value === "string" ? value.trim() : value;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${label} wajib diisi.`);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

function requireEmail(value) {
  const email = requireString(value, "Email");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Format email tidak valid.");
    error.statusCode = 400;
    throw error;
  }

  return email;
}

function requireHttpUrl(value, label = "URL") {
  const raw = requireString(value, label);

  let parsed;

  try {
    parsed = new URL(raw);
  } catch {
    const error = new Error(`${label} tidak valid.`);
    error.statusCode = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const error = new Error(`${label} harus menggunakan HTTP atau HTTPS.`);
    error.statusCode = 400;
    throw error;
  }

  return parsed.toString();
}

function getApiError(error) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim().slice(0, 1500);
  }

  if (data && typeof data === "object") {
    return (
      data.message ||
      data.error ||
      data.result ||
      JSON.stringify(data)
    ).toString().slice(0, 1500);
  }

  if (error?.code === "ECONNABORTED") {
    return "Permintaan ke layanan API terlalu lama. Silakan coba lagi.";
  }

  return error?.message || "Terjadi kesalahan pada layanan API.";
}

function extractAiAnswer(data) {
  if (typeof data === "string") return data.trim();
  if (!data || typeof data !== "object") return "";

  const candidates = [
    data.result,
    data.answer,
    data.response,
    data.reply,
    data.output,
    data.text,
    data.content,
    data.data,
    data.message,
  ];

  for (const item of candidates) {
    if (typeof item === "string" && item.trim()) {
      return item.trim();
    }
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const nested =
        item.result ??
        item.answer ??
        item.response ??
        item.reply ??
        item.output ??
        item.text ??
        item.content ??
        item.message;
      if (typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }
    }
  }

  return "";
}

function extractSessionId(data, fallbackId) {
  if (!data || typeof data !== "object") return fallbackId;
  const candidates = [
    data.session_id,
    data.chatId,
    data.chat_id,
    data.sessionId,
    data.result?.chatId,
    data.result?.chat_id,
    data.result?.session_id,
    data.result?.sessionId,
    data.data?.chatId,
    data.data?.chat_id,
    data.data?.session_id,
    data.data?.sessionId,
  ];

  for (const id of candidates) {
    if (typeof id === "string" && id.trim()) {
      return id.trim();
    }
  }

  return fallbackId;
}

function resolveBestGeminiModel(requestedModel, availableModels = []) {
  if (!Array.isArray(availableModels) || !availableModels.length) {
    return requestedModel || "gemini-2.0-pro";
  }
  const cleanReq = String(requestedModel || "").toLowerCase();
  if (availableModels.includes(cleanReq)) return cleanReq;

  if (cleanReq.includes("flash")) {
    const flashMatch = availableModels.find((m) =>
      String(m).toLowerCase().includes("flash")
    );
    if (flashMatch) return flashMatch;
  }

  if (cleanReq.includes("2.0")) {
    const v2Match = availableModels.find((m) =>
      String(m).toLowerCase().includes("2.0")
    );
    if (v2Match) return v2Match;
  }

  if (cleanReq.includes("pro")) {
    const proMatch = availableModels.find((m) =>
      String(m).toLowerCase().includes("pro")
    );
    if (proMatch) return proMatch;
  }

  return availableModels[0];
}

async function callJerexd(endpoint, params) {
  const response = await http.get(endpoint, {
    params: {
      apikey: API_KEY,
      ...params,
    },
  });

  return response.data;
}

async function handleGeminiModels(req, res) {
  const chatId = getInput(req, "chatId", getInput(req, "session_id", "HAOMI_XML"));
  const data = await callJerexd("/api/ai/gemini", {
    prompt: "Halo",
    model: "list",
    chatId,
  });

  return sendJson(res, 200, {
    success: true,
    models: Array.isArray(data?.models) ? data.models : GEMINI_DIRECT_MODELS,
    raw: data,
  });
}

async function handleChat(req, res) {
  const prompt = requireString(
    getInput(
      req,
      "prompt",
      getInput(req, "query", getInput(req, "question"))
    ),
    "Pesan"
  );

  const rawPrompt = getInput(req, "raw_prompt", prompt);
  const contextPrompt = getInput(req, "context_prompt", prompt);

  const requestedModel = getInput(
    req,
    "model",
    "openai/gpt-4o"
  );

  let model = requestedModel;
  if (requestedModel === "GPT-4o") {
    model = "openai/gpt-4o";
  } else if (COPILOT_MODELS.includes(requestedModel.toLowerCase())) {
    model = "microsoft/copilot";
  }

  const isGeminiDirect =
    GEMINI_DIRECT_MODELS.includes(model) ||
    model.startsWith("gemini-");
  const isCopilot = model === "microsoft/copilot";

  if (!ALLOWED_MODELS.includes(model) && !isGeminiDirect && !isCopilot) {
    return sendJson(res, 400, {
      success: false,
      message: "Model tidak tersedia.",
      availableModels: ALLOWED_MODELS,
    });
  }

  const isReset = getInput(req, "reset") === "true";

  // Setiap percakapan menggunakan session_id / chatId tersendiri.
  const rawSessionId =
    getInput(req, "chatId") ||
    getInput(req, "session_id") ||
    `HAOMI_XML_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const sessionId = isReset
    ? `HAOMI_XML_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    : rawSessionId;

  // 1. Endpoint khusus Microsoft Copilot (/api/ai/copilot?apikey=...&query=...)
  // Karena Copilot tidak memiliki session_id di server API, gunakan context_prompt
  // (dan fallback otomatis ke prompt murni bila diperlukan).
  if (isCopilot) {
    const primaryQuery = !isReset && contextPrompt ? contextPrompt : prompt;
    let data;

    try {
      data = await callJerexd("/api/ai/copilot", {
        query: primaryQuery,
      });
      if (data?.status === false && primaryQuery !== rawPrompt) {
        data = await callJerexd("/api/ai/copilot", {
          query: rawPrompt || prompt,
        });
      }
    } catch (err) {
      if (primaryQuery !== rawPrompt) {
        data = await callJerexd("/api/ai/copilot", {
          query: rawPrompt || prompt,
        });
      } else {
        throw err;
      }
    }

    if (data?.status === false) {
      return sendJson(res, 502, {
        success: false,
        message: data.message || "Copilot AI belum berhasil menjawab.",
        details: data,
        session_id: sessionId,
      });
    }

    const answer = extractAiAnswer(data);
    return sendJson(res, 200, {
      success: true,
      message: "Berhasil mendapatkan jawaban dari Copilot.",
      session_id: sessionId,
      model: "microsoft/copilot",
      stateless_session: true,
      answer: answer || data,
      raw: data,
    });
  }

  // 2. Endpoint khusus Gemini AI (/api/ai/gemini?apikey=...&prompt=...&model=...&chatId=HAOMI_XML)
  if (isGeminiDirect) {
    const targetUrl = getInput(req, "url", "");
    const geminiParams = {
      prompt,
      model,
      chatId: sessionId,
      ...(targetUrl ? { url: targetUrl } : {}),
    };

    let data = await callJerexd("/api/ai/gemini", geminiParams);

    // Jika model yang diminta mengembalikan daftar model (status: false & Array.isArray(data.models)),
    // otomatis pilih model Gemini yang valid dari daftar tersebut dan kirim ulang.
    if (
      data?.status === false &&
      Array.isArray(data?.models) &&
      data.models.length > 0 &&
      model.toLowerCase() !== "list"
    ) {
      const resolvedModel = resolveBestGeminiModel(model, data.models);
      data = await callJerexd("/api/ai/gemini", {
        ...geminiParams,
        model: resolvedModel,
      });
    }

    if (data?.status === false) {
      return sendJson(res, 502, {
        success: false,
        message: data.message || "Gemini AI tidak berhasil menjawab.",
        availableGeminiModels: data.models || undefined,
        details: data,
        session_id: sessionId,
        chatId: sessionId,
      });
    }

    const resolvedSessionId = extractSessionId(data, sessionId);
    const answer = extractAiAnswer(data);

    return sendJson(res, 200, {
      success: true,
      message: "Berhasil mendapatkan jawaban dari Gemini.",
      session_id: resolvedSessionId,
      chatId: resolvedSessionId,
      model: data?.model || model,
      answer: answer || data,
      raw: data,
    });
  }

  // 3. Endpoint AI Chat Multi-Model (/api/ai/aichat)
  const data = await callJerexd("/api/ai/aichat", {
    prompt,
    model,
    session_id: sessionId,
    ...(isReset ? { reset: "true" } : {}),
  });

  if (data?.status === false) {
    return sendJson(res, 502, {
      success: false,
      message: data.message || "JERE-API tidak berhasil menjawab.",
      details: data,
      session_id: sessionId,
    });
  }

  const answer = extractAiAnswer(data);

  return sendJson(res, 200, {
    success: true,
    message: "Berhasil mendapatkan jawaban.",
    session_id: extractSessionId(data, sessionId),
    model: data?.model || model,
    answer: answer || data,
    history_count: data?.history_count,
    raw: data,
  });
}

async function handleAlightMotionSend(req, res) {
  const email = requireEmail(getInput(req, "email"));

  const data = await callJerexd("/api/am/send", {
    email,
  });

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Permintaan Alight Motion gagal."
        : "Permintaan Alight Motion telah dikirim."),
    result: data,
  });
}

async function handleAlightMotionVerify(req, res) {
  const email = requireEmail(getInput(req, "email"));
  const link = requireHttpUrl(
    getInput(req, "link"),
    "Tautan verifikasi"
  );

  const data = await callJerexd("/api/am/verif", {
    email,
    link,
  });

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Verifikasi Alight Motion gagal."
        : "Permintaan verifikasi telah diproses."),
    result: data,
  });
}

async function handleUrlScan(req, res) {
  const url = requireHttpUrl(getInput(req, "url"));

  const data = await callJerexd("/api/tools/urlscan", {
    url,
  });

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Pemindaian URL gagal."
        : "Pemindaian URL selesai."),
    result: data,
  });
}

async function handleWhatsAppReact(req, res) {
  const url = requireHttpUrl(
    getInput(req, "url"),
    "URL WhatsApp"
  );

  const reactionInput = getInput(
    req,
    "reaction",
    "❤️"
  );

  const reactions = Array.isArray(reactionInput)
    ? reactionInput.join(",")
    : String(reactionInput)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .join(",");

  if (!reactions) {
    const error = new Error("Reaction wajib diisi.");
    error.statusCode = 400;
    throw error;
  }

  const data = await callJerexd("/api/whatsapp/reactch", {
    url,
    reaction: reactions,
  });

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Reaksi WhatsApp gagal."
        : "Permintaan reaksi WhatsApp selesai."),
    result: data,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, OPTIONS");

    return sendJson(res, 405, {
      success: false,
      message: "Metode HTTP tidak didukung.",
    });
  }

  if (!API_KEY) {
    return sendJson(res, 500, {
      success: false,
      message: "API key belum tersedia di backend.",
    });
  }

  const action = String(
    getInput(req, "action", "chat")
  ).toLowerCase();

  try {
    switch (action) {
      case "chat":
      case "gemini":
      case "copilot":
        if (action === "copilot" && !getInput(req, "model")) {
          req.body = { ...(req.body || {}), model: "microsoft/copilot" };
        } else if (action === "gemini" && !getInput(req, "model")) {
          req.body = { ...(req.body || {}), model: "gemini-2.0-pro" };
        }
        return await handleChat(req, res);

      case "gemini-models":
        return await handleGeminiModels(req, res);

      case "am-send":
        return await handleAlightMotionSend(req, res);

      case "am-verify":
      case "am-verif":
        return await handleAlightMotionVerify(req, res);

      case "urlscan":
        return await handleUrlScan(req, res);

      case "whatsapp-react":
      case "reactch":
        return await handleWhatsAppReact(req, res);

      case "models":
        return sendJson(res, 200, {
          success: true,
          models: ALLOWED_MODELS,
        });

      default:
        return sendJson(res, 400, {
          success: false,
          message: "Action tidak dikenal.",
          availableActions: [
            "chat",
            "gemini",
            "gemini-models",
            "copilot",
            "models",
            "am-send",
            "am-verify",
            "urlscan",
            "whatsapp-react",
          ],
        });
    }
  } catch (error) {
    const statusCode =
      error.statusCode ||
      error.response?.status ||
      500;

    return sendJson(res, statusCode, {
      success: false,
      message: getApiError(error),
      ...(error.response?.data
        ? { details: error.response.data }
        : {}),
    });
  }
};
