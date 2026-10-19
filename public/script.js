
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

    // =====================================
    // TEMPLATE DAN AREA CHAT
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

    // Tombol obrolan baru di sidebar
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
    const historyContainer = historyList?.closest(
        '.history-list-container'
    );

    if (sidebarContent && historyContainer) {
        sidebarContent.insertBefore(
            newChatButton,
            historyContainer
        );
    }

    // =====================================
    // STORAGE
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

    // Migrasi data chat dari versi sebelumnya
    if (sessions.length === 0) {
        const oldChats = readJSON(
            'smartAIConversations',
            []
        );

        if (Array.isArray(oldChats)) {
            oldChats.forEach(chat => {
                if (!chat.question) return;

                sessions.push({
                    id: chat.id || createId(),
                    title: chat.question.slice(0, 45),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    messages: [
                        {
                            id: createId(),
                            role: 'user',
                            content: chat.question
                        },
                        {
                            id: createId(),
                            role: 'assistant',
                            content: chat.answer || '',
                            sources: chat.sources || [],
                            similarQuestions:
                                chat.similarQuestions || []
                        }
                    ]
                });
            });
        }

        if (sessions.length === 0) {
            const oldHistory = readJSON('turboHistory', []);

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
    }

    let activeSessionId = localStorage.getItem(
        STORAGE_ACTIVE
    );

    let activeSession = sessions.find(
        session => session.id === activeSessionId
    );

    if (!activeSession && sessions.length) {
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
                activeSessionId
            );
        } catch (error) {
            console.error('Gagal menyimpan chat:', error);
        }
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
    // HISTORY PER SESI
    // =====================================

    function renderHistory() {
        historyList.innerHTML = '';

        [...sessions]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .forEach(session => {
                if (!session.messages.length) return;

                const li = document.createElement('li');
                li.className = 'session-history-item';

                if (session.id === activeSessionId) {
                    li.classList.add('active-session');
                }

                const title = document.createElement('div');
                title.className = 'session-history-title';
                title.textContent =
                    session.title || 'Obrolan Baru';

                const preview = document.createElement('small');
                preview.className = 'session-history-preview';

                const lastMessage = [...session.messages]
                    .reverse()
                    .find(message => message.role === 'user');

                preview.textContent = lastMessage?.content || '';

                li.append(title, preview);

                li.addEventListener('click', () => {
                    openSession(session.id);
                    sidebarOverlay.classList.remove(
                        'sidebar-visible'
                    );
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

        // Hilangkan bubble user dari template karena
        // pertanyaan sudah dirender sebagai pesan tersendiri.
        $('.user-bubble', card)?.remove();

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

        if (copyButton) {
            copyButton.addEventListener('click', async () => {
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
        }

        conversationList.appendChild(card);
    }

    // =====================================
    // SOURCES
    // =====================================

    function renderSources(element, items) {
        if (!element) return;

        element.innerHTML = '';

        const infoCard = element.closest('.info-card');

        const validItems = Array.isArray(items)
            ? items.filter(item => {
                const url = typeof item === 'string'
                    ? item.trim()
                    : item?.url;

                return Boolean(url);
            })
            : [];

        if (!validItems.length) {
            infoCard?.classList.add('hidden');
            return;
        }

        validItems.forEach(item => {
            const url = typeof item === 'string'
                ? item
                : item.url;

            const li = document.createElement('li');
            const link = document.createElement('a');

            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            try {
                link.textContent = new URL(url).hostname;
            } catch {
                link.textContent = url;
            }

            li.appendChild(link);
            element.appendChild(li);
        });

        infoCard?.classList.remove('hidden');
    }

    // =====================================
    // RELATED QUESTIONS
    // =====================================

    function renderRelated(element, items) {
        if (!element) return;

        element.innerHTML = '';

        const infoCard = element.closest('.info-card');

        const validItems = Array.isArray(items)
            ? items.filter(item => {
                const text = typeof item === 'string'
                    ? item.trim()
                    : item?.question || item?.text;

                return Boolean(text);
            })
            : [];

        if (!validItems.length) {
            infoCard?.classList.add('hidden');
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

        infoCard?.classList.remove('hidden');
    }

    // =====================================
    // KIRIM PERTANYAAN
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

        activeSession.updatedAt = Date.now();

        saveSessions();
        renderHistory();
        renderSession();

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

        activeSession.updatedAt = Date.now();

        saveSessions();
        renderHistory();
        renderSession();

        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }

    // =====================================
    // HAPUS SEMUA HISTORY
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

    saveSessions();
    renderHistory();
    renderSession();

})();
