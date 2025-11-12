// Arquivo: netlify/functions/sincronizar_bling-background.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

// Atualiza token
async function refreshAccessToken(refresh_token) {
    console.log("🔄 Atualizando token de acesso...");
    const CLIENT_ID = process.env.BLING_CLIENT_ID;
    const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
    const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');

    const postBody = querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    });

    const response = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${base64Credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body: postBody
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("❌ Falha no refresh:", JSON.stringify(data));
        throw new Error(`Refresh falhou: ${JSON.stringify(data)}`);
    }

    data.expires_at = Date.now() + (data.expires_in * 1000);

    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });
    await store.setJSON("tokens", data);
    console.log("✅ Token atualizado com sucesso!");
    return data.access_token;
}

exports.handler = async () => {
    console.log("🚀 Iniciando sincronização com Bling...");
    const storeTokens = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });

    let tokens = await storeTokens.get("tokens", { type: "json" });

    if (!tokens || !tokens.access_token) {
        console.error("❌ Tokens não encontrados no Blob. Execute o callback primeiro.");
        return { statusCode: 500, body: JSON.stringify({ error: "Tokens não encontrados." }) };
    }

    if (Date.now() > tokens.expires_at) {
        console.log("⚠️ Token expirado, tentando refresh...");
        try {
            tokens.access_token = await refreshAccessToken(tokens.refresh_token);
            tokens = await storeTokens.get("tokens", { type: "json" });
        } catch (err) {
            console.error("❌ Erro ao atualizar token:", err.message);
            return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
        }
    }

    const accessToken = tokens.access_token;
    const storeProdutos = getStore({
        name: "produtos_bling",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });

    // Teste de gravação no Blob
    try {
        await storeProdutos.setJSON("test_key", { test: "ok" });
        await storeProdutos.delete("test_key");
        console.log("✅ Teste de gravação no Blob bem-sucedido.");
    } catch (e) {
        console.error("❌ Falha ao escrever no Blob:", e.message);
        return { statusCode: 500, body: JSON.stringify({ error: "Sem permissão para gravar no Blob." }) };
    }

    let page = 1;
    let totalSalvos = 0;

    while (true) {
        console.log(`📦 Buscando produtos (página ${page})...`);
        const response = await fetch(`https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json"
            }
        });

        console.log(`➡️ Status da resposta: ${response.status}`);

        if (response.status === 401) {
            console.warn("⚠️ Token expirou durante sync. Tentando refresh...");
            tokens.access_token = await refreshAccessToken(tokens.refresh_token);
            continue;
        }

        if (!response.ok) {
            const erroData = await response.json();
            console.error("❌ Erro ao buscar produtos:", JSON.stringify(erroData));
            return { statusCode: 500, body: JSON.stringify(erroData) };
        }

        const dados = await response.json();
        const produtos = dados?.data || [];

        if (produtos.length === 0) {
            console.log("✅ Nenhum produto adicional encontrado. Sincronização concluída.");
            break;
        }

        for (const produto of produtos) {
            try {
                const idChave = produto.id.toString();

                // NOVO formato da API Bling v3:
                const precoVenda = parseFloat(produto.precos?.[0]?.preco || 0);
                const estoqueAtual = parseInt(produto.estoques?.[0]?.saldo || 0);
                const imagemUrl = produto.imagens?.[0]?.link || null;

                await storeProdutos.setJSON(idChave, {
                    nome: produto.nome,
                    preco: precoVenda,
                    estoque: estoqueAtual,
                    imagemUrl,
                    atualizado: new Date().toISOString()
                });

                totalSalvos++;
                console.log(`✅ Produto salvo: ${produto.nome} (R$ ${precoVenda} / Estoque: ${estoqueAtual})`);
            } catch (err) {
                console.error(`❌ Erro ao salvar produto: ${err.message}`);
            }

            // Pausa para evitar rate limit
            await new Promise(r => setTimeout(r, 1500));
        }

        page++;
    }

    console.log(`🎯 Sincronização finalizada! Total de produtos salvos: ${totalSalvos}`);
    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, produtos_salvos: totalSalvos })
    };
};
