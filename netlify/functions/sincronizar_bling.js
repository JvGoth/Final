// Arquivo: sincronizar_bling.js (VERSÃO NOVA - V3)

// Importação: Use o fetch nativo e remova o 'require("node-fetch")' se ainda estiver lá
const { getStore } = require("@netlify/blobs"); 
// const fetch = require("node-fetch"); <-- REMOVA ESTA LINHA se existir.

exports.handler = async () => {
    // Agora lendo o Access Token
    const accessToken = process.env.BLING_ACCESS_TOKEN;
    if (!accessToken) {
        return { statusCode: 500, body: "Access Token do Bling V3 não configurado." };
    }

    try {
        // 1. Endpoint V3: A URL mudou para 'api.bling.com.br/Api/v3'
        // Cuidado: Filtros na V3 usam um formato diferente. 
        const url = `https://api.bling.com.br/Api/v3/produtos?filtros=situacao[A]`; 
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // 2. Novo cabeçalho de AUTORIZAÇÃO V3
                'Authorization': `Bearer ${accessToken}`, 
                'Accept': 'application/json'
            }
        });

        const dados = await response.json();

        // 3. Estrutura de Resposta V3: Os dados vêm em 'data', não mais em 'retorno.produtos'
        if (response.ok && dados.data) {
            const store = getStore("produtos_bling");
            let produtosSalvos = 0;
            
            // Itera diretamente sobre o array de produtos V3
            for (const produto of dados.data) {
                const idChave = produto.id; // Assume que o ID do produto é o identificador correto
                
                // NOTA IMPORTANTE: Verifique os nomes dos campos da API V3
                await store.setJSON(idChave, {
                    nome: produto.descricao, // Pode ter mudado na V3
                    preco: parseFloat(produto.precos.preco), // A V3 aninha preços. Verifique o caminho!
                    estoque: parseInt(produto.estoque.atual), // A V3 aninha estoque. Verifique o caminho!
                    atualizado: new Date().toISOString()
                });
                produtosSalvos++;
            }
            
            console.log(`Sincronização Bling > Netlify Blobs concluída. ${produtosSalvos} produtos atualizados.`);
            return { statusCode: 200 };
            
        } else if (dados.erros) {
            console.error("Erro na resposta do Bling V3:", dados.erros);
            return { statusCode: 500, body: JSON.stringify(dados.erros) };
        } else {
            console.log("Nenhum produto ativo encontrado ou resposta do Bling inesperada.");
            return { statusCode: 200, body: "Nenhum produto ativo encontrado." };
        }

    } catch (error) {
        console.error("Erro fatal durante a sincronização:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message, stack: error.stack }) };
    }
};
