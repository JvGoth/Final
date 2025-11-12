// Arquivo: netlify/functions/bling_start_auth.js

const crypto = require('crypto');
const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const state = crypto.randomBytes(16).toString('hex');
        const store = getStore({ name: "bling_tokens" });
        await store.set("state", state);

        const CLIENT_ID = process.env.BLING_CLIENT_ID;
        const REDIRECT_URI = process.env.BLING_REDIRECT_URI || 'https://miaupresentes.netlify.app/.netlify/functions/bling_callback';

        const authorizeUrl = `https://api.bling.com.br/Api/v3/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}&scope=produtos`;

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, authorize_url: authorizeUrl })
        };
    } catch (error) {
        console.error("Erro ao gerar auth URL:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
