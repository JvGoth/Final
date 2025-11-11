// Arquivo: netlify/functions/ler_dados_produto.js

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const idChave = event.queryStringParameters.id; 

  if (!idChave) {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetro id ausente.' })
    };
  }

  try {
    const store = getStore({
      name: "produtos_bling",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_API_TOKEN
    });
    
    const produtoDados = await store.get(idChave, { type: "json" }); 

    if (produtoDados) { 
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produtoDados), 
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Produto não encontrado ou ainda não sincronizado." }),
      };
    }
  } catch (error) {
    console.error("Erro ao ler dados do Blob:", error.message, error.stack);
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Erro interno no servidor." }) 
    };
  }
};
