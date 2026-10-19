
"use strict";

/* =========================================
   HAO AI — PROFESSIONAL WORKSPACE
   Frontend: /public/script.js
   Backend:  /api
========================================= */

const API_URL = "/api";
const STORAGE_KEY = "haoAIWorkspaceConversations";
const ACTIVE_KEY = "haoAIWorkspaceActive";
const MODEL_KEY = "haoAIWorkspaceModel";
const DEFAULT_MODEL = "openai/gpt-4o";
const MAX_MESSAGE_LENGTH = 12000;

const MODELS = [
  { id: "chatday/ai-chat", name: "Chatday AI Chat", group: "Lainnya" },
  { id: "openai/gpt-5.6-terra", name: "GPT-5.6 Terra", group: "OpenAI" },
  { id: "openai/gpt-5.5", name: "GPT-5.5", group: "OpenAI" },
  { id: "openai/gpt-5.4", name: "GPT-5.4", group: "OpenAI" },
  { id: "openai/gpt-5.3-chat", name: "GPT-5.3 Chat", group: "OpenAI" },
  { id: "openai/gpt-5.1-instant", name: "GPT-5.1 Instant", group: "OpenAI" },
  { id: "openai/gpt-5", name: "GPT-5", group: "OpenAI" },
  { id: "openai/gpt-4o", name: "GPT-4o", group: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", group: "OpenAI" },
  { id: "xai/grok-4.1-fast-non-reasoning", name: "Grok 4.1 Fast", group: "xAI" },
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", group: "Anthropic" },
  { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", group: "Anthropic" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", group: "Anthropic" },
  { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5", group: "Anthropic" },
  { id: "anthropic/claude-opus-4.6", name: "Claude Opus 4.6", group: "Anthropic" },
  { id: "anthropic/claude-opus-4.7", name: "Claude Opus 4.7", group: "Anthropic" },
  { id: "anthropic/claude-opus-4.8", name: "Claude Opus 4.8", group: "Anthropic" },
  { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro", group: "DeepSeek" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", group: "DeepSeek" },
  { id: "deepseek/deepseek-v3.2-thinking", name: "DeepSeek V3.2 Thinking", group: "DeepSeek" },
  { id: "google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", group: "Google" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", group: "Google" },
  { id: "google/gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", group: "Google" },
  { id: "alibaba/qwen3-max", name: "Qwen3 Max", group: "Alibaba" },
  { id: "meta/llama-4-maverick", name: "Llama 4 Maverick", group: "Meta" },
  { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", group: "Moonshot" }
];

const $ = (selector, root = document) => root.querySelector(selector);

let conversations = loadConversations();
let activeId = readStorage(ACTIVE_KEY, "");
let selectedModel = readStorage(MODEL_KEY, DEFAULT_MODEL);
let sending = false;
let requestSequence = 0;
let toastSequence = 0;

/* -----------------------------------------
   STORAGE
----------------------------------------- */

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error("HAO AI storage error:", error);
    return false;
  }
}

function loadConversations() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(item =>
      item &&
      typeof item.id === "string" &&
      Array.isArray(item.messages)
    ).map(item => ({
      id: item.id,
      title: String(item.title || "Obrolan baru"),
      model: String(item.model || DEFAULT_MODEL),
      messages: item.messages
        .filter(message =>
          message &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
        )
        .map(message => ({
          role: message.role,
          content: message.content,
          model: message.model || item.model || DEFAULT_MODEL,
          error: Boolean(message.error),
          createdAt: Number(message.createdAt) || Date.now()
        })),
      createdAt: Number(item.createdAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Date.now()
    }));
  } catch {
    return [];
  }
}

function saveState() {
  const saved = writeStorage(
    STORAGE_KEY,
    JSON.stringify(conversations)
  );

  writeStorage(ACTIVE_KEY, activeId);
  writeStorage(MODEL_KEY, selectedModel);

  if (!saved) {
    showToast("Riwayat tidak dapat disimpan. Periksa ruang penyimpanan browser.");
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return "hao-" + crypto.randomUUID();
  }

  return "hao-" + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10);
}

function makeConversation() {
  return {
    id: makeId(),
    title: "Obrolan baru",
    model: selectedModel,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function getActiveConversation() {
  return conversations.find(item => item.id === activeId) || null;
}

function ensureConversation() {
  let current = getActiveConversation();

  if (!current) {
    current = makeConversation();
    conversations.unshift(current);
    activeId = current.id;
    saveState();
  }

  return current;
}

function getModelName(modelId) {
  return MODELS.find(model => model.id === modelId)?.name || modelId;
}

/* -----------------------------------------
   NOTIFICATIONS
----------------------------------------- */

function showToast(message) {
  const region = $("#toast-region");
  if (!region) return;

  const id = ++toastSequence;
  const item = document.createElement("div");

  item.className = "toast-message";
  item.textContent = message;
  item.dataset.toastId = String(id);

  region.appendChild(item);

  while (region.children.length > 3) {
    region.firstElementChild.remove();
  }

  setTimeout(() => {
    item.remove();
  }, 3200);
}

/* -----------------------------------------
   SAFE DOM HELPERS
----------------------------------------- */

function createButton(text, className, title = "") {
  const button = document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = text;

  if (title) button.title = title;

  return button;
}

function scrollToBottom() {
  const scroll = $("#chat-scroll");

  if (scroll) {
    scroll.scrollTop = scroll.scrollHeight;
  }
}

/* -----------------------------------------
   COMPOSER LOCATION
   Welcome: composer inside welcome area.
   Chat: composer fixed at the bottom.
----------------------------------------- */

function moveComposer(showWelcome) {
  const shell = $(".composer-shell");
  const welcomeAnchor = $("#welcome-composer-anchor");
  const composerArea = $("#composer-area");

  if (!shell || !welcomeAnchor || !composerArea) return;

  if (showWelcome) {
    if (shell.parentElement !== welcomeAnchor) {
      welcomeAnchor.appendChild(shell);
    }
  } else if (shell.parentElement !== composerArea) {
    composerArea.insertBefore(
      shell,
      composerArea.querySelector(".composer-disclaimer")
    );
  }
}

function updateView() {
  const current = ensureConversation();
  const hasMessages = current.messages.length > 0;

  $("#welcome-screen")?.classList.toggle("hidden", hasMessages);
  $("#chat-view")?.classList.toggle("active", hasMessages);

  const breadcrumb = $("#breadcrumb-current");
  if (breadcrumb) {
    breadcrumb.textContent = hasMessages
      ? (current.title || "Percakapan")
      : "Chat";
  }

  moveComposer(!hasMessages);
  renderMessages();
  renderHistory();
  updateModelButton();
}

/* -----------------------------------------
   MESSAGE RENDERING
----------------------------------------- */

function renderMessages() {
  const container = $("#chat-messages");
  if (!container) return;

  const current = ensureConversation();
  container.replaceChildren();

  current.messages.forEach(message => {
    container.appendChild(createMessageElement(message));
  });

  if (sending) {
    container.appendChild(createTypingIndicator());
  }

  requestAnimationFrame(scrollToBottom);
}

function createMessageElement(message) {
  const isUser = message.role === "user";

  const row = document.createElement("article");
  row.className = "message-row " + (isUser ? "user" : "assistant");

  if (message.error) row.classList.add("error");

  if (!isUser) {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "h";
    avatar.setAttribute("aria-label", "HAO AI");
    row.appendChild(avatar);
  }

  const wrap = document.createElement("div");
  wrap.className = "message-content-wrap";

  if (!isUser) {
    const meta = document.createElement("div");
    meta.className = "message-meta";

    const name = document.createElement("strong");
    name.textContent = "HAO AI";

    const model = document.createElement("span");
    model.className = "message-model-tag";
    model.textContent = getModelName(message.model || DEFAULT_MODEL);

    meta.append(name, model);
    wrap.appendChild(meta);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message.content;

  wrap.appendChild(bubble);

  if (!isUser) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copyButton = createButton(
      "▢ Salin",
      "message-action",
      "Salin jawaban"
    );

    copyButton.addEventListener("click", async () => {
      try {
        await copyText(message.content);
        showToast("Jawaban berhasil disalin.");
      } catch {
        showToast("Gagal menyalin. Coba pilih teks secara manual.");
      }
    });

    actions.appendChild(copyButton);
    wrap.appendChild(actions);
  }

  row.appendChild(wrap);
  return row;
}

function createTypingIndicator() {
  const row = document.createElement("article");
  row.className = "message-row assistant";
  row.id = "hao-typing";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "h";

  const wrap = document.createElement("div");
  wrap.className = "message-content-wrap";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const name = document.createElement("strong");
  name.textContent = "HAO AI";

  const state = document.createElement("span");
  state.textContent = "sedang berpikir";

  meta.append(name, state);

  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";

  for (let i = 0; i < 3; i++) {
    bubble.appendChild(document.createElement("span"));
  }

  wrap.append(meta, bubble);
  row.append(avatar, wrap);

  return row;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();

  const success = document.execCommand("copy");
  textarea.remove();

  if (!success) throw new Error("Clipboard tidak tersedia.");
}

/* -----------------------------------------
   HISTORY
----------------------------------------- */

function renderHistory() {
  const list = $("#conversation-list");
  const count = $("#history-count");
  const search = $("#history-search");

  if (!list) return;

  const query = (search?.value || "").trim().toLowerCase();

  const sorted = [...conversations].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  if (count) count.textContent = String(conversations.length);

  const filtered = sorted.filter(item => {
    if (!query) return true;

    const titleMatch = item.title.toLowerCase().includes(query);
    const messageMatch = item.messages.some(message =>
      message.content.toLowerCase().includes(query)
    );

    return titleMatch || messageMatch;
  });

  list.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = query
      ? "Tidak ada percakapan yang cocok."
      : "Riwayat akan muncul di sini setelah kamu mulai mengobrol.";

    list.appendChild(empty);
    return;
  }

  filtered.forEach(conversation => {
    const row = document.createElement("div");
    row.className = "history-row";

    const openButton = createButton(
      conversation.title || "Obrolan baru",
      "history-open" + (
        conversation.id === activeId ? " active" : ""
      )
    );

    openButton.title = conversation.title || "Obrolan baru";

    openButton.addEventListener("click", () => {
      if (sending) {
        showToast("Tunggu jawaban selesai sebelum berpindah obrolan.");
        return;
      }

      activeId = conversation.id;
      selectedModel = conversation.model || DEFAULT_MODEL;

      saveState();
      updateView();
      closeSidebar();
    });

    const deleteButton = createButton(
      "×",
      "history-delete",
      "Hapus obrolan"
    );

    deleteButton.setAttribute("aria-label", "Hapus " + conversation.title);

    deleteButton.addEventListener("click", () => {
      if (sending && conversation.id === activeId) {
        showToast("Tunggu jawaban selesai sebelum menghapus obrolan aktif.");
        return;
      }

      const confirmed = window.confirm(
        `Hapus obrolan "${conversation.title}" dari riwayat browser ini?`
      );

      if (!confirmed) return;

      conversations = conversations.filter(
        item => item.id !== conversation.id
      );

      if (activeId === conversation.id) {
        activeId = "";
        ensureConversation();
      }

      saveState();
      updateView();
      showToast("Obrolan dihapus.");
    });

    row.append(openButton, deleteButton);
    list.appendChild(row);
  });
}

function createNewChat() {
  if (sending) {
    showToast("Tunggu jawaban selesai sebelum membuat obrolan baru.");
    return;
  }

  const conversation = makeConversation();

  conversations.unshift(conversation);
  activeId = conversation.id;
  selectedModel = conversation.model;

  saveState();
  updateView();
  closeSidebar();

  $("#chat-input")?.focus();
}

/* -----------------------------------------
   MODEL SELECTOR
----------------------------------------- */

function initializeModelPicker() {
  const menu = $("#model-menu");
  const button = $("#model-button");
  const search = $("#model-search-input");
  const options = $("#model-options");

  if (!menu || !button || !search || !options) return;

  function renderOptions(filter = "") {
    options.replaceChildren();

    const query = filter.trim().toLowerCase();

    const filtered = MODELS.filter(model =>
      `${model.name} ${model.id} ${model.group}`
        .toLowerCase()
        .includes(query)
    );

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "Model tidak ditemukan.";
      options.appendChild(empty);
      return;
    }

    let previousGroup = "";

    filtered.forEach(model => {
      if (model.group !== previousGroup) {
        previousGroup = model.group;

        const heading = document.createElement("div");
        heading.className = "model-group-title";
        heading.textContent = model.group;
        options.appendChild(heading);
      }

      const option = createButton(
        "",
        "model-option" + (
          model.id === selectedModel ? " selected" : ""
        )
      );

      option.setAttribute("role", "option");
      option.setAttribute(
        "aria-selected",
        String(model.id === selectedModel)
      );

      const copy = document.createElement("span");
      copy.className = "model-option-copy";

      const name = document.createElement("strong");
      name.textContent = model.name;

      const id = document.createElement("small");
      id.textContent = model.id;

      copy.append(name, id);

      const check = document.createElement("span");
      check.className = "model-option-check";
      check.textContent = model.id === selectedModel ? "✓" : "";

      option.append(copy, check);

      option.addEventListener("click", () => {
        if (sending) {
          showToast("Tunggu jawaban selesai sebelum mengganti model.");
          return;
        }

        selectedModel = model.id;

        const current = ensureConversation();
        current.model = selectedModel;
        current.updatedAt = Date.now();

        saveState();
        updateModelButton();
        renderOptions(search.value);

        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");

        showToast("Model aktif: " + model.name);
      });

      options.appendChild(option);
    });
  }

  button.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));

    $("#tools-popover").hidden = true;

    if (open) {
      search.value = "";
      renderOptions();
      search.focus();
    }
  });

  search.addEventListener("input", () => {
    renderOptions(search.value);
  });

  document.addEventListener("click", event => {
    if (!$("#model-picker")?.contains(event.target)) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });

  renderOptions();
  updateModelButton();
}

function updateModelButton() {
  const label = $("#model-button-label");
  if (label) label.textContent = getModelName(selectedModel);

  const setting = $("#default-model-setting");
  if (setting) setting.value = selectedModel;
}

/* -----------------------------------------
   CHAT REQUEST
----------------------------------------- */

function setSending(value) {
  sending = value;

  const input = $("#chat-input");
  const send = $("#send-button");
  const state = $("#composer-state");

  if (input) input.disabled = value;

  if (send) {
    send.disabled = value;
    send.classList.toggle("loading", value);
    send.setAttribute("aria-busy", String(value));
    send.setAttribute(
      "aria-label",
      value ? "AI sedang memproses" : "Kirim pesan"
    );
  }

  if (state) {
    state.textContent = value ? "Memproses..." : "Siap membantu";
  }
}

async function sendMessage(rawText) {
  const question = String(rawText || "").trim();

  if (!question || sending) return;

  if (question.length > MAX_MESSAGE_LENGTH) {
    showToast("Pesan terlalu panjang.");
    return;
  }

  const current = ensureConversation();
  const modelForRequest = selectedModel;
  const requestId = ++requestSequence;
  const conversationId = current.id;

  // Tambahkan pesan pengguna tepat satu kali.
  current.messages.push({
    role: "user",
    content: question,
    model: modelForRequest,
    createdAt: Date.now()
  });

  if (
    current.title === "Obrolan baru" ||
    current.title === "Percakapan baru"
  ) {
    current.title = question.length > 48
      ? question.slice(0, 48).trimEnd() + "…"
      : question;
  }

  current.model = modelForRequest;
  current.updatedAt = Date.now();

  const input = $("#chat-input");

  // Bersihkan input sebelum menunggu jaringan.
  if (input) {
    input.value = "";
    input.style.height = "auto";
  }

  saveState();
  setSending(true);
  updateView();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        question,
        model: modelForRequest,
        session_id: conversationId
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Server mengembalikan respons yang bukan JSON (HTTP ${response.status}).`
      );
    }

    if (!response.ok || data.success === false) {
      throw new Error(
        data.error ||
        data.message ||
        `Permintaan gagal (HTTP ${response.status}).`
      );
    }

    const answer =
      data.answer ||
      data.result ||
      data.response ||
      data.message;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("Respons AI kosong atau formatnya tidak dikenali.");
    }

    // Abaikan respons jika request bukan request terbaru.
    if (requestId !== requestSequence) return;

    const target = conversations.find(item => item.id === conversationId);

    if (!target) return;

    target.messages.push({
      role: "assistant",
      content: answer.trim(),
      model: data.model || modelForRequest,
      createdAt: Date.now()
    });

    target.updatedAt = Date.now();

    saveState();
  } catch (error) {
    console.error("HAO AI request failed:", error);

    if (requestId === requestSequence) {
      const target = conversations.find(item => item.id === conversationId);

      if (target) {
        target.messages.push({
          role: "assistant",
          content: "Maaf, HAO belum berhasil mendapatkan jawaban.\n\n" +
            error.message,
          model: modelForRequest,
          error: true,
          createdAt: Date.now()
        });

        target.updatedAt = Date.now();
        saveState();
      }
    }
  } finally {
    if (requestId === requestSequence) {
      setSending(false);
      updateView();
    }
  }
}

/* -----------------------------------------
   INPUT EVENTS
----------------------------------------- */

function bindComposer() {
  const form = $("#chat-form");
  const input = $("#chat-input");

  if (!form || !input || form.dataset.bound === "true") return;

  form.dataset.bound = "true";

  // Satu-satunya handler pengiriman pesan.
  form.addEventListener("submit", event => {
    event.preventDefault();

    if (sending) return;

    sendMessage(input.value);
  });

  input.addEventListener("keydown", event => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.isComposing
    ) {
      event.preventDefault();

      if (!sending) form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 170) + "px";
  });
}

/* -----------------------------------------
   TOOL STATUS
----------------------------------------- */

function showToolStatus(tool) {
  const messages = {
    web: "Pencarian web belum terhubung. Backend saat ini hanya dikonfigurasi untuk chat JERE-API.",
    files: "Analisis dokumen belum tersedia. Endpoint upload dan pembacaan file belum dikonfigurasi.",
    images: "Analisis gambar belum tersedia. Endpoint vision belum dikonfigurasi."
  };

  showToast(messages[tool] || "Alat ini belum tersedia.");
}

function initializeTools() {
  const toggle = $("#tools-toggle");
  const popover = $("#tools-popover");

  if (!toggle || !popover) return;

  toggle.addEventListener("click", () => {
    popover.hidden = !popover.hidden;
    $("#model-menu").hidden = true;
    $("#model-button").setAttribute("aria-expanded", "false");
  });

  document.querySelectorAll("[data-tool]").forEach(button => {
    button.addEventListener("click", () => {
      showToolStatus(button.dataset.tool);
      popover.hidden = true;
    });
  });

  document.addEventListener("click", event => {
    if (
      !popover.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      popover.hidden = true;
    }
  });
}

/* -----------------------------------------
   SIDEBAR & SUGGESTIONS
----------------------------------------- */

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebar-backdrop")?.classList.remove("visible");
}

function initializeNavigation() {
  $("#new-chat")?.addEventListener("click", createNewChat);

  $("#sidebar-open")?.addEventListener("click", () => {
    $("#sidebar")?.classList.add("open");
    $("#sidebar-backdrop")?.classList.add("visible");
  });

  $("#sidebar-close")?.addEventListener("click", closeSidebar);
  $("#sidebar-backdrop")?.addEventListener("click", closeSidebar);

  $("#history-search")?.addEventListener("input", renderHistory);

  document.querySelectorAll(".suggestion-card[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      if (sending) {
        showToast("Tunggu jawaban sebelumnya selesai.");
        return;
      }

      sendMessage(button.dataset.prompt);
    });
  });

  // Shortcut Ctrl/Cmd + K: obrolan baru.
  document.addEventListener("keydown", event => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (modifier && event.key.toLowerCase() === "k") {
      event.preventDefault();
      createNewChat();
    }

    if (
      event.key === "/" &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    ) {
      event.preventDefault();
      $("#history-search")?.focus();
    }

    if (event.key === "Escape") {
      $("#tools-popover").hidden = true;
      $("#model-menu").hidden = true;
      closeSidebar();
    }
  });
}

/* -----------------------------------------
   SETTINGS
----------------------------------------- */

function initializeSettings() {
  const dialog = $("#settings-dialog");
  const openButtons = [
    $("#open-settings"),
    $("#topbar-settings")
  ].filter(Boolean);

  openButtons.forEach(button => {
    button.addEventListener("click", () => {
      updateDefaultModelOptions();

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        showToast("Pengaturan dialog tidak didukung browser ini.");
      }

      closeSidebar();
    });
  });

  $("#settings-close")?.addEventListener("click", () => {
    dialog.close();
  });

  dialog?.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  $("#default-model-setting")?.addEventListener("change", event => {
    if (sending) {
      showToast("Tunggu jawaban selesai sebelum mengganti model.");
      event.target.value = selectedModel;
      return;
    }

    selectedModel = event.target.value;

    const current = ensureConversation();
    current.model = selectedModel;

    saveState();
    updateModelButton();
    showToast("Model default diubah.");
  });

  $("#clear-history")?.addEventListener("click", () => {
    if (sending) {
      showToast("Tunggu jawaban selesai sebelum menghapus riwayat.");
      return;
    }

    const confirmed = window.confirm(
      "Hapus SEMUA riwayat HAO AI yang tersimpan di browser ini? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) return;

    conversations = [];
    activeId = "";

    ensureConversation();
    saveState();
    updateView();

    dialog.close();
    showToast("Semua riwayat lokal telah dihapus.");
  });
}

function updateDefaultModelOptions() {
  const select = $("#default-model-setting");
  if (!select) return;

  select.replaceChildren();

  MODELS.forEach(model => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = `${model.name} — ${model.group}`;
    select.appendChild(option);
  });

  select.value = selectedModel;
}

/* -----------------------------------------
   INITIALIZATION
----------------------------------------- */

function initHAO() {
  initializeModelPicker();
  initializeTools();
  initializeNavigation();
  initializeSettings();
  bindComposer();

  ensureConversation();
  updateView();

  console.info("HAO AI initialized", {
    modelCount: MODELS.length,
    activeConversation: activeId
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHAO, { once: true });
} else {
  initHAO();
}
