
(() => {
  "use strict";

  const API_URL = "/api";
  const STORAGE_KEY = "haomi_workspace_v1";
  const SETTINGS_KEY = "haomi_settings_v1";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const elements = {
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebarOverlay"),
    openSidebar: $("#openSidebar"),
    closeSidebar: $("#closeSidebar"),
    newChatButton: $("#newChatButton"),
    conversationList: $("#conversationList"),
    historyCount: $("#historyCount"),
    historySearch: $("#historySearch"),
    chatView: $("#chatView"),
    messages: $("#messages"),
    welcomeScreen: $("#welcomeScreen"),
    chatScroll: $("#chatScroll"),
    chatForm: $("#chatForm"),
    chatInput: $("#chatInput"),
    sendButton: $("#sendButton"),
    modelSelect: $("#modelSelect"),
    composerToolsButton: $("#composerToolsButton"),
    breadcrumbTitle: $("#breadcrumbTitle"),
    settingsModal: $("#settingsModal"),
    openSettings: $("#openSettings"),
    openSettingsTop: $("#openSettingsTop"),
    closeSettings: $("#closeSettings"),
    defaultModelSelect: $("#defaultModelSelect"),
    clearAllHistory: $("#clearAllHistory"),
    alightForm: $("#alightForm"),
    alightAction: $("#alightAction"),
    alightEmail: $("#alightEmail"),
    alightLink: $("#alightLink"),
    verificationLinkGroup: $("#verificationLinkGroup"),
    alightResult: $("#alightResult"),
    alightSubmit: $("#alightSubmit"),
    urlscanForm: $("#urlscanForm"),
    scanUrl: $("#scanUrl"),
    urlscanResult: $("#urlscanResult"),
    urlscanSubmit: $("#urlscanSubmit"),
    whatsappForm: $("#whatsappForm"),
    whatsappUrl: $("#whatsappUrl"),
    whatsappReaction: $("#whatsappReaction"),
    whatsappResult: $("#whatsappResult"),
    whatsappSubmit: $("#whatsappSubmit"),
    toastContainer: $("#toastContainer")
  };

  const pageMap = {
    chat: {
      element: elements.chatView,
      title: "Chat AI"
    },
    alight: {
      element: $("#alightView"),
      title: "Alight Motion"
    },
    urlscan: {
      element: $("#urlscanView"),
      title: "Scan URL"
    },
    whatsapp: {
      element: $("#whatsappView"),
      title: "Reaksi WhatsApp"
    }
  };

  const validModels = new Set(
    elements.modelSelect
      ? Array.from(elements.modelSelect.options).map(option => option.value)
      : []
  );

  let activeView = "chat";
  let isSending = false;
  let requestSequence = 0;
  let toastSequence = 0;

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function createConversation() {
    return {
      id: makeId(),
      title: "Obrolan baru",
      model: getDefaultModel(),
      sessionId: `haomi-${makeId()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function readStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

      if (
        stored &&
        Array.isArray(stored.conversations) &&
        typeof stored.activeId === "string"
      ) {
        return stored;
      }
    } catch (error) {
      console.warn("Riwayat HAOMI tidak dapat dibaca:", error);
    }

    return null;
  }

  function getDefaultModel() {
    try {
      const settings = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}"
      );

      if (settings.defaultModel && validModels.has(settings.defaultModel)) {
        return settings.defaultModel;
      }
    } catch (_) {
      // Gunakan model bawaan.
    }

    return "openai/gpt-4o";
  }

  const storedState = readStorage();

  let state = storedState || {
    conversations: [],
    activeId: ""
  };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      showToast(
        "Riwayat tidak dapat disimpan. Penyimpanan browser mungkin penuh.",
        true
      );
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (_) {
      showToast("Pengaturan tidak dapat disimpan.", true);
    }
  }

  function getActiveConversation() {
    return state.conversations.find(
      conversation => conversation.id === state.activeId
    ) || null;
  }

  function ensureConversation() {
    let conversation = getActiveConversation();

    if (!conversation) {
      conversation = createConversation();
      state.conversations.unshift(conversation);
      state.activeId = conversation.id;
      saveState();
    }

    return conversation;
  }

  function formatModel(model) {
    const names = {
      "openai/gpt-4o": "GPT-4o",
      "openai/gpt-4o-mini": "GPT-4o mini",
      "openai/gpt-5.6-terra": "GPT-5.6 Terra",
      "openai/gpt-5.5": "GPT-5.5",
      "openai/gpt-5.4": "GPT-5.4",
      "openai/gpt-5.3-chat": "GPT-5.3 Chat",
      "openai/gpt-5.1-instant": "GPT-5.1 Instant",
      "openai/gpt-5": "GPT-5",
      "chatday/ai-chat": "Chatday AI",
      "xai/grok-4.1-fast-non-reasoning": "Grok 4.1 Fast",
      "anthropic/claude-haiku-4.5": "Claude Haiku 4.5",
      "anthropic/claude-sonnet-5": "Claude Sonnet 5",
      "anthropic/claude-sonnet-4.6": "Claude Sonnet 4.6",
      "anthropic/claude-opus-4.5": "Claude Opus 4.5",
      "anthropic/claude-opus-4.6": "Claude Opus 4.6",
      "anthropic/claude-opus-4.7": "Claude Opus 4.7",
      "anthropic/claude-opus-4.8": "Claude Opus 4.8",
      "deepseek/deepseek-v4-pro": "DeepSeek V4 Pro",
      "deepseek/deepseek-v4-flash": "DeepSeek V4 Flash",
      "deepseek/deepseek-v3.2-thinking": "DeepSeek V3.2 Thinking",
      "google/gemini-3.1-pro-preview": "Gemini 3.1 Pro",
      "google/gemini-3-pro-preview": "Gemini 3 Pro",
      "google/gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
      "alibaba/qwen3-max": "Qwen3 Max",
      "meta/llama-4-maverick": "Llama 4 Maverick",
      "moonshotai/kimi-k2.6": "Kimi K2.6"
    };

    return names[model] || model || "AI";
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function renderInlineMarkdown(text) {
    let result = escapeHtml(text);

    result = result.replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    );

    result = result.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );

    result = result.replace(
      /(^|[^*])\*([^*\n]+)\*/g,
      "$1<em>$2</em>"
    );

    result = result.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_, label, url) => {
        try {
          const parsed = new URL(url);

          if (!["https:", "http:"].includes(parsed.protocol)) {
            return label;
          }

          return `<a href="${escapeHtml(parsed.href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        } catch (_) {
          return label;
        }
      }
    );

    return result;
  }

  function renderMarkdown(content) {
    const source = String(content ?? "").replace(/\r\n/g, "\n");
    const blocks = source.split(/```/);
    const output = [];

    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];

      if (index % 2 === 1) {
        const newline = block.indexOf("\n");
        const code = newline >= 0
          ? block.slice(newline + 1)
          : block;

        output.push(
          `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`
        );
        continue;
      }

      const lines = block.split("\n");
      let paragraph = [];
      let listType = "";
      let listItems = [];

      function flushParagraph() {
        if (!paragraph.length) return;

        output.push(
          `<p>${paragraph.map(renderInlineMarkdown).join("<br>")}</p>`
        );

        paragraph = [];
      }

      function flushList() {
        if (!listItems.length) return;

        const tag = listType === "ol" ? "ol" : "ul";

        output.push(
          `<${tag}>${listItems.map(item =>
            `<li>${renderInlineMarkdown(item)}</li>`
          ).join("")}</${tag}>`
        );

        listItems = [];
        listType = "";
      }

      for (const line of lines) {
        const trimmed = line.trim();
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        const unordered = trimmed.match(/^[-*]\s+(.+)$/);
        const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

        if (!trimmed) {
          flushParagraph();
          flushList();
          continue;
        }

        if (heading) {
          flushParagraph();
          flushList();

          const level = Math.min(heading[1].length + 1, 4);

          output.push(
            `<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`
          );
          continue;
        }

        if (unordered || ordered) {
          flushParagraph();

          const nextType = unordered ? "ul" : "ol";

          if (listType && listType !== nextType) {
            flushList();
          }

          listType = nextType;
          listItems.push((unordered || ordered)[1]);
          continue;
        }

        if (trimmed.startsWith(">")) {
          flushParagraph();
          flushList();

          output.push(
            `<blockquote>${renderInlineMarkdown(trimmed.slice(1).trim())}</blockquote>`
          );
          continue;
        }

        flushList();
        paragraph.push(trimmed);
      }

      flushParagraph();
      flushList();
    }

    return output.join("");
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (elements.chatScroll) {
        elements.chatScroll.scrollTop =
          elements.chatScroll.scrollHeight;
      }
    });
  }

  function updateWelcome() {
    const conversation = getActiveConversation();
    const hasMessages = Boolean(
      conversation && conversation.messages.length
    );

    elements.welcomeScreen.hidden = hasMessages;
  }

  function addMessageElement(message, index) {
    const wrapper = document.createElement("article");
    wrapper.className = `message ${message.role}`;

    if (message.error) {
      wrapper.classList.add("message-error");
    }

    if (message.role === "user") {
      const bubble = document.createElement("div");
      bubble.className = "message-bubble";
      bubble.textContent = message.content;
      wrapper.appendChild(bubble);
      elements.messages.appendChild(wrapper);
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
    badge.textContent = formatModel(message.model);

    heading.append(avatar, name, badge);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.innerHTML = renderMarkdown(message.content);

    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copyButton = document.createElement("button");
    copyButton.className = "message-action";
    copyButton.type = "button";
    copyButton.textContent = "Salin";
    copyButton.addEventListener("click", () => {
      copyText(message.content);
    });

    actions.appendChild(copyButton);

    if (!message.error) {
      const retryButton = document.createElement("button");
      retryButton.className = "message-action";
      retryButton.type = "button";
      retryButton.textContent = "Coba lagi";
      retryButton.addEventListener("click", () => retryMessage(index));
      actions.appendChild(retryButton);
    }

    wrapper.append(heading, bubble, actions);
    elements.messages.appendChild(wrapper);
  }

  function renderMessages() {
    const conversation = getActiveConversation();

    elements.messages.replaceChildren();

    if (!conversation) {
      updateWelcome();
      return;
    }

    conversation.messages.forEach((message, index) => {
      addMessageElement(message, index);
    });

    updateWelcome();
    scrollToBottom();
  }

  function renderHistory() {
    const query = (elements.historySearch?.value || "")
      .trim()
      .toLowerCase();

    const conversations = [...state.conversations]
      .sort((a, b) => b.updatedAt - a.updatedAt);

    elements.conversationList.replaceChildren();
    elements.historyCount.textContent = String(conversations.length);

    const filtered = conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(query)
    );

    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "empty-history";
      empty.textContent = query
        ? "Tidak ada percakapan yang cocok."
        : "Percakapanmu akan muncul di sini.";

      elements.conversationList.appendChild(empty);
      return;
    }

    for (const conversation of filtered) {
      const row = document.createElement("div");
      row.className = "history-item";

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "history-open";

      if (conversation.id === state.activeId) {
        openButton.classList.add("selected");
      }

      openButton.textContent = conversation.title;
      openButton.title = conversation.title;
      openButton.addEventListener("click", () => {
        if (isSending) {
          showToast("Tunggu jawaban selesai sebelum berpindah obrolan.");
          return;
        }

        state.activeId = conversation.id;
        saveState();
        renderHistory();
        renderMessages();
        showView("chat");
        closeSidebar();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "history-delete";
      deleteButton.textContent = "×";
      deleteButton.title = "Hapus percakapan";
      deleteButton.setAttribute("aria-label", "Hapus percakapan");

      deleteButton.addEventListener("click", () => {
        if (isSending && conversation.id === state.activeId) {
          showToast("Tunggu jawaban selesai sebelum menghapus obrolan.");
          return;
        }

        const confirmed = window.confirm(
          `Hapus percakapan "${conversation.title}" dari riwayat lokal?`
        );

        if (!confirmed) return;

        state.conversations = state.conversations.filter(
          item => item.id !== conversation.id
        );

        if (state.activeId === conversation.id) {
          const replacement = createConversation();
          state.conversations.unshift(replacement);
          state.activeId = replacement.id;
        }

        saveState();
        renderHistory();
        renderMessages();
      });

      row.append(openButton, deleteButton);
      elements.conversationList.appendChild(row);
    }
  }

  function setBusy(busy) {
    isSending = busy;
    elements.sendButton.disabled = busy;
    elements.sendButton.classList.toggle("is-loading", busy);
    elements.chatInput.disabled = busy;
    elements.modelSelect.disabled = busy;

    if (busy) {
      elements.sendButton.setAttribute("aria-label", "Sedang memproses");
    } else {
      elements.sendButton.setAttribute("aria-label", "Kirim pesan");
    }
  }

  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " error" : ""}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    const id = ++toastSequence;

    window.setTimeout(() => {
      if (id <= toastSequence) {
        toast.remove();
      }
    }, 3500);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(String(text));
      } else {
        const temporary = document.createElement("textarea");
        temporary.value = String(text);
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const success = document.execCommand("copy");
        temporary.remove();

        if (!success) throw new Error("Salin gagal");
      }

      showToast("Berhasil disalin.");
    } catch (_) {
      showToast("Tidak dapat menyalin otomatis.", true);
    }
  }

  async function requestApi(action, data = {}) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        action,
        ...data
      })
    });

    let result;

    try {
      result = await response.json();
    } catch (_) {
      throw new Error(
        `Server mengembalikan respons yang tidak valid (HTTP ${response.status}).`
      );
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message ||
        `Permintaan gagal (HTTP ${response.status}).`
      );
    }

    return result;
  }

  function updateConversationTitle(conversation) {
    const firstUserMessage = conversation.messages.find(
      message => message.role === "user"
    );

    if (!firstUserMessage) return;

    const title = firstUserMessage.content
      .replace(/\s+/g, " ")
      .trim();

    conversation.title = title.length > 42
      ? `${title.slice(0, 39)}…`
      : title || "Obrolan baru";
  }

  async function sendMessage(text) {
    const prompt = String(text || "").trim();

    if (!prompt || isSending) return;

    const conversation = ensureConversation();
    const sequence = ++requestSequence;

    conversation.model = elements.modelSelect.value;
    conversation.messages.push({
      role: "user",
      content: prompt,
      createdAt: Date.now()
    });

    updateConversationTitle(conversation);
    conversation.updatedAt = Date.now();

    // Kosongkan input langsung agar pesan tidak terlihat terkirim dua kali.
    elements.chatInput.value = "";
    autoResizeInput();
    setBusy(true);

    saveState();
    renderHistory();
    renderMessages();

    const loading = document.createElement("article");
    loading.className = "message assistant";
    loading.id = `loading-${sequence}`;

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
    badge.textContent = formatModel(conversation.model);

    heading.append(avatar, name, badge);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const typing = document.createElement("div");
    typing.className = "typing-row";
    typing.setAttribute("aria-label", "HAOMI sedang berpikir");

    for (let index = 0; index < 3; index++) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      typing.appendChild(dot);
    }

    bubble.appendChild(typing);
    loading.append(heading, bubble);
    elements.messages.appendChild(loading);

    updateWelcome();
    scrollToBottom();

    try {
      const result = await requestApi("chat", {
        prompt,
        model: conversation.model,
        session_id: conversation.sessionId
      });

      const answer = result.answer;

      const answerText =
        typeof answer === "string"
          ? answer
          : answer == null
            ? ""
            : JSON.stringify(answer, null, 2);

      if (!answerText.trim()) {
        throw new Error("API tidak mengembalikan teks jawaban.");
      }

      conversation.sessionId =
        result.session_id || conversation.sessionId;

      conversation.messages.push({
        role: "assistant",
        content: answerText,
        model: result.model || conversation.model,
        createdAt: Date.now()
      });

      conversation.updatedAt = Date.now();
    } catch (error) {
      conversation.messages.push({
        role: "assistant",
        content: `Maaf, HAOMI belum berhasil mendapatkan jawaban.\n\n${error.message || "Terjadi kesalahan jaringan."}`,
        model: conversation.model,
        error: true,
        createdAt: Date.now()
      });

      conversation.updatedAt = Date.now();
    } finally {
      // Hapus indikator loading sebelum merender ulang pesan.
      loading.remove();

      saveState();
      renderHistory();
      renderMessages();

      if (sequence === requestSequence) {
        setBusy(false);
        elements.chatInput.focus();
      }
    }
  }

  async function retryMessage(index) {
    if (isSending) return;

    const conversation = getActiveConversation();
    if (!conversation) return;

    const message = conversation.messages[index];

    if (!message || message.role !== "assistant" || !message.error) {
      return;
    }

    const userMessage = conversation.messages
      .slice(0, index)
      .reverse()
      .find(item => item.role === "user");

    if (!userMessage) {
      showToast("Pesan sebelumnya tidak ditemukan.", true);
      return;
    }

    // Hapus jawaban error dan ulangi prompt terakhir.
    conversation.messages.splice(index, 1);
    saveState();
    renderMessages();

    await sendMessage(userMessage.content);
  }

  function autoResizeInput() {
    elements.chatInput.style.height = "auto";
    elements.chatInput.style.height =
      `${Math.min(elements.chatInput.scrollHeight, 180)}px`;
  }

  function closeSidebar() {
    document.body.classList.remove("sidebar-open");
  }

  function openSidebar() {
    document.body.classList.add("sidebar-open");
  }

  function showView(viewName) {
    if (!pageMap[viewName]) return;

    activeView = viewName;

    Object.entries(pageMap).forEach(([name, page]) => {
      const isActive = name === viewName;

      page.element.hidden = !isActive;
      page.element.classList.toggle("active", isActive);
    });

    $$(".nav-item[data-view]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === viewName
      );
    });

    elements.breadcrumbTitle.textContent = pageMap[viewName].title;
    closeSidebar();

    if (viewName === "chat") {
      renderMessages();
      elements.chatInput.focus({ preventScroll: true });
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newChat() {
    if (isSending) {
      showToast("Tunggu jawaban selesai sebelum membuat obrolan baru.");
      return;
    }

    const conversation = createConversation();

    state.conversations.unshift(conversation);
    state.activeId = conversation.id;

    saveState();
    renderHistory();
    renderMessages();
    showView("chat");
    closeSidebar();
  }

  function openSettings() {
    const model = getDefaultModel();

    elements.defaultModelSelect.value = model;
    elements.settingsModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    elements.settingsModal.hidden = true;
    document.body.style.overflow = "";
  }

  function updateAlightFields() {
    const needsLink = elements.alightAction.value === "am-verify";

    elements.verificationLinkGroup.hidden = !needsLink;
    elements.alightLink.required = needsLink;

    elements.alightSubmit.firstChild.textContent = needsLink
      ? "Verifikasi tautan "
      : "Kirim permintaan ";
  }

  function showToolResult(element, content, status = "normal") {
    element.classList.remove("is-error", "is-success");

    if (status === "error") {
      element.classList.add("is-error");
    } else if (status === "success") {
      element.classList.add("is-success");
    }

    element.textContent = content;
  }

  function stringifyResult(result) {
    if (result == null) return "Tidak ada hasil dari server.";

    if (typeof result === "string") return result;

    return JSON.stringify(result, null, 2);
  }

  async function runTool({
    form,
    button,
    resultElement,
    action,
    payload,
    loadingText
  }) {
    if (form.dataset.busy === "true") return;

    form.dataset.busy = "true";
    button.disabled = true;

    const originalText = button.textContent;
    button.textContent = loadingText;

    showToolResult(resultElement, "Sedang menghubungi layanan API…");

    try {
      const result = await requestApi(action, payload);

      showToolResult(
        resultElement,
        stringifyResult(result.result ?? result),
        "success"
      );

      showToast("Permintaan selesai.");
    } catch (error) {
      showToolResult(
        resultElement,
        `Permintaan gagal: ${error.message || "Terjadi kesalahan."}`,
        "error"
      );

      showToast("Permintaan gagal. Periksa hasil untuk detail.", true);
    } finally {
      form.dataset.busy = "false";
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function bindEvents() {
    elements.openSidebar.addEventListener("click", openSidebar);
    elements.closeSidebar.addEventListener("click", closeSidebar);
    elements.sidebarOverlay.addEventListener("click", closeSidebar);

    elements.newChatButton.addEventListener("click", newChat);

    $$("[data-view]").forEach(button => {
      button.addEventListener("click", () => {
        showView(button.dataset.view);
      });
    });

    elements.historySearch.addEventListener("input", renderHistory);

    elements.chatForm.addEventListener("submit", event => {
      event.preventDefault();

      if (isSending) return;

      const prompt = elements.chatInput.value.trim();
      if (!prompt) return;

      sendMessage(prompt);
    });

    elements.chatInput.addEventListener("input", autoResizeInput);

    elements.chatInput.addEventListener("keydown", event => {
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();

        if (!isSending) {
          elements.chatForm.requestSubmit();
        }
      }
    });

    $$(".prompt-card[data-prompt]").forEach(button => {
      button.addEventListener("click", () => {
        showView("chat");
        elements.chatInput.value = button.dataset.prompt || "";
        autoResizeInput();
        elements.chatInput.focus();
      });
    });

    elements.composerToolsButton.addEventListener("click", () => {
      showToast("Pilih alat dari menu di kiri atas.");
      openSidebar();
    });

    elements.openSettings.addEventListener("click", openSettings);
    elements.openSettingsTop.addEventListener("click", openSettings);
    elements.closeSettings.addEventListener("click", closeSettings);

    elements.settingsModal.addEventListener("click", event => {
      if (event.target === elements.settingsModal) {
        closeSettings();
      }
    });

    elements.defaultModelSelect.addEventListener("change", () => {
      const model = elements.defaultModelSelect.value;

      saveSettings({ defaultModel: model });

      const conversation = getActiveConversation();

      if (conversation && conversation.messages.length === 0) {
        conversation.model = model;
        elements.modelSelect.value = model;
        saveState();
      }

      showToast("Model default diperbarui.");
    });

    elements.modelSelect.addEventListener("change", () => {
      const conversation = getActiveConversation();

      if (conversation && conversation.messages.length === 0) {
        conversation.model = elements.modelSelect.value;
        saveState();
      }
    });

    elements.clearAllHistory.addEventListener("click", () => {
      if (isSending) {
        showToast("Tunggu jawaban selesai sebelum menghapus riwayat.");
        return;
      }

      const confirmed = window.confirm(
        "Hapus semua percakapan yang tersimpan di browser ini?"
      );

      if (!confirmed) return;

      state = {
        conversations: [],
        activeId: ""
      };

      const conversation = createConversation();
      state.conversations.push(conversation);
      state.activeId = conversation.id;

      saveState();
      renderHistory();
      renderMessages();
      closeSettings();
      showToast("Riwayat lokal sudah dibersihkan.");
    });

    elements.alightAction.addEventListener("change", updateAlightFields);

    elements.alightForm.addEventListener("submit", event => {
      event.preventDefault();

      const action = elements.alightAction.value;
      const payload = {
        email: elements.alightEmail.value.trim()
      };

      if (action === "am-verify") {
        payload.link = elements.alightLink.value.trim();
      }

      runTool({
        form: elements.alightForm,
        button: elements.alightSubmit,
        resultElement: elements.alightResult,
        action,
        payload,
        loadingText: "Memproses…"
      });
    });

    elements.urlscanForm.addEventListener("submit", event => {
      event.preventDefault();

      runTool({
        form: elements.urlscanForm,
        button: elements.urlscanSubmit,
        resultElement: elements.urlscanResult,
        action: "urlscan",
        payload: {
          url: elements.scanUrl.value.trim()
        },
        loadingText: "Memindai…"
      });
    });

    elements.whatsappForm.addEventListener("submit", event => {
      event.preventDefault();

      runTool({
        form: elements.whatsappForm,
        button: elements.whatsappSubmit,
        resultElement: elements.whatsappResult,
        action: "whatsapp-react",
        payload: {
          url: elements.whatsappUrl.value.trim(),
          reaction: elements.whatsappReaction.value.trim()
        },
        loadingText: "Mengirim…"
      });
    });

    $$("[data-copy-result]").forEach(button => {
      button.addEventListener("click", () => {
        const element = document.getElementById(
          button.dataset.copyResult
        );

        if (element) copyText(element.textContent);
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeSidebar();

        if (!elements.settingsModal.hidden) {
          closeSettings();
        }
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        if (isSending) return;

        newChat();
      }
    });
  }

  function initialize() {
    if (!state.conversations.length) {
      const conversation = createConversation();
      state.conversations.push(conversation);
      state.activeId = conversation.id;
    }

    if (
      !state.conversations.some(
        conversation => conversation.id === state.activeId
      )
    ) {
      state.activeId = state.conversations[0].id;
    }

    const conversation = getActiveConversation();

    if (conversation) {
      const model = validModels.has(conversation.model)
        ? conversation.model
        : getDefaultModel();

      conversation.model = model;
      elements.modelSelect.value = model;
    }

    elements.defaultModelSelect.value = getDefaultModel();

    bindEvents();
    updateAlightFields();
    renderHistory();
    renderMessages();
    saveState();
  }

  initialize();
})();
