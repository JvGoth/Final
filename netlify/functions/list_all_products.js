// Arquivo: netlify/functions/list_all_products.js

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const store = getStore("produtos_bling");
        
        const listResult = await store.list();
        console.log("listResult:", JSON.stringify(listResult));  // Log para depurar o resultado
        
        const products = {};
        
        for (const key of (listResult.keys || [])) {  // Fallback para array vazio se keys undefined ou não iterável
            const produtoDados = await store.get(key, { type: "json" });
            products[key] = produtoDados;
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(products),
        };

    } catch (error) {
        console.error("Erro ao listar todos os produtos:", error.message, error.stack);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: "Erro ao buscar a lista de produtos do banco de dados.", details: error.message }) 
        };
    }
};

