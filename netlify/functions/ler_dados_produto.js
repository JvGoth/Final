// Arquivo: netlify/functions/ler_dados_produto.js (CORREÇÃO FINAL)

// Importações (usando 'require' para máxima compatibilidade com Netlify):
const { getStore } = require("@netlify/blobs"); 

// Esta função é chamada pelo front-end (estoque.js) para obter dados individuais
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
    
    // 1. Busca os dados. Armazena na variável 'produtoDados'.
    const produtoDados = await store.getJSON(idChave); 

    // 2. Verifica se a variável CORRETA tem conteúdo
    if (produtoDados) { // <-- CORRIGIDO! Deve ser 'produtoDados'
      // Retorna os dados do produto para o front-end
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        // 3. Usa a variável CORRETA
        body: JSON.stringify(produtoDados), // <-- CORRIGIDO! Deve ser 'produtoDados'
      };
    } else {
      // Produto não encontrado na base (N  etlify Blobs)
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Produto não encontrado ou ainda não sincronizado." }),
      };
    }
  } catch (error) {
    console.error("Erro ao ler dados do Blob:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno no servidor." }) };
  }
};
