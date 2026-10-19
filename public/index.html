
const axios = require("axios");

const BASE_URL = "https://api.jerexd.my.id";

// API key untuk pengujian.
// Setelah tes selesai, sebaiknya pindahkan ke Environment Variables Vercel.
const API_KEY =
  process.env.JEREXD_API_KEY || "jere_sTl9OLzPIyMn";

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

async function callJerexd(endpoint, params) {
  const response = await http.get(endpoint, {
    params: {
      apikey: API_KEY,
      ...params,
    },
  });

  return response.data;
}

async function handleChat(req, res) {
  const prompt = requireString(
    getInput(req, "prompt", getInput(req, "question")),
    "Pesan"
  );

  const requestedModel = getInput(
    req,
    "model",
    "openai/gpt-4o"
  );

  const model = requestedModel === "GPT-4o"
    ? "openai/gpt-4o"
    : requestedModel;

  if (!ALLOWED_MODELS.includes(model)) {
    return sendJson(res, 400, {
      success: false,
      message: "Model tidak tersedia.",
      availableModels: ALLOWED_MODELS,
    });
  }

  // Setiap percakapan menggunakan session_id tersendiri.
  // Frontend perlu menyimpan ID yang sama untuk chat yang sama.
  const sessionId =
    getInput(req, "session_id") ||
    `haomi-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const data = await callJerexd("/api/ai/aichat", {
    prompt,
    model,
    session_id: sessionId,
    ...(getInput(req, "reset") === "true"
      ? { reset: "true" }
      : {}),
  });

  if (data?.status === false) {
    return sendJson(res, 502, {
      success: false,
      message: data.message || "JERE-API tidak berhasil menjawab.",
      details: data,
      session_id: sessionId,
    });
  }

  return sendJson(res, 200, {
    success: true,
    message: "Berhasil mendapatkan jawaban.",
    session_id: data?.session_id || sessionId,
    model: data?.model || model,
    answer:
      data?.result ??
      data?.answer ??
      data?.response ??
      data?.message ??
      data?.data ??
      data,
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
        return await handleChat(req, res);

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
