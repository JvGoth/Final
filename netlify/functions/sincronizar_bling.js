// Arquivo: netlify/functions/sincronizar_bling.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    const accessToken = process.env.BLING_ACCESS_TOKEN;
    if (!accessToken) return { statusCode: 500, body: "Access Token não configurado." };

    try {
        // Modo manual usando env vars
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

            if (!response.ok || !dados.data) {
                console.error("Erro no Bling:", dados.erros || "Resposta inesperada");
                return { statusCode: 500, body: JSON.stringify(dados.erros || "Erro") };
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
        return { statusCode: 200, body: "Sincronização concluída." };

    } catch (error) {
        console.error("Erro:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
