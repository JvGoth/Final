import { getStore } from "@netlify/blobs";

// Esta função será chamada pelo front-end do seu site (sem chave API)
exports.handler = async (event) => {
  const idChave = event.queryStringParameters.id; // Pega o novo parâmetro 'id'

  if (!idChave) {
    return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Parâmetro id ausente.' })
    };
  }

  try {
    const store = getStore("produtos_bling");
    const produtoDados = await store.getJSON(idChave);

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
