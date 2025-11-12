// Arquivo: netlify/functions/bling_callback.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

const CLIENT_ID = process.env.BLING_CLIENT_ID;
const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
const REDIRECT_URI = process.env.BLING_REDIRECT_URI || 'https://miaupresentes.netlify.app/.netlify/functions/bling_callback';

const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
const base64Credentials = Buffer.from(credentials).toString('base64');

exports.handler = async (event) => {
    const params = event.queryStringParameters;
    const code = params.code;
    const error = params.error;
    const errorDescription = params.error_description;
    const receivedState = params.state;

    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
    });
    const storedState = await store.get("state");

    if (error) {
        await store.delete("state"); // Limpa
        return { statusCode: 400, body: JSON.stringify({ bling_error: error, description: errorDescription || 'Sem descrição.' }) };
    }

    if (!receivedState || receivedState !== storedState) {
        await store.delete("state");
        return { statusCode: 400, body: JSON.stringify({ error: "State ausente ou não corresponde (proteção CSRF)." }) };
    }

    await store.delete("state"); // Limpa após verificação

    if (!code) {
        return { statusCode: 400, body: JSON.stringify({ error: "Código de autorização 'code' não encontrado." }) };
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
        return { statusCode: 500, body: JSON.stringify({ error: "CLIENT_ID ou CLIENT_SECRET não configurados." }) };
    }

    const postBody = querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
    });

    const tokenUrl = 'https://api.bling.com.br/Api/v3/oauth/token';

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

        data.expires_at = Date.now() + (data.expires_in * 1000);

        await store.setJSON("tokens", data);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, access_token: data.access_token })
        };
    } catch (error) {
        console.error("Erro no callback:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
