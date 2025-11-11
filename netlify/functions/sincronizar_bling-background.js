// Arquivo: netlify/functions/sincronizar_bling-background.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const tokenStore = getStore("bling_tokens"); // Sem siteID/token - usa implícito
        const tokenData = await tokenStore.get("access_token", { type: "json" });
        if (!tokenData || !tokenData.access_token) {
            console.error("Access Token Bling não encontrado no Blobs.");
            return { statusCode: 500, body: "Access Token Bling não encontrado no Blobs. Rode o OAuth novamente." };
        }
        const accessToken = tokenData.access_token;
        console.log("Access Token carregado do Blobs com sucesso.");

        const store = getStore("produtos_bling"); // Sem siteID/token - usa implícito
        console.log("Store inicializado com sucesso.");

        // Teste inicial do Blobs
        await store.setJSON("test_key", { test: "valor" });
        const testData = await store.get("test_key", { type: "json" });
        console.log("Teste Blobs: ", testData ? "Sucesso" : "Falha");
        await store.delete("test_key");

        let page = 1;
        let produtosSalvos = 0;
        let hasMore = true;
        const maxPages = 5; // Aumente se precisar, mas teste para evitar timeouts longos

        while (hasMore && page <= maxPages) {
            const url = `https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`;
            
            let retries = 3;
            let response;
            while (retries > 0) {
                response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
                });
                console.log(`Status da API Bling (página ${page}): ${response.status}`);

                if (response.status === 429) {
                    console.log("Rate limit hit, retrying in 10s...");
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    retries--;
                    continue;
                }
                break;
            }
            if (retries === 0) return { statusCode: 429, body: "Rate limit exceeded no Bling." };

            const dados = await response.json();
            if (dados.erros) console.log("Erros do Bling:", JSON.stringify(dados.erros));

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
                console.log(`Salvou produto ID: ${idChave}`);
                produtosSalvos++;
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay para rate limit
            }

            hasMore = dados.data.length > 0;
            page++;
        }

        console.log(`Sincronizado: ${produtosSalvos} produtos (até página ${page - 1}).`);
        if (hasMore) console.log("Mais páginas disponíveis - rode novamente para continuar.");
        return { statusCode: 200, body: `Sincronização parcial concluída. Produtos salvos: ${produtosSalvos}` };

    } catch (error) {
        console.error("Erro geral em sincronizar_bling:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
