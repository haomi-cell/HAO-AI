const axios = require("axios");

const BASE_URL = "https://api.jerexd.my.id";

// API key utama JERE API
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

const MODEL_DIRECTORY = {
  "openai/gpt-4o": ["GPT-4o", "OpenAI"],
  "openai/gpt-4o-mini": ["GPT-4o mini", "OpenAI"],
  "openai/gpt-5.6-terra": ["GPT-5.6 Terra", "OpenAI"],
  "openai/gpt-5.5": ["GPT-5.5", "OpenAI"],
  "openai/gpt-5.4": ["GPT-5.4", "OpenAI"],
  "openai/gpt-5.3-chat": ["GPT-5.3 Chat", "OpenAI"],
  "openai/gpt-5.1-instant": ["GPT-5.1 Instant", "OpenAI"],
  "openai/gpt-5": ["GPT-5", "OpenAI"],
  "chatday/ai-chat": ["Chatday AI", "Chatday"],
  "xai/grok-4.1-fast-non-reasoning": ["Grok 4.1 Fast", "xAI"],
  "anthropic/claude-haiku-4.5": ["Claude Haiku 4.5", "Anthropic"],
  "anthropic/claude-sonnet-5": ["Claude Sonnet 5", "Anthropic"],
  "anthropic/claude-sonnet-4.6": ["Claude Sonnet 4.6", "Anthropic"],
  "anthropic/claude-opus-4.5": ["Claude Opus 4.5", "Anthropic"],
  "anthropic/claude-opus-4.6": ["Claude Opus 4.6", "Anthropic"],
  "anthropic/claude-opus-4.7": ["Claude Opus 4.7", "Anthropic"],
  "anthropic/claude-opus-4.8": ["Claude Opus 4.8", "Anthropic"],
  "deepseek/deepseek-v4-pro": ["DeepSeek V4 Pro", "DeepSeek"],
  "deepseek/deepseek-v4-flash": ["DeepSeek V4 Flash", "DeepSeek"],
  "deepseek/deepseek-v3.2-thinking": ["DeepSeek V3.2 Thinking", "DeepSeek"],
  "gemini-2.0-pro": ["Gemini 2.0 Pro", "Google"],
  "gemini-pro": ["Gemini Pro", "Google"],
  "gemini-flash": ["Gemini Flash", "Google"],
  "google/gemini-3.1-pro-preview": ["Gemini 3.1 Pro", "Google"],
  "google/gemini-3-pro-preview": ["Gemini 3 Pro", "Google"],
  "google/gemini-3.1-flash-lite": ["Gemini 3.1 Flash Lite", "Google"],
  "microsoft/copilot": ["Microsoft Copilot", "Microsoft"],
  "alibaba/qwen3-max": ["Qwen3 Max", "Alibaba"],
  "meta/llama-4-maverick": ["Llama 4 Maverick", "Meta"],
  "moonshotai/kimi-k2.6": ["Kimi K2.6", "Moonshot AI"],
};

const ALLOWED_MODELS = Object.keys(MODEL_DIRECTORY);

const CITY_KNOWLEDGE_BASE = {
  jombang:
    "Ini adalah deskripsi tentang Jombang: Kabupaten Jombang adalah sebuah wilayah kabupaten strategis di bagian tengah Provinsi Jawa Timur, Indonesia. Ibu kotanya berada di Kecamatan Jombang. Wilayah ini dikenal luas dengan julukan 'Kota Santri' karena banyaknya pondok pesantren besar bersejarah (seperti Tebuireng, Bahrul Ulum Tambakberas, Darul Ulum Rejoso, dan Denanyar) serta menjadi tempat kelahiran banyak tokoh besar nasional.",
  surabaya:
    "Ini adalah deskripsi tentang Surabaya: Kota Surabaya adalah ibu kota Provinsi Jawa Timur sekaligus kota metropolitan terbesar kedua di Indonesia setelah Jakarta. Dikenal sebagai 'Kota Pahlawan', Surabaya merupakan pusat perdagangan, industri, maritim, dan pendidikan utama di kawasan Indonesia Timur.",
  malang:
    "Ini adalah deskripsi tentang Malang: Kota Malang adalah sebuah kota di Provinsi Jawa Timur yang terletak di dataran tinggi yang sejuk. Dikenal sebagai 'Kota Pendidikan' dan 'Kota Bunga', Malang menjadi salah satu destinasi pariwisata dan pusat perguruan tinggi terkemuka di Indonesia.",
  jakarta:
    "Ini adalah deskripsi tentang Jakarta: Jakarta (DKI Jakarta) adalah pusat perekonomian, bisnis, diplomasi, dan pemerintahan berskala megapolitan di Indonesia yang terletak di pesisir barat laut Pulau Jawa.",
  bandung:
    "Ini adalah deskripsi tentang Bandung: Kota Bandung adalah ibu kota Provinsi Jawa Barat yang dikelilingi pegunungan sejuk. Dikenal dengan julukan 'Kota Kembang' dan 'Paris van Java', Bandung merupakan pusat industri kreatif, pendidikan tinggi, dan kuliner populer.",
  yogyakarta:
    "Ini adalah deskripsi tentang Yogyakarta: Kota Yogyakarta adalah ibu kota Daerah Istimewa Yogyakarta yang dikenal sebagai 'Kota Pelajar', pusat kebudayaan Jawa klasik, keraton bersejarah, serta tujuan wisata unggulan di Indonesia.",
  semarang:
    "Ini adalah deskripsi tentang Semarang: Kota Semarang adalah ibu kota Provinsi Jawa Tengah sekaligus kota pelabuhan, perdagangan, dan industri utama di jalur pantai utara (Pantura) Pulau Jawa yang terkenal dengan kawasan bersejarah Kota Lama.",
};

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
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

function buildMultipartPayload(fields = {}, filePart = null) {
  const boundary = `----HaomiFormBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
  const chunks = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val === undefined || val === null) continue;
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
          `${String(val)}\r\n`,
        "utf-8"
      )
    );
  }

  if (filePart && filePart.buffer) {
    const fieldName = filePart.fieldName || "file";
    const fileName = (filePart.fileName || "icon.png").replace(/"/g, "");
    const mimeType = filePart.mimeType || "application/octet-stream";
    chunks.push(
      Buffer.from(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
          `Content-Type: ${mimeType}\r\n\r\n`,
        "utf-8"
      )
    );
    chunks.push(filePart.buffer);
    chunks.push(Buffer.from("\r\n", "utf-8"));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, "utf-8"));
  return {
    boundary,
    buffer: Buffer.concat(chunks),
  };
}

function getModelMeta(modelId) {
  const entry = MODEL_DIRECTORY[modelId];
  if (entry) {
    return { name: entry[0], provider: entry[1] };
  }
  const clean = String(modelId || "GPT-4o");
  if (clean.includes("/")) {
    const [prov, name] = clean.split("/");
    return { name: name || clean, provider: prov || "AI" };
  }
  return { name: clean, provider: "AI" };
}

function getScopedSessionId(baseSessionId, modelId) {
  const slug = String(modelId || "default")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 28);
  const cleanBase = String(baseSessionId || "HAOMI_XML")
    .replace(/_[a-z0-9_]{2,30}$/i, "");
  return `${cleanBase}_${slug}`;
}

function sanitizeAiIdentity(text, modelId) {
  if (typeof text !== "string" || !text.trim()) return text;
  const { name, provider } = getModelMeta(modelId);
  let out = text;

  // Ganti kalimat perkenalan bawaan UnlimitedAI.Chat agar sesuai mesin model yang dipilih user
  out = out.replace(
    /Saya\s+(?:adalah\s+)?UnlimitedAI(?:\.Chat)?\s*,\s*sebuah\s+model\s+bahasa\s+yang\s+dikembangkan\s+oleh\s+tim\s+UnlimitedAI(?:\.Chat)?\.?/gi,
    `Saya **HAOMI AI** yang berjalan menggunakan mesin model **${name}** (${provider}).`
  );
  out = out.replace(
    /I\s+am\s+UnlimitedAI(?:\.Chat)?\s*,\s*a\s+language\s+model\s+developed\s+by\s+the\s+UnlimitedAI(?:\.Chat)?\s+team\.?/gi,
    `Saya **HAOMI AI** yang berjalan menggunakan mesin model **${name}** (${provider}).`
  );
  out = out.replace(/tim\s+UnlimitedAI(?:\.Chat)?/gi, `tim ${provider} pada konsol HAOMI AI`);
  out = out.replace(/UnlimitedAI\.Chat/gi, `HAOMI AI (${name})`);
  out = out.replace(/UnlimitedAI/gi, `HAOMI AI (${name})`);
  return out;
}

function extractAiAnswer(data, modelId = "openai/gpt-4o") {
  if (typeof data === "string") return sanitizeAiIdentity(data.trim(), modelId);
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
      return sanitizeAiIdentity(item.trim(), modelId);
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
        return sanitizeAiIdentity(nested.trim(), modelId);
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

async function callJerexd(endpoint, params = {}) {
  const response = await http.get(endpoint, {
    params: {
      apikey: API_KEY,
      ...params,
    },
  });

  return response.data;
}

async function tryGeminiFallback(promptText, sessionId, preferredModel = "gemini-2.0-pro", displayModelId = preferredModel) {
  try {
    let data = await callJerexd("/api/ai/gemini", {
      prompt: promptText,
      model: preferredModel,
      chatId: sessionId,
    });
    if (
      data?.status === false &&
      Array.isArray(data?.models) &&
      data.models.length > 0
    ) {
      const resolvedModel = resolveBestGeminiModel(preferredModel, data.models);
      data = await callJerexd("/api/ai/gemini", {
        prompt: promptText,
        model: resolvedModel,
        chatId: sessionId,
      });
    }
    if (data && data.status !== false) {
      const ans = extractAiAnswer(data, displayModelId);
      if (ans) return { data, answer: ans };
    }
  } catch {
    // ignore
  }
  return null;
}

async function tryCopilotFallback(queryText, displayModelId = "microsoft/copilot") {
  try {
    const data = await callJerexd("/api/ai/copilot", {
      query: queryText,
    });
    if (data && data.status !== false) {
      const ans = extractAiAnswer(data, displayModelId);
      if (ans) return { data, answer: ans };
    }
  } catch {
    // ignore
  }
  return null;
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

  const rawSessionId =
    getInput(req, "chatId") ||
    getInput(req, "session_id") ||
    `HAOMI_XML_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const baseSessionId = isReset
    ? `HAOMI_XML_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    : rawSessionId;

  // Pisahkan session_id per model agar saat user ganti model di satu ruang chat,
  // mesin baru tidak mewarisi memori perkenalan dari mesin sebelumnya.
  const scopedSessionId = getScopedSessionId(baseSessionId, model);
  const { name: modelLabel, provider: providerLabel } = getModelMeta(model);

  const identityGuard = `[Identitas Mesin: Kamu adalah HAOMI AI yang berjalan menggunakan mesin model ${modelLabel} (${providerLabel}). Jika ditanya siapa kamu atau menggunakan model apa, jawab bahwa kamu adalah HAOMI AI dengan mesin ${modelLabel} dari ${providerLabel}. Jangan pernah menyebut UnlimitedAI.Chat.]`;

  const promptWithIdentity = prompt.includes("Identitas Mesin:")
    ? prompt
    : `${identityGuard}\n\n${prompt}`;

  // 1. Endpoint Microsoft Copilot (/api/ai/copilot?apikey=...&query=...)
  if (isCopilot) {
    const primaryQuery = !isReset && contextPrompt ? contextPrompt : promptWithIdentity;
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
      const gemFallback = await tryGeminiFallback(promptWithIdentity, scopedSessionId, "gemini-2.0-pro", model);
      if (gemFallback) {
        return sendJson(res, 200, {
          success: true,
          message: "Berhasil mendapatkan jawaban.",
          session_id: baseSessionId,
          model: "microsoft/copilot",
          answer: gemFallback.answer,
          raw: gemFallback.data,
        });
      }
      return sendJson(res, 502, {
        success: false,
        message: data.message || "Copilot AI belum berhasil menjawab.",
        details: data,
        session_id: baseSessionId,
      });
    }

    const answer = extractAiAnswer(data, model);
    return sendJson(res, 200, {
      success: true,
      message: "Berhasil mendapatkan jawaban dari Copilot.",
      session_id: baseSessionId,
      model: "microsoft/copilot",
      stateless_session: true,
      answer: answer || data,
      raw: data,
    });
  }

  // 2. Endpoint Gemini AI (/api/ai/gemini?apikey=...&prompt=...&model=...&chatId=HAOMI_XML)
  if (isGeminiDirect) {
    const targetUrl = getInput(req, "url", "");
    const geminiParams = {
      prompt: promptWithIdentity,
      model,
      chatId: scopedSessionId,
      ...(targetUrl ? { url: targetUrl } : {}),
    };

    let data;
    try {
      data = await callJerexd("/api/ai/gemini", geminiParams);
    } catch {
      data = { status: false };
    }

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

    if (data?.status === false && rawPrompt) {
      try {
        data = await callJerexd("/api/ai/gemini", {
          prompt: `${identityGuard}\n\n${rawPrompt}`,
          model: "gemini-pro",
          chatId: scopedSessionId,
        });
      } catch {}
    }

    if (data?.status === false) {
      const copFallback = await tryCopilotFallback(promptWithIdentity, model);
      if (copFallback) {
        return sendJson(res, 200, {
          success: true,
          message: "Berhasil mendapatkan jawaban.",
          session_id: baseSessionId,
          chatId: baseSessionId,
          model,
          answer: copFallback.answer,
          raw: copFallback.data,
        });
      }
      return sendJson(res, 502, {
        success: false,
        message: data?.message || "Gemini AI tidak berhasil menjawab.",
        availableGeminiModels: data?.models || undefined,
        details: data,
        session_id: baseSessionId,
        chatId: baseSessionId,
      });
    }

    const answer = extractAiAnswer(data, model);

    return sendJson(res, 200, {
      success: true,
      message: "Berhasil mendapatkan jawaban dari Gemini.",
      session_id: baseSessionId,
      chatId: baseSessionId,
      model: data?.model || model,
      answer: answer || data,
      raw: data,
    });
  }

  // 3. Endpoint AI Chat Multi-Model (/api/ai/aichat) dengan Sesi Terisolasi per Mesin & Auto-Failover
  let data;
  try {
    data = await callJerexd("/api/ai/aichat", {
      prompt: promptWithIdentity,
      model,
      session_id: scopedSessionId,
      ...(isReset ? { reset: "true" } : {}),
    });
  } catch {
    data = { status: false };
  }

  if (data?.status === false) {
    const freshSessionId = `HAOMI_XML_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    try {
      data = await callJerexd("/api/ai/aichat", {
        prompt: `${identityGuard}\n\n${rawPrompt || prompt}`,
        model,
        session_id: getScopedSessionId(freshSessionId, model),
      });
    } catch {
      data = { status: false };
    }
  }

  if (data?.status === false && model !== "openai/gpt-4o") {
    try {
      data = await callJerexd("/api/ai/aichat", {
        prompt: `${identityGuard}\n\n${rawPrompt || prompt}`,
        model: "openai/gpt-4o",
        session_id: scopedSessionId,
      });
    } catch {
      data = { status: false };
    }
  }

  if (data?.status === false) {
    const gemFallback = await tryGeminiFallback(promptWithIdentity, scopedSessionId, "gemini-2.0-pro", model);
    if (gemFallback) {
      return sendJson(res, 200, {
        success: true,
        message: "Berhasil mendapatkan jawaban.",
        session_id: baseSessionId,
        model,
        answer: gemFallback.answer,
        raw: gemFallback.data,
      });
    }

    const copFallback = await tryCopilotFallback(promptWithIdentity, model);
    if (copFallback) {
      return sendJson(res, 200, {
        success: true,
        message: "Berhasil mendapatkan jawaban.",
        session_id: baseSessionId,
        model,
        answer: copFallback.answer,
        raw: copFallback.data,
      });
    }

    return sendJson(res, 502, {
      success: false,
      message: data?.message || "JERE-API tidak berhasil menjawab.",
      details: data,
      session_id: baseSessionId,
    });
  }

  const answer = extractAiAnswer(data, model);

  return sendJson(res, 200, {
    success: true,
    message: "Berhasil mendapatkan jawaban.",
    session_id: baseSessionId,
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
        : "Selamat! Akun Alight Motion Anda berhasil diproses menjadi Premium (Durasi 1 Tahun)."),
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
        : "Selamat! Akun Alight Motion Anda berhasil diverifikasi menjadi Premium (Durasi 1 Tahun)."),
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
        : "Pemindaian keamanan URL selesai."),
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
        : "Selamat! Reaksi emoji saluran WhatsApp berhasil dikirim."),
    result: data,
  });
}

// 1. Viu Premium (/api/movie/viuprem)
async function handleViuPrem(req, res) {
  const extraParams = {};
  const query = getInput(req, "query", "");
  if (query) extraParams.query = query;

  const data = await callJerexd("/api/movie/viuprem", extraParams);

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Gagal mengambil data Viu Premium."
        : "Selamat! Akses akun Viu Premium VIP berhasil diambil."),
    result: data,
  });
}

// 2. Info Kota (/api/search/infokota) + Peningkatan Deskripsi Narasi Otomatis
async function handleInfoKota(req, res) {
  const kota = requireString(
    getInput(req, "kota", getInput(req, "city", "Jombang")),
    "Nama kota"
  );

  const data = await callJerexd("/api/search/infokota", {
    kota,
  });

  // Jika API mengembalikan "Tidak ada deskripsi", susun deskripsi naratif yang jelas & lengkap
  if (data && typeof data === "object") {
    const target = data.result && typeof data.result === "object" ? data.result : data;
    const rawDesc = String(target.deskripsi || target.description || "").trim();
    const isMissingDesc =
      !rawDesc ||
      /tidak ada deskripsi|no description|-|null/i.test(rawDesc);

    const namaWilayah = target.nama || target.kota || kota;
    const prov = target.provinsi || "Indonesia";
    const negara = target.negara || "Indonesia";
    const pimpinan = target.bupati || target.walikota || target.wali_kota || target.gubernur || "";
    const keyLower = String(namaWilayah).toLowerCase().replace(/^(kabupaten|kota)\s+/i, "").trim();

    if (isMissingDesc) {
      if (CITY_KNOWLEDGE_BASE[keyLower]) {
        target.deskripsi = CITY_KNOWLEDGE_BASE[keyLower] + (pimpinan ? ` Saat ini wilayah ${namaWilayah} dipimpin oleh ${pimpinan}.` : "");
      } else {
        target.deskripsi =
          `Ini adalah deskripsi tentang ${namaWilayah}: ${namaWilayah} merupakan salah satu daerah otonom yang terletak di Provinsi ${prov}, ${negara}.` +
          (pimpinan ? ` Pemerintahan daerah ${namaWilayah} dipimpin oleh ${pimpinan}.` : "") +
          (target.url ? ` Informasi profil wilayah dan ensiklopedia resmi dapat diakses melalui ${target.url}.` : "");
      }
    } else if (!/^ini adalah deskripsi tentang/i.test(rawDesc)) {
      target.deskripsi = `Ini adalah deskripsi tentang ${namaWilayah}: ${rawDesc}`;
    }
  }

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? `Pencarian info kota ${kota} gagal.`
        : `Informasi lengkap wilayah ${kota} berhasil ditemukan.`),
    result: data,
  });
}

// 3. Tmp Files (/api/tools/tmpfiles) - Mendukung POST multipart/form-data & GET
async function handleTmpFiles(req, res) {
  const url = getInput(req, "url", "");
  const text = getInput(req, "text", "");
  const fileBase64 = getInput(req, "file_base64", "");
  const fileName = getInput(req, "file_name", "upload.bin");
  const fileMime = getInput(req, "file_mime", "application/octet-stream");

  if (fileBase64) {
    try {
      const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const { boundary, buffer: bodyBuffer } = buildMultipartPayload(
        { apikey: API_KEY, ...(url ? { url } : {}) },
        { fieldName: "file", fileName, mimeType: fileMime, buffer }
      );

      const postRes = await http.post("/api/tools/tmpfiles", bodyBuffer, {
        params: { apikey: API_KEY },
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": bodyBuffer.length,
        },
      });
      const postData = postRes.data;
      if (postData && postData.status !== false) {
        return sendJson(res, 200, {
          success: true,
          message: postData.message || "Selamat! File Anda berhasil diunggah ke TmpFiles Cloud.",
          result: postData,
        });
      }
    } catch {
      // Fallback di bawah
    }
  }

  const params = {};
  if (url) params.url = url;
  if (text) params.text = text;

  const data = await callJerexd("/api/tools/tmpfiles", params);

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Permintaan TmpFiles gagal."
        : "Selamat! File berhasil diproses ke penyimpanan sementara TmpFiles."),
    result: data,
  });
}

// 4. Web2APK (/api/tools/web2apk) - Menggunakan POST multipart/form-data (URL, NAME, FILE UPLOAD) + fallback GET
async function handleWeb2Apk(req, res) {
  const url = requireHttpUrl(
    getInput(req, "url", "https://hao-ai-kappa.vercel.app/"),
    "URL Website"
  );
  const name = requireString(
    getInput(req, "name", "Ai Haomi"),
    "Nama Aplikasi"
  );
  const fileBase64 = getInput(req, "file_base64", "");
  const fileName = getInput(req, "file_name", "icon.png");
  const fileMime = getInput(req, "file_mime", "image/png");

  let filePart = null;
  if (fileBase64) {
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
    filePart = {
      fieldName: "file",
      fileName,
      mimeType: fileMime,
      buffer: Buffer.from(cleanBase64, "base64"),
    };
  }

  let data = null;

  // 1. Kirim dengan metode POST multipart/form-data sesuai cURL di docs api.jerexd.my.id
  try {
    const { boundary, buffer: bodyBuffer } = buildMultipartPayload(
      { url, name, apikey: API_KEY },
      filePart
    );

    const postRes = await http.post("/api/tools/web2apk", bodyBuffer, {
      params: { apikey: API_KEY, url, name },
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": bodyBuffer.length,
      },
      timeout: 180000,
    });
    data = postRes.data;
  } catch (postErr) {
    // 2. Fallback ke GET apabila diperlukan
    try {
      data = await callJerexd("/api/tools/web2apk", { url, name });
    } catch {
      throw postErr;
    }
  }

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Pembuatan Web2APK gagal."
        : `Selamat! Aplikasi Android ${name} (.apk) berhasil dibangun.`),
    result: data,
  });
}

// 5. Cek Banned WA (/api/whatsapp/checkban)
async function handleWhatsAppCheckBan(req, res) {
  const rawNumber = requireString(
    getInput(req, "number", getInput(req, "nomor", "")),
    "Nomor WhatsApp"
  );
  const number = rawNumber.replace(/[^0-9]/g, "");

  if (!number || number.length < 7) {
    const error = new Error("Masukkan nomor WhatsApp yang valid (contoh: 081249309278).");
    error.statusCode = 400;
    throw error;
  }

  const data = await callJerexd("/api/whatsapp/checkban", {
    number,
  });

  return sendJson(res, 200, {
    success: data?.status !== false,
    message:
      data?.message ||
      (data?.status === false
        ? "Pengecekan status nomor WA gagal."
        : `Pengecekan status nomor WhatsApp ${number} selesai.`),
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

      case "viuprem":
      case "viu":
        return await handleViuPrem(req, res);

      case "infokota":
      case "kota":
        return await handleInfoKota(req, res);

      case "tmpfiles":
      case "tmpfile":
        return await handleTmpFiles(req, res);

      case "web2apk":
        return await handleWeb2Apk(req, res);

      case "checkban":
      case "wa-checkban":
        return await handleWhatsAppCheckBan(req, res);

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
            "viuprem",
            "infokota",
            "tmpfiles",
            "web2apk",
            "checkban",
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
