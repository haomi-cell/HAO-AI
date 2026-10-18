
const axios = require('axios');

const api = axios.create({
    baseURL: 'https://www.turboseek.io/api',
    timeout: 45000,
    headers: {
        origin: 'https://www.turboseek.io',
        referer: 'https://www.turboseek.io/',
        'user-agent':
            'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json'
    }
});

function extractText(value, depth = 0) {
    if (depth > 5 || value == null) return '';

    if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return '';

        // If the provider returns JSON encoded as a string, parse it.
        if (
            (text.startsWith('{') && text.endsWith('}')) ||
            (text.startsWith('[') && text.endsWith(']'))
        ) {
            try {
                const parsed = extractText(JSON.parse(text), depth + 1);
                if (parsed) return parsed;
            } catch (_) {}
        }

        return text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;|&apos;/gi, "'")
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    if (Array.isArray(value)) {
        return value
            .map(item => extractText(item, depth + 1))
            .filter(Boolean)
            .join('\n\n');
    }

    if (typeof value === 'object') {
        for (const key of [
            'answer', 'content', 'text',
            'response', 'result', 'message', 'html'
        ]) {
            if (value[key] != null) {
                const result = extractText(value[key], depth + 1);
                if (result) return result;
            }
        }
    }

    return '';
}

function normalizeSources(data) {
    const items = Array.isArray(data)
        ? data
        : data?.sources || data?.results || data?.data || [];

    if (!Array.isArray(items)) return [];

    return items.map(item => {
        const url = typeof item === 'string'
            ? item
            : item?.url || item?.link;

        if (typeof url !== 'string') return null;

        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return null;
            }
            return parsed.href;
        } catch (_) {
            return null;
        }
    }).filter(Boolean);
}

async function turboseekLogic(question) {
    const q = typeof question === 'string' ? question.trim() : '';

    if (!q) {
        const error = new Error('Pertanyaan tidak boleh kosong.');
        error.statusCode = 400;
        throw error;
    }

    const sourceResponse = await api.post('/getSources', {
        question: q
    });

    const rawSources = sourceResponse.data;

    if (!rawSources ||
        (Array.isArray(rawSources) && rawSources.length === 0)) {
        throw new Error('TurboSeek tidak mengembalikan sumber.');
    }

    let similarQuestions = [];

    try {
        const similarResponse = await api.post('/getSimilarQuestions', {
            question: q,
            sources: rawSources
        });

        const similar = similarResponse.data;
        const items = Array.isArray(similar)
            ? similar
            : similar?.questions || similar?.results || [];

        if (Array.isArray(items)) {
            similarQuestions = items.map(item =>
                typeof item === 'string' ? item : item?.question
            ).filter(item => typeof item === 'string' && item.trim());
        }
    } catch (error) {
        console.error(
            '[TurboSeek] Similar questions failed:',
            error.response?.status || error.code || error.message
        );
    }

    const answerResponse = await api.post('/getAnswer', {
        question: q,
        sources: rawSources
    });

    const answer = extractText(answerResponse.data);

    if (!answer) {
        // Log only response structure, not question or credentials.
        const payload = answerResponse.data;

        console.error('[TurboSeek] Empty answer', {
            status: answerResponse.status,
            contentType: answerResponse.headers?.['content-type'],
            responseType: typeof payload,
            responseKeys: payload && typeof payload === 'object'
                ? Object.keys(payload)
                : [],
            responseLength: typeof payload === 'string'
                ? payload.length
                : undefined
        });

        const error = new Error(
            'TurboSeek mengembalikan jawaban kosong. Periksa log provider.'
        );
        error.statusCode = 502;
        throw error;
    }

    return {
        answer,
        sources: normalizeSources(rawSources),
        similarQuestions
    };
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (!['GET', 'POST'].includes(req.method)) {
        res.setHeader('Allow', 'GET, POST, OPTIONS');
        return res.status(405).json({
            error: 'Method tidak didukung.'
        });
    }

    const question = typeof req.query?.question === 'string'
        ? req.query.question
        : typeof req.body?.question === 'string'
            ? req.body.question
            : '';

    if (!question.trim()) {
        return res.status(400).json({
            error: 'Silakan masukkan pertanyaan.'
        });
    }

    try {
        const result = await turboseekLogic(question);
        return res.status(200).json(result);
    } catch (error) {
        const status = error.statusCode ||
            (error.code === 'ECONNABORTED' ? 504 : 502);

        console.error('[SmartAI API]', {
            status,
            message: error.message,
            providerStatus: error.response?.status,
            providerCode: error.code
        });

        return res.status(status).json({
            error: status === 504
                ? 'TurboSeek terlalu lama merespons. Coba lagi.'
                : error.message || 'Gagal mendapatkan jawaban AI.'
        });
    }
};
