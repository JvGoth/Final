// Arquivo: netlify/functions/sincronizar_bling.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer"); // Adicionado para refresh

async function refreshAccessToken(refresh_token) {
    const CLIENT_ID = process.env.BLING_CLIENT_ID;
    const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
    const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    const postBody = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });

    const tokenUrl = 'https://api.bling.com.br/Api/v3/oauth/token';

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
        throw new Error(`Refresh falhou: ${JSON.stringify(data)}`);
    }

    data.expires_at = Date.now() + (data.expires_in * 1000);
    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
    });
    await store.setJSON("tokens", data);
    return data.access_token;
}

exports.handler = async () => {
    const storeTokens = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
    });
    let tokens = await storeTokens.get("tokens", { type: "json" });

    if (!tokens || !tokens.access_token) {
        return { statusCode: 500, body: JSON.stringify({ error: "Tokens não encontrados no Blob. Rode o callback primeiro." }) };
    }

    // Checa expiração e refresca se necessário
    if (Date.now() > tokens.expires_at) {
        try {
            tokens.access_token = await refreshAccessToken(tokens.refresh_token);
            tokens = await storeTokens.get("tokens", { type: "json" }); // Recarrega
        } catch (error) {
            return { statusCode: 500, body: JSON.stringify({ error: "Falha no refresh: " + error.message }) };
        }
    }

    const accessToken = tokens.access_token;

    const storeProdutos = getStore({
        name: "produtos_bling",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_API_TOKEN
    });

    try {
        // Teste Blobs
        await storeProdutos.setJSON("test_key", { test: "valor" });
        await storeProdutos.delete("test_key");

        let page = 1;
        let produtosSalvos = 0;
        let hasMore = true;

        while (hasMore) {
            const url = `https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
            });

            if (response.status === 401) { // Se expirado, refresca
                tokens.access_token = await refreshAccessToken(tokens.refresh_token);
                continue;
            }

            if (!response.ok) {
                return { statusCode: 500, body: JSON.stringify(await response.json()) };
            }

            const dados = await response.json();
            if (!dados.data || dados.data.length === 0) {
                hasMore = false;
                break;
            }

            for (const produto of dados.data) {
                const idChave = produto.id.toString();
                const imagemUrl = produto.imagens?.[0]?.link || null;

                await storeProdutos.setJSON(idChave, {
                    nome: produto.nome,
                    preco: parseFloat(produto.precoVenda || 0),
                    estoque: parseInt(produto.estoqueAtual || 0),
                    imagemUrl: imagemUrl,
                    atualizado: new Date().toISOString()
                });
                produtosSalvos++;
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay para rates
            }

            page++;
        }

        return { statusCode: 200, body: `Sincronização concluída. Produtos salvos: ${produtosSalvos}` };
    } catch (error) {
        console.error("Erro em sincronizar_bling:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
