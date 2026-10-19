
(() => {
    'use strict';

    // ==========================================
    // SMART-AI CHAT ENGINE
    // Desain HTML dan CSS tetap dipertahankan
    // ==========================================

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

    const STORAGE_CHAT = 'smartAIConversations';
    const STORAGE_HISTORY = 'turboHistory';

    // Template asli tidak dihapus dari DOM.
    resultTemplate.classList.add('hidden');

    // Wadah seluruh percakapan
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

    // ==========================================
    // STORAGE
    // ==========================================

    function readStorage(key, fallback) {
        try {
            const value = JSON.parse(
                localStorage.getItem(key) || 'null'
            );

            return value ?? fallback;
        } catch {
            return fallback;
        }
    }

    let conversations = readStorage(STORAGE_CHAT, []);
    let searchHistory = readStorage(STORAGE_HISTORY, []);

    if (!Array.isArray(conversations)) conversations = [];
    if (!Array.isArray(searchHistory)) searchHistory = [];

    function saveConversations() {
        try {
            localStorage.setItem(
                STORAGE_CHAT,
                JSON.stringify(conversations)
            );
        } catch (error) {
            console.error('Gagal menyimpan percakapan:', error);
        }
    }

    function saveHistory() {
        try {
            localStorage.setItem(
                STORAGE_HISTORY,
                JSON.stringify(searchHistory)
            );
        } catch (error) {
            console.error('Gagal menyimpan riwayat:', error);
        }
    }

    // ==========================================
    // NAVIGASI
    // ==========================================

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

    // ==========================================
    // RIWAYAT SIDEBAR
    // ==========================================

    function addToHistory(question) {
        searchHistory = searchHistory.filter(
            item => item !== question
        );

        searchHistory.unshift(question);
        searchHistory = searchHistory.slice(0, 50);

        saveHistory();
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';

        searchHistory.forEach(question => {
            const li = document.createElement('li');
            li.textContent = question;
            li.style.cursor = 'pointer';

            li.addEventListener('click', () => {
                const existing = conversations.find(
                    chat => chat.question === question
                );

                if (existing) {
                    showConversation(existing.id);
                } else {
                    performSearch(question);
                }

                sidebarOverlay.classList.remove('sidebar-visible');
            });

            historyList.appendChild(li);
        });
    }

    clearHistoryBtn?.addEventListener('click', () => {
        if (!confirm('Hapus semua riwayat dan percakapan?')) {
            return;
        }

        searchHistory = [];
        conversations = [];

        localStorage.removeItem(STORAGE_HISTORY);
        localStorage.removeItem(STORAGE_CHAT);

        conversationList.innerHTML = '';
        welcomeScreen.classList.remove('hidden');

        renderHistory();
    });

    // ==========================================
    // SOURCES
    // ==========================================

    function renderSources(element, sources) {
        element.innerHTML = '';

        const validSources = Array.isArray(sources)
            ? sources.filter(source => {
                const url = typeof source === 'string'
                    ? source.trim()
                    : source?.url;

                return Boolean(url);
            })
            : [];

        const infoCard = element.closest('.info-card');

        // Sembunyikan Sources jika kosong
        if (validSources.length === 0) {
            infoCard?.classList.add('hidden');
            return;
        }

        validSources.forEach(source => {
            const url = typeof source === 'string'
                ? source
                : source.url;

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

    // ==========================================
    // RELATED QUESTIONS
    // ==========================================

    function renderRelated(element, questions) {
        element.innerHTML = '';

        const validQuestions = Array.isArray(questions)
            ? questions.filter(item => {
                const question = typeof item === 'string'
                    ? item.trim()
                    : item?.question || item?.text;

                return Boolean(question);
            })
            : [];

        const infoCard = element.closest('.info-card');

        // Sembunyikan Related jika kosong
        if (validQuestions.length === 0) {
            infoCard?.classList.add('hidden');
            return;
        }

        validQuestions.forEach(item => {
            const question = typeof item === 'string'
                ? item
                : item.question || item.text;

            const li = document.createElement('li');
            li.textContent = question;
            li.style.cursor = 'pointer';

            li.addEventListener('click', () => {
                performSearch(question);
            });

            element.appendChild(li);
        });

        infoCard?.classList.remove('hidden');
    }

    // ==========================================
    // MEMBUAT KARTU PERCAKAPAN
    // ==========================================

    function createCard(chat) {
        const card = resultTemplate.cloneNode(true);

        card.removeAttribute('id');
        card.classList.remove('hidden');

        const questionElement = $('#user-query-display', card);
        const answerElement = $('#answer-text', card);
        const sourcesElement = $('#sources-list', card);
        const relatedElement = $('#similar-list', card);

        questionElement.textContent = chat.question;
        answerElement.textContent = chat.answer || '';

        // Sources dan Related diperiksa secara terpisah
        renderSources(sourcesElement, chat.sources || []);
        renderRelated(
            relatedElement,
            chat.similarQuestions || []
        );

        // Loader khusus setiap kartu
        if (chat.loading) {
            const loader = document.createElement('div');
            loader.className = 'chat-loading';

            const pulse = document.createElement('div');
            pulse.className = 'loader-pulse';

            const text = document.createElement('p');
            text.textContent = 'Generating response...';

            loader.append(pulse, text);
            card.insertBefore(loader, card.firstChild);
        }

        // Tombol salin jawaban
        const copyButton = $('.action-icons', card)?.children[0];

        if (copyButton) {
            copyButton.style.cursor = 'pointer';
            copyButton.title = 'Salin jawaban';

            copyButton.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(
                        answerElement.textContent
                    );

                    copyButton.textContent = 'check';

                    setTimeout(() => {
                        copyButton.textContent = 'content_copy';
                    }, 1200);
                } catch {
                    alert('Tidak dapat menyalin jawaban.');
                }
            });
        }

        conversationList.appendChild(card);

        return card;
    }

    // ==========================================
    // KIRIM PERTANYAAN
    // ==========================================

    form.addEventListener('submit', event => {
        event.preventDefault();

        const question = input.value.trim();

        if (question) {
            performSearch(question);
        }
    });

    async function performSearch(question) {
        welcomeScreen.classList.add('hidden');

        input.value = '';
        input.blur();

        addToHistory(question);

        const chat = {
            id: Date.now().toString() + '-' +
                Math.random().toString(36).slice(2, 8),
            question,
            answer: '',
            sources: [],
            similarQuestions: [],
            loading: true
        };

        conversations.push(chat);
        saveConversations();

        const card = createCard(chat);

        card.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        try {
            const response = await fetch(
                `/api?question=${encodeURIComponent(question)}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Gagal mendapatkan jawaban.'
                );
            }

            chat.answer = typeof data.answer === 'string'
                ? data.answer
                : JSON.stringify(data.answer ?? '');

            chat.sources = Array.isArray(data.sources)
                ? data.sources
                : [];

            chat.similarQuestions =
                Array.isArray(data.similarQuestions)
                    ? data.similarQuestions
                    : [];

            chat.loading = false;

            saveConversations();

            card.remove();
            createCard(chat);

        } catch (error) {
            console.error('Smart-AI:', error);

            chat.loading = false;
            chat.answer =
                'Maaf, terjadi kendala saat mengambil jawaban. ' +
                'Silakan coba lagi.';

            saveConversations();

            card.remove();
            createCard(chat);
        }
    }

    // ==========================================
    // BUKA PERCAKAPAN TERSIMPAN
    // ==========================================

    function showConversation(id) {
        const chat = conversations.find(
            item => item.id === id
        );

        if (!chat) return;

        conversationList.innerHTML = '';
        createCard(chat);

        welcomeScreen.classList.add('hidden');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // ==========================================
    // PULIHKAN CHAT SETELAH REFRESH
    // ==========================================

    function restoreConversations() {
        conversationList.innerHTML = '';

        conversations.forEach(chat => {
            if (chat.loading) {
                chat.loading = false;

                if (!chat.answer) {
                    chat.answer =
                        'Permintaan sebelumnya terhenti. ' +
                        'Silakan ajukan pertanyaan kembali.';
                }
            }

            createCard(chat);
        });

        if (conversations.length > 0) {
            welcomeScreen.classList.add('hidden');
        }

        saveConversations();
    }

    // ==========================================
    // INISIALISASI
    // ==========================================

    renderHistory();
    restoreConversations();
})();
