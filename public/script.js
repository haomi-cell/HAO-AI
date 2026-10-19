
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
    const chatArea = $('.chat-area');

    const STORAGE_SESSIONS = 'smartAIChatSessions';
    const STORAGE_ACTIVE = 'smartAIActiveSession';

    let isSending = false;

    // =========================================
    // SIAPKAN AREA PERCAKAPAN
    // =========================================

    resultTemplate.classList.add('hidden');

    let conversationList = $('#conversation-list');

    if (!conversationList) {
        conversationList = document.createElement('div');
        conversationList.id = 'conversation-list';

        resultTemplate.parentNode.insertBefore(
            conversationList,
            resultTemplate
        );
    }

    // =========================================
    // TOMBOL OBROLAN BARU
    // =========================================

    let newChatButton = $('#new-chat-button');

    if (!newChatButton) {
        newChatButton = document.createElement('button');
        newChatButton.type = 'button';
        newChatButton.id = 'new-chat-button';

        newChatButton.innerHTML = `
            <span class="material-icons-round">add</span>
            <span>Obrolan Baru</span>
        `;

        const historyContainer = historyList?.closest(
            '.history-list-container'
        );

        if (historyContainer) {
            historyContainer.parentNode.insertBefore(
                newChatButton,
                historyContainer
            );
        }
    }

    // =========================================
    // STORAGE DAN SESSION
    // =========================================

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
        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 9)
        );
    }

    function createSession() {
        return {
            id: createId(),
            title: 'Obrolan Baru',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
    }

    let sessions = readJSON(STORAGE_SESSIONS, []);

    if (!Array.isArray(sessions)) {
        sessions = [];
    }

    // Migrasi riwayat lama jika tersedia.
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
    }

    let activeSessionId = localStorage.getItem(
        STORAGE_ACTIVE
    );

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
                activeSessionId
            );
        } catch (error) {
            console.error('Gagal menyimpan riwayat:', error);
        }
    }

    function updateSession() {
        activeSession.updatedAt = Date.now();

        sessions.sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        saveSessions();
        renderHistory();
    }

    // =========================================
    // NAVIGASI
    // =========================================

    enterAppBtn?.addEventListener('click', () => {
        landingPage.style.display = 'none';
        mainApp.classList.remove('hidden-section');
        input?.focus();
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

    // =========================================
    // FITUR OBROLAN BARU
    // =========================================

    function newChat() {
        if (isSending) {
            alert('Tunggu jawaban selesai sebelum membuat obrolan baru.');
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

    // =========================================
    // HISTORY PER OBROLAN
    // =========================================

    function renderHistory() {
        if (!historyList) return;

        historyList.innerHTML = '';

        [...sessions]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .forEach(session => {
                if (!session.messages?.length) return;

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

                const lastUserMessage = [...session.messages]
                    .reverse()
                    .find(message => message.role === 'user');

                preview.textContent =
                    lastUserMessage?.content || '';

                li.append(title, preview);

                li.addEventListener('click', () => {
                    if (isSending) {
                        alert(
                            'Tunggu jawaban selesai sebelum berpindah obrolan.'
                        );
                        return;
                    }

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
        activeSessionId = id;

        saveSessions();
        renderSession();
        renderHistory();
    }

    // =========================================
    // RENDER PESAN PENGGUNA
    // =========================================

    function renderUserMessage(message) {
        const bubble = document.createElement('div');

        bubble.className = 'chat-bubble user-bubble';
        bubble.textContent = message.content;

        conversationList.appendChild(bubble);
    }

    // =========================================
    // RENDER JAWABAN AI
    // =========================================

    function renderAssistantMessage(message) {
        const card = resultTemplate.cloneNode(true);

        card.removeAttribute('id');
        card.classList.remove('hidden');

        $('.user-bubble', card)?.remove();

        const answer = $('#answer-text', card);
        const sources = $('#sources-list', card);
        const related = $('#similar-list', card);
        const infoCards = card.querySelectorAll('.info-card');

        // Hilangkan sources/related kosong sebelum ditampilkan.
        infoCards.forEach(infoCard => {
            infoCard.classList.add('hidden');
        });

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

        // Tombol salin, suka, dan tidak suka.
        const actionButtons = $$('.action-icons span', card);

        const copyButton = actionButtons[0];
        const likeButton = actionButtons[1];
        const dislikeButton = actionButtons[2];

        copyButton?.addEventListener('click', async () => {
            const text = message.content || '';

            if (!text || message.loading) return;

            try {
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const textarea = document.createElement('textarea');

                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';

                    document.body.appendChild(textarea);
                    textarea.select();

                    const copied = document.execCommand('copy');

                    textarea.remove();

                    if (!copied) {
                        throw new Error('Gagal menyalin.');
                    }
                }

                copyButton.textContent = 'check';

                setTimeout(() => {
                    copyButton.textContent = 'content_copy';
                }, 1200);
            } catch (error) {
                console.error(error);
                alert('Tidak bisa menyalin jawaban. Coba lagi.');
            }
        });

        function giveFeedback(button, positive) {
            if (message.loading) return;

            const feedback = positive ? 'like' : 'dislike';

            message.feedback =
                message.feedback === feedback ? null : feedback;

            saveSessions();

            [likeButton, dislikeButton].forEach(item => {
                if (!item) return;

                item.style.color = '#aaa';
                item.style.transform = 'scale(1)';
                item.title = '';
            });

            if (message.feedback) {
                button.style.color = '#52685a';
                button.style.transform = 'scale(1.12)';
                button.title = 'Feedback tersimpan';
            }
        }

        likeButton?.addEventListener('click', () => {
            giveFeedback(likeButton, true);
        });

        dislikeButton?.addEventListener('click', () => {
            giveFeedback(dislikeButton, false);
        });

        // Pulihkan tampilan feedback ketika chat dibuka kembali.
        if (message.feedback === 'like' && likeButton) {
            likeButton.style.color = '#52685a';
            likeButton.title = 'Feedback tersimpan';
        }

        if (message.feedback === 'dislike' && dislikeButton) {
            dislikeButton.style.color = '#52685a';
            dislikeButton.title = 'Feedback tersimpan';
        }

        conversationList.appendChild(card);
    }

    function $$(selector, root = document) {
        return Array.from(root.querySelectorAll(selector));
    }

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

    // =========================================
    // SOURCES
    // =========================================

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

    // =========================================
    // RELATED QUESTIONS
    // =========================================

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

    // =========================================
    // KIRIM PERTANYAAN
    // =========================================

    form.addEventListener('submit', event => {
        event.preventDefault();

        const question = input.value.trim();

        if (question && !isSending) {
            sendMessage(question);
        }
    });

    async function sendMessage(question) {
        if (isSending) return;

        isSending = true;

        const submitButton = $('#submit-btn');
        if (submitButton) submitButton.disabled = true;

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

        updateSession();
        renderSession();
        scrollToBottom();

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
            console.error('SmartAI API:', error);

            assistantMessage.content =
                'Maaf, ada kendala saat mengambil jawaban. ' +
                'Silakan coba lagi sebentar, ya.';
        } finally {
            assistantMessage.loading = false;
            isSending = false;

            if (submitButton) submitButton.disabled = false;

            updateSession();
            renderSession();
            scrollToBottom();
        }
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            if (chatArea) {
                chatArea.scrollTo({
                    top: chatArea.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    }

    // =========================================
    // AKTIFKAN QUICK ACTIONS
    // =========================================

    const quickActionPrompts = {
        'Job Finder UX':
            'Bantu saya merancang UX aplikasi pencarian kerja yang modern. Jelaskan fitur utama, alur pengguna, dan contoh tampilannya.',

        'Marketing Strategy':
            'Bantu saya menyusun strategi pemasaran yang efektif. Jelaskan target pasar, positioning, kanal pemasaran, dan cara mengukur hasilnya.'
    };

    $$('.action-pill').forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.setAttribute('role', 'button');
        pill.setAttribute('tabindex', '0');

        function activate() {
            const label = pill.innerText.trim();
            const prompt = quickActionPrompts[label];

            if (prompt) {
                sendMessage(prompt);
            } else {
                input.value = label;
                input.focus();
            }
        }

        pill.addEventListener('click', activate);

        pill.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activate();
            }
        });
    });

    // =========================================
    // AKTIFKAN KARTU BUSINESS DAN CODING
    // =========================================

    const explorePrompts = {
        Business:
            'Bantu saya menganalisis sebuah bisnis. Jelaskan target pasar, pesaing, peluang, risiko, dan strategi pengembangannya.',

        Coding:
            'Bantu saya membuat program. Tanyakan kebutuhan saya jika bahasa pemrograman, tujuan, atau fitur yang diperlukan belum jelas.'
    };

    $$('.explore-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        function activate() {
            const heading = $('h3', card)?.textContent.trim();
            const prompt = explorePrompts[heading];

            if (prompt) {
                sendMessage(prompt);
            }
        }

        card.addEventListener('click', activate);

        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activate();
            }
        });
    });

    // =========================================
    // CLEAR HISTORY
    // =========================================

    clearHistoryBtn?.addEventListener('click', () => {
        if (!confirm('Hapus semua riwayat obrolan?')) {
            return;
        }

        if (isSending) {
            alert('Tunggu jawaban selesai sebelum menghapus riwayat.');
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

    // =========================================
    // MULAI APLIKASI
    // =========================================

    saveSessions();
    renderHistory();
    renderSession();

})();
