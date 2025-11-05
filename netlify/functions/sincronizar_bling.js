// FORÇAR O USO DE REQUIRE PARA node-fetch (mais compatível com a compilação do Netlify)
const { getStore } = require("@netlify/blobs");
const fetch = require("node-fetch"); 

exports.handler = async () => {
  // A CHAVE API É LIDA AQUI (seguramente do Netlify Environment)
  const apiKey = process.env.BLING_API_KEY; 
  if (!apiKey) {
    // Este erro deve aparecer no log se a variável estiver ausente
    return { statusCode: 500, body: "API Key do Bling não configurada." };
  }

  try {
    // 1. CHAMA A API DO BLING (Busca todos os produtos ativos)
    const url = `https://bling.com.br/Api/v3/produtos/json/?apikey=${apiKey}&filters=situacao[A]`;
    const response = await fetch(url);
    const dados = await response.json();

    if (dados.retorno && dados.retorno.produtos) {
      const store = getStore("produtos_bling"); // O seu cache de dados
      let produtosSalvos = 0;
      
      for (const item of dados.retorno.produtos) {
        const produto = item.produto;
        const idChave = produto.id; 

        if (!idChave) {
          console.error(`[ERRO FATAL] Produto sem ID não pode ser sincronizado!`);
          continue;
        }

        // LOG CRÍTICO QUE PRECISAMOS VER!
        console.log(`Sincronizando produto ID: ${idChave}`);

        await store.setJSON(idChave, {
            nome: produto.descricao,
            preco: parseFloat(produto.preco),
            estoque: parseInt(produto.estoqueAtual),
            atualizado: new Date().toISOString()
        });
          produtosSalvos++;
      }
      
      console.log(`Sincronização Bling > Netlify Blobs concluída. ${produtosSalvos} produtos atualizados.`);
      return { statusCode: 200 };
      
    } else if (dados.retorno?.erros) {
        // Se a chave API for inválida ou faltar permissão
      console.error("Erro na resposta do Bling:", dados.retorno.erros);
      return { statusCode: 500, body: JSON.stringify(dados.retorno.erros) };
    } else {
        console.log("Nenhum produto ativo encontrado ou resposta do Bling inesperada.");
        return { statusCode: 200, body: "Nenhum produto ativo encontrado." };
    }
  } catch (error) {
    console.error("Erro fatal durante a sincronização:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
  }
};
