// netlify/functions/ler_dados_produto.js

import { getStore } from "@netlify/blobs";

// Esta função será chamada pelo front-end do seu site
exports.handler = async (event) => {
  const sku = event.queryStringParameters.sku;

  if (!sku) {
    return { statusCode: 400, body: JSON.stringify({ error: "Parâmetro SKU é obrigatório." }) };
  }

  try {
    const store = getStore("produtos_bling");
    const dadosProduto = await store.getJSON(sku);

    if (dadosProduto) {
      // Retorna os dados do produto (preço, estoque) para o front-end
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosProduto),
      };
    } else {
      // Produto não encontrado na base do Netlify Blobs
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
