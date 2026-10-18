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

    console.log('STEP 1: Requesting sources');

    const { data: sourcesData } = await inst.post('/getSources', {
        question
    });

    console.log(
        'SOURCES RESPONSE:',
        JSON.stringify(sourcesData).slice(0, 1500)
    );

    const sources = Array.isArray(sourcesData)
        ? sourcesData
        : [];

    console.log('STEP 2: Requesting similar questions');

    const { data: similarData } = await inst.post(
        '/getSimilarQuestions',
        { question, sources }
    );

    console.log('STEP 3: Requesting answer');

    const { data: answerData } = await inst.post('/getAnswer', {
        question,
        sources
    });

    console.log(
        'ANSWER RESPONSE:',
        JSON.stringify(answerData).slice(0, 3000)
    );

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

    const cleanAnswer = String(answer)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .trim();

    return {
        answer: cleanAnswer,
        sources: sources.map(item => item?.url).filter(Boolean),
        similarQuestions: Array.isArray(similarData)
            ? similarData
            : []
    };
}

module.exports = async (req, res) => {
    const question = req.query?.question || req.body?.question;

    if (typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
            error: 'Pertanyaan tidak boleh kosong.'
        });
    }

    try {
        const result = await turboseekLogic(question.trim());

        if (!result.answer) {
            console.error('EMPTY ANSWER: TurboSeek returned no readable text');

            return res.status(502).json({
                error: 'Jawaban dari TurboSeek kosong.'
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('TURBOSEEK FAILURE:', {
            stage: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        return res.status(502).json({
            error: 'Gagal mendapatkan jawaban dari TurboSeek.',
            detail: error.response?.data || error.message
        });
    }
};