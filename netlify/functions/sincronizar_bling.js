// netlify/functions/sincronizar_bling.js

import { getStore } from "@netlify/blobs";
import fetch from "node-fetch";

// Esta função será agendada para rodar automaticamente (o Cron Job)
exports.handler = async () => {
  const apiKey = process.env.BLING_API_KEY; 
  if (!apiKey) {
    return { statusCode: 500, body: "API Key do Bling não configurada." };
  }

  try {
    // 1. CHAMA A API DO BLING (Busca todos os produtos ativos)
    // Opcional: Adicionar filtros específicos se a lista for muito longa (ex: 'filters=situacao[A]')
    const url = `https://bling.com.br/Api/v2/produtos/json/?apikey=${apiKey}&filters=situacao[A]`;
    const response = await fetch(url);
    const dados = await response.json();

    if (dados.retorno && dados.retorno.produtos) {
      const store = getStore("produtos_bling"); // O seu Guarda-Volumes
      let produtosSalvos = 0;
      
      for (const item of dados.retorno.produtos) {
        const produto = item.produto;
        const sku = produto.codigo; // O SKU é o código do produto no Bling

        // Se o produto não tiver um SKU, ele será ignorado
        if (sku) {
          // 2. SALVA NO NETLIFY BLOBS
          await store.setJSON(sku, {
            nome: produto.descricao,
            preco: parseFloat(produto.preco),
            estoque: parseInt(produto.estoqueAtual),
            atualizado: new Date().toISOString()
          });
          produtosSalvos++;
        }
      }
      
      console.log(`Sincronização Bling > Netlify Blobs concluída. ${produtosSalvos} produtos atualizados.`);
      
      return { statusCode: 200 };
      
    } else {
      console.error("Erro na resposta do Bling ou nenhum produto encontrado:", dados.retorno.erros);
      return { statusCode: 500, body: JSON.stringify(dados.retorno.erros) };
    }
  } catch (error) {
    console.error("Erro fatal durante a sincronização:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
