// Arquivo: js/product_listing.js (Versão Final)

const LIST_ALL_URL = '/.netlify/functions/list_all_products'; 
const DEFAULT_IMAGE = 'imagens/default.jpg'; // Altere para o caminho da sua imagem padrão

/**
 * Converte os dados do produto em HTML
 */
function createProductCardHTML(id, produto) {
    // ✅ NOVO: Pega a URL salva no Blob (se existir, usa default se não)
    const imageUrl = produto.imagemUrl || DEFAULT_IMAGE;
    
    // Formatação de preço
    const precoFormatado = produto.preco ? 
                           new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco) : 
                           'R$ --,--';
    
    return `
        <div class="product-card fade-in" data-id="${id}" data-name="${produto.nome}">
            <img src="${imageUrl}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            
            <strong data-price>${precoFormatado}</strong>
            
            <p class="stock-info" data-stock-status style="display: none;"></p>
            
            <button class="add-to-cart" 
                    data-name="${produto.nome}" 
                    data-price="${produto.preco || 0}">
                Adicionar ao Carrinho
            </button>
        </div>
    `;
}

/**
 * Busca a lista de produtos e insere na página
 */
async function loadProductsFromBling() {
    // Tenta obter o container de listagem principal
    const productListContainer = document.querySelector('.product-list');
    
    if (!productListContainer) return; 

    productListContainer.innerHTML = '<h2>Carregando produtos...</h2>';
    
    try {
        const response = await fetch(LIST_ALL_URL);
        const data = await response.json();

        productListContainer.innerHTML = ''; // Limpa a mensagem de carregamento

        if (data.error) {
            productListContainer.innerHTML = '<h2>Erro ao carregar produtos. Tente mais tarde.</h2>';
            return;
        }

        let htmlContent = '';
        for (const id in data) {
            // AQUI VOCÊ PODE INSERIR UM FILTRO SE QUISER SEPARAR CANECAS DE OUTROS PRODUTOS
            // Exemplo: if (window.location.pathname.includes('canecas.html') && !data[id].nome.toLowerCase().includes('caneca')) continue;

            htmlContent += createProductCardHTML(id, data[id]);
        }
        
        productListContainer.innerHTML = htmlContent;
        
        // 3. ATUALIZA ESTOQUE/PREÇO: Chama o script de estoque/preço (que já existe e funciona com data-id)
        if (typeof atualizarDadosDosProdutos === 'function') {
             atualizarDadosDosProdutos();
        }

    } catch (error) {
        console.error("Erro na listagem de produtos:", error);
        productListContainer.innerHTML = '<h2>Não foi possível conectar ao banco de dados.</h2>';
    }
}

// Inicia o carregamento quando a página terminar de carregar
document.addEventListener('DOMContentLoaded', loadProductsFromBling);