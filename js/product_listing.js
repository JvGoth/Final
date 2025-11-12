// Arquivo: js/product_listing.js - Versão Final com Debug

const LIST_ALL_URL = '/.netlify/functions/list_all_products';
const DEFAULT_IMAGE = 'imagens/default.jpg';

/**
 * Cria o HTML do card.
 */
function createProductCardHTML(id, produto) {
    const imageUrl = produto.imagemUrl || DEFAULT_IMAGE;
    
    // Lógica de Preço (AGORA SEMPRE FORMATA)
    const preco = produto.preco || 0;
    const precoFormatado = new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(preco);

    // Lógica de Estoque
    const estoque = produto.estoque || 0;
    let stockHTML = '';
    
    if (estoque > 5) {
        stockHTML = `<p class="stock-info" data-stock-status style="display: block; color: #4CAF50;">Em estoque (${estoque})</p>`;
    } else if (estoque > 0 && estoque <= 5) {
        stockHTML = `<p class="stock-info" data-stock-status style="display: block;">⚠ Restam apenas ${estoque} unidades!</p>`;
    } else if (estoque <= 0) {
        stockHTML = `<p class="stock-info" data-stock-status style="display: block;">Esgotado</p>`;
    }

    const whatsappMessage = encodeURIComponent(`Olá! Gostaria de comprar o produto: ${produto.nome}`);
    const whatsappNumber = '553599879068'; 

    return `
        <div class="product-card fade-in" data-id="${id}" data-name="${produto.nome}">
            <img src="${imageUrl}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <strong data-price>${precoFormatado}</strong>
            
            ${stockHTML}
            
            <div class="product-buttons">
                <button class="add-to-cart" 
                        data-name="${produto.nome}" 
                        data-price="${preco}">
                    Adicionar ao Carrinho
                </button>
                <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}" 
                   class="whatsapp-buy-btn" target="_blank">
                    Comprar pelo WhatsApp
                </a>
            </div>
        </div>
    `;
}

/**
 * Função principal para carregar os produtos.
 */
async function loadProductsFromBling() {
    const productListContainer = document.querySelector('.product-list');
    if (!productListContainer) {
        console.error('Container .product-list não encontrado no HTML.');
        productListContainer.innerHTML = '<h2>Erro ao carregar produtos. Verifique o console (F12) para detalhes do servidor.</h2>';
        return;
    }

    productListContainer.innerHTML = '<h2>Carregando produtos...</h2>';

    try {
        const response = await fetch(LIST_ALL_URL);
        
        // --- LOG DE DEBUG CRÍTICO 1 ---
        console.log('Status da requisição de produtos:', response.status); 

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erro na função Netlify (list_all_products): Status ${response.status}. Detalhes: ${errorText}`);
            return;
        }
        
        const data = await response.json();
        
        // --- LOG DE DEBUG CRÍTICO 2 ---
        console.log('Dados de produtos recebidos (JSON COMPLETO):', data); 

        productListContainer.innerHTML = ''; 

        if (data.error) {
            productListContainer.innerHTML = '<h2>Erro ao carregar produtos: ' + data.error + '</h2>';
            return;
        }

        let htmlContent = '';
        let count = 0;
        for (const id in data) {
            // Log de Preço Individual
            if (data[id].preco === undefined || data[id].preco === null) {
                console.warn(`Produto ${data[id].nome} (ID ${id}) não tem o campo 'preco' no JSON.`);
            } else {
                // --- LOG DE DEBUG CRÍTICO 3 ---
                console.log(`Preço de ${data[id].nome} (ID ${id}): ${data[id].preco}`);
            }

            htmlContent += createProductCardHTML(id, data[id]);
            count++;
        }
        
        productListContainer.innerHTML = htmlContent || '<h2>Nenhum produto disponível no momento.</h2>';
        
    } catch (error) {
        console.error("Erro na listagem de produtos (Geral):", error);
        productListContainer.innerHTML = '<h2>Não foi possível conectar ao servidor. Verifique sua conexão ou a função Netlify.</h2>';
    }
}

document.addEventListener('DOMContentLoaded', loadProductsFromBling);


