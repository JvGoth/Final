// Arquivo: netlify/functions/sincronizar_bling.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    const accessToken = process.env.BLING_ACCESS_TOKEN;
    if (!accessToken) return { statusCode: 500, body: "Access Token Bling não configurado." };

    const siteID = process.env.NETLIFY_SITE_ID;
    const apiToken = process.env.NETLIFY_API_TOKEN;
    if (!siteID || !apiToken) return { statusCode: 500, body: "NETLIFY_SITE_ID ou NETLIFY_API_TOKEN não configurados." };

    console.log("Usando siteID:", siteID.substring(0, 8) + "...");
    console.log("Usando token:", apiToken.substring(0, 8) + "...");

    try {
        const store = getStore({
            name: "produtos_bling",
            siteID: siteID,
            token: apiToken
        });

        // Teste inicial do Blobs
        await store.setJSON("test_key", { test: "valor" });
        const testData = await store.get("test_key", { type: "json" });
        console.log("Teste Blobs: ", testData ? "Sucesso" : "Falha");
        await store.delete("test_key");

        let page = 1;
        let produtosSalvos = 0;
        let hasMore = true;
        const maxPages = 5; // Limite para evitar timeout - aumente se background function

        while (hasMore && page <= maxPages) {
            const url = `https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
            });
            const dados = await response.json();

            console.log(`Status da API Bling (página ${page}): ${response.status}`);
            if (dados.erros) console.log("Erros do Bling:", dados.erros);

            if (!response.ok || !dados.data) {
                return { statusCode: 500, body: JSON.stringify(dados.erros || "Resposta inesperada do Bling") };
            }

            for (const produto of dados.data) {
                const idChave = produto.id.toString();
                const imagemUrl = produto.imagens && produto.imagens.length > 0 ? produto.imagens[0].link : null;

                await store.setJSON(idChave, {
                    nome: produto.nome,
                    preco: parseFloat(produto.precoVenda || 0),
                    estoque: parseInt(produto.estoqueAtual || 0),
                    imagemUrl: imagemUrl,
                    atualizado: new Date().toISOString()
                });
                produtosSalvos++;
                await new Promise(resolve => setTimeout(resolve, 100)); // Delay para evitar rate limit
            }

            hasMore = dados.data.length > 0;
            page++;
        }

        console.log(`Sincronizado: ${produtosSalvos} produtos (até página ${page - 1}).`);
        if (hasMore) console.log("Mais páginas disponíveis - rode novamente para continuar.");
        return { statusCode: 200, body: "Sincronização parcial concluída. Produtos salvos: " + produtosSalvos };

    } catch (error) {
        console.error("Erro geral:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};  
