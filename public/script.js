(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Endpoint utama tetap /api sesuai arsitektur backend
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

  const responseStyleLabels = {
    standard: "Standar",
    concise: "Ringkas",
    technical: "Teknis",
    casual: "Santai"
  };

  const responseStylePrompts = {
    standard: "",
    concise: "[Instruksi Gaya: Jawab secara singkat, padat, dan langsung ke inti permasalahan tanpa basa-basi.]\n\n",
    technical: "[Instruksi Gaya: Jawab secara teknis, sistematis, terstruktur dengan poin atau kode yang presisi.]\n\n",
    casual: "[Instruksi Gaya: Jawab dengan bahasa yang santai, natural, dan mudah dicerna.]\n\n"
  };

  const defaultSettings = {
    theme: "dark",
    density: "standard",
    defaultModel: "openai/gpt-4o",
    responseStyle: "standard",
    enterToSend: true,
    saveHistory: true,
    defaultWaEmoji: "🙄,💦,🥰,😋"
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
    modelProvider: $("#selectedModelProvider"),
    modelLabel: $("#selectedModelLabel"),
    navModelIndicator: $("#navModelIndicator"),
    modelDialog: $("#modelDialog"),
    modelList: $("#modelList"),
    modelSearch: $("#modelSearch"),
    closeModel: $("#closeModelDialog"),
    breadcrumb: $("#breadcrumbTitle"),
    activeChatTitle: $("#activeChatTitle"),
    chatTitleDivider: $("#chatTitleDivider"),
    settings: $("#settingsModal"),
    defaultModel: $("#defaultModelSelect"),
    responseStyle: $("#responseStyleSelect"),
    enterToSend: $("#enterToSendToggle"),
    saveHistory: $("#saveHistoryToggle"),
    defaultWaEmoji: $("#defaultWaEmojiInput"),
    enterHintBadge: $("#enterHintBadge"),
    welcomeModelBadge: $("#welcomeModelBadge"),
    welcomeModelText: $("#welcomeModelText"),
    welcomeStyleBadge: $("#welcomeStyleBadge"),
    welcomeStyleText: $("#welcomeStyleText"),
    welcomeStorageBadge: $("#welcomeStorageBadge"),
    welcomeStorageText: $("#welcomeStorageText"),
    composerToolsBtn: $("#composerToolsButton"),
    composerToolsMenu: $("#composerToolsMenu"),
    toast: $("#toastContainer")
  };

  let settings = loadSettings();
  let state = loadState();
  let busy = false;
  let requestId = 0;
  let lastFocusedElement = null;
  let activeProviderFilter = "all";
  let pendingResetSession = false;
  let clearHistoryConfirmTimer = null;

  function id() {
    return window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { ...defaultSettings, ...saved };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(nextSettings) {
    settings = { ...settings, ...nextSettings };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      toast("Pengaturan tidak dapat disimpan di browser ini.", true);
    }
    applySettingsToUI();
  }

  function getResolvedTheme(themeChoice) {
    if (themeChoice === "system") {
      return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return themeChoice === "light" ? "light" : "dark";
  }

  function applySettingsToUI() {
    const resolvedTheme = getResolvedTheme(settings.theme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-density", settings.density || "standard");

    $$("[data-theme-choice]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeChoice === settings.theme);
    });

    $$("[data-density-choice]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.densityChoice === settings.density);
    });

    if (els.defaultModel) els.defaultModel.value = getDefaultModel();
    if (els.responseStyle) els.responseStyle.value = settings.responseStyle || "standard";
    if (els.enterToSend) els.enterToSend.checked = Boolean(settings.enterToSend);
    if (els.saveHistory) els.saveHistory.checked = Boolean(settings.saveHistory);
    if (els.defaultWaEmoji) els.defaultWaEmoji.value = settings.defaultWaEmoji || defaultSettings.defaultWaEmoji;

    if (els.enterHintBadge) {
      els.enterHintBadge.textContent = settings.enterToSend ? "Enter ↵" : "Ctrl+Enter ↵";
    }

    const activeModel = activeConversation()?.model || getDefaultModel();
    if (els.welcomeModelText) {
      els.welcomeModelText.textContent = `Model: ${modelName(activeModel)}`;
    }
    if (els.welcomeStyleText) {
      els.welcomeStyleText.textContent = `Gaya: ${responseStyleLabels[settings.responseStyle] || "Standar"}`;
    }
    if (els.welcomeStorageText) {
      els.welcomeStorageText.textContent = `Riwayat Lokal: ${settings.saveHistory ? "Aktif" : "Nonaktif (Sesi)"}`;
    }
  }

  function getDefaultModel() {
    return models[settings.defaultModel] ? settings.defaultModel : "openai/gpt-4o";
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
    if (!settings.saveHistory) {
      return { conversations: [], activeId: "" };
    }
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
    if (!settings.saveHistory) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast("Penyimpanan lokal penuh. Riwayat sesi ini belum tersimpan.", true);
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

  function modelProvider(model) {
    return models[model]?.[1] || "AI";
  }

  function syncModelIndicators(model) {
    const target = model || activeConversation()?.model || getDefaultModel();
    if (els.modelLabel) els.modelLabel.textContent = modelName(target);
    if (els.modelProvider) els.modelProvider.textContent = modelProvider(target);
    if (els.navModelIndicator) els.navModelIndicator.textContent = modelName(target);
    if (els.welcomeModelText) els.welcomeModelText.textContent = `Model: ${modelName(target)}`;
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
        const lang = split >= 0 ? block.slice(0, split).trim() || "kode" : "kode";
        const code = split >= 0 ? block.slice(split + 1) : block;
        const cleanCode = code.trimEnd();
        result.push(
          `<div class="code-block-wrapper">` +
            `<div class="code-block-header">` +
              `<span>${escapeHTML(lang)}</span>` +
              `<button type="button" class="code-copy-btn" data-copy-code="${escapeHTML(cleanCode)}">Salin kode</button>` +
            `</div>` +
            `<pre><code>${escapeHTML(cleanCode)}</code></pre>` +
          `</div>`
        );
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
    window.setTimeout(() => item.remove(), 3200);
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
      toast("Teks berhasil disalin.");
    } catch {
      toast("Tidak dapat menyalin teks.", true);
    }
  }

  function formatTime(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
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
    avatar.textContent = "H";

    const name = document.createElement("span");
    name.className = "assistant-name";
    name.textContent = "HAOMI";

    const badge = document.createElement("span");
    badge.className = "model-badge";
    badge.textContent = modelName(message.model);

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatTime(message.createdAt);

    heading.append(avatar, name, badge, time);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = markdown(message.content);

    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "message-action";
    copy.textContent = "Salin respons";
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

    if (els.activeChatTitle) {
      els.activeChatTitle.textContent = conversation?.title || "Obrolan baru";
    }

    syncModelIndicators(conversation?.model);

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
        : "Belum ada riwayat percakapan.";
      els.conversationList.appendChild(empty);
      return;
    }

    filtered.forEach(conversation => {
      const row = document.createElement("div");
      row.className = "history-item";
      row.setAttribute("role", "listitem");
      row.classList.toggle("selected", conversation.id === state.activeId);

      const open = document.createElement("button");
      open.type = "button";
      open.className = "history-open";
      open.textContent = conversation.title;
      open.title = `${conversation.title} (${modelName(conversation.model)})`;

      open.addEventListener("click", () => {
        if (busy) {
          toast("Tunggu respons selesai sebelum berpindah percakapan.");
          return;
        }
        state.activeId = conversation.id;
        saveState();
        renderHistory();
        renderMessages();
        showView("chat");
        closeMobileSidebar();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "history-delete";
      remove.textContent = "×";
      remove.title = "Hapus percakapan";
      remove.setAttribute("aria-label", "Hapus percakapan");

      remove.addEventListener("click", event => {
        event.stopPropagation();
        if (busy && conversation.id === state.activeId) {
          toast("Tunggu respons selesai sebelum menghapus percakapan.");
          return;
        }

        // Konfirmasi 2-klik langsung pada tombol agar bebas dari pemblokiran confirm() browser
        if (!remove.classList.contains("confirming")) {
          remove.classList.add("confirming");
          remove.textContent = "Hapus?";
          window.setTimeout(() => {
            if (remove.isConnected) {
              remove.classList.remove("confirming");
              remove.textContent = "×";
            }
          }, 2800);
          return;
        }

        state.conversations = state.conversations.filter(item => item.id !== conversation.id);

        if (state.activeId === conversation.id) {
          const replacement = state.conversations[0] || newConversation();
          if (!state.conversations.length) state.conversations.unshift(replacement);
          state.activeId = replacement.id;
        }

        saveState();
        renderHistory();
        renderMessages();
        toast("Percakapan dihapus.");
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

  async function directJerexdFallback(action, payload = {}) {
    const BASE_URL = "https://api.jerexd.my.id";
    const API_KEY = "jere_sTl9OLzPIyMn";
    let endpoint = "/api/ai/aichat";
    const params = new URLSearchParams({ apikey: API_KEY });

    if (action === "chat") {
      endpoint = "/api/ai/aichat";
      params.set("prompt", payload.prompt || "");
      params.set("model", payload.model || "openai/gpt-4o");
      params.set("session_id", payload.session_id || `haomi-${Date.now()}`);
      if (payload.reset === "true") params.set("reset", "true");
    } else if (action === "am-send") {
      endpoint = "/api/am/send";
      params.set("email", payload.email || "");
    } else if (action === "am-verify" || action === "am-verif") {
      endpoint = "/api/am/verif";
      params.set("email", payload.email || "");
      params.set("link", payload.link || "");
    } else if (action === "urlscan") {
      endpoint = "/api/tools/urlscan";
      params.set("url", payload.url || "");
    } else if (action === "whatsapp-react" || action === "reactch") {
      endpoint = "/api/whatsapp/reactch";
      params.set("url", payload.url || "");
      params.set("reaction", payload.reaction || "❤️");
    }

    const res = await fetch(`https://api.jerexd.my.id${endpoint}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    const data = await res.json();
    if (data?.status === false) {
      throw new Error(data.message || "Permintaan ke layanan API gagal.");
    }
    if (action === "chat") {
      return {
        success: true,
        session_id: data?.session_id || payload.session_id,
        model: data?.model || payload.model,
        answer: data?.result ?? data?.answer ?? data?.response ?? data?.message ?? data?.data ?? data
      };
    }
    return {
      success: data?.status !== false,
      result: data
    };
  }

  async function apiRequest(action, payload = {}) {
    let response;
    try {
      response = await fetch("https://api.jerexd.my.id" ? API_URL : "https://api.jerexd.my.id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ action, ...payload })
      });
    } catch {
      return await directJerexdFallback(action, payload);
    }

    if (response.status === 404 || response.status === 405) {
      return await directJerexdFallback(action, payload);
    }

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
    avatar.textContent = "H";

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
    dots.setAttribute("aria-label", "Sedang memproses jawaban");

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
    const stylePrefix = responseStylePrompts[settings.responseStyle] || "";
    const effectivePrompt = stylePrefix ? `${stylePrefix}${prompt}` : prompt;

    try {
      const requestPayload = {
        prompt: effectivePrompt,
        model,
        session_id: conversation.sessionId
      };

      if (pendingResetSession) {
        requestPayload.reset = "true";
        pendingResetSession = false;
      }

      const data = await apiRequest("chat", requestPayload);

      const rawAnswer = data.answer ?? data.result ?? data.response ?? data.message;
      const answer = typeof rawAnswer === "string"
        ? rawAnswer
        : rawAnswer == null ? "" : JSON.stringify(rawAnswer, null, 2);

      if (!answer.trim()) {
        throw new Error("Layanan API tidak mengembalikan teks jawaban.");
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
        content: `Permintaan belum berhasil diproses.\n\nDetail: ${error.message || "Terjadi gangguan koneksi ke layanan API."}`,
        model,
        error: true,
        createdAt: Date.now()
      });
    } finally {
      loading.remove();
      conversation.updatedAt = Date.now();
      saveState();
      renderHistory();
      renderMessages();
      setBusy(false);
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

  function toggleSidebar() {
    if (window.innerWidth <= 860) {
      document.body.classList.toggle("sidebar-open");
    } else {
      document.body.classList.toggle("sidebar-collapsed");
    }
  }

  function closeMobileSidebar() {
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
      if (!view) return;
      view.hidden = key !== name;
      view.classList.toggle("active", key === name);
    });

    $$(".nav-item[data-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.view === name);
    });

    els.breadcrumb.textContent = viewTitles[name];
    const isChat = name === "chat";
    if (els.activeChatTitle) els.activeChatTitle.hidden = !isChat;
    if (els.chatTitleDivider) els.chatTitleDivider.hidden = !isChat;
    $("#resetSessionButton").hidden = !isChat;
    $("#exportChatButton").hidden = !isChat;

    closeComposerMenu();
    closeMobileSidebar();

    if (isChat) renderMessages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newChat() {
    if (busy) {
      toast("Tunggu respons selesai sebelum membuat obrolan baru.");
      return;
    }

    const conversation = newConversation();
    state.conversations.unshift(conversation);
    state.activeId = conversation.id;

    saveState();
    renderHistory();
    renderMessages();
    showView("chat");
    closeMobileSidebar();
  }

  function resetCurrentSessionContext() {
    const conversation = ensureConversation();
    conversation.sessionId = `haomi-${id()}`;
    pendingResetSession = true;
    saveState();
    closeComposerMenu();
    toast("Sesi konteks AI telah direset untuk pesan berikutnya.");
  }

  function exportCurrentChat() {
    const conversation = activeConversation();
    if (!conversation || !conversation.messages.length) {
      toast("Belum ada isi percakapan untuk diekspor.", true);
      return;
    }

    const lines = [
      `# ${conversation.title}`,
      `Model: ${modelName(conversation.model)} (${conversation.model})`,
      `Waktu Ekspor: ${new Date().toLocaleString("id-ID")}`,
      ""
    ];

    conversation.messages.forEach(msg => {
      const sender = msg.role === "user" ? "PENGGUNA" : `HAOMI (${modelName(msg.model)})`;
      lines.push(`### ${sender}`);
      lines.push(msg.content);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "percakapan"}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Percakapan berhasil diekspor (.md).");
  }

  function exportAllBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      conversations: state.conversations
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `haomi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Cadangan data berhasil diunduh (.json).");
  }

  function toggleComposerMenu() {
    const isHidden = els.composerToolsMenu.hidden;
    els.composerToolsMenu.hidden = !isHidden;
    els.composerToolsBtn.setAttribute("aria-expanded", String(isHidden));
  }

  function closeComposerMenu() {
    if (!els.composerToolsMenu) return;
    els.composerToolsMenu.hidden = true;
    els.composerToolsBtn?.setAttribute("aria-expanded", "false");
  }

  function openModelDialog() {
    lastFocusedElement = document.activeElement;
    els.modelDialog.hidden = false;
    els.modelTrigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    updateModelOptions();
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
      const provider = button.dataset.provider || "other";
      const matchesQuery = name.toLowerCase().includes(query) || button.dataset.model.toLowerCase().includes(query);
      const matchesProvider = activeProviderFilter === "all" || provider === activeProviderFilter;
      button.hidden = !(matchesQuery && matchesProvider);
      button.classList.toggle("selected", button.dataset.model === selected);
    });
  }

  function selectModel(model) {
    if (!models[model]) return;

    const conversation = ensureConversation();
    conversation.model = model;
    saveState();

    syncModelIndicators(model);
    updateModelOptions();
    closeModelDialog();
    toast(`Model aktif: ${modelName(model)}`);
  }

  function openSettings() {
    applySettingsToUI();
    els.settings.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    els.settings.hidden = true;
    document.body.style.overflow = "";
  }

  function setAlightMode(mode) {
    const select = $("#alightAction");
    select.value = mode;
    $$(".mode-tab[data-am-mode]").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.amMode === mode);
    });
    updateAlightFields();
  }

  function updateAlightFields() {
    const mode = $("#alightAction").value;
    const needsLink = mode === "am-verify";
    $("#verificationLinkGroup").hidden = !needsLink;
    $("#alightLink").required = needsLink;
    $("#alightSubmit span").textContent = needsLink ? "Verifikasi tautan akun" : "Kirim permintaan verifikasi";
    $$(".mode-tab[data-am-mode]").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.amMode === mode);
    });
  }

  function renderStructuredSummary(summaryEl, data) {
    if (!summaryEl) return;
    summaryEl.replaceChildren();

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      summaryEl.hidden = true;
      return;
    }

    const entries = Object.entries(data).filter(([, val]) =>
      val !== null && val !== undefined && typeof val !== "object"
    ).slice(0, 6);

    if (!entries.length) {
      summaryEl.hidden = true;
      return;
    }

    entries.forEach(([key, val]) => {
      const row = document.createElement("div");
      row.className = "summary-kv";
      const k = document.createElement("span");
      k.className = "summary-key";
      k.textContent = key;
      const v = document.createElement("span");
      v.className = "summary-val";
      v.textContent = String(val);
      row.append(k, v);
      summaryEl.appendChild(row);
    });

    summaryEl.hidden = false;
  }

  function showToolResult(element, statusBadge, timeBadge, summaryEl, text, status = "", elapsedMs = null, rawObj = null) {
    element.classList.remove("is-error", "is-success");
    statusBadge?.classList.remove("is-error", "is-success");

    if (status === "error") {
      element.classList.add("is-error");
      statusBadge?.classList.add("is-error");
      if (statusBadge) statusBadge.textContent = "Gagal";
    } else if (status === "success") {
      element.classList.add("is-success");
      statusBadge?.classList.add("is-success");
      if (statusBadge) statusBadge.textContent = "Berhasil";
    } else {
      if (statusBadge) statusBadge.textContent = status || "Siap";
    }

    if (timeBadge) {
      if (elapsedMs !== null) {
        timeBadge.hidden = false;
        timeBadge.textContent = `${elapsedMs} ms`;
      } else {
        timeBadge.hidden = true;
      }
    }

    renderStructuredSummary(summaryEl, rawObj);
    element.textContent = text;
  }

  function stringifyResult(value) {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  async function runTool(config) {
    const { form, button, resultElement, statusBadge, timeBadge, summaryEl, action, payload, loadingText } = config;
    if (form.dataset.busy === "true") return;

    form.dataset.busy = "true";
    const labelSpan = $("span", button) || button;
    const originalText = labelSpan.textContent;
    button.disabled = true;
    labelSpan.textContent = loadingText;

    const startTime = performance.now();
    showToolResult(resultElement, statusBadge, timeBadge, summaryEl, "Menghubungi endpoint layanan...", "Memproses");

    try {
      const data = await apiRequest(action, payload);
      const elapsed = Math.round(performance.now() - startTime);
      const result = data.result ?? data.data ?? data;
      showToolResult(
        resultElement,
        statusBadge,
        timeBadge,
        summaryEl,
        stringifyResult(result),
        "success",
        elapsed,
        typeof result === "object" ? result : data
      );
      toast("Permintaan selesai diproses.");
    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime);
      showToolResult(
        resultElement,
        statusBadge,
        timeBadge,
        summaryEl,
        `Permintaan gagal: ${error.message || "Terjadi kesalahan."}`,
        "error",
        elapsed,
        null
      );
      toast("Permintaan gagal. Periksa detail respons.", true);
    } finally {
      form.dataset.busy = "false";
      button.disabled = false;
      labelSpan.textContent = originalText;
    }
  }

  function syncWaEmojiChips() {
    const input = $("#whatsappReaction");
    if (!input) return;
    const currentList = input.value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    $$(".emoji-chip[data-emoji]").forEach(chip => {
      chip.classList.toggle("active", currentList.includes(chip.dataset.emoji));
    });
  }

  function toggleWaEmoji(emoji) {
    const input = $("#whatsappReaction");
    if (!input) return;
    const list = input.value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    const idx = list.indexOf(emoji);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(emoji);
    }

    input.value = list.join(",");
    syncWaEmojiChips();
  }

  function bindEvents() {
    $("#openSidebar").addEventListener("click", toggleSidebar);
    $("#closeSidebar").addEventListener("click", closeMobileSidebar);
    els.overlay.addEventListener("click", closeMobileSidebar);
    $("#newChatButton").addEventListener("click", newChat);
    els.historySearch.addEventListener("input", renderHistory);

    $("#quickThemeToggle").addEventListener("click", () => {
      const currentResolved = getResolvedTheme(settings.theme);
      const nextTheme = currentResolved === "dark" ? "light" : "dark";
      saveSettings({ theme: nextTheme });
      toast(`Tema diubah ke mode ${nextTheme === "dark" ? "Gelap" : "Terang"}.`);
    });

    $("#resetSessionButton").addEventListener("click", resetCurrentSessionContext);
    $("#popoverResetChat").addEventListener("click", resetCurrentSessionContext);
    $("#exportChatButton").addEventListener("click", exportCurrentChat);

    $$("[data-view]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        showView(button.dataset.view);
      });
    });

    els.chatForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!busy) sendMessage(els.input.value);
    });

    els.input.addEventListener("input", resizeInput);
    els.input.addEventListener("keydown", event => {
      if (event.isComposing) return;
      if (settings.enterToSend) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (!busy) els.chatForm.requestSubmit();
        }
      } else {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          if (!busy) els.chatForm.requestSubmit();
        }
      }
    });

    $$(".prompt-card[data-prompt]").forEach(button => {
      button.addEventListener("click", () => {
        showView("chat");
        els.input.value = button.dataset.prompt || "";
        resizeInput();
        els.input.focus();
      });
    });

    // Welcome status pills shortcuts
    els.welcomeModelBadge?.addEventListener("click", openModelDialog);
    els.welcomeStyleBadge?.addEventListener("click", openSettings);
    els.welcomeStorageBadge?.addEventListener("click", openSettings);

    // Delegated copy for code blocks inside assistant messages
    els.messages.addEventListener("click", event => {
      const codeBtn = event.target.closest("[data-copy-code]");
      if (codeBtn) {
        copyText(codeBtn.dataset.copyCode);
      }
    });

    // Composer tools popover
    els.composerToolsBtn.addEventListener("click", event => {
      event.stopPropagation();
      toggleComposerMenu();
    });

    document.addEventListener("click", event => {
      if (!els.composerToolsMenu.hidden &&
          !els.composerToolsMenu.contains(event.target) &&
          !els.composerToolsBtn.contains(event.target)) {
        closeComposerMenu();
      }
    });

    // Model dialog events
    els.modelTrigger.addEventListener("click", openModelDialog);
    els.closeModel.addEventListener("click", closeModelDialog);
    els.modelSearch.addEventListener("input", updateModelOptions);

    $$(".provider-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        activeProviderFilter = btn.dataset.provider || "all";
        $$(".provider-filter").forEach(b => b.classList.toggle("active", b === btn));
        updateModelOptions();
      });
    });

    els.modelDialog.addEventListener("click", event => {
      if (event.target === els.modelDialog) closeModelDialog();
    });

    $$(".model-option").forEach(button => {
      button.addEventListener("click", () => selectModel(button.dataset.model));
    });

    // Settings modal events
    $("#openSettings").addEventListener("click", openSettings);
    $("#openSettingsTop").addEventListener("click", openSettings);
    $("#closeSettings").addEventListener("click", closeSettings);

    els.settings.addEventListener("click", event => {
      if (event.target === els.settings) closeSettings();
    });

    $$("[data-theme-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSettings({ theme: btn.dataset.themeChoice });
        toast("Tema tampilan diperbarui.");
      });
    });

    $$("[data-density-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSettings({ density: btn.dataset.densityChoice });
        toast("Kerapatan teks diperbarui.");
      });
    });

    els.defaultModel.addEventListener("change", () => {
      const nextModel = els.defaultModel.value;
      saveSettings({ defaultModel: nextModel });
      const active = activeConversation();
      if (active && !active.messages.length) {
        active.model = nextModel;
        saveState();
        syncModelIndicators(nextModel);
      }
      toast(`Model default diatur ke ${modelName(nextModel)}.`);
    });

    els.responseStyle.addEventListener("change", () => {
      saveSettings({ responseStyle: els.responseStyle.value });
      toast(`Gaya respons diatur ke ${responseStyleLabels[els.responseStyle.value]}.`);
    });

    els.enterToSend.addEventListener("change", () => {
      saveSettings({ enterToSend: els.enterToSend.checked });
      toast(els.enterToSend.checked
        ? "Tombol Enter diaktifkan untuk mengirim pesan."
        : "Gunakan Ctrl+Enter untuk mengirim pesan.");
    });

    els.saveHistory.addEventListener("change", () => {
      const enabled = els.saveHistory.checked;
      saveSettings({ saveHistory: enabled });
      if (enabled) {
        saveState();
        toast("Penyimpanan riwayat lokal diaktifkan.");
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        toast("Penyimpanan lokal dinonaktifkan. Percakapan hanya disimpan selama sesi tab ini.");
      }
    });

    els.defaultWaEmoji.addEventListener("change", () => {
      const val = els.defaultWaEmoji.value.trim() || defaultSettings.defaultWaEmoji;
      saveSettings({ defaultWaEmoji: val });
      const waInput = $("#whatsappReaction");
      if (waInput) {
        waInput.value = val;
        syncWaEmojiChips();
      }
      toast("Emoji default Reaksi WhatsApp disimpan.");
    });

    $("#exportAllDataBtn").addEventListener("click", exportAllBackup);

    const clearBtn = $("#clearAllHistory");
    clearBtn.addEventListener("click", () => {
      if (busy) {
        toast("Tunggu jawaban selesai sebelum menghapus riwayat.");
        return;
      }

      if (!clearBtn.classList.contains("confirming")) {
        clearBtn.classList.add("confirming");
        clearBtn.textContent = "Klik sekali lagi untuk konfirmasi hapus";
        clearTimeout(clearHistoryConfirmTimer);
        clearHistoryConfirmTimer = window.setTimeout(() => {
          clearBtn.classList.remove("confirming");
          clearBtn.textContent = "Hapus Semua Riwayat";
        }, 3500);
        return;
      }

      clearTimeout(clearHistoryConfirmTimer);
      clearBtn.classList.remove("confirming");
      clearBtn.textContent = "Hapus Semua Riwayat";

      const conversation = newConversation();
      state = {
        conversations: [conversation],
        activeId: conversation.id
      };

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      saveState();
      renderHistory();
      renderMessages();
      closeSettings();
      toast("Seluruh riwayat lokal berhasil dihapus.");
    });

    // Alight Motion tool events
    $$(".mode-tab[data-am-mode]").forEach(tab => {
      tab.addEventListener("click", () => setAlightMode(tab.dataset.amMode));
    });

    $("#alightAction").addEventListener("change", updateAlightFields);

    $("#alightForm").addEventListener("submit", event => {
      event.preventDefault();
      const action = $("#alightAction").value;
      const payload = { email: $("#alightEmail").value.trim() };
      if (action === "am-verify") payload.link = $("#alightLink").value.trim();

      runTool({
        form: $("#alightForm"),
        button: $("#alightSubmit"),
        resultElement: $("#alightResult"),
        statusBadge: $("#alightStatusBadge"),
        timeBadge: $("#alightTimeBadge"),
        summaryEl: $("#alightSummary"),
        action,
        payload,
        loadingText: "Memproses..."
      });
    });

    // URL Scan tool events
    $("#pasteUrlBtn").addEventListener("click", async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = (await navigator.clipboard.readText()).trim();
          if (text) {
            $("#scanUrl").value = text.startsWith("http") ? text : `https://${text}`;
            toast("URL ditempel dari clipboard.");
            return;
          }
        }
        $("#scanUrl").focus();
        toast("Silakan tekan Ctrl+V pada kolom URL.");
      } catch {
        $("#scanUrl").focus();
        toast("Silakan tekan Ctrl+V pada kolom URL.");
      }
    });

    $("#urlscanForm").addEventListener("submit", event => {
      event.preventDefault();
      runTool({
        form: $("#urlscanForm"),
        button: $("#urlscanSubmit"),
        resultElement: $("#urlscanResult"),
        statusBadge: $("#urlscanStatusBadge"),
        timeBadge: $("#urlscanTimeBadge"),
        summaryEl: $("#urlscanSummary"),
        action: "urlscan",
        payload: { url: $("#scanUrl").value.trim() },
        loadingText: "Memindai..."
      });
    });

    // WhatsApp Reaction tool events
    $$(".emoji-chip[data-emoji]").forEach(chip => {
      chip.addEventListener("click", () => toggleWaEmoji(chip.dataset.emoji));
    });

    $("#whatsappReaction").addEventListener("input", syncWaEmojiChips);

    $("#resetWaEmojiBtn").addEventListener("click", () => {
      $("#whatsappReaction").value = settings.defaultWaEmoji || defaultSettings.defaultWaEmoji;
      syncWaEmojiChips();
      toast("Emoji dikembalikan ke pengaturan default.");
    });

    $("#whatsappForm").addEventListener("submit", event => {
      event.preventDefault();
      runTool({
        form: $("#whatsappForm"),
        button: $("#whatsappSubmit"),
        resultElement: $("#whatsappResult"),
        statusBadge: $("#whatsappStatusBadge"),
        timeBadge: $("#whatsappTimeBadge"),
        summaryEl: $("#whatsappSummary"),
        action: "whatsapp-react",
        payload: {
          url: $("#whatsappUrl").value.trim(),
          reaction: $("#whatsappReaction").value.trim()
        },
        loadingText: "Mengirim..."
      });
    });

    // Copy & Clear result buttons across all tools
    $$("[data-copy-result]").forEach(button => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.copyResult);
        if (target) copyText(target.textContent);
      });
    });

    $$("[data-clear-result]").forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.clearResult;
        const target = document.getElementById(targetId);
        if (!target) return;
        target.classList.remove("is-error", "is-success");
        target.textContent = "Hasil telah dibersihkan. Siap untuk eksekusi baru.";

        const prefix = targetId.replace("Result", "");
        const badge = document.getElementById(`${prefix}StatusBadge`);
        const time = document.getElementById(`${prefix}TimeBadge`);
        const summary = document.getElementById(`${prefix}Summary`);
        if (badge) {
          badge.classList.remove("is-error", "is-success");
          badge.textContent = "Siap";
        }
        if (time) time.hidden = true;
        if (summary) summary.hidden = true;
      });
    });

    // Global keyboard shortcuts
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMobileSidebar();
        closeComposerMenu();
        if (!els.modelDialog.hidden) closeModelDialog();
        if (!els.settings.hidden) closeSettings();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        if (els.settings.hidden) openSettings();
        else closeSettings();
      }

      if (event.key === "/" && !els.modelDialog.hidden &&
          document.activeElement !== els.modelSearch) {
        event.preventDefault();
        els.modelSearch.focus();
      } else if (event.key === "/" && els.modelDialog.hidden && els.settings.hidden &&
                 !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        els.historySearch.focus();
      }
    });
  }

  function initialize() {
    applySettingsToUI();

    if (!state.conversations.length) {
      const conversation = newConversation();
      state.conversations.push(conversation);
      state.activeId = conversation.id;
    }

    if (!state.conversations.some(item => item.id === state.activeId)) {
      state.activeId = state.conversations[0].id;
    }

    const waInput = $("#whatsappReaction");
    if (waInput && settings.defaultWaEmoji) {
      waInput.value = settings.defaultWaEmoji;
    }

    const conversation = activeConversation();
    syncModelIndicators(conversation?.model || getDefaultModel());

    bindEvents();
    updateAlightFields();
    syncWaEmojiChips();
    renderHistory();
    renderMessages();
    updateModelOptions();
    saveState();
  }

  initialize();
})();
