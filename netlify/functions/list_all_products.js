// Arquivo: netlify/functions/list_all_products.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        // Modo manual
        const store = getStore({
            name: "produtos_bling",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_API_TOKEN
        });
        
        const listResult = await store.list();
        
        const products = {};
        
        for (const key of listResult.keys) {
            const produtoDados = await store.getJSON(key);
            products[key] = produtoDados;
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(products),
        };

    } catch (error) {
        console.error("Erro ao listar todos os produtos:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Erro ao buscar a lista de produtos do banco de dados.", details: error.message }) 
        };
    }
};
