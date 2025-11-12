// Arquivo: netlify/functions/sincronizar_bling-background.js

const { getStore } = require("@netlify/blobs");
const querystring = require("querystring");
const { Buffer } = require("buffer");

async function refreshAccessToken(refresh_token) {
    console.log("🔄 Atualizando token de acesso...");
    const CLIENT_ID = process.env.BLING_CLIENT_ID;
    const CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
    const base64Credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const body = querystring.stringify({
        grant_type: "refresh_token",
        refresh_token
    });

    const res = await fetch("https://api.bling.com.br/Api/v3/oauth/token", {
        method: "POST",
        headers: {
            "Authorization": `Basic ${base64Credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        },
        body
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    data.expires_at = Date.now() + (data.expires_in * 1000);
    const store = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });
    await store.setJSON("tokens", data);

    console.log("✅ Token atualizado.");
    return data.access_token;
}

async function buscarPreco(accessToken, idProduto) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${idProduto}/precos`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
    });
    const dados = await res.json();
    return dados?.data?.[0]?.preco ?? 0;
}

async function buscarEstoque(accessToken, idProduto) {
    const res = await fetch(`https://api.bling.com.br/Api/v3/produtos/${idProduto}/estoques`, {
        headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
    });
    const dados = await res.json();
    return dados?.data?.[0]?.saldo ?? 0;
}

exports.handler = async () => {
    console.log("🚀 Iniciando sincronização com Bling...");

    const storeTokens = getStore({
        name: "bling_tokens",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });

    let tokens = await storeTokens.get("tokens", { type: "json" });
    if (!tokens?.access_token) {
        console.error("❌ Nenhum token encontrado. Faça login primeiro.");
        return { statusCode: 401, body: JSON.stringify({ error: "Token ausente" }) };
    }

    if (Date.now() > tokens.expires_at) {
        tokens.access_token = await refreshAccessToken(tokens.refresh_token);
        tokens = await storeTokens.get("tokens", { type: "json" });
    }

    const accessToken = tokens.access_token;
    const storeProdutos = getStore({
        name: "produtos_bling",
        siteID: process.env.NETLIFY_SITE_ID,
        token: process.env.NETLIFY_AUTH_TOKEN
    });

    let page = 1, totalSalvos = 0;

    while (true) {
        console.log(`📦 Buscando produtos (página ${page})...`);
        const res = await fetch(`https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`, {
            headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
        });

        const data = await res.json();
        const produtos = data?.data || [];

        if (produtos.length === 0) break;

        for (const produto of produtos) {
            const id = produto.id;
            const nome = produto.nome;
            const imagemUrl = produto.imagens?.[0]?.link || null;

            let preco = 0;
            let estoque = 0;

            try {
                preco = await buscarPreco(accessToken, id);
                estoque = await buscarEstoque(accessToken, id);
            } catch (e) {
                console.error(`⚠️ Falha ao obter preço/estoque do produto ${id}:`, e.message);
            }

            try {
                await storeProdutos.setJSON(id.toString(), {
                    nome,
                    preco: parseFloat(preco),
                    estoque: parseInt(estoque),
                    imagemUrl,
                    atualizado: new Date().toISOString()
                });
                totalSalvos++;
                console.log(`✅ ${nome} - R$ ${preco} / Estoque: ${estoque}`);
            } catch (e) {
                console.error(`❌ Erro ao salvar ${id}: ${e.message}`);
            }

            await new Promise(r => setTimeout(r, 1000)); // pausa pra evitar bloqueio
        }

        page++;
    }

    console.log(`🎯 Sincronização concluída. Total: ${totalSalvos}`);
    return { statusCode: 200, body: JSON.stringify({ sucesso: true, produtos_salvos: totalSalvos }) };
};
