// js/estoque.js - Versão Adaptada para Bling/Netlify Functions

// URL base para sua função de leitura de dados do produto
const READ_DATA_URL = '/.netlify/functions/ler_dados_produto';

/**
 * Função principal para buscar e atualizar o estoque e preço de todos os produtos na página.
 * Ela itera sobre todos os elementos com a classe .product-card.
 */
async function atualizarDadosDosProdutos() {
    // Busca todos os cards que possuem o SKU, incluindo os do carrossel
    const productCards = document.querySelectorAll('.product-card, .carousel-item');

    for (const card of productCards) {
        // Assume que o SKU está no data-sku do cartão ou em um elemento interno
        const sku = card.dataset.sku; 

        // Se o card não tiver o atributo data-sku, pulamos para o próximo
        if (!sku) {
            continue; 
        }

        try {
            // 1. CHAMA A NETLIFY FUNCTION de forma segura
            const response = await fetch(`${READ_DATA_URL}?sku=${sku}`);

            if (response.ok) {
                const dadosProduto = await response.json();
                
                // 2. ATUALIZA O PREÇO
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price');
                if (priceElement) {
                    priceElement.textContent = dadosProduto.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    });
                    
                    // ATENÇÃO: Atualiza o data-price para que o cart.js possa funcionar corretamente
                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton) {
                        addToCartButton.dataset.price = dadosProduto.preco; 
                    }
                }

                // 3. ATUALIZA O ESTOQUE
                const stockElement = card.querySelector('.stock') || card.querySelector('.estoque-info'); 
                if (stockElement) {
                    const qtd = dadosProduto.estoque;
                    
                    if (qtd > 0 && qtd <= 5) {
                        stockElement.textContent = `⚠ Restam apenas ${qtd} unidades!`;
                        stockElement.style.display = "block";
                    } else if (qtd > 5) {
                        stockElement.style.display = "none";
                    } else {
                        stockElement.textContent = `Produto Esgotado!`;
                        stockElement.style.display = "block";
                        const buyButton = card.querySelector('.add-to-cart');
                        if (buyButton) {
                             buyButton.textContent = 'Esgotado';
                             buyButton.disabled = true; 
                        }
                    }
                }
                
            } else {
                console.warn(`Produto SKU ${sku} não encontrado no cache do Bling.`);
            }

        } catch (error) {
            console.error(`Erro ao processar o SKU ${sku}:`, error);
        }
    }
}

// Garante que a função rode após a página carregar
document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
