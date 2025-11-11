// Arquivo: netlify/functions/ler_dados_produto.js

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // O ID do produto é passado como parâmetro na URL: ?id=123456
  const idChave = event.queryStringParameters.id; 

  if (!idChave) {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetro id ausente.' })
    };
  }

  try {
    const store = getStore("produtos_bling");
    
    // 1. Busca os dados e armazena em 'produtoDados'
    const produtoDados = await store.getJSON(idChave); 

    // 2. Verifica se 'produtoDados' existe
    if (produtoDados) { 
      // Retorna os dados do produto para o front-end
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        // 3. Serializa 'produtoDados'
        body: JSON.stringify(produtoDados), 
      };
    } else {
      // Produto não encontrado na base (Netlify Blobs)
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Produto não encontrado ou ainda não sincronizado." }),
      };
    }
  } catch (error) {
    console.error("Erro ao ler dados do Blob:", error);
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "Erro interno no servidor." }) 
    };
  }
};
