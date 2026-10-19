
"use strict";

const axios = require("axios");

const BASE_URL = "https://api.jerexd.my.id";
const API_KEY = process.env.JEREXD_API_KEY;
const TIMEOUT = 30000;

const http = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  maxRedirects: 3,
  headers: {
    Accept: "application/json",
    "User-Agent": "HAOMI-AI/1.0"
  }
});

function sendJson(res, status, data) {
  return res.status(status).json(data);
}

function getBody(req) {
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return {};
}

function requiredString(value, name, maxLength = 5000) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} wajib diisi.`);
  }

  const result = value.trim();

  if (result.length > maxLength) {
    throw new Error(`${name} terlalu panjang.`);
  }

  return result;
}

function validateEmail(value) {
  const email = requiredString(value, "Email", 254);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  return email;
}

function validateHttpUrl(value, name = "URL") {
  const input = requiredString(value, name, 8000);

  let parsed;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`${name} tidak valid.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} harus menggunakan HTTP atau HTTPS.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${name} tidak boleh berisi kredensial.`);
  }

  return parsed.toString();
}

function getApiKey() {
  if (!API_KEY) {
    const error = new Error(
      "API key belum diatur. Tambahkan JEREXD_API_KEY di Environment Variables Vercel."
    );
    error.statusCode = 500;
    throw error;
  }

  return API_KEY;
}

function upstreamError(error) {
  const status = error.response?.status;
  const data = error.response?.data;

  // Jangan mengirim konfigurasi request, API key, atau URL sensitif ke klien.
  let message = "Layanan JERE-API gagal memproses permintaan.";

  if (data && typeof data.message === "string") {
    message = data.message.slice(0, 400);
  } else if (error.code === "ECONNABORTED") {
    message = "Permintaan ke layanan AI melewati batas waktu.";
  }

  const result = new Error(message);
  result.statusCode = status && status >= 400 && status < 600 ? status : 502;
  return result;
}

async function callJerexd(path, params) {
  const response = await http.get(path, { params });
  return response.data;
}

function assertUpstreamSuccess(data) {
  if (data && typeof data === "object" && data.status === false) {
    throw new Error(
      typeof data.message === "string"
        ? data.message.slice(0, 400)
        : "Layanan menolak permintaan."
    );
  }

  return data;
}

async function chat(body) {
  const question = requiredString(
    body.question || body.prompt,
    "Pertanyaan",
    12000
  );

  const model = requiredString(
    body.model || "openai/gpt-4o",
    "Model",
    120
  );

  // ID sesi dibuat oleh frontend dan digunakan kembali untuk obrolan yang sama.
  const sessionId = requiredString(
    body.session_id || `haomi-${Date.now()}`,
    "Session ID",
    200
  );

  const data = await callJerexd("/api/ai/aichat", {
    apikey: getApiKey(),
    prompt: question,
    model,
    session_id: sessionId
  });

  assertUpstreamSuccess(data);

  const answer =
    data?.result ??
    data?.answer ??
    data?.response ??
    data?.message;

  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error(
      "Respons AI kosong. Periksa model dan format respons JERE-API."
    );
  }

  return {
    success: true,
    answer: answer.trim(),
    model: data.model || model,
    session_id: data.session_id || sessionId,
    history_count: data.history_count ?? null
  };
}

async function alightMotionSend(body) {
  const email = validateEmail(body.email);

  const data = await callJerexd("/api/am/send", {
    apikey: getApiKey(),
    email
  });

  assertUpstreamSuccess(data);

  return {
    success: true,
    tool: "alight-motion",
    message: data?.message || "Permintaan pengiriman verifikasi selesai.",
    result: data
  };
}

async function alightMotionVerify(body) {
  const email = validateEmail(body.email);
  const link = validateHttpUrl(body.link, "Tautan verifikasi");

  // Tautan verifikasi bisa mengandung kode autentikasi sensitif.
  // Jangan mencatat link ini ke log dan jangan mengembalikannya ke frontend.
  const data = await callJerexd("/api/am/verif", {
    apikey: getApiKey(),
    email,
    link
  });

  assertUpstreamSuccess(data);

  return {
    success: true,
    tool: "alight-motion",
    message: data?.message || "Permintaan verifikasi selesai.",
    result: data
  };
}

async function scanUrl(body) {
  const url = validateHttpUrl(body.url, "URL yang akan dipindai");

  const data = await callJerexd("/api/tools/urlscan", {
    apikey: getApiKey(),
    url
  });

  assertUpstreamSuccess(data);

  return {
    success: true,
    tool: "url-scan",
    message: data?.message || "Pemindaian URL selesai.",
    result: data
  };
}

async function whatsappReact(body) {
  const url = validateHttpUrl(body.url, "URL postingan WhatsApp");
  const reaction = requiredString(body.reaction, "Emoji reaksi", 300);

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL WhatsApp tidak valid.");
  }

  if (
    parsed.hostname !== "whatsapp.com" &&
    parsed.hostname !== "www.whatsapp.com"
  ) {
    throw new Error("Gunakan tautan postingan kanal WhatsApp.");
  }

  // Batasi daftar emoji agar parameter tidak digunakan untuk payload sembarang.
  const allowedEmoji = new Set([
    "👍", "❤️", "😂", "😮", "😢", "🙏", "🔥",
    "🎉", "😍", "🥰", "😋", "💦", "🙄", "🤔",
    "👏", "💯", "✨", "😊", "😎", "😅", "😡"
  ]);

  const reactions = reaction
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  if (!reactions.length || reactions.length > 10) {
    throw new Error("Masukkan 1 sampai 10 emoji reaksi.");
  }

  if (reactions.some(emoji => !allowedEmoji.has(emoji))) {
    throw new Error("Terdapat emoji yang belum didukung.");
  }

  const data = await callJerexd("/api/whatsapp/reactch", {
    apikey: getApiKey(),
    url,
    reaction: reactions.join(",")
  });

  assertUpstreamSuccess(data);

  return {
    success: true,
    tool: "whatsapp-reaction",
    message: data?.message || "Permintaan reaksi selesai.",
    result: data
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      success: true,
      app: "HAOMI",
      message: "HAOMI API aktif.",
      tools: ["chat", "am-send", "am-verify", "urlscan", "whatsapp-react"]
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      success: false,
      error: "Gunakan metode POST."
    });
  }

  try {
    const body = getBody(req);
    const action = requiredString(body.action || "chat", "Action", 40);

    let result;

    switch (action) {
      case "chat":
        result = await chat(body);
        break;

      case "am-send":
        result = await alightMotionSend(body);
        break;

      case "am-verify":
        result = await alightMotionVerify(body);
        break;

      case "urlscan":
        result = await scanUrl(body);
        break;

      case "whatsapp-react":
        result = await whatsappReact(body);
        break;

      default:
        return sendJson(res, 400, {
          success: false,
          error: "Action tidak dikenal."
        });
    }

    return sendJson(res, 200, result);
  } catch (error) {
    const safeError = error.response ? upstreamError(error) : error;
    const status = safeError.statusCode || 400;

    if (status >= 500) {
      console.error("HAOMI API error:", safeError.message);
    }

    return sendJson(res, status, {
      success: false,
      error: safeError.message || "Terjadi kesalahan pada server."
    });
  }
};
