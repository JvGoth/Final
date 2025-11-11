// Arquivo: netlify/functions/sincronizar_bling.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    const accessToken = process.env.BLING_ACCESS_TOKEN;
    if (!accessToken) return { statusCode: 500, body: "Access Token não configurado." };

    try {
        const store = getStore({
            name: "produtos_bling",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_API_TOKEN
        });
        
        let page = 1;
        let produtosSalvos = 0;
        let hasMore = true;

        while (hasMore) {
            const url = `https://api.bling.com.br/Api/v3/produtos?situacao=A&page=${page}&limit=100`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' }
            });
            const dados = await response.json();

            // Log para debug
            console.log(`Status da API Bling: ${response.status}`);
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
            }

            hasMore = dados.data.length > 0;
            page++;
        }

        console.log(`Sincronizado: ${produtosSalvos} produtos.`);
        return { statusCode: 200, body: "Sincronização concluída com sucesso." };

    } catch (error) {
        console.error("Erro geral:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
