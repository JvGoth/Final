// Arquivo: netlify/functions/list_all_products.js (CORRIGIDO)

// CORREÇÃO: Usando a sintaxe de require() para compatibilidade com Netlify Functions
const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
    try {
        const store = getStore("produtos_bling");
        
        // A função list() retorna todos os pares chave/valor no Blob
        const listResult = await store.list();
        
        const products = {};
        
        // 1. Busca os dados de cada produto de forma individual
        // Nota: listResult.keys é um array de strings (os IDs do Bling)
        for (const key of listResult.keys) {
            // key é o ID do Bling (ex: "123456789")
            const produtoDados = await store.getJSON(key);
            // 2. Armazena no objeto com a chave sendo o ID
            products[key] = produtoDados;
        }

        // Retorna todos os produtos como um objeto
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