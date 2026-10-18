const axios = require('axios');

async function turboseekLogic(question) {
    const inst = axios.create({
        baseURL: 'https://www.turboseek.io/api',
        timeout: 25000,
        headers: {
            origin: 'https://www.turboseek.io',
            referer: 'https://www.turboseek.io/',
            'user-agent': 'Mozilla/5.0'
        }
    });

    // 1. Ambil sumber
    const { data: sourcesData } = await inst.post('/getSources', {
        question
    });

    const sources = Array.isArray(sourcesData)
        ? sourcesData
        : [];

    // 2. Ambil pertanyaan terkait
    const { data: similarData } = await inst.post(
        '/getSimilarQuestions',
        {
            question,
            sources
        }
    );

    // 3. Ambil jawaban asli
    const { data: answerData } = await inst.post('/getAnswer', {
        question,
        sources
    });

    // Catat respons asli agar bisa diperiksa di Vercel Logs
    console.log(
        'TURBOSEEK ANSWER:',
        JSON.stringify(answerData)
    );

    // 4. Baca kemungkinan format respons
    let answer = '';

    if (typeof answerData === 'string') {
        answer = answerData;
    } else if (answerData && typeof answerData === 'object') {
        answer =
            answerData.answer ??
            answerData.data?.answer ??
            answerData.text ??
            answerData.content ??
            answerData.result ??
            '';
    }

    if (typeof answer !== 'string') {
        answer = '';
    }

    // 5. Bersihkan HTML jawaban
    const cleanAnswer = answer
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .trim();

    // 6. Kembalikan hasil ke website
    return {
        answer: cleanAnswer,
        sources: sources
            .map(item => item?.url)
            .filter(Boolean),
        similarQuestions: Array.isArray(similarData)
            ? similarData
            : []
    };
}

// Handler Vercel
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const question =
        req.query?.question ||
        req.body?.question;

    if (typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
            error: 'Pertanyaan tidak boleh kosong.'
        });
    }

    try {
        const result = await turboseekLogic(question.trim());

        if (!result.answer) {
            return res.status(502).json({
                error: 'TurboSeek returned an empty answer.',
                sources: result.sources
            });
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error(
            'TurboSeek API error:',
            error.response?.status,
            error.response?.data || error.message
        );

        return res.status(502).json({
            error: 'Gagal mendapatkan jawaban dari TurboSeek.',
            detail: error.response?.data || error.message
        });
    }
};