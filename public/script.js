
(() => {
    'use strict';

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const landingPage = $('#landing-page');
    const mainApp = $('#main-app');
    const enterAppBtn = $('#enter-app-btn');

    const form = $('#search-form');
    const input = $('#question-input');
    const resultTemplate = $('#result-container');
    const welcomeScreen = $('#welcome-screen');

    const historyList = $('#history-list');
    const menuToggle = $('#menu-toggle');
    const closeSidebar = $('#close-sidebar');
    const sidebarOverlay = $('#sidebar-overlay');
    const clearHistoryBtn = $('#clear-history');

    const STORAGE_SESSIONS = 'smartAIChatSessions';
    const STORAGE_ACTIVE = 'smartAIActiveSession';
    const OLD_STORAGE = 'smartAIConversations';
    const OLD_HISTORY = 'turboHistory';

    // =====================================
    // TAMPILAN DASAR
    // =====================================

    resultTemplate.classList.add('hidden');

    const conversationList = document.createElement('div');
    conversationList.id = 'conversation-list';

    Object.assign(conversationList.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%'
    });

    resultTemplate.parentNode.insertBefore(
        conversationList,
        resultTemplate
    );

    // Tombol obrolan baru pada sidebar
    const newChatButton = document.createElement('button');

    newChatButton.type = 'button';
    newChatButton.id = 'new-chat-button';
    newChatButton.innerHTML =
        '<span class="material-icons-round">add</span>' +
        '<span>Obrolan Baru</span>';

    Object.assign(newChatButton.style, {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '13px',
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,.14)',
        borderRadius: '12px',
        background: '#26312b',
        color: '#ffffff',
        fontFamily: 'inherit',
        fontSize: '14px',
        cursor: 'pointer'
    });

    const sidebarContent = $('.sidebar-content');

    if (sidebarContent && historyList) {
        const historyContainer = historyList.closest(
            '.history-list-container'
        );

        if (historyContainer) {
            sidebarContent.insertBefore(
                newChatButton,
                historyContainer
            );
        }
    }

    // =====================================
    // PENYIMPANAN
    // =====================================

    function readJSON(key, fallback) {
        try {
            const value = JSON.parse(
                localStorage.getItem(key) || 'null'
            );

            return value ?? fallback;
        } catch {
            return fallback;
        }
    }

    function createId() {
        return Date.now().toString(36) +
            Math.random().toString(36).slice(2, 9);
    }

    function createSession(title = 'Obrolan Baru') {
        return {
            id: createId(),
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
    }

    let sessions = readJSON(STORAGE_SESSIONS, []);

    if (!Array.isArray(sessions)) {
        sessions = [];
    }

    // Migrasi data percakapan dari versi sebelumnya.
    // Setiap percakapan lama dipertahankan sebagai sesi tersendiri.
    if (sessions.length === 0) {
        const oldChats = readJSON(OLD_STORAGE, []);

        if (Array.isArray(oldChats) && oldChats.length > 0) {
            oldChats.forEach(oldChat => {
                if (!oldChat.question) return;

                sessions.push({
                    id: oldChat.id || createId(),
                    title: oldChat.question.slice(0, 45),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    messages: [
                        {
                            id: createId(),
                            role: 'user',
                            content: oldChat.question
                        },
                        {
                            id: createId(),
                            role: 'assistant',
                            content: oldChat.answer || '',
                            sources: oldChat.sources || [],
                            similarQuestions:
                                oldChat.similarQuestions || []
                        }
                    ]
                });
            });
        } else {
            // Migrasi riwayat pertanyaan lama jika tersedia.
            const oldHistory = readJSON(OLD_HISTORY, []);

            if (Array.isArray(oldHistory)) {
                oldHistory.forEach(question => {
                    if (typeof question !== 'string') return;

                    sessions.push({
                        ...createSession(question.slice(0, 45)),
                        messages: [
                            {
                                id: createId(),
                                role: 'user',
                                content: question
                            }
                        ]
                    });
                });
            }
        }

        saveSessions();
    }

    let activeSessionId = localStorage.getItem(STORAGE_ACTIVE);

    let activeSession = sessions.find(
        session => session.id === activeSessionId
    );

    if (!activeSession && sessions.length > 0) {
        activeSession = [...sessions].sort(
            (a, b) => b.updatedAt - a.updatedAt
        )[0];
    }

    if (!activeSession) {
        activeSession = createSession();
        sessions.unshift(activeSession);
    }

    activeSessionId = activeSession.id;

    function saveSessions() {
        try {
            localStorage.setItem(
                STORAGE_SESSIONS,
                JSON.stringify(sessions)
            );

            localStorage.setItem(
                STORAGE_ACTIVE,
                activeSessionId || ''
            );
        } catch (error) {
            console.error('Gagal menyimpan sesi:', error);
        }
    }

    function touchSession() {
        activeSession.updatedAt = Date.now();

        sessions.sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        saveSessions();
        renderHistory();
    }

    // =====================================
    // NAVIGASI
    // =====================================

    enterAppBtn?.addEventListener('click', () => {
        landingPage.style.display = 'none';
        mainApp.classList.remove('hidden-section');
    });

    menuToggle?.addEventListener('click', () => {
        sidebarOverlay.classList.add('sidebar-visible');
    });

    closeSidebar?.addEventListener('click', () => {
        sidebarOverlay.classList.remove('sidebar-visible');
    });

    sidebarOverlay?.addEventListener('click', event => {
        if (event.target === sidebarOverlay) {
            sidebarOverlay.classList.remove('sidebar-visible');
        }
    });

    // =====================================
    // OBROLAN BARU
    // =====================================

    function newChat() {
        if (
            activeSession &&
            activeSession.messages.length === 0
        ) {
            conversationList.innerHTML = '';
            welcomeScreen.classList.remove('hidden');
            sidebarOverlay.classList.remove('sidebar-visible');
            input?.focus();
            return;
        }

        activeSession = createSession();
        activeSessionId = activeSession.id;

        sessions.unshift(activeSession);

        saveSessions();

        conversationList.innerHTML = '';
        welcomeScreen.classList.remove('hidden');

        sidebarOverlay.classList.remove('sidebar-visible');

        renderHistory();
        input?.focus();
    }

    newChatButton.addEventListener('click', newChat);

    // =====================================
    // RIWAYAT BERDASARKAN SESI
    // =====================================

    function renderHistory() {
        historyList.innerHTML = '';

        const sortedSessions = [...sessions].sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        sortedSessions.forEach(session => {
            // Jangan tampilkan sesi kosong yang belum pernah dipakai.
            if (session.messages.length === 0) return;

            const li = document.createElement('li');

            li.className = 'session-history-item';

            if (session.id === activeSessionId) {
                li.classList.add('active-session');
            }

            const title = document.createElement('div');
            title.className = 'session-history-title';
            title.textContent = session.title || 'Obrolan Baru';

            const preview = document.createElement('small');
            preview.className = 'session-history-preview';

            const lastMessage = session.messages[
                session.messages.length - 1
            ];

            preview.textContent = lastMessage?.content || '';

            li.append(title, preview);

            li.addEventListener('click', () => {
                openSession(session.id);
                sidebarOverlay.classList.remove('sidebar-visible');
            });

            historyList.appendChild(li);
        });
    }

    function openSession(id) {
        const session = sessions.find(
            item => item.id === id
        );

        if (!session) return;

        activeSession = session;
        activeSessionId = session.id;

        saveSessions();
        renderSession();
        renderHistory();
    }

    // =====================================
    // RENDER PESAN
    // =====================================

    function renderSession() {
        conversationList.innerHTML = '';

        if (!activeSession.messages.length) {
            welcomeScreen.classList.remove('hidden');
            return;
        }

        welcomeScreen.classList.add('hidden');

        activeSession.messages.forEach(message => {
            if (message.role === 'user') {
                renderUserMessage(message);
            } else {
                renderAssistantMessage(message);
            }
        });
    }

    function renderUserMessage(message) {
        const bubble = document.createElement('div');

        bubble.className = 'chat-bubble user-bubble';
        bubble.textContent = message.content;

        conversationList.appendChild(bubble);
    }

    function renderAssistantMessage(message) {
        const card = resultTemplate.cloneNode(true);

        card.removeAttribute('id');
        card.classList.remove('hidden');

        const userBubble = $('.user-bubble', card);

        // User bubble dibuat terpisah supaya tidak muncul dua kali.
        userBubble?.remove();

        const answer = $('#answer-text', card);
        const sources = $('#sources-list', card);
        const related = $('#similar-list', card);

        if (message.loading) {
            answer.innerHTML = `
                <span class="typing-indicator"
                      aria-label="SmartAI sedang mengetik">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            `;
        } else {
            answer.textContent = message.content || '';
        }

        renderSources(sources, message.sources || []);
        renderRelated(
            related,
            message.similarQuestions || []
        );

        const copyButton = $('.action-icons', card)?.children[0];

        copyButton?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(
                    message.content || ''
                );

                copyButton.textContent = 'check';

                setTimeout(() => {
                    copyButton.textContent = 'content_copy';
                }, 1000);
            } catch {
                alert('Gagal menyalin jawaban.');
            }
        });

        conversationList.appendChild(card);
    }

    // =====================================
    // SOURCES
    // =====================================

    function renderSources(element, items) {
        if (!element) return;

        element.innerHTML = '';

        const card = element.closest('.info-card');

        const validItems = Array.isArray(items)
            ? items.filter(item => {
                const url = typeof item === 'string'
                    ? item.trim()
                    : item?.url;

                return Boolean(url);
            })
            : [];

        if (!validItems.length) {
            card?.classList.add('hidden');
            return;
        }

        validItems.forEach(item => {
            const url = typeof item === 'string'
                ? item
                : item.url;

            const li = document.createElement('li');
            const a = document.createElement('a');

            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            try {
                a.textContent = new URL(url).hostname;
            } catch {
                a.textContent = url;
            }

            li.appendChild(a);
            element.appendChild(li);
        });

        card?.classList.remove('hidden');
    }

    // =====================================
    // RELATED
    // =====================================

    function renderRelated(element, items) {
        if (!element) return;

        element.innerHTML = '';

        const card = element.closest('.info-card');

        const validItems = Array.isArray(items)
            ? items.filter(item => {
                const text = typeof item === 'string'
                    ? item.trim()
                    : item?.question || item?.text;

                return Boolean(text);
            })
            : [];

        if (!validItems.length) {
            card?.classList.add('hidden');
            return;
        }

        validItems.forEach(item => {
            const question = typeof item === 'string'
                ? item
                : item.question || item.text;

            const li = document.createElement('li');

            li.textContent = question;

            li.addEventListener('click', () => {
                sendMessage(question);
            });

            element.appendChild(li);
        });

        card?.classList.remove('hidden');
    }

    // =====================================
    // KIRIM PESAN
    // =====================================

    form.addEventListener('submit', event => {
        event.preventDefault();

        const question = input.value.trim();

        if (question) {
            sendMessage(question);
        }
    });

    async function sendMessage(question) {
        welcomeScreen.classList.add('hidden');

        input.value = '';
        input.blur();

        // Judul sesi diambil dari pertanyaan pertama.
        if (activeSession.messages.length === 0) {
            activeSession.title = question.length > 45
                ? question.slice(0, 45) + '…'
                : question;
        }

        activeSession.messages.push({
            id: createId(),
            role: 'user',
            content: question
        });

        const assistantMessage = {
            id: createId(),
            role: 'assistant',
            content: '',
            sources: [],
            similarQuestions: [],
            loading: true
        };

        activeSession.messages.push(assistantMessage);

        touchSession();
        renderSession();

        // Pindah ke pesan paling baru.
        const chatArea = $('.chat-area');

        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        try {
            const response = await fetch(
                `/api?question=${encodeURIComponent(question)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Gagal mengambil jawaban.'
                );
            }

            assistantMessage.content =
                typeof data.answer === 'string'
                    ? data.answer
                    : JSON.stringify(data.answer ?? '');

            assistantMessage.sources =
                Array.isArray(data.sources)
                    ? data.sources
                    : [];

            assistantMessage.similarQuestions =
                Array.isArray(data.similarQuestions)
                    ? data.similarQuestions
                    : [];

        } catch (error) {
            console.error('SmartAI:', error);

            assistantMessage.content =
                'Maaf, ada kendala saat mengambil jawaban. ' +
                'Coba kirim pertanyaan sekali lagi, ya.';
        }

        assistantMessage.loading = false;

        touchSession();
        renderSession();

        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }

    // =====================================
    // HAPUS RIWAYAT
    // =====================================

    clearHistoryBtn?.addEventListener('click', () => {
        if (!confirm('Hapus semua riwayat obrolan?')) {
            return;
        }

        sessions = [];
        activeSession = createSession();
        activeSessionId = activeSession.id;

        sessions.push(activeSession);

        saveSessions();

        conversationList.innerHTML = '';
        welcomeScreen.classList.remove('hidden');

        renderHistory();

        sidebarOverlay.classList.remove('sidebar-visible');
    });

    // =====================================
    // MULAI APLIKASI
    // =====================================

    renderHistory();
    renderSession();

})();
