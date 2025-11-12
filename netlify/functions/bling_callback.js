// Arquivo: netlify/functions/bling_callback.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

const CLIENT_ID = process.env.BLING_CLIENT_ID;
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
const REDIRECT_URI = process.env.BLING_REDIRECT_URI || 'https://miaupresentes.netlify.app/.netlify/functions/bling_callback'; // Use env para flexibilidade

const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
const base64Credentials = Buffer.from(credentials).toString('base64');

exports.handler = async (event) => {
    const code = event.queryStringParameters.code;
    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ error: "Código de autorização 'code' não encontrado na URL." }) };
    }
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return { statusCode: 500, body: JSON.stringify({ error: "Variáveis CLIENT_ID ou CLIENT_SECRET não configuradas." }) };
    }

    const postBody = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
    });

    const tokenUrl = 'https://api.bling.com.br/Api/v3/oauth/token'; // CORRIGIDO: Adicionado "api."

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: postBody
        });

        const data = await response.json();

        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        // NOVO: Calcula expires_at para checar expiração mais tarde
        data.expires_at = Date.now() + (data.expires_in * 1000);

        const store = getStore({ name: "bling_tokens" });
        await store.setJSON("tokens", data); // Salva objeto completo: access_token, refresh_token, expires_in, expires_at

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, access_token: data.access_token })
        };
    } catch (error) {
        console.error("Erro no callback:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
