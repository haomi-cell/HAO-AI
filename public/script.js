(() => {
  "use strict";

  if (window.__HAOMI_CONSOLE_BOOTED__) return;
  window.__HAOMI_CONSOLE_BOOTED__ = true;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Endpoint utama tetap /api sesuai arsitektur backend
  const API_URL = "/api";
  const STORAGE_KEY = "haomi_workspace_v2";
  const SETTINGS_KEY = "haomi_settings_v1";
  const TELEMETRY_KEY = "haomi_telemetry_v1";
  const SOUND_KEY = "haomi_sound_fx_v1";
  const ROBOT_AVATAR = "data:image/jpeg;base64,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";

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

  const responseStyleOrder = ["standard", "casual", "concise", "technical"];

  const responseStylePrompts = {
    standard: "",
    concise: "[Instruksi Gaya: Jawab secara singkat, padat, dan langsung ke inti permasalahan tanpa basa-basi.]\n\n",
    technical: "[Instruksi Gaya: Jawab secara teknis, sistematis, terstruktur dengan poin atau kode yang presisi.]\n\n",
    casual: "[Instruksi Gaya: Jawab dengan bahasa yang santai, natural, dan mudah dicerna.]\n\n"
  };

  const defaultSettings = {
    theme: "dark",
    density: "standard",
    streamSpeed: "cyber",
    defaultModel: "openai/gpt-4o",
    responseStyle: "standard",
    enterToSend: true,
    saveHistory: true,
    defaultWaEmoji: "🙄,💦,🥰,😋"
  };

  // Pastikan kapsul Dynamic Island tersedia di bagian atas layar
  function ensureDynamicIslandDOM() {
    if ($("#dynamicIsland")) return;
    const wrap = document.createElement("div");
    wrap.className = "dynamic-island-wrap";
    wrap.id = "dynamicIslandWrap";
    wrap.innerHTML =
      `<div class="dynamic-island" id="dynamicIsland" role="status" aria-live="polite" title="Ketuk untuk buka kapsul pintar">` +
        `<div class="island-compact-row" id="islandCompactRow">` +
          `<div class="island-left">` +
            `<span class="island-orb" id="islandOrb"></span>` +
            `<span class="island-text" id="islandText">HAOMI · Siap</span>` +
          `</div>` +
          `<div class="island-wave" aria-hidden="true">` +
            `<span></span><span></span><span></span><span></span>` +
          `</div>` +
        `</div>` +
        `<div class="island-pod-body" id="islandPodBody" hidden>` +
          `<div class="island-pod-metrics">` +
            `<div class="island-mini-stat"><small>WAKTU</small><strong id="islandClock">AKTIF</strong></div>` +
            `<div class="island-mini-stat"><small>PING</small><strong id="islandPing">12 ms</strong></div>` +
            `<div class="island-mini-stat"><small>GERAK</small><strong id="islandFps">60 FPS</strong></div>` +
          `</div>` +
          `<div class="island-pod-actions">` +
            `<button type="button" class="island-pod-btn" id="islandSoundBtn"><span id="islandSoundLabel">Suara: Mati</span></button>` +
            `<button type="button" class="island-pod-btn" id="islandFocusBtn"><span>Mode Fokus</span></button>` +
            `<button type="button" class="island-pod-btn" id="islandThemeBtn"><span id="islandThemeLabel">Tema</span></button>` +
          `</div>` +
        `</div>` +
      `</div>`;
    document.body.prepend(wrap);
  }

  ensureDynamicIslandDOM();

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
    composerToolsBtn: $("#composerToolsButton"),
    composerToolsMenu: $("#composerToolsMenu"),
    terminalInput: $("#terminalCommandInput"),
    statTotalReq: $("#statTotalReq"),
    statSuccessRate: $("#statSuccessRate"),
    statAvgLatency: $("#statAvgLatency"),
    dashActiveModel: $("#dashActiveModel"),
    dashActiveStyle: $("#dashActiveStyle"),
    boxActiveModel: $("#boxActiveModel"),
    boxAiStyle: $("#boxAiStyle"),
    boxPingTest: $("#boxPingTest"),
    boxSessionInfo: $("#boxSessionInfo"),
    pingStatusSub: $("#pingStatusSub"),
    slashCmdMenu: $("#slashCmdMenu"),
    metricOS: $("#metricOS"),
    metricBrowser: $("#metricBrowser"),
    metricBattery: $("#metricBattery"),
    metricResolution: $("#metricResolution"),
    liveClockText: $("#liveClockText"),
    toast: $("#toastContainer"),
    dynamicIsland: $("#dynamicIsland"),
    islandOrb: $("#islandOrb"),
    islandText: $("#islandText"),
    islandPodBody: $("#islandPodBody"),
    islandClock: $("#islandClock"),
    islandPing: $("#islandPing"),
    islandFps: $("#islandFps"),
    islandSoundBtn: $("#islandSoundBtn"),
    islandSoundLabel: $("#islandSoundLabel"),
    islandFocusBtn: $("#islandFocusBtn"),
    islandThemeBtn: $("#islandThemeBtn"),
    islandThemeLabel: $("#islandThemeLabel")
  };

  let settings = loadSettings();
  let state = loadState();
  let telemetry = loadTelemetry();
  let busy = false;
  let requestId = 0;
  let lastFocusedElement = null;
  let activeProviderFilter = "all";
  let pendingResetSession = false;
  let clearHistoryConfirmTimer = null;
  let forceShowHud = false;
  let activeStreamCancel = null;
  let islandTimer = null;
  let lastMeasuredPing = 12;
  let soundEnabled = false;
  let audioCtx = null;

  try {
    soundEnabled = localStorage.getItem(SOUND_KEY) === "1";
  } catch {}

  function id() {
    return window.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Efek suara sentuhan halus (Web Audio API)
  function playCyberTick(freq = 640, duration = 0.045) {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.024, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
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
      localStorage.setItem("haomi_theme_pref", settings.theme);
    } catch {
      toast("Pengaturan belum bisa disimpan di browser ini.", true);
    }
    applySettingsToUI();
  }

  function loadTelemetry() {
    try {
      const saved = JSON.parse(localStorage.getItem(TELEMETRY_KEY) || "null");
      if (saved && typeof saved === "object") {
        return {
          totalRequests: Number(saved.totalRequests) || 0,
          successCount: Number(saved.successCount) || 0,
          totalLatencyMs: Number(saved.totalLatencyMs) || 0
        };
      }
    } catch {}
    return { totalRequests: 0, successCount: 0, totalLatencyMs: 0 };
  }

  function recordTelemetry(success, latencyMs) {
    telemetry.totalRequests += 1;
    if (success) telemetry.successCount += 1;
    if (latencyMs > 0) {
      telemetry.totalLatencyMs += latencyMs;
      lastMeasuredPing = latencyMs;
    }
    if (settings.saveHistory) {
      try {
        localStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry));
      } catch {}
    }
    renderTelemetryStats();
  }

  function getIdleIslandLabel() {
    const activeModel = activeConversation()?.model || getDefaultModel();
    const avg = telemetry.totalRequests > 0
      ? Math.round(telemetry.totalLatencyMs / telemetry.totalRequests)
      : lastMeasuredPing;
    const pingText = avg > 0 ? `${avg} ms` : "Siap";
    return `${modelName(activeModel)} · ${pingText}`;
  }

  function updateIslandIdleText() {
    if (!els.islandText || !els.dynamicIsland) return;
    if (!els.dynamicIsland.classList.contains("is-notifying")) {
      els.islandText.textContent = getIdleIslandLabel();
    }
  }

  function renderTelemetryStats() {
    if (els.statTotalReq) {
      els.statTotalReq.textContent = String(telemetry.totalRequests);
    }
    if (els.statSuccessRate) {
      const rate = telemetry.totalRequests > 0
        ? Math.round((telemetry.successCount / telemetry.totalRequests) * 100)
        : 100;
      els.statSuccessRate.textContent = `${rate}%`;
    }
    if (els.statAvgLatency) {
      const avg = telemetry.totalRequests > 0
        ? Math.round(telemetry.totalLatencyMs / telemetry.totalRequests)
        : lastMeasuredPing;
      els.statAvgLatency.textContent = avg > 0 ? `${avg} ms` : "12 ms";
      if (els.islandPing) els.islandPing.textContent = avg > 0 ? `${avg} ms` : "12 ms";
    }
    updateIslandIdleText();
  }

  function measureNetworkPing(showFeedback = false) {
    const t0 = performance.now();
    if (els.pingStatusSub && showFeedback) {
      els.pingStatusSub.textContent = "Mengecek koneksi...";
    }
    fetch(window.location.href, { method: "HEAD", cache: "no-store" })
      .then(() => {
        const ms = Math.max(8, Math.round(performance.now() - t0));
        lastMeasuredPing = ms;
        if (els.statAvgLatency) els.statAvgLatency.textContent = `${ms} ms`;
        if (els.islandPing) els.islandPing.textContent = `${ms} ms`;
        if (els.pingStatusSub) {
          els.pingStatusSub.textContent = `${ms < 120 ? "Sangat ngebut" : "Koneksi stabil"} · Ketuk tes`;
        }
        updateIslandIdleText();
        if (showFeedback) toast(`Respon jaringan: ${ms} ms · Stabil`);
      })
      .catch(() => {
        const ms = Math.max(11, Math.round(performance.now() - t0));
        lastMeasuredPing = ms;
        if (els.statAvgLatency) els.statAvgLatency.textContent = `${ms} ms`;
        if (els.islandPing) els.islandPing.textContent = `${ms} ms`;
        if (els.pingStatusSub) els.pingStatusSub.textContent = "Siap dipakai · Ketuk tes";
        updateIslandIdleText();
        if (showFeedback) toast(`Respon jaringan: ${ms} ms · Siap`);
      });
  }

  function initDeviceMetrics() {
    const ua = navigator.userAgent || "";
    let os = "Linux / Unix";
    if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Win/i.test(ua)) os = "Windows";
    else if (/Mac/i.test(ua)) os = "macOS";

    let browser = "Browser";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

    if (els.metricOS) els.metricOS.textContent = os;
    if (els.metricBrowser) els.metricBrowser.textContent = browser;

    const updateRes = () => {
      if (els.metricResolution) {
        els.metricResolution.textContent = `${window.innerWidth}x${window.innerHeight}`;
      }
    };
    updateRes();
    window.addEventListener("resize", updateRes);

    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        const updateBat = () => {
          const pct = Math.round((battery.level || 1) * 100);
          if (els.metricBattery) {
            els.metricBattery.textContent = `${pct}%${battery.charging ? " ⚡" : ""}`;
          }
        };
        updateBat();
        battery.addEventListener("levelchange", updateBat);
        battery.addEventListener("chargingchange", updateBat);
      }).catch(() => {});
    }

    const updateClock = () => {
      try {
        const now = new Date();
        const shortTime = now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        });
        const fullTime = now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        if (els.liveClockText) els.liveClockText.textContent = `${fullTime} WIB`;
        if (els.islandClock) els.islandClock.textContent = shortTime;
      } catch {
        if (els.liveClockText) els.liveClockText.textContent = "AKTIF";
        if (els.islandClock) els.islandClock.textContent = "AKTIF";
      }
    };
    updateClock();
    window.setInterval(updateClock, 1000);

    // Indikator FPS halus saat kapsul Dynamic Island dibuka
    let frameCount = 0;
    let lastFpsTime = performance.now();
    function trackFps(now) {
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        const fps = Math.min(60, Math.max(48, Math.round((frameCount * 1000) / (now - lastFpsTime))));
        if (els.islandFps && els.islandPodBody && !els.islandPodBody.hidden) {
          els.islandFps.textContent = `${fps} FPS`;
        }
        frameCount = 0;
        lastFpsTime = now;
      }
      requestAnimationFrame(trackFps);
    }
    requestAnimationFrame(trackFps);
  }

  function initSpotlightEffect() {
    document.addEventListener("mousemove", event => {
      const card = event.target.closest(".spotlight-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    });
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
    document.body?.setAttribute("data-theme", resolvedTheme);
    document.documentElement.setAttribute("data-density", settings.density || "standard");

    const metaTheme = $("#metaThemeColor") || $('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", resolvedTheme === "light" ? "#f2f7f4" : "#060908");
    }

    if (els.islandThemeLabel) {
      els.islandThemeLabel.textContent = resolvedTheme === "light" ? "Mode: Terang" : "Mode: Gelap";
    }

    if (els.islandSoundLabel) {
      els.islandSoundLabel.textContent = soundEnabled ? "Suara: Aktif" : "Suara: Mati";
    }

    $$("[data-theme-choice]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeChoice === settings.theme);
    });

    $$("[data-density-choice]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.densityChoice === settings.density);
    });

    $$("[data-stream-choice]").forEach(btn => {
      btn.classList.toggle("active", (settings.streamSpeed || "cyber") === btn.dataset.streamChoice);
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
    const styleLabel = responseStyleLabels[settings.responseStyle] || "Standar";

    if (els.welcomeModelText) {
      els.welcomeModelText.textContent = `Model: ${modelName(activeModel)}`;
    }
    if (els.welcomeStyleText) {
      els.welcomeStyleText.textContent = `Gaya: ${styleLabel}`;
    }
    if (els.dashActiveModel) {
      els.dashActiveModel.textContent = modelName(activeModel);
    }
    if (els.dashActiveStyle) {
      els.dashActiveStyle.textContent = styleLabel;
    }
    updateIslandIdleText();
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
      toast("Penyimpanan penuh, riwayat sesi ini belum tersimpan.", true);
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
    const label = modelName(target);
    if (els.modelLabel) els.modelLabel.textContent = label;
    if (els.modelProvider) els.modelProvider.textContent = modelProvider(target);
    if (els.navModelIndicator) els.navModelIndicator.textContent = label;
    if (els.welcomeModelText) els.welcomeModelText.textContent = `Model: ${label}`;
    if (els.dashActiveModel) els.dashActiveModel.textContent = label;
    updateIslandIdleText();
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

  // Notifikasi langsung tampil di Dynamic Island bagian atas tengah
  function toast(message, error = false) {
    const cleanMsg = String(message || "")
      .replace(/\/api\/[a-z0-9\/_-]+/gi, "")
      .replace(/endpoint/gi, "layanan")
      .trim();
    if (!cleanMsg) return;

    const island = els.dynamicIsland || $("#dynamicIsland");
    const textEl = els.islandText || $("#islandText");

    if (island && textEl) {
      island.classList.add("is-notifying");
      island.classList.toggle("is-error", Boolean(error));
      textEl.textContent = cleanMsg;
      playCyberTick(error ? 320 : 780, 0.06);

      if (islandTimer) window.clearTimeout(islandTimer);
      islandTimer = window.setTimeout(() => {
        island.classList.remove("is-notifying", "is-error");
        textEl.textContent = getIdleIslandLabel();
      }, 2800);
      return;
    }

    if (els.toast) {
      const item = document.createElement("div");
      item.className = `toast${error ? " error" : ""}`;
      item.textContent = cleanMsg;
      els.toast.appendChild(item);
      window.setTimeout(() => item.remove(), 2800);
    }
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
      toast("Teks berhasil disalin");
    } catch {
      toast("Tidak dapat menyalin teks", true);
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
      if (els.chatScroll) {
        els.chatScroll.scrollTo({
          top: els.chatScroll.scrollHeight,
          behavior: "smooth"
        });
      }
    });
  }

  function createRobotAvatarEl(thinking = false) {
    const avatar = document.createElement("span");
    avatar.className = `assistant-avatar${thinking ? " is-thinking" : ""}`;
    const img = document.createElement("img");
    img.src = ROBOT_AVATAR;
    img.alt = "HAOMI Robot";
    avatar.appendChild(img);
    return avatar;
  }

  function addMessage(message, index, animateStream = false) {
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

    const avatar = createRobotAvatarEl(false);

    const name = document.createElement("span");
    name.className = "assistant-name";
    name.textContent = "HAOMI BOT";

    const badge = document.createElement("span");
    badge.className = "model-badge";
    badge.textContent = modelName(message.model);

    const time = document.createElement("span");
    time.className = "message-time";
    time.textContent = formatTime(message.createdAt);

    heading.append(avatar, name, badge, time);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "message-action";
    copy.textContent = "Salin jawaban";
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

    const speedMode = settings.streamSpeed || "cyber";
    if (animateStream && !message.error && speedMode !== "instant") {
      streamAssistantText(article, bubble, actions, message.content, speedMode);
    } else {
      bubble.innerHTML = markdown(message.content);
    }
  }

  function streamAssistantText(article, bubble, actions, fullText, speedMode) {
    if (activeStreamCancel) activeStreamCancel();

    article.classList.add("is-streaming");
    const skipBtn = document.createElement("button");
    skipBtn.type = "button";
    skipBtn.className = "message-action skip-stream-btn";
    skipBtn.textContent = "⚡ Tampilkan Langsung";
    actions.prepend(skipBtn);

    const length = fullText.length;
    let cursor = 0;
    let finished = false;

    const baseStep = speedMode === "turbo"
      ? Math.max(6, Math.ceil(length / 45))
      : Math.max(2, Math.ceil(length / 110));

    const finishInstant = () => {
      if (finished) return;
      finished = true;
      activeStreamCancel = null;
      article.classList.remove("is-streaming");
      skipBtn.remove();
      bubble.innerHTML = markdown(fullText);
      scrollBottom();
    };

    activeStreamCancel = finishInstant;
    skipBtn.addEventListener("click", finishInstant);

    function step() {
      if (finished) return;
      const sliceNext = fullText.slice(cursor, cursor + baseStep * 2);
      const spaceIdx = sliceNext.indexOf(" ");
      const advance = spaceIdx > 0 ? spaceIdx + 1 : baseStep;
      cursor = Math.min(length, cursor + advance);

      const partial = fullText.slice(0, cursor);
      bubble.innerHTML = markdown(partial) + `<span class="cyber-cursor">▋</span>`;
      scrollBottom();

      if (cursor < length) {
        window.setTimeout(() => requestAnimationFrame(step), speedMode === "turbo" ? 12 : 22);
      } else {
        finishInstant();
      }
    }

    requestAnimationFrame(step);
  }

  function renderMessages(animateLastAssistant = false) {
    const conversation = activeConversation();
    els.messages.replaceChildren();

    const hasMessages = Boolean(conversation?.messages?.length);
    if (els.welcome) els.welcome.hidden = hasMessages && !forceShowHud;

    if (els.activeChatTitle) {
      els.activeChatTitle.textContent = conversation?.title || "Obrolan baru";
    }

    syncModelIndicators(conversation?.model);

    if (conversation) {
      const lastIdx = conversation.messages.length - 1;
      conversation.messages.forEach((message, index) => {
        const shouldAnimate = animateLastAssistant && index === lastIdx && message.role === "assistant";
        addMessage(message, index, shouldAnimate);
      });
    }

    if (hasMessages) scrollBottom();
  }

  function renderHistory() {
    if (!els.conversationList || !els.historyCount) return;
    const query = (els.historySearch?.value || "").trim().toLowerCase();
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
        ? "Tidak ada obrolan yang cocok."
        : "Belum ada riwayat obrolan.";
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
          toast("Tunggu balasan selesai sebelum pindah obrolan.");
          return;
        }
        state.activeId = conversation.id;
        saveState();
        renderHistory();
        renderMessages(false);
        showView("chat");
        closeMobileSidebar();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "history-delete";
      remove.textContent = "×";
      remove.title = "Hapus obrolan";
      remove.setAttribute("aria-label", "Hapus obrolan");

      remove.addEventListener("click", event => {
        event.stopPropagation();
        if (busy && conversation.id === state.activeId) {
          toast("Tunggu balasan selesai sebelum menghapus.");
          return;
        }

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
        renderMessages(false);
        toast("Obrolan dihapus");
      });

      row.append(open, remove);
      els.conversationList.appendChild(row);
    });
  }

  function setBusy(value) {
    busy = value;
    if (els.send) {
      els.send.disabled = value;
      els.send.classList.toggle("is-loading", value);
      els.send.setAttribute("aria-label", value ? "Sedang memproses" : "Kirim pesan");
    }
    if (els.input) els.input.disabled = value;
  }

  async function directJerexdFallback(action, payload = {}) {
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
      throw new Error(data.message || "Permintaan belum berhasil diproses.");
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
    const startMs = performance.now();
    let response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ action, ...payload })
      });
    } catch {
      try {
        const fallbackData = await directJerexdFallback(action, payload);
        recordTelemetry(true, Math.round(performance.now() - startMs));
        return fallbackData;
      } catch (err) {
        recordTelemetry(false, Math.round(performance.now() - startMs));
        throw err;
      }
    }

    if (response.status === 404 || response.status === 405) {
      try {
        const fallbackData = await directJerexdFallback(action, payload);
        recordTelemetry(true, Math.round(performance.now() - startMs));
        return fallbackData;
      } catch (err) {
        recordTelemetry(false, Math.round(performance.now() - startMs));
        throw err;
      }
    }

    let data;
    try {
      data = await response.json();
    } catch {
      recordTelemetry(false, Math.round(performance.now() - startMs));
      throw new Error(`Balasan server tidak terbaca (Kode ${response.status}).`);
    }

    if (!response.ok || data.success === false) {
      recordTelemetry(false, Math.round(performance.now() - startMs));
      throw new Error(data.message || `Permintaan gagal (Kode ${response.status}).`);
    }

    recordTelemetry(true, Math.round(performance.now() - startMs));
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

    const avatar = createRobotAvatarEl(true);

    const name = document.createElement("span");
    name.className = "assistant-name";
    name.textContent = "HAOMI BOT";

    const badge = document.createElement("span");
    badge.className = "model-badge";
    badge.textContent = modelName(model);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    const hud = document.createElement("div");
    hud.className = "neural-thinking-hud";
    hud.setAttribute("aria-label", "HAOMI sedang menyiapkan balasan");

    const bars = document.createElement("div");
    bars.className = "wave-bars";
    for (let i = 0; i < 4; i++) {
      const bar = document.createElement("span");
      bar.className = "wave-bar";
      bars.appendChild(bar);
    }

    const label = document.createElement("span");
    label.textContent = "Sedang menyusun jawaban...";

    hud.append(bars, label);
    bubble.appendChild(hud);
    heading.append(avatar, name, badge);
    article.append(heading, bubble);
    els.messages.appendChild(article);
    scrollBottom();
    return article;
  }

  async function sendMessage(rawText) {
    const prompt = String(rawText || "").trim();
    if (!prompt || busy) return;

    // Jalankan perintah cepat jika diawali "/" tanpa spasi
    if (prompt.startsWith("/") && !prompt.includes(" ")) {
      if (executeSlashShortcut(prompt.toLowerCase())) {
        els.input.value = "";
        resizeInput();
        if (els.slashCmdMenu) els.slashCmdMenu.hidden = true;
        return;
      }
    }

    if (activeStreamCancel) activeStreamCancel();
    forceShowHud = false;
    if (els.slashCmdMenu) els.slashCmdMenu.hidden = true;

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
    renderMessages(false);

    const loading = createLoading(sequence, model);
    const stylePrefix = responseStylePrompts[settings.responseStyle] || "";
    const effectivePrompt = stylePrefix ? `${stylePrefix}${prompt}` : prompt;

    let succeeded = false;
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
        throw new Error("Belum ada teks balasan yang diterima, coba kirim ulang ya.");
      }

      conversation.sessionId = data.session_id || conversation.sessionId;
      conversation.messages.push({
        role: "assistant",
        content: answer,
        model: data.model || model,
        createdAt: Date.now()
      });
      succeeded = true;
    } catch (error) {
      conversation.messages.push({
        role: "assistant",
        content: `Maaf, pesanmu belum berhasil diproses.\n\nInfo: ${error.message || "Koneksi sedang sibuk, coba sebentar lagi ya."}`,
        model,
        error: true,
        createdAt: Date.now()
      });
    } finally {
      loading.remove();
      conversation.updatedAt = Date.now();
      saveState();
      renderHistory();
      renderMessages(succeeded);
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
    renderMessages(false);

    await sendMessage(prompt);
  }

  function resizeInput() {
    if (!els.input) return;
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(els.input.scrollHeight, 160)}px`;
  }

  function toggleSidebar() {
    if (window.innerWidth <= 860) {
      const isOpen = !document.body.classList.contains("sidebar-open");
      document.body.classList.toggle("sidebar-open", isOpen);
      $("#appShell")?.classList.toggle("sidebar-open", isOpen);
      els.sidebar?.classList.toggle("open", isOpen);
    } else {
      document.body.classList.toggle("sidebar-collapsed");
    }
  }

  function closeMobileSidebar() {
    document.body.classList.remove("sidebar-open");
    $("#appShell")?.classList.remove("sidebar-open");
    els.sidebar?.classList.remove("open");
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
    urlscan: "Cek Keamanan Link",
    whatsapp: "Reaksi Saluran WA"
  };

  function showView(name) {
    if (!viewIds[name]) return;

    Object.entries(viewIds).forEach(([key, elementId]) => {
      const view = document.getElementById(elementId);
      if (!view) return;
      view.hidden = key !== name;
      view.classList.toggle("active", key === name);
    });

    $$(".nav-item[data-view], .mob-nav-item[data-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.view === name);
    });

    if (els.breadcrumb) els.breadcrumb.textContent = viewTitles[name];
    const isChat = name === "chat";
    if (els.activeChatTitle) els.activeChatTitle.hidden = !isChat;
    if (els.chatTitleDivider) els.chatTitleDivider.hidden = !isChat;
    const resetBtn = $("#resetSessionButton");
    const exportBtn = $("#exportChatButton");
    const dashBtn = $("#toggleDashboardBtn");
    if (resetBtn) resetBtn.hidden = !isChat;
    if (exportBtn) exportBtn.hidden = !isChat;
    if (dashBtn) dashBtn.hidden = !isChat;

    closeComposerMenu();
    closeMobileSidebar();

    if (isChat) renderMessages(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newChat() {
    if (busy) {
      toast("Tunggu balasan selesai sebelum membuat obrolan baru.");
      return;
    }

    if (activeStreamCancel) activeStreamCancel();
    forceShowHud = false;

    const conversation = newConversation();
    state.conversations.unshift(conversation);
    state.activeId = conversation.id;

    saveState();
    renderHistory();
    renderMessages(false);
    showView("chat");
    closeMobileSidebar();
    toast("Sesi obrolan baru siap");
  }

  function resetCurrentSessionContext() {
    const conversation = ensureConversation();
    conversation.sessionId = `haomi-${id()}`;
    conversation.messages = [];
    pendingResetSession = true;
    forceShowHud = false;
    saveState();
    renderHistory();
    renderMessages(false);
    closeComposerMenu();
    toast("Obrolan dibersihkan, siap mulai bahasan baru");
  }

  function exportCurrentChat() {
    const conversation = activeConversation();
    if (!conversation || !conversation.messages.length) {
      toast("Belum ada isi obrolan untuk diunduh.", true);
      return;
    }

    const lines = [
      `# ${conversation.title}`,
      `Model: ${modelName(conversation.model)}`,
      `Waktu Unduh: ${new Date().toLocaleString("id-ID")}`,
      ""
    ];

    conversation.messages.forEach(msg => {
      const sender = msg.role === "user" ? "KAMU" : `HAOMI BOT (${modelName(msg.model)})`;
      lines.push(`### ${sender}`);
      lines.push(msg.content);
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${conversation.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "obrolan"}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast("Obrolan berhasil diunduh (.md)");
  }

  function exportAllBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      telemetry,
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
    toast("Cadangan data berhasil diunduh (.json)");
  }

  function toggleComposerMenu() {
    if (!els.composerToolsMenu) return;
    const isHidden = els.composerToolsMenu.hidden;
    els.composerToolsMenu.hidden = !isHidden;
    els.composerToolsBtn?.setAttribute("aria-expanded", String(isHidden));
  }

  function closeComposerMenu() {
    if (!els.composerToolsMenu) return;
    els.composerToolsMenu.hidden = true;
    els.composerToolsBtn?.setAttribute("aria-expanded", "false");
  }

  function openModelDialog() {
    if (!els.modelDialog) return;
    lastFocusedElement = document.activeElement;
    els.modelDialog.hidden = false;
    els.modelTrigger?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    updateModelOptions();
  }

  function closeModelDialog() {
    if (!els.modelDialog) return;
    els.modelDialog.hidden = true;
    els.modelTrigger?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    lastFocusedElement?.focus?.({ preventScroll: true });
  }

  function updateModelOptions() {
    if (!els.modelList) return;
    const query = (els.modelSearch?.value || "").trim().toLowerCase();
    const selected = activeConversation()?.model || getDefaultModel();

    $$(".model-option", els.modelList).forEach(button => {
      const name = models[button.dataset.model]?.join(" ") || button.dataset.model;
      const provider = button.dataset.provider || "other";
      const matchesQuery = name.toLowerCase().includes(query) || button.dataset.model.toLowerCase().includes(query);
      const matchesProvider = activeProviderFilter === "all" || provider === activeProviderFilter;
      button.hidden = !(matchesQuery && matchesProvider);
      const isSel = button.dataset.model === selected;
      button.classList.toggle("selected", isSel);
      button.classList.toggle("active", isSel);
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
    if (!els.settings) return;
    applySettingsToUI();
    els.settings.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeSettings() {
    if (!els.settings) return;
    els.settings.hidden = true;
    document.body.style.overflow = "";
  }

  function setAlightMode(mode) {
    const select = $("#alightAction");
    if (select) select.value = mode;
    $$(".mode-tab[data-am-mode]").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.amMode === mode);
    });
    updateAlightFields();
  }

  function updateAlightFields() {
    const select = $("#alightAction");
    if (!select) return;
    const mode = select.value;
    const needsLink = mode === "am-verify";
    const linkGroup = $("#verificationLinkGroup");
    const linkInput = $("#alightLink");
    const submitSpan = $("#alightSubmit span");
    if (linkGroup) linkGroup.hidden = !needsLink;
    if (linkInput) linkInput.required = needsLink;
    if (submitSpan) {
      submitSpan.textContent = needsLink ? "Verifikasi Tautan Akun" : "Kirim Email Verifikasi";
    }
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
    if (!element) return;
    element.classList.remove("is-error", "is-success");
    statusBadge?.classList.remove("is-error", "is-success");

    if (status === "error") {
      element.classList.add("is-error");
      statusBadge?.classList.add("is-error");
      if (statusBadge) statusBadge.textContent = "GAGAL";
    } else if (status === "success") {
      element.classList.add("is-success");
      statusBadge?.classList.add("is-success");
      if (statusBadge) statusBadge.textContent = "BERHASIL";
    } else {
      if (statusBadge) statusBadge.textContent = status || "SIAP";
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
    if (!form || form.dataset.busy === "true") return;

    form.dataset.busy = "true";
    const labelSpan = $("span", button) || button;
    const originalText = labelSpan.textContent;
    button.disabled = true;
    labelSpan.textContent = loadingText;

    const startTime = performance.now();
    showToolResult(resultElement, statusBadge, timeBadge, summaryEl, "// Sedang memproses permintaan kamu...", "PROSES");

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
      toast("Berhasil diproses!");
    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime);
      showToolResult(
        resultElement,
        statusBadge,
        timeBadge,
        summaryEl,
        `// Gagal diproses: ${error.message || "Terjadi kendala koneksi."}`,
        "error",
        elapsed,
        null
      );
      toast("Gagal diproses, cek keterangan hasil.", true);
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

  function cycleResponseStyle() {
    const current = settings.responseStyle || "standard";
    const nextIdx = (responseStyleOrder.indexOf(current) + 1) % responseStyleOrder.length;
    const nextStyle = responseStyleOrder[nextIdx];
    saveSettings({ responseStyle: nextStyle });
    toast(`Gaya bicara AI: ${responseStyleLabels[nextStyle]}`);
  }

  function toggleQuickTheme() {
    const currentResolved = getResolvedTheme(settings.theme);
    const nextTheme = currentResolved === "dark" ? "light" : "dark";
    saveSettings({ theme: nextTheme });
    toast(`Mode ${nextTheme === "dark" ? "Gelap" : "Terang"} diaktifkan`);
  }

  // Eksekusi pintasan perintah cepat (/model, /gaya, /kode, /ringkas, /reset, /tema, dll.)
  function executeSlashShortcut(cmd) {
    if (els.slashCmdMenu) els.slashCmdMenu.hidden = true;
    if (cmd === "/model" || cmd === "/models") {
      openModelDialog();
      return true;
    }
    if (cmd === "/gaya" || cmd === "/style") {
      cycleResponseStyle();
      return true;
    }
    if (cmd === "/kode") {
      if (els.input) {
        els.input.value = "Tolong cek dan rapikan kode berikut biar jalan mulus:\n\n";
        resizeInput();
        els.input.focus();
        toast("Format cek kode disiapkan");
      }
      return true;
    }
    if (cmd === "/ringkas") {
      if (els.input) {
        els.input.value = "Tolong rangkum poin paling penting dari teks berikut pakai bahasa yang santai:\n\n";
        resizeInput();
        els.input.focus();
        toast("Format rangkuman disiapkan");
      }
      return true;
    }
    if (cmd === "/reset") {
      resetCurrentSessionContext();
      return true;
    }
    if (cmd === "/tema" || cmd === "/theme") {
      toggleQuickTheme();
      return true;
    }
    if (cmd === "/am" || cmd === "/alight") {
      showView("alight");
      return true;
    }
    if (cmd === "/scan" || cmd === "/urlscan") {
      showView("urlscan");
      return true;
    }
    if (cmd === "/wa" || cmd === "/react") {
      showView("whatsapp");
      return true;
    }
    if (cmd === "/settings" || cmd === "/config") {
      openSettings();
      return true;
    }
    return false;
  }

  function handleTerminalFilter() {
    const q = (els.terminalInput?.value || "").trim().toLowerCase();
    $$("[data-filter-text]").forEach(card => {
      const hay = (card.dataset.filterText || "").toLowerCase();
      card.hidden = Boolean(q) && !hay.includes(q) && !q.startsWith("/");
    });
  }

  function handleTerminalExecute(rawVal) {
    const cmd = rawVal.trim();
    if (!cmd) return;
    if (els.terminalInput) els.terminalInput.value = "";
    handleTerminalFilter();
    if (executeSlashShortcut(cmd.toLowerCase())) return;
    sendMessage(cmd);
  }

  function bindEvents() {
    $("#openSidebar")?.addEventListener("click", toggleSidebar);
    $("#closeSidebar")?.addEventListener("click", closeMobileSidebar);
    els.overlay?.addEventListener("click", closeMobileSidebar);
    $("#newChatButton")?.addEventListener("click", newChat);
    els.historySearch?.addEventListener("input", renderHistory);

    // Interaksi kapsul Dynamic Island di bagian atas
    if (els.dynamicIsland && els.islandPodBody) {
      els.dynamicIsland.addEventListener("click", event => {
        if (event.target.closest(".island-pod-btn")) return;
        const expanded = !els.islandPodBody.hidden;
        els.islandPodBody.hidden = expanded;
        els.dynamicIsland.classList.toggle("is-expanded", !expanded);
        playCyberTick(520, 0.04);
      });

      document.addEventListener("click", event => {
        if (!els.dynamicIsland.contains(event.target) && !els.islandPodBody.hidden) {
          els.islandPodBody.hidden = true;
          els.dynamicIsland.classList.remove("is-expanded");
        }
      });
    }

    els.islandSoundBtn?.addEventListener("click", event => {
      event.stopPropagation();
      soundEnabled = !soundEnabled;
      try {
        localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
      } catch {}
      if (els.islandSoundLabel) {
        els.islandSoundLabel.textContent = soundEnabled ? "Suara: Aktif" : "Suara: Mati";
      }
      toast(soundEnabled ? "Efek suara sentuhan aktif" : "Efek suara dimatikan");
    });

    els.islandFocusBtn?.addEventListener("click", event => {
      event.stopPropagation();
      if (els.welcome) {
        forceShowHud = els.welcome.hidden;
        els.welcome.hidden = !els.welcome.hidden;
        toast(els.welcome.hidden ? "Mode Fokus: Dasbor disembunyikan" : "Panel dasbor ditampilkan");
      }
    });

    els.islandThemeBtn?.addEventListener("click", event => {
      event.stopPropagation();
      toggleQuickTheme();
    });

    document.addEventListener("pointerdown", event => {
      if (event.target.closest("button, .interactive-stat, .prompt-card")) {
        playCyberTick(600, 0.03);
      }
    }, { passive: true });

    // 4 Kotak Dasbor Utama Interaktif
    els.boxActiveModel?.addEventListener("click", openModelDialog);
    els.boxAiStyle?.addEventListener("click", cycleResponseStyle);
    els.boxPingTest?.addEventListener("click", () => measureNetworkPing(true));
    els.boxSessionInfo?.addEventListener("click", () => {
      newChat();
      els.input?.focus();
    });

    // Tombol pintasan di bagian atas
    $("#toggleDashboardBtn")?.addEventListener("click", () => {
      if (!els.welcome) return;
      const hasMessages = Boolean(activeConversation()?.messages?.length);
      if (!hasMessages) {
        els.welcome.hidden = !els.welcome.hidden;
        toast(els.welcome.hidden ? "Mode Fokus aktif" : "Panel dasbor ditampilkan");
        return;
      }
      forceShowHud = !forceShowHud;
      els.welcome.hidden = !forceShowHud;
      if (forceShowHud) {
        els.chatScroll?.scrollTo({ top: 0, behavior: "smooth" });
      }
      toast(forceShowHud ? "Panel dasbor ditampilkan" : "Mode Fokus aktif");
    });

    $("#quickThemeToggle")?.addEventListener("click", toggleQuickTheme);
    $("#resetSessionButton")?.addEventListener("click", resetCurrentSessionContext);
    $("#popoverResetChat")?.addEventListener("click", resetCurrentSessionContext);
    $("#exportChatButton")?.addEventListener("click", exportCurrentChat);

    $$("[data-view]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        showView(button.dataset.view);
      });
    });

    // Chip perintah cepat & menu slash command di keyboard composer
    $$(".cmd-chip[data-cmd]").forEach(chip => {
      chip.addEventListener("click", () => {
        executeSlashShortcut(chip.dataset.cmd);
      });
    });

    $$(".slash-cmd-item[data-slash]").forEach(item => {
      item.addEventListener("click", () => {
        if (els.input && item.dataset.slash !== "/kode" && item.dataset.slash !== "/ringkas") {
          els.input.value = "";
          resizeInput();
        }
        executeSlashShortcut(item.dataset.slash);
      });
    });

    els.terminalInput?.addEventListener("input", handleTerminalFilter);
    els.terminalInput?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleTerminalExecute(els.terminalInput.value);
      }
    });

    els.chatForm?.addEventListener("submit", event => {
      event.preventDefault();
      if (!busy && els.input) sendMessage(els.input.value);
    });

    els.input?.addEventListener("input", () => {
      resizeInput();
      const val = (els.input.value || "").trim();
      if (els.slashCmdMenu) {
        if (val.startsWith("/") && !val.includes(" ")) {
          let anyVisible = false;
          $$(".slash-cmd-item", els.slashCmdMenu).forEach(item => {
            const cmd = item.dataset.slash || "";
            const match = cmd.startsWith(val.toLowerCase());
            item.hidden = !match;
            if (match) anyVisible = true;
          });
          els.slashCmdMenu.hidden = !anyVisible;
        } else {
          els.slashCmdMenu.hidden = true;
        }
      }
    });

    els.input?.addEventListener("keydown", event => {
      if (event.isComposing) return;
      if (settings.enterToSend) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (!busy) els.chatForm?.requestSubmit();
        }
      } else {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          if (!busy) els.chatForm?.requestSubmit();
        }
      }
    });

    $$(".prompt-card[data-prompt]").forEach(button => {
      button.addEventListener("click", () => {
        showView("chat");
        if (els.input) {
          els.input.value = button.dataset.prompt || "";
          resizeInput();
          els.input.focus();
          toast("Ide obrolan siap dikirim");
        }
      });
    });

    els.welcomeModelBadge?.addEventListener("click", openModelDialog);
    els.welcomeStyleBadge?.addEventListener("click", openSettings);

    els.messages?.addEventListener("click", event => {
      const codeBtn = event.target.closest("[data-copy-code]");
      if (codeBtn) {
        copyText(codeBtn.dataset.copyCode);
      }
    });

    els.composerToolsBtn?.addEventListener("click", event => {
      event.stopPropagation();
      toggleComposerMenu();
    });

    document.addEventListener("click", event => {
      if (els.composerToolsMenu && !els.composerToolsMenu.hidden &&
          !els.composerToolsMenu.contains(event.target) &&
          !els.composerToolsBtn?.contains(event.target)) {
        closeComposerMenu();
      }
    });

    els.modelTrigger?.addEventListener("click", openModelDialog);
    els.closeModel?.addEventListener("click", closeModelDialog);
    els.modelSearch?.addEventListener("input", updateModelOptions);

    $$(".provider-filter").forEach(btn => {
      btn.addEventListener("click", () => {
        activeProviderFilter = btn.dataset.provider || "all";
        $$(".provider-filter").forEach(b => b.classList.toggle("active", b === btn));
        updateModelOptions();
      });
    });

    els.modelDialog?.addEventListener("click", event => {
      if (event.target === els.modelDialog) closeModelDialog();
    });

    $$(".model-option").forEach(button => {
      button.addEventListener("click", () => selectModel(button.dataset.model));
    });

    // Pengaturan
    $("#openSettings")?.addEventListener("click", openSettings);
    $("#openSettingsTop")?.addEventListener("click", openSettings);
    $("#openSettingsMobile")?.addEventListener("click", openSettings);
    $("#closeSettings")?.addEventListener("click", closeSettings);

    els.settings?.addEventListener("click", event => {
      if (event.target === els.settings) closeSettings();
    });

    $$("[data-stream-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSettings({ streamSpeed: btn.dataset.streamChoice });
        toast("Kecepatan ketikan AI diperbarui");
      });
    });

    $$("[data-theme-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSettings({ theme: btn.dataset.themeChoice });
        const actual = getResolvedTheme(btn.dataset.themeChoice);
        toast(`Mode ${actual === "light" ? "Terang" : "Gelap"} diaktifkan`);
      });
    });

    window.matchMedia?.("(prefers-color-scheme: light)")?.addEventListener?.("change", () => {
      if (settings.theme === "system") applySettingsToUI();
    });

    $$("[data-density-choice]").forEach(btn => {
      btn.addEventListener("click", () => {
        saveSettings({ density: btn.dataset.densityChoice });
        toast("Ukuran tampilan diperbarui");
      });
    });

    els.defaultModel?.addEventListener("change", () => {
      const nextModel = els.defaultModel.value;
      saveSettings({ defaultModel: nextModel });
      const active = activeConversation();
      if (active && !active.messages.length) {
        active.model = nextModel;
        saveState();
        syncModelIndicators(nextModel);
      }
      toast(`Model utama diatur ke ${modelName(nextModel)}`);
    });

    els.responseStyle?.addEventListener("change", () => {
      saveSettings({ responseStyle: els.responseStyle.value });
      toast(`Gaya bicara diatur ke ${responseStyleLabels[els.responseStyle.value]}`);
    });

    els.enterToSend?.addEventListener("change", () => {
      saveSettings({ enterToSend: els.enterToSend.checked });
      toast(els.enterToSend.checked
        ? "Tombol Enter aktif untuk kirim pesan"
        : "Gunakan Ctrl+Enter untuk kirim pesan");
    });

    els.saveHistory?.addEventListener("change", () => {
      const enabled = els.saveHistory.checked;
      saveSettings({ saveHistory: enabled });
      if (enabled) {
        saveState();
        toast("Riwayat obrolan disimpan di browser");
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TELEMETRY_KEY);
        } catch {}
        toast("Penyimpanan riwayat dimatikan");
      }
    });

    els.defaultWaEmoji?.addEventListener("change", () => {
      const val = els.defaultWaEmoji.value.trim() || defaultSettings.defaultWaEmoji;
      saveSettings({ defaultWaEmoji: val });
      const waInput = $("#whatsappReaction");
      if (waInput) {
        waInput.value = val;
        syncWaEmojiChips();
      }
      toast("Emoji bawaan Reaksi WA disimpan");
    });

    $("#exportAllDataBtn")?.addEventListener("click", exportAllBackup);

    const clearBtn = $("#clearAllHistory");
    clearBtn?.addEventListener("click", () => {
      if (busy) {
        toast("Tunggu jawaban selesai sebelum menghapus riwayat.");
        return;
      }

      if (!clearBtn.classList.contains("confirming")) {
        clearBtn.classList.add("confirming");
        clearBtn.textContent = "Ketuk sekali lagi buat hapus";
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
      telemetry = { totalRequests: 0, successCount: 0, totalLatencyMs: 0 };

      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TELEMETRY_KEY);
      } catch {}
      saveState();
      renderTelemetryStats();
      renderHistory();
      renderMessages(false);
      closeSettings();
      toast("Semua riwayat obrolan berhasil dihapus");
    });

    // Alight Motion
    $$(".mode-tab[data-am-mode]").forEach(tab => {
      tab.addEventListener("click", () => setAlightMode(tab.dataset.amMode));
    });

    $("#alightAction")?.addEventListener("change", updateAlightFields);

    $("#alightForm")?.addEventListener("submit", event => {
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

    // Scan URL
    $("#pasteUrlBtn")?.addEventListener("click", async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = (await navigator.clipboard.readText()).trim();
          if (text) {
            $("#scanUrl").value = text.startsWith("http") ? text : `https://${text}`;
            toast("Link berhasil ditempel");
            return;
          }
        }
        $("#scanUrl")?.focus();
        toast("Silakan tekan Ctrl+V di kolom link");
      } catch {
        $("#scanUrl")?.focus();
        toast("Silakan tekan Ctrl+V di kolom link");
      }
    });

    $("#urlscanForm")?.addEventListener("submit", event => {
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
        loadingText: "Memeriksa..."
      });
    });

    // Reaksi WhatsApp
    $$(".emoji-chip[data-emoji]").forEach(chip => {
      chip.addEventListener("click", () => toggleWaEmoji(chip.dataset.emoji));
    });

    $("#whatsappReaction")?.addEventListener("input", syncWaEmojiChips);

    $("#resetWaEmojiBtn")?.addEventListener("click", () => {
      const waInput = $("#whatsappReaction");
      if (waInput) waInput.value = settings.defaultWaEmoji || defaultSettings.defaultWaEmoji;
      syncWaEmojiChips();
      toast("Emoji dikembalikan ke setelan awal");
    });

    $("#whatsappForm")?.addEventListener("submit", event => {
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
        target.textContent = "// Hasil sudah dibersihkan, siap dipakai lagi.";

        const prefix = targetId.replace("Result", "");
        const badge = document.getElementById(`${prefix}StatusBadge`);
        const time = document.getElementById(`${prefix}TimeBadge`);
        const summary = document.getElementById(`${prefix}Summary`);
        if (badge) {
          badge.classList.remove("is-error", "is-success");
          badge.textContent = "SIAP";
        }
        if (time) time.hidden = true;
        if (summary) summary.hidden = true;
        toast("Hasil dibersihkan");
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMobileSidebar();
        closeComposerMenu();
        if (els.slashCmdMenu) els.slashCmdMenu.hidden = true;
        if (els.modelDialog && !els.modelDialog.hidden) closeModelDialog();
        if (els.settings && !els.settings.hidden) closeSettings();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }

      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        if (els.settings?.hidden) openSettings();
        else closeSettings();
      }

      if (event.key === "/" && els.modelDialog && !els.modelDialog.hidden &&
          document.activeElement !== els.modelSearch) {
        event.preventDefault();
        els.modelSearch?.focus();
      } else if (event.key === "/" &&
                 (!els.modelDialog || els.modelDialog.hidden) &&
                 (!els.settings || els.settings.hidden) &&
                 !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        els.input?.focus();
      }
    });
  }

  function initialize() {
    applySettingsToUI();
    initDeviceMetrics();
    initSpotlightEffect();
    renderTelemetryStats();
    measureNetworkPing(false);

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
    renderMessages(false);
    updateModelOptions();
    saveState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
