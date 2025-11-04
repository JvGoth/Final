import { getStore } from "@netlify/blobs";
import fetch from "node-fetch";

// Esta função será agendada para rodar automaticamente
exports.handler = async () => {
  // A CHAVE API É LIDA AQUI (seguramente do Netlify Environment)
  const apiKey = process.env.BLING_API_KEY; 
  if (!apiKey) {
    return { statusCode: 500, body: "API Key do Bling não configurada." };
  }

  try {
    // 1. CHAMA A API DO BLING (Busca todos os produtos ativos)
    const url = `https://bling.com.br/Api/v2/produtos/json/?apikey=${apiKey}&filters=situacao[A]`;
    const response = await fetch(url);
    const dados = await response.json();

    if (dados.retorno && dados.retorno.produtos) {
      const store = getStore("produtos_bling"); // O seu cache de dados
      let produtosSalvos = 0;
      
      for (const item of dados.retorno.produtos) {
        const produto = item.produto;
        
        // USAR O ID INTERNO COMO CHAVE
        const idChave = produto.id; 

        if (!idChave) {
          console.error(`[ERRO FATAL] Produto sem ID não pode ser sincronizado!`);
          continue;
        }

        console.log(`Sincronizando produto ID: ${idChave}`);

        // A CHAVE AGORA É idChave e as propriedades estão corretamente dentro do objeto {}
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
      
    } else {
      console.error("Erro na resposta do Bling ou nenhum produto encontrado:", dados.retorno?.erros);
      return { statusCode: 500, body: JSON.stringify(dados.retorno?.erros || { error: "Resposta do Bling inesperada." }) };
    }
  } catch (error) {
    console.error("Erro fatal durante a sincronização:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
