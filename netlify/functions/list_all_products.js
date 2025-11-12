// Arquivo: netlify/functions/list_all_products.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const store = getStore({
            name: "produtos_bling",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_API_TOKEN
        });
        const listResult = await store.list();
        
        const keys = listResult.blobs ? listResult.blobs.map(blob => blob.key) : [];

        const products = {};
        for (const key of keys) {
            const produtoDados = await store.get(key, { type: "json" });
            if (produtoDados) products[key] = produtoDados;
        }

        return { statusCode: 200, body: JSON.stringify(products) };
    } catch (error) {
        console.error("Erro ao listar produtos:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: "Erro ao listar produtos." }) };
    }
};
