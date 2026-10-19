
const axios = require("axios");

const BASE_URL = "https://api.jerexd.my.id";
const API_ENDPOINT = `${BASE_URL}/api/ai/aichat`;

// Menggunakan Environment Variable jika tersedia.
const API_KEY =
  process.env.JEREXD_API_KEY || "jere_sTl9OLzPIyMn";

const DEFAULT_MODEL = "openai/gpt-4o";
const MAX_PROMPT_LENGTH = 12000;

const AVAILABLE_MODELS = [
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

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

function getString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function extractAnswer(data) {
  if (typeof data === "string") {
    return data.trim();
  }

  const candidates = [
    data?.result,
    data?.answer,
    data?.response,
    data?.message,
    data?.data?.result,
    data?.data?.answer,
    data?.data?.response,
    data?.choices?.[0]?.message?.content,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      error: "Method tidak didukung.",
    });
  }

  try {
    const body = getBody(req);
    const query = req.query || {};

    const action = getString(body.action || query.action);

    // Mengembalikan daftar model untuk frontend.
    if (action === "models") {
      return res.status(200).json({
        success: true,
        defaultModel: DEFAULT_MODEL,
        models: AVAILABLE_MODELS,
      });
    }

    const question = getString(
      body.question ||
      body.prompt ||
      query.question ||
      query.prompt
    );

    const model = getString(
      body.model || query.model,
      DEFAULT_MODEL
    );

    const sessionId = getString(
      body.session_id ||
      body.sessionId ||
      query.session_id ||
      query.sessionId
    );

    const resetValue = body.reset ?? query.reset;
    const reset = resetValue === true ||
      String(resetValue).toLowerCase() === "true";

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Pertanyaan tidak boleh kosong.",
      });
    }

    if (question.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        success: false,
        error: "Pertanyaan terlalu panjang.",
      });
    }

    if (!AVAILABLE_MODELS.includes(model)) {
      return res.status(400).json({
        success: false,
        error: "Model tidak tersedia.",
        models: AVAILABLE_MODELS,
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "session_id wajib diisi.",
      });
    }

    if (sessionId.length > 150) {
      return res.status(400).json({
        success: false,
        error: "session_id terlalu panjang.",
      });
    }

    const params = {
      apikey: API_KEY,
      prompt: question,
      model,
      session_id: sessionId,
    };

    if (reset) {
      params.reset = "true";
    }

    const response = await axios.get(API_ENDPOINT, {
      params,
      timeout: 60000,
      headers: {
        Accept: "application/json",
      },
    });

    const data = response.data;

    if (data?.status === false) {
      return res.status(400).json({
        success: false,
        error: data.message || "JERE-API menolak permintaan.",
        models: data.models || undefined,
      });
    }

    const answer = extractAnswer(data);

    if (!answer) {
      console.error(
        "JERE-API tidak mengembalikan jawaban yang terbaca."
      );

      return res.status(502).json({
        success: false,
        error: "Jawaban AI kosong atau format respons tidak dikenali.",
      });
    }

    return res.status(200).json({
      success: true,
      answer,
      model: data?.model || model,
      session_id: data?.session_id || sessionId,
      history_count: data?.history_count ?? null,
      sources: Array.isArray(data?.sources) ? data.sources : [],
      similarQuestions: Array.isArray(data?.similarQuestions)
        ? data.similarQuestions
        : [],
    });
  } catch (error) {
    console.error("Smart-AI API error:", {
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });

    const status = error.response?.status;

    return res.status(status === 429 ? 429 : 502).json({
      success: false,
      error:
        error.response?.data?.message ||
        "Smart-AI gagal terhubung ke JERE-API. Silakan coba lagi.",
    });
  }
};
