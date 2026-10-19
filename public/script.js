
"use strict";

/* ======================================
   HAO AI — CHAT, MODEL & HISTORY
====================================== */

const API_URL = "/api";
const STORAGE_KEY = "haoAIConversations";
const ACTIVE_KEY = "haoAIActiveConversation";
const MODEL_KEY = "haoAISelectedModel";
const DEFAULT_MODEL = "openai/gpt-4o";

const MODELS = [
  ["chatday/ai-chat", "Chatday AI Chat", "Lainnya"],
  ["openai/gpt-5.6-terra", "GPT-5.6 Terra", "OpenAI"],
  ["openai/gpt-5.5", "GPT-5.5", "OpenAI"],
  ["openai/gpt-5.4", "GPT-5.4", "OpenAI"],
  ["openai/gpt-5.3-chat", "GPT-5.3 Chat", "OpenAI"],
  ["openai/gpt-5.1-instant", "GPT-5.1 Instant", "OpenAI"],
  ["openai/gpt-5", "GPT-5", "OpenAI"],
  ["openai/gpt-4o", "GPT-4o", "OpenAI"],
  ["openai/gpt-4o-mini", "GPT-4o Mini", "OpenAI"],
  ["xai/grok-4.1-fast-non-reasoning", "Grok 4.1 Fast", "xAI"],
  ["anthropic/claude-haiku-4.5", "Claude Haiku 4.5", "Anthropic"],
  ["anthropic/claude-sonnet-5", "Claude Sonnet 5", "Anthropic"],
  ["anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6", "Anthropic"],
  ["anthropic/claude-opus-4.5", "Claude Opus 4.5", "Anthropic"],
  ["anthropic/claude-opus-4.6", "Claude Opus 4.6", "Anthropic"],
  ["anthropic/claude-opus-4.7", "Claude Opus 4.7", "Anthropic"],
  ["anthropic/claude-opus-4.8", "Claude Opus 4.8", "Anthropic"],
  ["deepseek/deepseek-v4-pro", "DeepSeek V4 Pro", "DeepSeek"],
  ["deepseek/deepseek-v4-flash", "DeepSeek V4 Flash", "DeepSeek"],
  ["deepseek/deepseek-v3.2-thinking", "DeepSeek V3.2 Thinking", "DeepSeek"],
  ["google/gemini-3.1-pro-preview", "Gemini 3.1 Pro", "Google"],
  ["google/gemini-3-pro-preview", "Gemini 3 Pro", "Google"],
  ["google/gemini-3.1-flash-lite", "Gemini 3.1 Flash Lite", "Google"],
  ["alibaba/qwen3-max", "Qwen3 Max", "Alibaba"],
  ["meta/llama-4-maverick", "Llama 4 Maverick", "Meta"],
  ["moonshotai/kimi-k2.6", "Kimi K2.6", "Moonshot"]
].map(([value, label, group]) => ({ value, label, group }));

const $ = (selector, root = document) => root.querySelector(selector);

let conversations = loadConversations();
let activeId = localStorage.getItem(ACTIVE_KEY) || "";
let selectedModel = localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
let sending = false;
let requestToken = 0;

/* ======================================
   STORAGE
====================================== */

function makeId() {
  return "hao-" + (
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
  );
}

function loadConversations() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (!Array.isArray(data)) return [];

    return data.filter(item =>
      item &&
      typeof item.id === "string" &&
      Array.isArray(item.messages)
    );
  } catch {
    return [];
  }
}

function saveAll() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    localStorage.setItem(ACTIVE_KEY, activeId);
    localStorage.setItem(MODEL_KEY, selectedModel);
  } catch (error) {
    console.error("HAO AI: gagal menyimpan riwayat.", error);
    toast("Penyimpanan browser penuh. Riwayat mungkin tidak tersimpan.");
  }
}

function newConversation() {
  return {
    id: makeId(),
    title: "Obrolan baru",
    model: selectedModel,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function getActive() {
  return conversations.find(item => item.id === activeId);
}

function ensureActive() {
  let current = getActive();

  if (!current) {
    current = newConversation();
    conversations.unshift(current);
    activeId = current.id;
    saveAll();
  }

  return current;
}

function modelLabel(value) {
  return MODELS.find(item => item.value === value)?.label || value;
}

/* ======================================
   GENERAL HELPERS
====================================== */

function toast(message) {
  let element = $("#hao-toast");

  if (!element) {
    element = document.createElement("div");
    element.id = "hao-toast";
    element.setAttribute("role", "status");
    document.body.appendChild(element);
  }

  element.textContent = message;
  element.hidden = false;

  clearTimeout(element._timer);
  element._timer = setTimeout(() => {
    element.hidden = true;
  }, 2800);
}

function makeButton(text, className, title) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  if (title) button.title = title;
  return button;
}

function scrollToLatest() {
  const area = $("#chat-messages");
  if (area) area.scrollTop = area.scrollHeight;
}

function setBusy(value) {
  sending = value;

  const button = $("#send-button");
  const input = $("#chat-input");

  if (button) {
    button.disabled = value;
    button.setAttribute("aria-busy", String(value));
  }

  if (input) {
    input.disabled = value;
  }
}

/* ======================================
   WELCOME & CHAT VIEW
====================================== */

function updateView() {
  const current = ensureActive();
  const welcome = $("#welcome-screen");
  const chat = $("#chat-area");

  const hasMessages = current.messages.length > 0;

  welcome?.classList.toggle("hidden", hasMessages);
  chat?.classList.toggle("active", hasMessages);

  renderMessages();
  renderHistory();
  updateModelButton();
}

function renderMessages() {
  const area = $("#chat-messages");
  if (!area) return;

  const current = ensureActive();
  area.replaceChildren();

  current.messages.forEach(message => {
    area.appendChild(createMessage(message));
  });

  if (sending) {
    area.appendChild(createTypingIndicator());
  }

  requestAnimationFrame(scrollToLatest);
}

function createMessage(message) {
  const isUser = message.role === "user";

  const row = document.createElement("article");
  row.className = `message-row ${isUser ? "user" : "assistant"}`;

  if (message.error) row.classList.add("message-error");

  if (!isUser) {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "H";
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
    model.textContent = "· " + modelLabel(message.model || DEFAULT_MODEL);

    meta.append(name, model);
    wrap.appendChild(meta);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  // textContent prevents HTML from the AI being executed.
  bubble.textContent = message.content || "";
  wrap.appendChild(bubble);

  if (!isUser) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = makeButton("Salin", "message-action", "Salin jawaban");

    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(message.content || "");
        toast("Jawaban disalin.");
      } catch {
        toast("Tidak bisa menyalin otomatis di browser ini.");
      }
    });

    actions.appendChild(copy);
    wrap.appendChild(actions);
  }

  row.appendChild(wrap);
  return row;
}

function createTypingIndicator() {
  const row = document.createElement("article");
  row.className = "message-row assistant";
  row.id = "hao-typing-indicator";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "H";

  const wrap = document.createElement("div");
  wrap.className = "message-content-wrap";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "HAO AI sedang mengetik";

  const bubble = document.createElement("div");
  bubble.className = "typing-bubble";

  for (let i = 0; i < 3; i++) {
    bubble.appendChild(document.createElement("span"));
  }

  wrap.append(meta, bubble);
  row.append(avatar, wrap);

  return row;
}

/* ======================================
   HISTORY
====================================== */

function renderHistory() {
  const list = $("#conversation-list");
  if (!list) return;

  list.replaceChildren();

  if (!conversations.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "Belum ada percakapan.";
    list.appendChild(empty);
    return;
  }

  [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach(conversation => {
      const row = document.createElement("div");
      row.className = "history-row";

      const open = makeButton(
        conversation.title || "Obrolan baru",
        "history-open" + (conversation.id === activeId ? " active" : "")
      );

      open.addEventListener("click", () => {
        if (sending) {
          toast("Tunggu jawaban selesai sebelum pindah obrolan.");
          return;
        }

        activeId = conversation.id;
        selectedModel = conversation.model || DEFAULT_MODEL;
        saveAll();
        updateView();
        closeSidebar();
      });

      const remove = makeButton("×", "history-delete", "Hapus dari riwayat");

      remove.addEventListener("click", () => {
        if (sending) {
          toast("Tunggu jawaban selesai sebelum menghapus obrolan.");
          return;
        }

        conversations = conversations.filter(item => item.id !== conversation.id);

        if (activeId === conversation.id) {
          activeId = "";
          ensureActive();
        }

        saveAll();
        updateView();
        toast("Obrolan dihapus dari riwayat browser.");
      });

      row.append(open, remove);
      list.appendChild(row);
    });
}

function createNewChat() {
  if (sending) {
    toast("Tunggu jawaban selesai terlebih dahulu.");
    return;
  }

  const conversation = newConversation();

  conversations.unshift(conversation);
  activeId = conversation.id;
  selectedModel = conversation.model;

  saveAll();
  updateView();

  $("#chat-input")?.focus();
  closeSidebar();
}

/* ======================================
   MODEL PICKER
====================================== */

function createModelPicker() {
  if ($("#hao-model-picker")) return;

  const host = $("#chat-tools");
  if (!host) return;

  const wrapper = document.createElement("div");
  wrapper.id = "hao-model-picker";

  const button = makeButton("", "", "Pilih model AI");
  button.id = "hao-model-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.id = "hao-model-label";

  const arrow = document.createElement("span");
  arrow.textContent = "▾";

  button.append(label, arrow);

  const menu = document.createElement("div");
  menu.id = "hao-model-menu";
  menu.hidden = true;
  menu.setAttribute("role", "listbox");
  menu.setAttribute("aria-label", "Pilih model AI");

  const search = document.createElement("input");
  search.id = "hao-model-search";
  search.type = "search";
  search.placeholder = "Cari model...";
  search.setAttribute("aria-label", "Cari model");

  const options = document.createElement("div");
  options.id = "hao-model-options";

  menu.append(search, options);
  wrapper.append(button, menu);
  host.appendChild(wrapper);

  function drawOptions(filter = "") {
    options.replaceChildren();

    const query = filter.trim().toLowerCase();
    const matches = MODELS.filter(model =>
      `${model.label} ${model.value} ${model.group}`.toLowerCase().includes(query)
    );

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = "Model tidak ditemukan.";
      options.appendChild(empty);
      return;
    }

    let lastGroup = "";

    matches.forEach(model => {
      if (model.group !== lastGroup) {
        lastGroup = model.group;

        const heading = document.createElement("div");
        heading.className = "model-group-title";
        heading.textContent = lastGroup;
        options.appendChild(heading);
      }

      const option = makeButton("", "model-option" + (
        model.value === selectedModel ? " selected" : ""
      ));

      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(model.value === selectedModel));

      const name = document.createElement("strong");
      name.textContent = (model.value === selectedModel ? "✓ " : "") + model.label;

      const id = document.createElement("small");
      id.textContent = model.value;

      option.append(name, id);

      option.addEventListener("click", () => {
        selectedModel = model.value;

        const current = ensureActive();
        current.model = selectedModel;
        current.updatedAt = Date.now();

        saveAll();
        updateModelButton();
        drawOptions(search.value);

        menu.hidden = true;
        button.setAttribute("aria-expanded", "false");
        toast("Model dipilih: " + model.label);
      });

      options.appendChild(option);
    });
  }

  button.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    button.setAttribute("aria-expanded", String(!menu.hidden));

    if (!menu.hidden) {
      search.value = "";
      drawOptions();
      search.focus();
    }
  });

  search.addEventListener("input", () => drawOptions(search.value));

  document.addEventListener("click", event => {
    if (!wrapper.contains(event.target)) {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    }
  });

  drawOptions();
  updateModelButton();
}

function updateModelButton() {
  const label = $("#hao-model-label");
  if (label) label.textContent = modelLabel(selectedModel);
}

/* ======================================
   SEND MESSAGE — SINGLE SUBMIT HANDLER
====================================== */

async function sendMessage(rawText) {
  const question = String(rawText || "").trim();

  if (!question || sending) return;

  const current = ensureActive();
  const chosenModel = selectedModel;
  const token = ++requestToken;

  // Add the user message once, then clear the input immediately.
  current.messages.push({
    role: "user",
    content: question,
    model: chosenModel,
    createdAt: Date.now()
  });

  if (current.title === "Obrolan baru") {
    current.title = question.length > 42
      ? question.slice(0, 42) + "…"
      : question;
  }

  current.model = chosenModel;
  current.updatedAt = Date.now();

  const input = $("#chat-input");
  if (input) {
    input.value = "";
    input.style.height = "auto";
  }

  saveAll();
  setBusy(true);
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
        model: chosenModel,
        session_id: current.id
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Respons server tidak valid.");
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.message || "Permintaan gagal.");
    }

    const answer = data.answer || data.result || data.response;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("AI tidak memberikan jawaban.");
    }

    // Prevent a stale request from adding a reply to another conversation.
    if (token !== requestToken) return;

    current.messages.push({
      role: "assistant",
      content: answer.trim(),
      model: data.model || chosenModel,
      createdAt: Date.now()
    });

    current.updatedAt = Date.now();
    saveAll();
  } catch (error) {
    console.error("HAO AI request error:", error);

    if (token === requestToken) {
      current.messages.push({
        role: "assistant",
        content: "Maaf, terjadi kendala: " + error.message,
        model: chosenModel,
        error: true,
        createdAt: Date.now()
      });

      current.updatedAt = Date.now();
      saveAll();
    }
  } finally {
    if (token === requestToken) {
      setBusy(false);
      updateView();
    }
  }
}

/* ======================================
   INPUT EVENTS — BOUND ONCE
====================================== */

function bindInput() {
  const form = $("#chat-form");
  const input = $("#chat-input");

  if (!form || !input || form.dataset.haoBound === "true") return;

  form.dataset.haoBound = "true";

  // The only handler responsible for sending messages.
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (sending) return;

    const value = input.value;
    sendMessage(value);
  });

  // Enter sends; Shift+Enter adds a newline.
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (sending) return;
      form.requestSubmit();
    }
  });

  // Auto-grow input without leaving stale height.
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 160) + "px";
  });
}

/* ======================================
   NAVIGATION & PROMPTS
====================================== */

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebar-overlay")?.classList.remove("visible");
}

function bindNavigation() {
  $("#new-chat")?.addEventListener("click", createNewChat);

  $("#header-new-chat")?.addEventListener("click", createNewChat);

  $("#open-sidebar")?.addEventListener("click", () => {
    $("#sidebar")?.classList.add("open");
    $("#sidebar-overlay")?.classList.add("visible");
  });

  $("#close-sidebar")?.addEventListener("click", closeSidebar);
  $("#sidebar-overlay")?.addEventListener("click", closeSidebar);

  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      if (sending) {
        toast("Tunggu jawaban sebelumnya selesai.");
        return;
      }

      sendMessage(button.dataset.prompt || "");
    });
  });
}

/* ======================================
   START HAO AI
====================================== */

function initHAO() {
  ensureActive();
  createModelPicker();
  bindInput();
  bindNavigation();
  updateView();

  console.log("HAO AI siap.", {
    models: MODELS.length,
    activeConversation: activeId
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHAO, { once: true });
} else {
  initHAO();
}
