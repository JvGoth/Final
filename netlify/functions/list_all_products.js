// Arquivo: netlify/functions/list_all_products.js

const { getStore, listStores } = require("@netlify/blobs");  // Adicionado listStores para debug

exports.handler = async () => {
    try {
        // NOVO: Lista todos os stores para debug
        const { stores } = await listStores();
        console.log('Stores disponíveis:', stores.join(', '));  // Log: Veja se "produtos_bling" existe

        const store = getStore({
            name: "produtos_bling",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_AUTH_TOKEN  // Ou API_TOKEN se não renomeou
        });
        const listResult = await store.list();
        
        const keys = listResult.blobs ? listResult.blobs.map(blob => blob.key) : [];
        console.log(`Encontradas ${keys.length} chaves no Blobs: ${keys.join(', ') || 'nenhuma'}`);  // Log crucial

        const products = {};
        for (const key of keys) {
            const produtoDados = await store.get(key, { type: "json" });
            if (produtoDados) {
                products[key] = produtoDados;
                console.log(`Produto ${key} carregado: ${produtoDados.nome}`);
            }
        }

        if (Object.keys(products).length === 0) {
            console.warn("Nenhum produto encontrado no Blobs.");
        }

        return { statusCode: 200, body: JSON.stringify(products) };
    } catch (error) {
        console.error("Erro ao listar produtos:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: "Erro ao listar produtos." }) };
    }
};
