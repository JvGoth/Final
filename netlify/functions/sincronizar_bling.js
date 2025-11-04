import { getStore } from "@netlify/blobs";
import fetch from "node-fetch";

exports.handler = async () => {
  const apiKey = process.env.BLING_API_KEY; 
  if (!apiKey) {
    return { statusCode: 500, body: "API Key do Bling não configurada." };
  }

  try {
    // Filtro: Apenas produtos com Situação "Ativo" [A]
    const url = `https://bling.com.br/Api/v2/produtos/json/?apikey=${apiKey}&filters=situacao[A]`;
    const response = await fetch(url);
    const dados = await response.json();

    if (dados.retorno && dados.retorno.produtos) {
      const store = getStore("produtos_bling");
      let produtosSalvos = 0;
      
      for (const item of dados.retorno.produtos) {
        const produto = item.produto;
        
        // USAR O ID INTERNO COMO CHAVE, POIS O CÓDIGO (SKU) ESTÁ VAZIO
        const idChave = produto.id; 

        if (!idChave) {
          console.error(`[ERRO FATAL] Produto sem ID não pode ser sincronizado!`);
          continue;
        }

        console.log(`Sincronizando produto ID: ${idChave}`);

        // SALVA NO BLOBS USANDO O ID COMO CHAVE
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
        // Se a chave API for inválida ou faltar permissão, o Bling retorna um erro aqui
      console.error("Erro na resposta do Bling:", dados.retorno.erros);
      return { statusCode: 500, body: JSON.stringify(dados.retorno.erros) };
    } else {
        // Caso de não haver produtos ativos ou outro erro não mapeado
        console.log("Nenhum produto ativo encontrado ou resposta do Bling inesperada.");
        return { statusCode: 200, body: "Nenhum produto ativo encontrado." };
    }
  } catch (error) {
    console.error("Erro fatal durante a sincronização:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
  }
};
