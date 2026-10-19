
"use strict";

const API_URL = "/api";
const STORAGE_KEY = "haomiConversationsV1";
const ACTIVE_KEY = "haomiActiveConversationV1";
const MODEL_KEY = "haomiSelectedModelV1";
const DEFAULT_MODEL = "openai/gpt-4o";
const MAX_MESSAGE_LENGTH = 12000;

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
].map(([id, name, group]) => ({ id, name, group }));

const TOOL_CONFIG = {
  "alight-motion": {
    title: "Alight Motion",
    icon: "▶",
    description: "Kirim permintaan verifikasi atau proses tautan verifikasi akun milikmu.",
    notice: "Gunakan email dan tautan verifikasi milikmu sendiri. Jangan bagikan tautan autentikasi kepada orang lain."
  },
  "urlscan": {
    title: "Scan URL",
    icon: "⌕",
    description: "Periksa tautan dan lihat hasil yang dikembalikan layanan pemindaian.",
    notice: "Hasil pemindaian bukan jaminan bahwa sebuah situs aman. Hindari membuka tautan mencurigakan."
  },
  "whatsapp-react": {
    title: "Reaksi WhatsApp",
    icon: "◉",
    description: "Kirim reaksi emoji pada postingan kanal WhatsApp yang dapat diakses.",
    notice: "Gunakan hanya tautan postingan yang dapat kamu akses dan jangan mengirim reaksi berulang secara berlebihan."
  }
};

let conversations = loadConversations();
let activeId = safeGet(ACTIVE_KEY, "");
let selectedModel = safeGet(MODEL_KEY, DEFAULT_MODEL);
let sending = false;
let activeTool = "";
let requestSequence = 0;
let toastTimer = null;

/* STORAGE */

function safeGet(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error("HAOMI storage error:", error);
    return false;
  }
}

function loadConversations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(item =>
      item && typeof item.id === "string" && Array.isArray(item.messages)
    ).map(item => ({
      id: item.id,
      title: String(item.title || "Obrolan baru"),
      model: String(item.model || DEFAULT_MODEL),
      messages: item.messages.filter(message =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string"
      ),
      createdAt: Number(item.createdAt) || Date.now(),
      updatedAt: Number(item.updatedAt) || Date.now()
    }));
  } catch {
    return [];
  }
}

function saveState() {
  const ok = safeSet(STORAGE_KEY, JSON.stringify(conversations));
  safeSet(ACTIVE_KEY, activeId);
  safeSet(MODEL_KEY, selectedModel);

  if (!ok) showToast("Riwayat tidak tersimpan. Periksa ruang penyimpanan browser.");
}

function makeId() {
  return "haomi-" + (
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
  );
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

function activeConversation() {
  return conversations.find(item => item.id === activeId) || null;
}

function ensureConversation() {
  let current = activeConversation();

  if (!current) {
    current = newConversation();
    conversations.unshift(current);
    activeId = current.id;
    saveState();
  }

  return current;
}

function modelName(id) {
  return MODELS.find(model => model.id === id)?.name || id;
}

/* HELPERS */

function $(selector, root = document) {
  return root.querySelector(selector);
}

function button(text, className, title = "") {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  if (title) element.title = title;
  return element;
}

function showToast(message) {
  const region = $("#toast-region");
  if (!region) return;

  region.replaceChildren();

  const item = document.createElement("div");
  item.className = "toast-message";
  item.textContent = message;
  region.appendChild(item);

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => item.remove(), 3500);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();

  const success = document.execCommand("copy");
  input.remove();

  if (!success) throw new Error("Clipboard tidak tersedia.");
}

function moveComposer(welcome) {
  const shell = $(".composer-shell");
  const anchor = $("#welcome-composer-anchor");
  const area = $("#composer-area");

  if (!shell || !anchor || !area) return;

  if (welcome) {
    if (shell.parentElement !== anchor) anchor.appendChild(shell);
  } else if (shell.parentElement !== area) {
    area.insertBefore(shell, area.querySelector(".composer-disclaimer"));
  }
}

function closeSidebar() {
  $("#sidebar")?.classList.remove("open");
  $("#sidebar-backdrop")?.classList.remove("visible");
}

/* VIEW NAVIGATION */

function showChatView() {
  activeTool = "";

  $("#tool-view").hidden = true;
  $("#chat-view").classList.toggle(
    "active",
    ensureConversation().messages.length > 0
  );
  $("#welcome-screen").classList.toggle(
    "hidden",
    ensureConversation().messages.length > 0
  );

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.view === "chat");
  });

  $("#breadcrumb-current").textContent = "Chat";
  $("#history-section").hidden = false;

  updateView();
  closeSidebar();
}

function openTool(tool) {
  if (!TOOL_CONFIG[tool]) return;

  activeTool = tool;
  const config = TOOL_CONFIG[tool];

  $("#welcome-screen").classList.add("hidden");
  $("#chat-view").classList.remove("active");
  $("#tool-view").hidden = false;
  $("#breadcrumb-current").textContent = config.title;
  $("#history-section").hidden = true;

  $("#tool-page-icon").textContent = config.icon;
  $("#tool-page-title").textContent = config.title;
  $("#tool-page-description").textContent = config.description;
  $("#tool-page-eyebrow").textContent = "HAOMI TOOLS";
  $("#tool-notice").textContent = config.notice;

  $("#tool-result").hidden = true;
  $("#tool-result-message").textContent = "";
  $("#tool-result-data").textContent = "";

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.tool === tool);
  });

  $("#tools-popover").hidden = true;
  $("#model-menu").hidden = true;

  renderToolForm(tool);
  closeSidebar();
}

/* CHAT VIEW */

function updateView() {
  const current = ensureConversation();
  const hasMessages = current.messages.length > 0;

  if (!activeTool) {
    $("#welcome-screen").classList.toggle("hidden", hasMessages);
    $("#chat-view").classList.toggle("active", hasMessages);
    $("#breadcrumb-current").textContent = hasMessages
      ? current.title
      : "Chat";

    moveComposer(!hasMessages);
  }

  renderMessages();
  renderHistory();
  updateModelButton();
}

function renderMessages() {
  const container = $("#chat-messages");
  if (!container) return;

  container.replaceChildren();

  ensureConversation().messages.forEach(message => {
    container.appendChild(renderMessage(message));
  });

  if (sending && !activeTool) {
    container.appendChild(renderTyping());
  }

  requestAnimationFrame(() => {
    const scroll = $("#chat-scroll");
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  });
}

function renderMessage(message) {
  const user = message.role === "user";
  const row = document.createElement("article");
  row.className = "message-row " + (user ? "user" : "assistant");

  if (message.error) row.classList.add("error");

  if (!user) {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "h";
    row.appendChild(avatar);
  }

  const wrap = document.createElement("div");
  wrap.className = "message-content-wrap";

  if (!user) {
    const meta = document.createElement("div");
    meta.className = "message-meta";

    const name = document.createElement("strong");
    name.textContent = "HAOMI";

    const model = document.createElement("span");
    model.className = "message-model-tag";
    model.textContent = modelName(message.model || DEFAULT_MODEL);

    meta.append(name, model);
    wrap.appendChild(meta);
  }

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message.content;
  wrap.appendChild(bubble);

  if (!user) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = button("▢ Salin", "message-action", "Salin jawaban");
    copy.addEventListener("click", async () => {
      try {
        await copyText(message.content);
        showToast("Jawaban disalin.");
      } catch {
        showToast("Tidak dapat menyalin teks.");
      }
    });

    actions.appendChild(copy);
    wrap.appendChild(actions);
  }

  row.appendChild(wrap);
  return row;
}

function renderTyping() {
  const row = document.createElement("article");
  row.className = "message-row assistant";

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "h";

  const wrap = document.createElement("div");
  wrap.className = "message-content-wrap";

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "HAOMI sedang berpikir";

  const dots = document.createElement("div");
  dots.className = "typing-bubble";

  for (let i = 0; i < 3; i++) {
    dots.appendChild(document.createElement("span"));
  }

  wrap.append(meta, dots);
  row.append(avatar, wrap);
  return row;
}

/* HISTORY */

function renderHistory() {
  const list = $("#conversation-list");
  if (!list) return;

  const query = ($("#history-search")?.value || "").trim().toLowerCase();
  const items = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter(item => !query ||
      item.title.toLowerCase().includes(query) ||
      item.messages.some(message => message.content.toLowerCase().includes(query))
    );

  $("#history-count").textContent = String(conversations.length);
  list.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = query ? "Tidak ada hasil." : "Belum ada percakapan.";
    list.appendChild(empty);
    return;
  }

  items.forEach(conversation => {
    const row = document.createElement("div");
    row.className = "history-row";

    const open = button(
      conversation.title,
      "history-open" + (conversation.id === activeId ? " active" : "")
    );

    open.addEventListener("click", () => {
      if (sending) {
        showToast("Tunggu jawaban selesai sebelum pindah obrolan.");
        return;
      }

      activeId = conversation.id;
      selectedModel = conversation.model || DEFAULT_MODEL;
      showChatView();
      saveState();
    });

    const remove = button("×", "history-delete", "Hapus obrolan");
    remove.addEventListener("click", () => {
      if (sending && conversation.id === activeId) {
        showToast("Tunggu jawaban selesai sebelum menghapus.");
        return;
      }

      if (!confirm(`Hapus obrolan "${conversation.title}"?`)) return;

      conversations = conversations.filter(item => item.id !== conversation.id);

      if (activeId === conversation.id) {
        activeId = "";
        ensureConversation();
      }

      saveState();
      updateView();
      showToast("Obrolan dihapus.");
    });

    row.append(open, remove);
    list.appendChild(row);
  });
}

function createNewChat() {
  if (sending) {
    showToast("Tunggu jawaban selesai terlebih dahulu.");
    return;
  }

  const conversation = newConversation();
  conversations.unshift(conversation);
  activeId = conversation.id;
  selectedModel = conversation.model;

  saveState();
  showChatView();
  $("#chat-input").focus();
}

/* CHAT REQUEST */

function setSending(value) {
  sending = value;

  $("#chat-input").disabled = value;
  $("#send-button").disabled = value;
  $("#send-button").classList.toggle("loading", value);
  $("#send-button").setAttribute("aria-busy", String(value));
  $("#composer-state").textContent = value ? "Memproses..." : "Siap membantu";
}

async function sendMessage(raw) {
  const question = String(raw || "").trim();

  if (!question || sending) return;

  if (question.length > MAX_MESSAGE_LENGTH) {
    showToast("Pesan terlalu panjang.");
    return;
  }

  activeTool = "";
  $("#tool-view").hidden = true;

  const current = ensureConversation();
  const conversationId = current.id;
  const model = selectedModel;
  const requestId = ++requestSequence;

  current.messages.push({
    role: "user",
    content: question,
    model,
    createdAt: Date.now()
  });

  if (current.title === "Obrolan baru") {
    current.title = question.length > 48
      ? question.slice(0, 48).trimEnd() + "…"
      : question;
  }

  current.model = model;
  current.updatedAt = Date.now();

  $("#chat-input").value = "";
  $("#chat-input").style.height = "auto";

  saveState();
  setSending(true);
  updateView();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        action: "chat",
        question,
        model,
        session_id: conversationId
      })
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    const answer = data.answer || data.result || data.response;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("Respons AI kosong.");
    }

    if (requestId !== requestSequence) return;

    const target = conversations.find(item => item.id === conversationId);
    if (!target) return;

    target.messages.push({
      role: "assistant",
      content: answer.trim(),
      model: data.model || model,
      createdAt: Date.now()
    });

    target.updatedAt = Date.now();
    saveState();
  } catch (error) {
    console.error("HAOMI chat error:", error.message);

    const target = conversations.find(item => item.id === conversationId);

    if (target && requestId === requestSequence) {
      target.messages.push({
        role: "assistant",
        content: "Maaf, HAOMI belum berhasil mendapatkan jawaban.\n\n" + error.message,
        model,
        error: true,
        createdAt: Date.now()
      });

      target.updatedAt = Date.now();
      saveState();
    }
  } finally {
    if (requestId === requestSequence) {
      setSending(false);
      updateView();
    }
  }
}

function bindComposer() {
  const form = $("#chat-form");
  const input = $("#chat-input");

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!sending) sendMessage(input.value);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!sending) form.requestSubmit();
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 170) + "px";
  });
}

/* MODEL SELECTOR */

function initializeModels() {
  const menu = $("#model-menu");
  const buttonElement = $("#model-button");
  const search = $("#model-search-input");
  const options = $("#model-options");

  function renderOptions(filter = "") {
    options.replaceChildren();

    const query = filter.trim().toLowerCase();
    const matches = MODELS.filter(item =>
      `${item.name} ${item.id} ${item.group}`.toLowerCase().includes(query)
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
        heading.textContent = model.group;
        options.appendChild(heading);
      }

      const item = button("", "model-option" + (model.id === selectedModel ? " selected" : ""));
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(model.id === selectedModel));

      const copy = document.createElement("span");
      copy.className = "model-option-copy";

      const name = document.createElement("strong");
      name.textContent = model.name;

      const id = document.createElement("small");
      id.textContent = model.id;

      const check = document.createElement("span");
      check.className = "model-option-check";
      check.textContent = model.id === selectedModel ? "✓" : "";

      copy.append(name, id);
      item.append(copy, check);

      item.addEventListener("click", () => {
        if (sending) {
          showToast("Tunggu jawaban selesai sebelum mengganti model.");
          return;
        }

        selectedModel = model.id;
        ensureConversation().model = selectedModel;
        saveState();
        updateModelButton();
        renderOptions(search.value);
        menu.hidden = true;
        buttonElement.setAttribute("aria-expanded", "false");
        showToast("Model dipilih: " + model.name);
      });

      options.appendChild(item);
    });
  }

  buttonElement.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    buttonElement.setAttribute("aria-expanded", String(!menu.hidden));
    $("#tools-popover").hidden = true;

    if (!menu.hidden) {
      search.value = "";
      renderOptions();
      search.focus();
    }
  });

  search.addEventListener("input", () => renderOptions(search.value));

  document.addEventListener("click", event => {
    if (!$("#model-picker").contains(event.target)) {
      menu.hidden = true;
      buttonElement.setAttribute("aria-expanded", "false");
    }
  });

  renderOptions();
  updateModelButton();
}

function updateModelButton() {
  $("#model-button-label").textContent = modelName(selectedModel);
  $("#default-model-setting").value = selectedModel;
}

/* TOOLS: FORM CREATION */

function field(label, name, placeholder, options = {}) {
  const group = document.createElement("div");
  group.className = "field-group";

  const title = document.createElement("label");
  title.htmlFor = "tool-field-" + name;
  title.textContent = label;

  const control = options.multiline
    ? document.createElement("textarea")
    : document.createElement("input");

  control.id = "tool-field-" + name;
  control.name = name;
  control.className = "field-control";
  control.placeholder = placeholder;
  control.required = options.required !== false;

  if (!options.multiline) {
    control.type = options.type || "text";
    if (options.autocomplete) control.autocomplete = options.autocomplete;
    if (options.maxLength) control.maxLength = options.maxLength;
  }

  group.append(title, control);

  if (options.help) {
    const help = document.createElement("small");
    help.className = "field-help";
    help.textContent = options.help;
    group.appendChild(help);
  }

  return group;
}

function renderToolForm(tool) {
  const container = $("#tool-fields");
  container.replaceChildren();

  if (tool === "alight-motion") {
    const actionField = document.createElement("div");
    actionField.className = "field-group";

    const label = document.createElement("label");
    label.htmlFor = "am-action";
    label.textContent = "Tindakan";

    const select = document.createElement("select");
    select.id = "am-action";
    select.name = "amAction";
    select.className = "field-control";

    [
      ["am-send", "Kirim permintaan verifikasi"],
      ["am-verify", "Verifikasi dengan tautan"]
    ].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });

    actionField.append(label, select);
    container.appendChild(actionField);
    container.appendChild(field("Email akun", "email", "nama@email.com", {
      type: "email",
      autocomplete: "email",
      maxLength: 254,
      help: "Gunakan email untuk akun yang kamu miliki atau berwenang mengelolanya."
    }));

    const linkGroup = field(
      "Tautan verifikasi",
      "link",
      "Tempel tautan verifikasi yang kamu terima",
      {
        multiline: true,
        required: false,
        help: "Hanya diperlukan untuk tindakan verifikasi. Tautan ini dapat berisi kode autentikasi sensitif."
      }
    );

    linkGroup.id = "am-link-group";
    container.appendChild(linkGroup);

    select.addEventListener("change", () => {
      const verify = select.value === "am-verify";
      $("#tool-field-link").required = verify;
      $("#am-link-group").hidden = !verify;
      $("#tool-field-link").value = "";
    });

    $("#am-link-group").hidden = true;
    $("#tool-field-link").required = false;
  }

  if (tool === "urlscan") {
    container.appendChild(field(
      "URL yang akan dipindai",
      "url",
      "https://contoh.com",
      {
        type: "url",
        maxLength: 8000,
        help: "Masukkan alamat situs lengkap yang diawali http:// atau https://."
      }
    ));
  }

  if (tool === "whatsapp-react") {
    container.appendChild(field(
      "Tautan postingan kanal",
      "url",
      "https://whatsapp.com/channel/...",
      {
        type: "url",
        maxLength: 2000,
        help: "Gunakan tautan postingan kanal WhatsApp yang valid."
      }
    ));

    const group = document.createElement("div");
    group.className = "field-group";

    const label = document.createElement("label");
    label.htmlFor = "wa-reactions";
    label.textContent = "Emoji reaksi";

    const select = document.createElement("select");
    select.id = "wa-reactions";
    select.className = "field-control";
    select.name = "reaction";

    [
      ["👍", "👍 Jempol"],
      ["❤️", "❤️ Hati"],
      ["😂", "😂 Tertawa"],
      ["😮", "😮 Terkejut"],
      ["🙏", "🙏 Terima kasih"],
      ["🔥", "🔥 Keren"],
      ["😍", "😍 Suka"],
      ["🥰", "🥰 Sayang"],
      ["😋", "😋 Nikmat"],
      ["💦", "💦 Tetesan"]
    ].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });

    group.append(label, select);
    container.appendChild(group);
  }

  $("#tool-submit").textContent = "Jalankan alat →";
  $("#tool-result").hidden = true;
}

/* TOOL REQUESTS */

function redactSensitive(value, key = "") {
  const sensitiveKey = /(^|_)(apikey|api_key|token|secret|password|authorization|oobcode|code|link|url|email)(_|$)/i;

  if (sensitiveKey.test(key)) return "[disembunyikan]";

  if (Array.isArray(value)) {
    return value.map(item => redactSensitive(item));
  }

  if (value && typeof value === "object") {
    const result = {};

    Object.entries(value).forEach(([childKey, childValue]) => {
      result[childKey] = redactSensitive(childValue, childKey);
    });

    return result;
  }

  if (typeof value === "string") {
    // Redaksi URL verifikasi yang mungkin muncul di pesan respons.
    return value
      .replace(/https?:\/\/\S+/gi, "[tautan disembunyikan]")
      .replace(/\b[A-Za-z0-9_-]{30,}\b/g, "[kode disembunyikan]");
  }

  return value;
}

async function submitTool(event) {
  event.preventDefault();

  if (!activeTool) return;

  const form = $("#tool-form");
  const submit = $("#tool-submit");
  const data = new FormData(form);
  const action = activeTool;

  const payload = {};

  if (action === "alight-motion") {
    payload.action = data.get("amAction");
    payload.email = String(data.get("email") || "").trim();

    if (payload.action === "am-verify") {
      payload.link = String(data.get("link") || "").trim();
    }
  }

  if (action === "urlscan") {
    payload.action = "urlscan";
    payload.url = String(data.get("url") || "").trim();
  }

  if (action === "whatsapp-react") {
    payload.action = "whatsapp-react";
    payload.url = String(data.get("url") || "").trim();
    payload.reaction = String(data.get("reaction") || "").trim();
  }

  if (!form.reportValidity()) return;

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    showToast("Format email tidak valid.");
    return;
  }

  submit.disabled = true;
  submit.textContent = "Memproses...";
  $("#tool-result").hidden = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error || result.message || `HTTP ${response.status}`);
    }

    $("#tool-result").hidden = false;
    $("#tool-result-message").textContent =
      result.message || "Permintaan diterima oleh layanan.";

    const safeResult = redactSensitive(result.result ?? result);
    $("#tool-result-data").textContent = JSON.stringify(safeResult, null, 2);

    showToast("Permintaan selesai.");
  } catch (error) {
    $("#tool-result").hidden = false;
    $("#tool-result-message").textContent = "Permintaan gagal: " + error.message;
    $("#tool-result-data").textContent = "";
    showToast("Alat gagal dijalankan. Periksa hasilnya.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Jalankan alat →";
  }
}

/* TOOLS MENU */

function initializeTools() {
  $("#tools-toggle").addEventListener("click", () => {
    const popover = $("#tools-popover");
    popover.hidden = !popover.hidden;
    $("#model-menu").hidden = true;
    $("#model-button").setAttribute("aria-expanded", "false");
  });

  document.querySelectorAll("[data-tool]").forEach(element => {
    element.addEventListener("click", () => openTool(element.dataset.tool));
  });

  $("#back-to-chat").addEventListener("click", showChatView);
  $("#tool-form").addEventListener("submit", submitTool);

  document.addEventListener("click", event => {
    const popover = $("#tools-popover");

    if (
      !popover.contains(event.target) &&
      !$("#tools-toggle").contains(event.target)
    ) {
      popover.hidden = true;
    }
  });

  $("#copy-tool-result").addEventListener("click", async () => {
    const text = [
      $("#tool-result-message").textContent,
      $("#tool-result-data").textContent
    ].filter(Boolean).join("\n\n");

    try {
      await copyText(text);
      showToast("Hasil disalin.");
    } catch {
      showToast("Tidak dapat menyalin hasil.");
    }
  });
}

/* NAVIGATION & SETTINGS */

function initializeNavigation() {
  $("#new-chat").addEventListener("click", createNewChat);
  $("#sidebar-open").addEventListener("click", () => {
    $("#sidebar").classList.add("open");
    $("#sidebar-backdrop").classList.add("visible");
  });

  $("#sidebar-close").addEventListener("click", closeSidebar);
  $("#sidebar-backdrop").addEventListener("click", closeSidebar);
  $("#history-search").addEventListener("input", renderHistory);

  document.querySelectorAll("[data-prompt]").forEach(element => {
    element.addEventListener("click", () => sendMessage(element.dataset.prompt));
  });

  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      createNewChat();
    }

    if (event.key === "Escape") {
      $("#tools-popover").hidden = true;
      $("#model-menu").hidden = true;
      closeSidebar();
    }
  });
}

function initializeSettings() {
  const dialog = $("#settings-dialog");

  [$("#open-settings"), $("#topbar-settings")].forEach(element => {
    element.addEventListener("click", () => {
      populateDefaultModelOptions();
      dialog.showModal();
      closeSidebar();
    });
  });

  $("#settings-close").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  $("#default-model-setting").addEventListener("change", event => {
    if (sending) {
      event.target.value = selectedModel;
      showToast("Tunggu jawaban selesai.");
      return;
    }

    selectedModel = event.target.value;
    ensureConversation().model = selectedModel;
    saveState();
    updateModelButton();
    showToast("Model default diperbarui.");
  });

  $("#clear-history").addEventListener("click", () => {
    if (sending) {
      showToast("Tunggu jawaban selesai sebelum menghapus riwayat.");
      return;
    }

    if (!confirm("Hapus semua riwayat chat di browser ini?")) return;

    conversations = [];
    activeId = "";
    ensureConversation();
    saveState();
    updateView();
    dialog.close();
    showToast("Riwayat lokal dihapus.");
  });
}

function populateDefaultModelOptions() {
  const select = $("#default-model-setting");
  select.replaceChildren();

  MODELS.forEach(model => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = `${model.name} — ${model.group}`;
    select.appendChild(option);
  });

  select.value = selectedModel;
}

/* START */

function init() {
  ensureConversation();
  bindComposer();
  initializeModels();
  initializeTools();
  initializeNavigation();
  initializeSettings();
  updateView();

  console.info("HAOMI siap.", { models: MODELS.length });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
