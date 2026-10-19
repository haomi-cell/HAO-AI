// api/index.js
const axios = require('axios');

const BASE_URL = 'https://api.jerexd.my.id';
const API_KEY = 'jere_sTl9OLzPIyMn';

// Deteksi pertanyaan seputar pembuat / pencipta AI
function isAskingCreator(text) {
    const q = text.toLowerCase().trim();
    const patterns = [
        /siapa.*(buat|bikin|cipta|kembang|develop|rancang|bangun|pemilik|owner)/i,
        /(pembuat|pencipta|pengembang|developer|owner|pemilik).*(kamu|mu|anda|ai\s*ini|smart\s*ai|siapa)/i,
        /(buatan|ciptaan|bikinan|karya)\s+siapa/i,
        /who\s+(made|created|built|developed|owns)\s+you/i,
        /who\s+is\s+your\s+(creator|developer|maker|owner)/i
    ];
    return patterns.some(regex => regex.test(q));
}

async function customAILogic(question) {
    // 1. Respon instan jika ditanya siapa pembuatnya
    if (isAskingCreator(question)) {
        return {
            answer: 'Saya adalah SmartAI, asisten kecerdasan buatan yang dibuat dan dikembangkan oleh Mas Haomi_Xml. Ada yang bisa saya bantu hari ini?',
            sources: ['https://hao-ai-kappa.vercel.app'],
            similarQuestions: [
                'Apa saja fitur SmartAI buatan Mas Haomi_Xml?',
                'Bisa bantu saya membuat kode program?',
                'Bagaimana cara kerja SmartAI?'
            ]
        };
    }

    try {
        // 2. Panggil Endpoint Chatai Milikmu
        const response = await axios.get(`${BASE_URL}/api/ai/aichat`, {
            params: {
                apikey: API_KEY,
                prompt: question,
                model: 'gpt-4o', // Sesuaikan model jika diperlukan (misal: gpt-4o, default, dll)
                session_id: 'smart-ai-user-' + Math.floor(Math.random() * 10000)
            },
            timeout: 20000
        });

        const data = response.data;

        // Ekstraksi teks jawaban dari response endpoint kamu
        let aiAnswer = data?.result 
            || data?.answer 
            || data?.response 
            || data?.message 
            || data?.data 
            || (typeof data === 'string' ? data : JSON.stringify(data));

        return {
            answer: String(aiAnswer).trim(),
            sources: data?.sources || [],
            similarQuestions: data?.similarQuestions || []
        };
    } catch (error) {
        console.error('Error dari API Jerexd:', error?.response?.data || error.message);
        return {
            answer: 'Maaf, server AI sedang mengalami kendala atau sibuk. Silakan coba beberapa saat lagi.',
            sources: [],
            similarQuestions: []
        };
    }
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
        const result = await customAILogic(question);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Gagal memproses permintaan' });
    }
};
