
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const API_URL = "/api";
  const STORAGE_KEY = "haomi_workspace_v2";
  const SETTINGS_KEY = "haomi_settings_v1";

  const models = {
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
    "google/gemini-3.1-pro-preview": ["Gemini 3.1 Pro", "Google"],
    "google/gemini-3-pro-preview": ["Gemini 3 Pro", "Google"],
    "google/gemini-3.1-flash-lite": ["Gemini 3.1 Flash Lite", "Google"],
    "alibaba/qwen3-max": ["Qwen3 Max", "Alibaba"],
    "meta/llama-4-maverick": ["Llama 4 Maverick", "Meta"],
    "moonshotai/kimi-k2.6": ["Kimi K2.6", "Moonshot AI"]
  };

  const els = {
    sidebar: $("#sidebar"),
    overlay: $("#sidebarOverlay"),
    conversationList: $("#conversationList"),
    historyCount: $("#historyCount"),
    historySearch: $("#historySearch"),
    messages: $("#messages"),
    welcome: $("#welcomeScreen"),
    chatScroll: $("#chatScroll"),
    chatForm: $("#chatForm"),
    input: $("#chatInput"),
    send: $("#sendButton"),
    modelTrigger: $("#modelPickerTrigger"),
    modelLabel: $("#selectedModelLabel"),
    modelDialog: $("#modelDialog"),
    modelList: $("#modelList"),
    modelSearch: $("#modelSearch"),
    closeModel: $("#closeModelDialog"),
    breadcrumb: $("#breadcrumbTitle"),
    settings: $("#settingsModal"),
    defaultModel: $("#defaultModelSelect"),
    toast: $("#toastContainer")
  };

  let state = loadState();
  let busy = false;
  let requestId = 0;
  let lastFocusedElement = null;

  function id() {
    return window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function getDefaultModel() {
    const saved = loadSettings().defaultModel;
    return models[saved] ? saved : "openai/gpt-4o";
  }

  function applySettings() {
    const settings = loadSettings();
    const theme = ["light", "dark", "system"].includes(settings.theme) ? settings.theme : "light";
    const resolvedTheme = theme === "system"
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.density = settings.density === "compact" ? "compact" : "comfortable";
    document.documentElement.classList.toggle("reduce-motion", Boolean(settings.reduceMotion));

    const themeSelect = $("#themeSelect");
    const densitySelect = $("#densitySelect");
    const enterToggle = $("#enterToSendToggle");
    const motionToggle = $("#reduceMotionToggle");
    if (themeSelect) themeSelect.value = theme;
    if (densitySelect) densitySelect.value = settings.density === "compact" ? "compact" : "comfortable";
    if (enterToggle) enterToggle.checked = settings.enterToSend !== false;
    if (motionToggle) motionToggle.checked = Boolean(settings.reduceMotion);
  }

  function newConversation() {
    return {
      id: id(),
      title: "Obrolan baru",
      model: getDefaultModel(),
      sessionId: `haomi-${id()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

      if (saved && Array.isArray(saved.conversations)) {
        return saved;
      }
    } catch (error) {
      console.warn("Riwayat tidak dapat dibaca:", error);
    }

    return { conversations: [], activeId: "" };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast("Penyimpanan browser penuh. Riwayat belum tersimpan.", true);
    }
  }

  function saveSettings(value) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
    } catch {
      toast("Pengaturan tidak dapat disimpan.", true);
    }
  }

  function activeConversation() {
    return state.conversations.find(item => item.id === state.activeId) || null;
  }

  function ensureConversation() {
    let conversation = activeConversation();

    if (!conversation) {
      conversation = newConversation();
      state.conversations.unshift(conversation);
      state.activeId = conversation.id;
      saveState();
    }

    return conversation;
  }

  function modelName(model) {
    return models[model]?.[0] || model || "AI";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function inlineMarkdown(text) {
    let html = escapeHTML(text);

    html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, label, url) => {
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol)) return label;

          return `<a href="${escapeHTML(parsed.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        } catch {
          return label;
        }
      }
    );

    return html;
  }

  function markdown(source) {
    const blocks = String(source ?? "").replace(/\r\n/g, "\n").split("```");
    const result = [];

    blocks.forEach((block, index) => {
      if (index % 2 === 1) {
        const split = block.indexOf("\n");
        const code = split >= 0 ? block.slice(split + 1) : block;
        result.push(`<pre><code>${escapeHTML(code.trimEnd())}</code></pre>`);
        return;
      }

      let paragraph = [];
      let list = [];
      let listType = "";

      const flushParagraph = () => {
        if (!paragraph.length) return;
        result.push(`<p>${paragraph.map(inlineMarkdown).join("<br>")}</p>`);
        paragraph = [];
      };

      const flushList = () => {
        if (!list.length) return;
        result.push(
          `<${listType}>${list.map(item => `<li>${inlineMarkdown(item)}</li>`).join("")}</${listType}>`
        );
        list = [];
        listType = "";
      };

      block.split("\n").forEach(line => {
        const text = line.trim();
        if (!text) {
          flushParagraph();
          flushList();
          return;
        }

        const heading = text.match(/^(#{1,3})\s+(.+)$/);
        const unordered = text.match(/^[-*]\s+(.+)$/);
        const ordered = text.match(/^\d+[.)]\s+(.+)$/);

        if (heading) {
          flushParagraph();
          flushList();
          const level = Math.min(heading[1].length + 1, 4);
          result.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
          return;
        }

        if (unordered || ordered) {
          flushParagraph();
          const nextType = unordered ? "ul" : "ol";
          if (listType && listType !== nextType) flushList();
          listType = nextType;
          list.push((unordered || ordered)[1]);
          return;
        }

        if (text.startsWith(">")) {
          flushParagraph();
          flushList();
          result.push(`<blockquote>${inlineMarkdown(text.slice(1).trim())}</blockquote>`);
          return;
        }

        flushList();
        paragraph.push(text);
      });

      flushParagraph();
      flushList();
    });

    return result.join("");
  }

  function toast(message, error = false) {
    const item = document.createElement("div");
    item.className = `toast${error ? " error" : ""}`;
    item.textContent = message;
    els.toast.appendChild(item);
    window.setTimeout(() => item.remove(), 3300);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(text));
      } else {
        const area = document.createElement("textarea");
        area.value = String(text);
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) throw new Error("Gagal menyalin");
      }
      toast("Berhasil disalin.");
    } catch {
      toast("Tidak dapat menyalin teks.", true);
    }
  }

  function scrollBottom() {
    requestAnimationFrame(() => {
      els.chatScroll.scrollTop = els.chatScroll.scrollHeight;
    });
  }

  function addMessage(message, index) {
    const article = document.createElement("article");
    article.className = `message ${message.role}`;
    if (message.error) article.classList.add("message-error");

    if (message.role === "user") {
      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = message.content;
      article.appendChild(bubble);
      els.messages.appendChild(article);
      return;
    }

    const heading = document.createElement("div");
    heading.className = "assistant-heading";

    const avatar = document.createElement("span");
    avatar.className = "assistant-avatar";
    avatar.textContent = "h.";

    const name = document.createElement("span");
    name.className = "assistant-name";
    name.textContent = "HAOMI";

    const badge = document.createElement("span");
    badge.className = "model-badge";
    badge.textContent = modelName(message.model);

    heading.append(avatar, name, badge);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = markdown(message.content);

    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "message-action";
    copy.textContent = "Salin";
    copy.addEventListener("click", () => copyText(message.content));
    actions.appendChild(copy);

    if (message.error) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "message-action";
      retry.textContent = "Coba lagi";
      retry.addEventListener("click", () => retryLastQuestion(index));
      actions.appendChild(retry);
    }

    article.append(heading, bubble, actions);
    els.messages.appendChild(article);
  }

  function renderMessages() {
    const conversation = activeConversation();
    els.messages.replaceChildren();

    const hasMessages = Boolean(conversation?.messages?.length);
    els.welcome.hidden = hasMessages;

    if (conversation) {
      conversation.messages.forEach((message, index) => addMessage(message, index));
    }

    if (hasMessages) scrollBottom();
  }

  function renderHistory() {
    const query = (els.historySearch.value || "").trim().toLowerCase();
    const conversations = [...state.conversations]
      .sort((a, b) => b.updatedAt - a.updatedAt);

    els.conversationList.replaceChildren();
    els.historyCount.textContent = String(conversations.length);

    const filtered = conversations.filter(item =>
      item.title.toLowerCase().includes(query)
    );

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty-history";
      empty.textContent = query
        ? "Tidak ada percakapan yang cocok."
        : "Percakapanmu akan muncul di sini.";
      els.conversationList.appendChild(empty);
      return;
    }

    filtered.forEach(conversation => {
      const row = document.createElement("div");
      row.className = "history-item";

      const open = document.createElement("button");
      open.type = "button";
      open.className = "history-open";
      open.textContent = conversation.title;
      open.title = conversation.title;
      open.classList.toggle("selected", conversation.id === state.activeId);

      open.addEventListener("click", () => {
        if (busy) {
          toast("Tunggu jawaban selesai sebelum berpindah obrolan.");
          return;
        }

        state.activeId = conversation.id;
        saveState();
        renderHistory();
        renderMessages();
        showView("chat");
        closeSidebar();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "history-delete";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Hapus percakapan");

      remove.addEventListener("click", () => {
        if (busy && conversation.id === state.activeId) {
          toast("Tunggu jawaban selesai sebelum menghapus obrolan.");
          return;
        }

        if (!confirm(`Hapus "${conversation.title}" dari riwayat?`)) return;

        state.conversations = state.conversations.filter(item => item.id !== conversation.id);

        if (state.activeId === conversation.id) {
          const replacement = newConversation();
          state.conversations.unshift(replacement);
          state.activeId = replacement.id;
        }

        saveState();
        renderHistory();
        renderMessages();
      });

      row.append(open, remove);
      els.conversationList.appendChild(row);
    });
  }

  function setBusy(value) {
    busy = value;
    els.send.disabled = value;
    els.input.disabled = value;
    els.send.classList.toggle("is-loading", value);
    els.send.setAttribute("aria-label", value ? "Sedang memproses" : "Kirim pesan");
  }

  async function apiRequest(action, payload = {}) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ action, ...payload })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Respons server tidak valid (HTTP ${response.status}).`);
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Permintaan gagal (HTTP ${response.status}).`);
    }

    return data;
  }

  function updateTitle(conversation) {
    const first = conversation.messages.find(message => message.role === "user");
    if (!first) return;

    const title = first.content.replace(/\s+/g, " ").trim();
    conversation.title = title.length > 42 ? `${title.slice(0, 39)}…` : title || "Obrolan baru";
  }

  function createLoading(sequence, model) {
    const article = document.createElement("article");
    article.className = "message assistant";
    article.dataset.loadingId = String(sequence);

    const heading = document.createElement("div");
    heading.className = "assistant-heading";

    const avatar = document.createElement("span");
    avatar.className = "assistant-avatar";
    avatar.textContent = "h.";

    const name = document.createElement("span");
    name.className = "assistant-name";
    name.textContent = "HAOMI";

    const badge = document.createElement("span");
    badge.className = "model-badge";
    badge.textContent = modelName(model);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const dots = document.createElement("div");
    dots.className = "typing-row";
    dots.setAttribute("aria-label", "HAOMI sedang berpikir");

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      dots.appendChild(dot);
    }

    bubble.appendChild(dots);
    heading.append(avatar, name, badge);
    article.append(heading, bubble);
    els.messages.appendChild(article);
    scrollBottom();
    return article;
  }

  async function sendMessage(rawText) {
    const prompt = String(rawText || "").trim();
    if (!prompt || busy) return;

    const conversation = ensureConversation();
    const sequence = ++requestId;
    const model = conversation.model || getDefaultModel();

    // Simpan isi sebelum mengosongkan composer agar tidak terkirim ulang.
    conversation.messages.push({
      role: "user",
      content: prompt,
      createdAt: Date.now()
    });

    updateTitle(conversation);
    conversation.updatedAt = Date.now();

    els.input.value = "";
    resizeInput();
    setBusy(true);
    saveState();
    renderHistory();
    renderMessages();

    const loading = createLoading(sequence, model);

    try {
      const data = await apiRequest("chat", {
        prompt,
        model,
        session_id: conversation.sessionId
      });

      const rawAnswer = data.answer ?? data.result ?? data.response ?? data.message;
      const answer = typeof rawAnswer === "string"
        ? rawAnswer
        : rawAnswer == null ? "" : JSON.stringify(rawAnswer, null, 2);

      if (!answer.trim()) {
        throw new Error("API tidak mengembalikan teks jawaban.");
      }

      conversation.sessionId = data.session_id || conversation.sessionId;
      conversation.messages.push({
        role: "assistant",
        content: answer,
        model: data.model || model,
        createdAt: Date.now()
      });
    } catch (error) {
      conversation.messages.push({
        role: "assistant",
        content: `Maaf, HAOMI belum berhasil mendapatkan jawaban.\n\n${error.message || "Terjadi kesalahan jaringan."}`,
        model,
        error: true,
        createdAt: Date.now()
      });
    } finally {
      // Satu-satunya tempat loading dihapus. Tidak ada footer/disclaimer
      // yang ditambahkan dari JavaScript, sehingga tidak muncul ganda.
      loading.remove();

      conversation.updatedAt = Date.now();
      saveState();
      renderHistory();
      renderMessages();
      setBusy(false);

      // Jangan panggil input.focus() di sini.
      // Keyboard HP tidak boleh muncul sendiri setelah jawaban selesai.
    }
  }

  async function retryLastQuestion(index) {
    if (busy) return;

    const conversation = activeConversation();
    if (!conversation) return;

    const errorMessage = conversation.messages[index];
    if (!errorMessage?.error) return;

    const previousUser = conversation.messages
      .slice(0, index)
      .reverse()
      .find(message => message.role === "user");

    if (!previousUser) {
      toast("Pesan sebelumnya tidak ditemukan.", true);
      return;
    }

    const prompt = previousUser.content;

    // Hilangkan jawaban error. Kirim ulang prompt tanpa menambah
    // bubble user kedua kalinya.
    conversation.messages.splice(index, 1);
    conversation.messages.splice(conversation.messages.indexOf(previousUser), 1);
    saveState();
    renderMessages();

    await sendMessage(prompt);
  }

  function resizeInput() {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 160)}px`;
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  const viewIds = {
    chat: "chatView",
    alight: "alightView",
    urlscan: "urlscanView",
    whatsapp: "whatsappView"
  };

  const viewTitles = {
    chat: "Chat AI",
    alight: "Alight Motion",
    urlscan: "Scan URL",
    whatsapp: "Reaksi WhatsApp"
  };

  function showView(name) {
    if (!viewIds[name]) return;

    Object.entries(viewIds).forEach(([key, elementId]) => {
      const view = document.getElementById(elementId);
      view.hidden = key !== name;
      view.classList.toggle("active", key === name);
    });

    $$("[data-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.view === name);
    });

    els.breadcrumb.textContent = viewTitles[name];
    closeSidebar();

    // Sengaja tidak memfokuskan textarea ketika kembali ke chat.
    // Pengguna menyentuh kolom sendiri jika ingin mengetik.
    if (name === "chat") renderMessages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newChat() {
    if (busy) {
      toast("Tunggu jawaban selesai sebelum membuat obrolan baru.");
      return;
    }

    const conversation = newConversation();
    state.conversations.unshift(conversation);
    state.activeId = conversation.id;

    saveState();
    renderHistory();
    renderMessages();
    showView("chat");
    closeSidebar();
  }

  function openModelDialog() {
    lastFocusedElement = document.activeElement;
    els.modelDialog.hidden = false;
    els.modelTrigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    updateModelOptions();
    // Jangan otomatis membuka keyboard pencarian di HP.
  }

  function closeModelDialog() {
    els.modelDialog.hidden = true;
    els.modelTrigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    lastFocusedElement?.focus?.({ preventScroll: true });
  }

  function updateModelOptions() {
    const query = (els.modelSearch.value || "").trim().toLowerCase();
    const selected = activeConversation()?.model || getDefaultModel();

    $$(".model-option", els.modelList).forEach(button => {
      const name = models[button.dataset.model]?.join(" ") || button.dataset.model;
      const matches = name.toLowerCase().includes(query);
      button.hidden = !matches;
      button.classList.toggle("selected", button.dataset.model === selected);
    });
  }

  function selectModel(model) {
    if (!models[model]) return;

    const conversation = ensureConversation();
    conversation.model = model;
    saveState();

    els.modelLabel.textContent = modelName(model);
    updateModelOptions();
    closeModelDialog();

    toast(`Model dipilih: ${modelName(model)}`);
  }

  function openSettings() {
    els.defaultModel.value = getDefaultModel();
    applySettings();
    els.settings.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    els.settings.hidden = true;
    document.body.style.overflow = "";
  }

  function updateAlightFields() {
    const needsLink = $("#alightAction").value === "am-verify";
    $("#verificationLinkGroup").hidden = !needsLink;
    $("#alightLink").required = needsLink;
    $("#alightSubmit").innerHTML = `${needsLink ? "Verifikasi tautan" : "Kirim permintaan"} <span>→</span>`;
  }

  function showToolResult(element, text, status = "") {
    element.classList.remove("is-error", "is-success");
    if (status) element.classList.add(status === "error" ? "is-error" : "is-success");
    element.textContent = text;
  }

  function stringifyResult(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  async function runTool(form, button, resultElement, action, payload, loadingText) {
    if (form.dataset.busy === "true") return;

    form.dataset.busy = "true";
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = loadingText;

    showToolResult(resultElement, "Sedang menghubungi layanan API…");

    try {
      const data = await apiRequest(action, payload);
      const result = data.result ?? data.data ?? data;
      showToolResult(resultElement, stringifyResult(result), "success");
      toast("Permintaan selesai.");
    } catch (error) {
      showToolResult(
        resultElement,
        `Permintaan gagal: ${error.message || "Terjadi kesalahan."}`,
        "error"
      );
      toast("Permintaan gagal. Periksa hasil untuk detail.", true);
    } finally {
      form.dataset.busy = "false";
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function bindEvents() {
    $("#openSidebar").addEventListener("click", openSidebar);
    $("#closeSidebar").addEventListener("click", closeSidebar);
    els.overlay.addEventListener("click", closeSidebar);
    $("#newChatButton").addEventListener("click", newChat);
    els.historySearch.addEventListener("input", renderHistory);

    $$("[data-view]").forEach(button => {
      button.addEventListener("click", () => showView(button.dataset.view));
    });

    els.chatForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!busy) sendMessage(els.input.value);
    });

    els.input.addEventListener("input", resizeInput);
    els.input.addEventListener("keydown", event => {
      const enterToSend = loadSettings().enterToSend !== false;
      if (enterToSend && event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!busy) els.chatForm.requestSubmit();
      }
    });

    $$(".prompt-card[data-prompt]").forEach(button => {
      button.addEventListener("click", () => {
        showView("chat");
        els.input.value = button.dataset.prompt || "";
        resizeInput();
        // Tidak auto-focus supaya keyboard tidak terbuka tanpa tindakan pengguna.
      });
    });

    $("#composerToolsButton").addEventListener("click", openSidebar);

    els.modelTrigger.addEventListener("click", openModelDialog);
    els.closeModel.addEventListener("click", closeModelDialog);
    els.modelSearch.addEventListener("input", updateModelOptions);

    els.modelDialog.addEventListener("click", event => {
      if (event.target === els.modelDialog) closeModelDialog();
    });

    $$(".model-option").forEach(button => {
      button.addEventListener("click", () => selectModel(button.dataset.model));
    });

    $("#openSettings").addEventListener("click", openSettings);
    $("#openSettingsTop").addEventListener("click", openSettings);
    $("#closeSettings").addEventListener("click", closeSettings);

    els.settings.addEventListener("click", event => {
      if (event.target === els.settings) closeSettings();
    });

    els.defaultModel.addEventListener("change", () => {
      saveSettings({ ...loadSettings(), defaultModel: els.defaultModel.value });
      toast("Model default diperbarui.");
    });

    $("#themeSelect").addEventListener("change", () => {
      saveSettings({ ...loadSettings(), theme: $("#themeSelect").value });
      applySettings();
      toast("Tema tampilan diperbarui.");
    });

    $("#densitySelect").addEventListener("change", () => {
      saveSettings({ ...loadSettings(), density: $("#densitySelect").value });
      applySettings();
      toast("Kepadatan tampilan diperbarui.");
    });

    $("#enterToSendToggle").addEventListener("change", event => {
      saveSettings({ ...loadSettings(), enterToSend: event.target.checked });
      toast(event.target.checked ? "Enter akan mengirim pesan." : "Enter akan membuat baris baru.");
    });

    $("#reduceMotionToggle").addEventListener("change", event => {
      saveSettings({ ...loadSettings(), reduceMotion: event.target.checked });
      applySettings();
      toast(event.target.checked ? "Animasi dikurangi." : "Animasi normal diaktifkan.");
    });

    $("#clearAllHistory").addEventListener("click", () => {
      if (busy) {
        toast("Tunggu jawaban selesai sebelum menghapus riwayat.");
        return;
      }

      if (!confirm("Hapus semua riwayat yang tersimpan di browser ini?")) return;

      const conversation = newConversation();
      state = {
        conversations: [conversation],
        activeId: conversation.id
      };

      saveState();
      renderHistory();
      renderMessages();
      closeSettings();
      toast("Riwayat lokal berhasil dibersihkan.");
    });

    $("#alightAction").addEventListener("change", updateAlightFields);

    $("#alightForm").addEventListener("submit", event => {
      event.preventDefault();

      const action = $("#alightAction").value;
      const payload = { email: $("#alightEmail").value.trim() };

      if (action === "am-verify") payload.link = $("#alightLink").value.trim();

      runTool(
        $("#alightForm"), $("#alightSubmit"), $("#alightResult"),
        action, payload, "Memproses…"
      );
    });

    $("#urlscanForm").addEventListener("submit", event => {
      event.preventDefault();

      runTool(
        $("#urlscanForm"), $("#urlscanSubmit"), $("#urlscanResult"),
        "urlscan", { url: $("#scanUrl").value.trim() }, "Memindai…"
      );
    });

    $("#whatsappForm").addEventListener("submit", event => {
      event.preventDefault();

      runTool(
        $("#whatsappForm"), $("#whatsappSubmit"), $("#whatsappResult"),
        "whatsapp-react",
        {
          url: $("#whatsappUrl").value.trim(),
          reaction: $("#whatsappReaction").value.trim()
        },
        "Mengirim…"
      );
    });

    $$("[data-copy-result]").forEach(button => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.copyResult);
        if (target) copyText(target.textContent);
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSidebar();
        if (!els.modelDialog.hidden) closeModelDialog();
        if (!els.settings.hidden) closeSettings();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }

      if (event.key === "/" && !els.modelDialog.hidden &&
          document.activeElement !== els.modelSearch) {
        event.preventDefault();
        els.modelSearch.focus();
      }
    });
  }

  function initialize() {
    if (!state.conversations.length) {
      const conversation = newConversation();
      state.conversations.push(conversation);
      state.activeId = conversation.id;
    }

    if (!state.conversations.some(item => item.id === state.activeId)) {
      state.activeId = state.conversations[0].id;
    }

    const conversation = activeConversation();
    els.modelLabel.textContent = modelName(conversation?.model || getDefaultModel());
    els.defaultModel.value = getDefaultModel();

    applySettings();
    bindEvents();
    updateAlightFields();
    renderHistory();
    renderMessages();
    updateModelOptions();
    saveState();
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
        if (loadSettings().theme === "system") applySettings();
      });
    }
  }

  initialize();
})();
