
"use strict";

/* =========================================
   SMART-AI CONFIGURATION
========================================= */

const API_URL = "/api";
const STORAGE_KEY = "smartAIChatSessions";
const ACTIVE_SESSION_KEY = "smartAIActiveSession";
const MODEL_STORAGE_KEY = "smartAISelectedModel";

const DEFAULT_MODEL = "openai/gpt-4o";

const AVAILABLE_MODELS = [
  { value: "chatday/ai-chat", label: "Chatday AI Chat", group: "Lainnya" },
  { value: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", group: "OpenAI" },
  { value: "openai/gpt-5.5", label: "GPT-5.5", group: "OpenAI" },
  { value: "openai/gpt-5.4", label: "GPT-5.4", group: "OpenAI" },
  { value: "openai/gpt-5.3-chat", label: "GPT-5.3 Chat", group: "OpenAI" },
  { value: "openai/gpt-5.1-instant", label: "GPT-5.1 Instant", group: "OpenAI" },
  { value: "openai/gpt-5", label: "GPT-5", group: "OpenAI" },
  { value: "openai/gpt-4o", label: "GPT-4o", group: "OpenAI" },
  { value: "openai/gpt-4o-mini", label: "GPT-4o Mini", group: "OpenAI" },
  { value: "xai/grok-4.1-fast-non-reasoning", label: "Grok 4.1 Fast", group: "xAI" },
  { value: "anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5", group: "Anthropic" },
  { value: "anthropic/claude-sonnet-5", label: "Claude Sonnet 5", group: "Anthropic" },
  { value: "anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6", group: "Anthropic" },
  { value: "anthropic/claude-opus-4.5", label: "Claude Opus 4.5", group: "Anthropic" },
  { value: "anthropic/claude-opus-4.6", label: "Claude Opus 4.6", group: "Anthropic" },
  { value: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7", group: "Anthropic" },
  { value: "anthropic/claude-opus-4.8", label: "Claude Opus 4.8", group: "Anthropic" },
  { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", group: "DeepSeek" },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", group: "DeepSeek" },
  { value: "deepseek/deepseek-v3.2-thinking", label: "DeepSeek V3.2 Thinking", group: "DeepSeek" },
  { value: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", group: "Google" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", group: "Google" },
  { value: "google/gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", group: "Google" },
  { value: "alibaba/qwen3-max", label: "Qwen3 Max", group: "Alibaba" },
  { value: "meta/llama-4-maverick", label: "Llama 4 Maverick", group: "Meta" },
  { value: "moonshotai/kimi-k2.6", label: "Kimi K2.6", group: "Moonshot" }
];

/* =========================================
   STATE
========================================= */

let sessions = loadSessions();
let activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || "";
let selectedModel =
  localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
let isSending = false;

if (!AVAILABLE_MODELS.some((model) => model.value === selectedModel)) {
  selectedModel = DEFAULT_MODEL;
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 12)
  );
}

function createSession() {
  const id = "smart-ai-" + createId();

  return {
    id,
    title: "Obrolan baru",
    model: selectedModel,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(saved)) return [];

    return saved.filter(
      (session) =>
        session &&
        typeof session.id === "string" &&
        Array.isArray(session.messages)
    );
  } catch (error) {
    console.warn("Riwayat Smart-AI tidak dapat dibaca:", error);
    return [];
  }
}

function saveSessions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
  } catch (error) {
    console.error("Riwayat gagal disimpan:", error);
    showToast("Penyimpanan penuh. Riwayat mungkin tidak tersimpan.");
  }
}

function getActiveSession() {
  return sessions.find((session) => session.id === activeSessionId);
}

function ensureActiveSession() {
  let session = getActiveSession();

  if (!session) {
    session = createSession();
    sessions.unshift(session);
    activeSessionId = session.id;
    saveSessions();
  }

  return session;
}

function getModelLabel(modelValue) {
  const model = AVAILABLE_MODELS.find((item) => item.value === modelValue);
  return model ? model.label : modelValue;
}

/* =========================================
   DOM HELPERS
========================================= */

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  let toast = $("#smartai-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "smartai-toast";
    toast.setAttribute("role", "status");

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "100px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "99999",
      background: "#202522",
      color: "#fff",
      padding: "11px 16px",
      borderRadius: "12px",
      maxWidth: "90%",
      fontSize: "14px",
      boxShadow: "0 8px 30px #0005"
    });

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toast._hideTimer);

  toast._hideTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

function scrollToBottom() {
  const container =
    $("#chat-messages") ||
    $("#conversation-container") ||
    $("#result-container")?.parentElement;

  if (container) {
    container.scrollTop = container.scrollHeight;
  }

  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth"
  });
}

/* =========================================
   MODEL PICKER
========================================= */

function createModelPicker() {
  if ($("#smartai-model-picker")) return;

  const inputArea =
    $("#chat-input-container") ||
    $("#input-container") ||
    $("#chat-form") ||
    $("form") ||
    $(".input-area") ||
    $(".chat-input-area");

  if (!inputArea) {
    console.warn(
      "Smart-AI: area input belum ditemukan. Model picker akan dibuat setelah elemen input tersedia."
    );
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.id = "smartai-model-picker";

  Object.assign(wrapper.style, {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    margin: "8px 0",
    zIndex: "30"
  });

  const button = document.createElement("button");
  button.type = "button";
  button.id = "smartai-model-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  Object.assign(button.style, {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 13px",
    border: "1px solid var(--border-color, #343a36)",
    borderRadius: "999px",
    background: "var(--surface-color, #191d1a)",
    color: "var(--text-color, #e9eee9)",
    cursor: "pointer",
    font: "inherit",
    fontSize: "13px",
    maxWidth: "100%"
  });

  const label = document.createElement("span");
  label.id = "smartai-model-label";

  const arrow = document.createElement("span");
  arrow.textContent = "▾";
  arrow.setAttribute("aria-hidden", "true");

  button.append(label, arrow);

  const menu = document.createElement("div");
  menu.id = "smartai-model-menu";
  menu.hidden = true;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Pilih model AI");

  Object.assign(menu.style, {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "0",
    width: "min(310px, calc(100vw - 40px))",
    maxHeight: "55vh",
    overflowY: "auto",
    padding: "7px",
    border: "1px solid var(--border-color, #343a36)",
    borderRadius: "14px",
    background: "var(--surface-color, #191d1a)",
    color: "var(--text-color, #e9eee9)",
    boxShadow: "0 12px 35px #0006"
  });

  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Cari model AI...";
  search.setAttribute("aria-label", "Cari model AI");

  Object.assign(search.style, {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px",
    marginBottom: "6px",
    borderRadius: "9px",
    border: "1px solid var(--border-color, #343a36)",
    background: "var(--background-color, #101310)",
    color: "inherit",
    font: "inherit"
  });

  const list = document.createElement("div");
  list.id = "smartai-model-options";

  menu.append(search, list);
  wrapper.append(button, menu);

  const existingTools =
    $("#chat-tools") ||
    $(".input-tools") ||
    $(".input-actions");

  if (existingTools) {
    existingTools.appendChild(wrapper);
  } else {
    inputArea.appendChild(wrapper);
  }

  function renderOptions(filter = "") {
    const query = filter.trim().toLowerCase();
    list.replaceChildren();

    const filtered = AVAILABLE_MODELS.filter((model) =>
      (model.label + " " + model.value + " " + model.group)
        .toLowerCase()
        .includes(query)
    );

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.textContent = "Model tidak ditemukan.";
      empty.style.padding = "12px";
      empty.style.fontSize = "13px";
      list.appendChild(empty);
      return;
    }

    let currentGroup = "";

    filtered.forEach((model) => {
      if (model.group !== currentGroup) {
        currentGroup = model.group;

        const heading = document.createElement("div");
        heading.textContent = currentGroup;

        Object.assign(heading.style, {
          padding: "10px 8px 5px",
          opacity: "0.65",
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase"
        });

        list.appendChild(heading);
      }

      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "option");
      option.setAttribute(
        "aria-selected",
        String(model.value === selectedModel)
      );

      Object.assign(option.style, {
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px",
        margin: "2px 0",
        border: "0",
        borderRadius: "9px",
        background:
          model.value === selectedModel
            ? "var(--accent-soft, #293b31)"
            : "transparent",
        color: "inherit",
        cursor: "pointer",
        font: "inherit"
      });

      const name = document.createElement("div");
      name.textContent =
        (model.value === selectedModel ? "✓ " : "") + model.label;

      const code = document.createElement("div");
      code.textContent = model.value;

      Object.assign(code.style, {
        fontSize: "10px",
        opacity: "0.6",
        marginTop: "4px",
        overflowWrap: "anywhere"
      });

      option.append(name, code);

      option.addEventListener("click", () => {
        selectedModel = model.value;

        const session = getActiveSession();

        if (session) {
          session.model = selectedModel;
          session.updatedAt = Date.now();
        }

        saveSessions();
        updateModelButton();
        renderOptions(search.value);
        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");

        showToast("Model dipilih: " + model.label);
      });

      list.appendChild(option);
    });
  }

  function updateModelButton() {
    label.textContent = getModelLabel(selectedModel);
  }

  button.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    button.setAttribute("aria-expanded", String(!menu.hidden));

    if (!menu.hidden) {
      search.value = "";
      renderOptions();
      search.focus();
    }
  });

  search.addEventListener("input", () => renderOptions(search.value));

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });

  updateModelButton();
  renderOptions();
}

/* =========================================
   CHAT HISTORY UI
========================================= */

function ensureHistoryUI() {
  let list = $("#smartai-session-list");

  if (list) return list;

  const sidebar =
    $("#conversation-list") ||
    $("#history-list") ||
    $("#chat-history") ||
    $(".sidebar-content") ||
    $("#sidebar");

  if (!sidebar) {
    console.warn(
      "Smart-AI: sidebar tidak ditemukan. Riwayat tetap disimpan di browser."
    );
    return null;
  }

  const section = document.createElement("section");
  section.id = "smartai-history-section";

  const heading = document.createElement("div");
  heading.textContent = "Percakapan";

  Object.assign(heading.style, {
    padding: "12px 8px 8px",
    fontWeight: "700",
    fontSize: "13px"
  });

  list = document.createElement("div");
  list.id = "smartai-session-list";

  section.append(heading, list);
  sidebar.appendChild(section);

  return list;
}

function renderHistory() {
  const list = ensureHistoryUI();

  if (!list) return;

  list.replaceChildren();

  if (!sessions.length) {
    const empty = document.createElement("div");
    empty.textContent = "Belum ada percakapan.";
    empty.style.padding = "10px";
    empty.style.opacity = "0.65";
    empty.style.fontSize = "13px";
    list.appendChild(empty);
    return;
  }

  sessions
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((session) => {
      const row = document.createElement("div");

      Object.assign(row.style, {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        margin: "3px 0"
      });

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = session.title || "Obrolan baru";
      openButton.title = session.title || "Obrolan baru";

      Object.assign(openButton.style, {
        flex: "1",
        minWidth: "0",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "left",
        padding: "10px",
        border: "0",
        borderRadius: "9px",
        background:
          session.id === activeSessionId
            ? "var(--accent-soft, #293b31)"
            : "transparent",
        color: "inherit",
        cursor: "pointer",
        font: "inherit",
        fontSize: "13px"
      });

      openButton.addEventListener("click", () => {
        if (isSending) {
          showToast("Tunggu jawaban AI selesai terlebih dahulu.");
          return;
        }

        activeSessionId = session.id;
        selectedModel = session.model || DEFAULT_MODEL;
        saveSessions();
        renderHistory();
        renderConversation();
        updateModelPicker();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.title = "Hapus percakapan ini";
      deleteButton.setAttribute(
        "aria-label",
        "Hapus " + (session.title || "percakapan")
      );

      Object.assign(deleteButton.style, {
        padding: "6px 10px",
        border: "0",
        borderRadius: "8px",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        fontSize: "18px"
      });

      deleteButton.addEventListener("click", () => {
        if (isSending) {
          showToast("Tunggu jawaban AI selesai terlebih dahulu.");
          return;
        }

        sessions = sessions.filter((item) => item.id !== session.id);

        if (activeSessionId === session.id) {
          activeSessionId = "";
          ensureActiveSession();
        }

        saveSessions();
        renderHistory();
        renderConversation();
        showToast("Percakapan dihapus dari riwayat lokal.");
      });

      row.append(openButton, deleteButton);
      list.appendChild(row);
    });
}

function updateModelPicker() {
  const label = $("#smartai-model-label");

  if (label) {
    label.textContent = getModelLabel(selectedModel);
  }

  const session = getActiveSession();

  if (session) {
    session.model = selectedModel;
    saveSessions();
  }
}

/* =========================================
   MESSAGE RENDERING
========================================= */

function findMessageContainer() {
  let container =
    $("#chat-messages") ||
    $("#conversation-container") ||
    $("#messages-container");

  if (container) return container;

  const result = $("#result-container");

  if (result && result.parentElement) {
    container = result.parentElement;
    return container;
  }

  container = document.createElement("div");
  container.id = "chat-messages";

  Object.assign(container.style, {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%"
  });

  const main =
    $("#main-content") ||
    $("main") ||
    $(".main-content") ||
    document.body;

  main.appendChild(container);

  return container;
}

function renderConversation() {
  const container = findMessageContainer();
  const session = ensureActiveSession();

  const originalResult = $("#result-container");

  if (originalResult && originalResult.parentElement === container) {
    originalResult.hidden = true;
  }

  container
    .querySelectorAll(".smartai-rendered-message")
    .forEach((element) => element.remove());

  session.messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "smartai-rendered-message";

    Object.assign(article.style, {
      width: "100%",
      boxSizing: "border-box",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere"
    });

    if (message.role === "user") {
      const bubble = document.createElement("div");
      bubble.textContent = message.content;

      Object.assign(bubble.style, {
        marginLeft: "auto",
        maxWidth: "min(85%, 720px)",
        padding: "12px 16px",
        borderRadius: "18px 18px 4px 18px",
        background: "var(--user-bubble, #26352c)",
        color: "var(--text-color, inherit)",
        lineHeight: "1.65"
      });

      article.appendChild(bubble);
    } else {
      const header = document.createElement("div");
      header.textContent = "Smart-AI · " + getModelLabel(message.model || session.model);

      Object.assign(header.style, {
        fontSize: "12px",
        opacity: "0.7",
        marginBottom: "8px"
      });

      const content = document.createElement("div");
      content.className = "smartai-message-content";
      content.textContent = message.content;

      Object.assign(content.style, {
        lineHeight: "1.8",
        overflowWrap: "anywhere"
      });

      const actions = document.createElement("div");

      Object.assign(actions.style, {
        display: "flex",
        gap: "8px",
        marginTop: "10px"
      });

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.textContent = "Salin";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(message.content);
          showToast("Jawaban berhasil disalin.");
        } catch {
          showToast("Gagal menyalin. Silakan salin teks secara manual.");
        }
      });

      Object.assign(copyButton.style, {
        padding: "7px 11px",
        borderRadius: "8px",
        border: "1px solid var(--border-color, #343a36)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer"
      });

      actions.appendChild(copyButton);

      article.append(header, content, actions);
    }

    container.appendChild(article);
  });

  updateModelPicker();
  scrollToBottom();
}

function setLoading(loading) {
  let indicator = $("#smartai-loading");

  if (loading) {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "smartai-loading";
      indicator.className = "smartai-rendered-message";
      indicator.textContent = "Smart-AI sedang berpikir...";

      Object.assign(indicator.style, {
        padding: "12px 0",
        opacity: "0.7",
        fontSize: "14px"
      });

      findMessageContainer().appendChild(indicator);
    }
  } else if (indicator) {
    indicator.remove();
  }

  const sendButton =
    $("#send-button") ||
    $("#send-btn") ||
    $('button[type="submit"]');

  if (sendButton) {
    sendButton.disabled = loading;
    sendButton.setAttribute("aria-busy", String(loading));
  }
}

/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage(text) {
  const question = String(text || "").trim();

  if (!question) {
    showToast("Tulis pertanyaan terlebih dahulu.");
    return;
  }

  if (isSending) {
    showToast("Tunggu jawaban sebelumnya selesai.");
    return;
  }

  const session = ensureActiveSession();

  isSending = true;

  session.model = selectedModel;
  session.messages.push({
    role: "user",
    content: question,
    model: selectedModel,
    createdAt: Date.now()
  });

  if (
    session.title === "Obrolan baru" ||
    session.title === "Obrolan baru".trim()
  ) {
    session.title =
      question.length > 42 ? question.slice(0, 42) + "…" : question;
  }

  session.updatedAt = Date.now();

  saveSessions();
  renderHistory();
  renderConversation();
  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        question,
        prompt: question,
        model: selectedModel,
        session_id: session.id
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Respons server bukan JSON yang valid.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.message || "Permintaan AI gagal.");
    }

    const answer =
      data.answer ||
      data.result ||
      data.response ||
      data.message;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("AI mengembalikan jawaban kosong.");
    }

    session.messages.push({
      role: "assistant",
      content: answer.trim(),
      model: data.model || selectedModel,
      createdAt: Date.now()
    });

    session.updatedAt = Date.now();
    saveSessions();
  } catch (error) {
    console.error("Smart-AI send error:", error);

    session.messages.push({
      role: "assistant",
      content: "Maaf, terjadi kesalahan: " + error.message,
      model: selectedModel,
      error: true,
      createdAt: Date.now()
    });

    session.updatedAt = Date.now();
    saveSessions();
  } finally {
    isSending = false;
    setLoading(false);
    renderHistory();
    renderConversation();
    clearInput();
  }
}

/* =========================================
   INPUT HANDLING
========================================= */

function findInput() {
  return (
    $("#chat-input") ||
    $("#message-input") ||
    $("#prompt-input") ||
    $("#user-input") ||
    $("textarea") ||
    $('input[type="text"]')
  );
}

function clearInput() {
  const input = findInput();

  if (input) {
    input.value = "";
    input.style.height = "";
  }
}

function bindInput() {
  const input = findInput();

  if (!input) {
    console.warn("Smart-AI: kolom input tidak ditemukan.");
    return;
  }

  const form = input.closest("form");

  if (form && !form.dataset.smartAiBound) {
    form.dataset.smartAiBound = "true";

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (isSending) return;

      sendMessage(input.value);
    });

    return;
  }

  const sendButton =
    $("#send-button") ||
    $("#send-btn") ||
    $("#submit-button");

  if (sendButton && !sendButton.dataset.smartAiBound) {
    sendButton.dataset.smartAiBound = "true";

    sendButton.addEventListener("click", (event) => {
      event.preventDefault();

      if (!isSending) sendMessage(input.value);
    });
  }

  if (!input.dataset.smartAiBound) {
    input.dataset.smartAiBound = "true";

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (!isSending) sendMessage(input.value);
      }
    });
  }
}

/* =========================================
   NEW CHAT
========================================= */

function createNewChat() {
  if (isSending) {
    showToast("Tunggu jawaban AI selesai terlebih dahulu.");
    return;
  }

  const session = createSession();

  sessions.unshift(session);
  activeSessionId = session.id;
  selectedModel = session.model;

  saveSessions();
  renderHistory();
  renderConversation();

  const input = findInput();

  if (input) input.focus();

  showToast("Obrolan baru dibuat.");
}

function bindNewChatButton() {
  const selectors = [
    "#new-chat",
    "#new-chat-button",
    "#new-chat-btn",
    "#new-conversation",
    "[data-action='new-chat']"
  ];

  const button = selectors
    .map((selector) => $(selector))
    .find(Boolean);

  if (button && !button.dataset.smartAiBound) {
    button.dataset.smartAiBound = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      createNewChat();
    });

    return;
  }

  const sidebar =
    $("#sidebar") ||
    $(".sidebar-content") ||
    $("#conversation-list");

  if (!sidebar || $("#smartai-new-chat")) return;

  const newButton = document.createElement("button");
  newButton.id = "smartai-new-chat";
  newButton.type = "button";
  newButton.textContent = "+ Obrolan Baru";

  Object.assign(newButton.style, {
    width: "100%",
    padding: "11px 12px",
    margin: "8px 0",
    border: "1px solid var(--border-color, #343a36)",
    borderRadius: "10px",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left"
  });

  newButton.addEventListener("click", createNewChat);

  sidebar.prepend(newButton);
}

/* =========================================
   RESET CURRENT API SESSION
========================================= */

async function resetCurrentSession() {
  if (isSending) {
    showToast("Tunggu jawaban AI selesai terlebih dahulu.");
    return;
  }

  const session = getActiveSession();

  if (!session) return;

  const confirmed = window.confirm(
    "Hapus riwayat percakapan AI untuk sesi ini?"
  );

  if (!confirmed) return;

  isSending = true;
  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: "Mulai sesi baru.",
        model: selectedModel,
        session_id: session.id,
        reset: true
      })
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Gagal mereset sesi.");
    }

    session.messages = [];
    session.title = "Obrolan baru";
    session.updatedAt = Date.now();

    saveSessions();
    renderHistory();
    renderConversation();

    showToast("Riwayat sesi berhasil direset.");
  } catch (error) {
    console.error("Reset session error:", error);
    showToast(error.message || "Gagal mereset sesi.");
  } finally {
    isSending = false;
    setLoading(false);
  }
}

/* =========================================
   INITIALIZATION
========================================= */

function initializeSmartAI() {
  ensureActiveSession();
  createModelPicker();
  ensureHistoryUI();
  renderHistory();
  renderConversation();
  bindInput();
  bindNewChatButton();

  const resetButton =
    $("#reset-chat") ||
    $("#reset-session") ||
    "[data-action='reset-chat']";

  const actualResetButton =
    typeof resetButton === "string"
      ? $(resetButton)
      : resetButton;

  if (actualResetButton && !actualResetButton.dataset.smartAiBound) {
    actualResetButton.dataset.smartAiBound = "true";

    actualResetButton.addEventListener("click", (event) => {
      event.preventDefault();
      resetCurrentSession();
    });
  }

  console.log("Smart-AI initialized.", {
    session: activeSessionId,
    model: selectedModel,
    availableModels: AVAILABLE_MODELS.length
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSmartAI);
} else {
  initializeSmartAI();
}
