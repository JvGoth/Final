// Arquivo: netlify/functions/sincronizar_bling-background.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

async function refreshAccessToken(refresh_token) {
    console.log("Iniciando refresh de token...");
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
        console.error("Refresh falhou:", JSON.stringify(data));
        throw new Error(`Refresh falhou: ${JSON.stringify(data)}`);
    }

    data.expires_at = Date.now() + (data.expires_in * 1000);
    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN  // ALTERADO: Use AUTH_TOKEN
    });
    await store.setJSON("tokens", data);
    console.log("Refresh concluído com sucesso.");
    return data.access_token;
}

exports.handler = async () => {
    console.log("Iniciando sincronização... Verificando tokens.");
    const storeTokens = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN  // ALTERADO
    });
    let tokens = await storeTokens.get("tokens", { type: "json" });

    if (!tokens || !tokens.access_token) {
        console.error("Tokens não encontrados.");
        return { statusCode: 500, body: JSON.stringify({ error: "Tokens não encontrados no Blob. Rode o callback primeiro." }) };
    }

    if (Date.now() > tokens.expires_at) {
        console.log("Token expirado, refreshing...");
        try {
            tokens.access_token = await refreshAccessToken(tokens.refresh_token);
            tokens = await storeTokens.get("tokens", { type: "json" });
        } catch (error) {
            console.error("Falha no refresh:", error.message);
            return { statusCode: 500, body: JSON.stringify({ error: "Falha no refresh: " + error.message }) };
        }
    }

    const accessToken = tokens.access_token;
    console.log("Token válido. Iniciando sync de produtos.");

    const storeProdutos = getStore({
        name: "produtos_bling",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN  // ALTERADO
    });

    try {
        console.log("Testando Blobs...");
        await storeProdutos.setJSON("test_key", { test: "valor" });
        await storeProdutos.delete("test_key");
        console.log("Teste Blobs OK.");

        let page = 1;
        let produtosSalvos = 0;
        let hasMore = true;

        while (hasMore) {
            console.log(`Buscando página ${page}...`);
            const url = `https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
            });

            console.log(`Status da resposta Bling (página ${page}): ${response.status}`);

            if (response.status === 401) {
                console.log("401 detectado, refreshing token...");
                tokens.access_token = await refreshAccessToken(tokens.refresh_token);
                continue;
            }

            if (!response.ok) {
                const erroData = await response.json();
                console.error("Erro na API Bling:", JSON.stringify(erroData));
                return { statusCode: 500, body: JSON.stringify(erroData) };
            }

            const dados = await response.json();
            if (!dados.data || dados.data.length === 0) {
                console.log("Não há mais dados. Finalizando.");
                hasMore = false;
                break;
            }

            console.log(`Processando ${dados.data.length} produtos na página ${page}...`);
            for (const produto of dados.data) {
                const idChave = produto.id.toString();
                const imagemUrl = produto.imagens?.[0]?.link || null;

                try {
                    await storeProdutos.setJSON(idChave, {
                        nome: produto.nome,
                        preco: parseFloat(produto.precos?.[0]?.preco || 0),
                        estoque: parseInt(produto.estoques?.[0]?.saldo || 0),
                        imagemUrl: imagemUrl,
                        atualizado: new Date().toISOString()
                    });
                    produtosSalvos++;
                    console.log(`Produto ${idChave} salvo com sucesso.`);
                } catch (setError) {
                    console.error(`Erro ao salvar produto ID ${idChave}:`, setError.message, setError.stack);
                    // Continua
                }
                await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2s para evitar 401
            }

            console.log(`Página ${page} completa. Produtos salvos até agora: ${produtosSalvos}`);
            page++;
        }

        console.log(`Sincronização concluída! Total produtos: ${produtosSalvos}`);
        return { statusCode: 200, body: `Sincronização concluída. Produtos salvos: ${produtosSalvos}` };
    } catch (error) {
        console.error("Erro geral em sync:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
