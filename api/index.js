// api/index.js
const axios = require('axios');

async function turboseekLogic(question) {
    const inst = axios.create({
        baseURL: 'https://www.turboseek.io/api',
        timeout: 8000,
        headers: {
            origin: 'https://www.turboseek.io',
            referer: 'https://www.turboseek.io/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
        }
    });

    let sources = [];
    let similarQuestions = [];
    let cleanAnswer = '';

    // 1. Get Sources dari TurboSeek
    try {
        const resSources = await inst.post('/getSources', { question });
        if (Array.isArray(resSources.data)) {
            sources = resSources.data;
        }
    } catch (e) {
        console.error('Gagal mengambil sources:', e.message);
    }

    // 2. Get Similar Questions dari TurboSeek
    try {
        const resSimilar = await inst.post('/getSimilarQuestions', { question, sources });
        if (Array.isArray(resSimilar.data)) {
            similarQuestions = resSimilar.data;
        }
    } catch (e) {
        console.error('Gagal mengambil similar questions:', e.message);
    }

    // 3. Get Answer dari TurboSeek
    try {
        const { data: answer } = await inst.post('/getAnswer', { question, sources });
        if (typeof answer === 'string' && answer.trim() !== '') {
            cleanAnswer = answer.match(/(.*?)<\/p>/gs)?.map(match => {
                return match.replace(/<\/?[^>]+(>|$)/g, '').trim();
            }).join('\n\n') || answer.replace(/<\/?[^>]+(>|$)/g, '').trim();
        }
    } catch (e) {
        console.error('Gagal mengambil answer dari TurboSeek:', e.message);
    }

    // 4. FALLBACK AI: Jika jawaban TurboSeek kosong, gunakan AI cadangan otomatis
    if (!cleanAnswer) {
        try {
            const sourceUrls = sources.map(s => s.url).slice(0, 3).join(', ');
            const systemPrompt = 'Kamu adalah SmartAI, asisten AI yang cerdas, sopan, dan membantu. Jawab pertanyaan pengguna dengan jelas dan rapi menggunakan bahasa yang sama dengan pengguna.';
            const userPrompt = sourceUrls 
                ? `Pertanyaan: ${question}\n(Referensi terkait: ${sourceUrls})` 
                : question;

            const fallbackRes = await axios.post('https://text.pollinations.ai/', {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'openai'
            }, { timeout: 15000 });

            cleanAnswer = typeof fallbackRes.data === 'string' 
                ? fallbackRes.data.trim() 
                : JSON.stringify(fallbackRes.data);
        } catch (fallbackErr) {
            cleanAnswer = 'Maaf, server AI sedang sibuk saat ini. Silakan coba beberapa saat lagi.';
        }
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
