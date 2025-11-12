// Arquivo: netlify/functions/ler_dados_produto.js

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
    const idChave = event.queryStringParameters.id;
    if (!idChave) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro id ausente.' }) };
    }

    try {
        const store = getStore({
            name: "seu_name",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_AUTH_TOKEN
        });
        const produtoDados = await store.get(idChave, { type: "json" });

        if (produtoDados) {
            return { statusCode: 200, body: JSON.stringify(produtoDados) };
        } else {
            return { statusCode: 404, body: JSON.stringify({ error: "Produto não encontrado." }) };
        }
    } catch (error) {
        console.error("Erro ao ler Blob:", error.message, error.stack);
        return { statusCode: 500, body: JSON.stringify({ error: "Erro interno." }) };
    }
};
