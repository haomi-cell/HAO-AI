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

    const { data: sourcesData } = await inst.post('/getSources', {
        question
    });

    const sources = Array.isArray(sourcesData)
        ? sourcesData
        : [];

    const { data: similarData } = await inst.post(
        '/getSimilarQuestions',
        { question, sources }
    );

    const { data: answerData } = await inst.post('/getAnswer', {
        question,
        sources
    });

    // Tangani beberapa kemungkinan format respons.
    let answer = typeof answerData === 'string'
        ? answerData
        : answerData?.answer ??
          answerData?.data?.answer ??
          answerData?.text ??
          '';

    if (typeof answer !== 'string') {
        answer = JSON.stringify(answer);
    }

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
            error: 'Please provide a question'
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
            error: 'Gagal mendapatkan jawaban dari layanan AI.',
            detail: error.response?.data || error.message
        });
    }
};