// api/index.js
const axios = require('axios');

// Deteksi jika pengguna bertanya langsung tentang pembuat / pencipta AI
function isAskingCreator(text) {
    const q = text.toLowerCase().trim();
    const patterns = [
        /siapa.*(buat|bikin|cipta|kembang|develop|rancang|bangun|pemilik|owner)/i,
        /(pembuat|pencipta|pengembang|developer|owner|pemilik).*(kamu|mu|anda|ai\s*ini|smart\s*ai|siapa)/i,
        /(buatan|ciptaan|bikinan|karya)\s+siapa/i,
        /yang\s+(buat|bikin|menciptakan|mengembangkan)\s+(kamu|anda|ai\s*ini|smart\s*ai)/i,
        /who\s+(made|created|built|developed|owns)\s+you/i,
        /who\s+is\s+your\s+(creator|developer|maker|owner)/i
    ];
    return patterns.some(regex => regex.test(q));
}

// Fungsi pembersih teks agar rapi di layar
function formatCleanText(text) {
    if (!text) return '';
    return String(text)
        .replace(/\*\*(.*?)\*\*/g, '$1') // Hapus bintang bold mentah
        .replace(/###\s*/g, '')          // Hapus pagar heading mentah
        .replace(/##\s*/g, '')
        .trim();
}

// Fungsi pemanggil AI dengan 3 jalur cadangan otomatis
async function generateAIResponse(question, sourceUrls) {
    const systemPrompt = 'Kamu adalah SmartAI, asisten AI yang sangat pintar, ramah, dan luwes. Kamu dibuat dan dikembangkan oleh Mas Haomi_Xml. Jika ditanya siapa pembuat atau penciptamu, jawab dengan bangga bahwa kamu dibuat oleh Mas Haomi_Xml. Jawablah setiap pertanyaan (termasuk bantuan coding, tugas, atau obrolan santai) secara jelas, terstruktur dengan baris baru yang rapi, dan gunakan bahasa Indonesia yang natural.';
    
    const userPrompt = sourceUrls
        ? `${question}\n\n(Konteks referensi web jika relevan: ${sourceUrls})`
        : question;

    const seed = Math.floor(Math.random() * 100000);

    // JALUR 1: Endpoint OpenAI Compatible Pollinations
    try {
        const res1 = await axios.post('https://text.pollinations.ai/openai', {
            model: 'openai',
            seed: seed,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        }, { timeout: 10000 });

        const content1 = res1.data?.choices?.[0]?.message?.content || (typeof res1.data === 'string' ? res1.data : '');
        if (content1 && content1.trim()) {
            return formatCleanText(content1);
        }
    } catch (e1) {
        console.warn('Jalur AI 1 sibuk, beralih ke Jalur 2...');
    }

    // JALUR 2: Endpoint Direct GET Pollinations (Sangat Stabil & Bebas Limit)
    try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(question)}?system=${encodeURIComponent(systemPrompt)}&seed=${seed}`;
        const res2 = await axios.get(url, { timeout: 10000 });
        if (res2.data && typeof res2.data === 'string' && res2.data.trim()) {
            return formatCleanText(res2.data);
        }
    } catch (e2) {
        console.warn('Jalur AI 2 sibuk, beralih ke Jalur 3...');
    }

    // JALUR 3: Model Alternatif (Mistral)
    try {
        const url3 = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=mistral&system=${encodeURIComponent(systemPrompt)}&seed=${seed}`;
        const res3 = await axios.get(url3, { timeout: 10000 });
        if (res3.data && typeof res3.data === 'string' && res3.data.trim()) {
            return formatCleanText(res3.data);
        }
    } catch (e3) {
        console.error('Semua jalur AI gagal:', e3.message);
    }

    return 'Halo! Saya SmartAI buatan Mas Haomi_Xml. Saat ini jaringan sedang padat, silakan kirim ulang pertanyaan Anda.';
}

async function turboseekLogic(question) {
    // Jika bertanya tentang pembuat AI, langsung jawab instan
    if (isAskingCreator(question)) {
        return {
            answer: 'Halo! Saya adalah SmartAI, asisten kecerdasan buatan yang dibuat dan dikembangkan oleh Mas Haomi_Xml.\n\nSaya siap membantu Anda dalam coding, mencari informasi, menganalisis bisnis, maupun menjawab berbagai pertanyaan lainnya. Ada yang ingin kita kerjakan hari ini?',
            sources: ['https://hao-ai-kappa.vercel.app'],
            similarQuestions: [
                'Bisa bantu buatkan kode HTML dan CSS?',
                'Apa saja yang bisa dilakukan SmartAI?',
                'Berikan tips belajar pemrograman untuk pemula'
            ]
        };
    }

    const inst = axios.create({
        baseURL: 'https://www.turboseek.io/api',
        timeout: 4500,
        headers: {
            origin: 'https://www.turboseek.io',
            referer: 'https://www.turboseek.io/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    });

    let sources = [];
    let similarQuestions = [];

    // Ambil Sources terlebih dahulu dengan batas waktu singkat
    try {
        const resSources = await inst.post('/getSources', { question });
        if (Array.isArray(resSources.data)) {
            sources = resSources.data;
        }
    } catch (e) {
        console.warn('Skip sources:', e.message);
    }

    const sourceUrls = sources.map(s => s.url).filter(Boolean).slice(0, 3).join(', ');

    // Jalankan pembuatan jawaban AI & pertanyaan terkait secara BERSAMAAN (Paralel) agar cepat
    const [aiAnswerResult, similarResult] = await Promise.allSettled([
        generateAIResponse(question, sourceUrls),
        inst.post('/getSimilarQuestions', { question, sources })
    ]);

    const cleanAnswer = aiAnswerResult.status === 'fulfilled' 
        ? aiAnswerResult.value 
        : 'Maaf, terjadi kendala koneksi. Silakan coba lagi.';

    if (similarResult.status === 'fulfilled' && Array.isArray(similarResult.value?.data)) {
        similarQuestions = similarResult.value.data;
    }

    return {
        answer: cleanAnswer,
        sources: sources.map(s => s.url).filter(Boolean),
        similarQuestions
    };
}

// Vercel Serverless Handler
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const question = (req.query && req.query.question) || (req.body && req.body.question);

    if (!question) {
        return res.status(400).json({ error: 'Please provide a question' });
    }

    try {
        const result = await turboseekLogic(question);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
