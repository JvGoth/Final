// Arquivo: js/estoque.js

// URL base para sua função de leitura de dados do produto
const READ_DATA_URL = '/.netlify/functions/ler_dados_produto';

/**
 * Função principal para buscar e atualizar o estoque e preço de todos os produtos na página.
 * Ela itera sobre todos os elementos com a classe .product-card ou .carousel-item.
 */
async function atualizarDadosDosProdutos() {
    // Busca todos os cards (do carrossel estático ou de listas de produtos estáticas)
    const productCards = document.querySelectorAll('.product-card, .carousel-item');

    for (const card of productCards) {
        const idChave = card.dataset.id;
        if (!idChave) {
            continue;
        }

        console.log(`Buscando ID (estoque.js): ${idChave}`);

        try {
            // 1. CHAMA A NETLIFY FUNCTION
            const response = await fetch(`${READ_DATA_URL}?id=${idChave}`);

            if (response.ok) {
                const dadosProduto = await response.json();

                // 2. ATUALIZA O PREÇO (COM LÓGICA CORRIGIDA)
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    const preco = dadosProduto.preco || 0;
                    const precoFormatado = (preco > 0) ?
                        preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
                        'Consultar';
                    
                    priceElement.textContent = precoFormatado;

                    // Atualiza o data-price do botão do carrinho
                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton) {
                        addToCartButton.dataset.price = preco; // Salva 0 ou o preço
                    }
                }

                // 3. ATUALIZA O ESTOQUE
                let stockElement = card.querySelector('.stock-info'); // Usando a classe definida no product_listing
                if (!stockElement) {
                    stockElement = card.querySelector('.stock') || card.querySelector('.estoque-info');
                }
                if (!stockElement) {
                    stockElement = document.createElement('p');
                    stockElement.classList.add('stock-info'); // Mantém o padrão
                    card.appendChild(stockElement);
                }

                const qtd = dadosProduto.estoque || 0;

                if (stockElement) {
                    if (qtd > 5) {
                        stockElement.style.display = "none";
                    } else if (qtd > 0) {
                        stockElement.textContent = `⚠ Restam apenas ${qtd} unidades!`;
                        stockElement.style.display = "block";
                    } else {
                        stockElement.textContent = `Esgotado`;
                        stockElement.style.display = "block";
                    }
                }

            } else {
                console.warn(`Produto ID ${idChave} não encontrado no cache. Mantendo dados estáticos.`);
                // Fallback: Define preço como "Consultar"
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    priceElement.textContent = 'Consultar';
                }
                const addToCartButton = card.querySelector('.add-to-cart');
                if (addToCartButton) {
                    addToCartButton.dataset.price = 0; // Garante que o carrinho saiba que é 0
                }
            }

        } catch (error) {
            console.error(`Erro ao processar o ID ${idChave} (estoque.js):`, error);
        }
    }
}

// Garante que a função rode após a página carregar
document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
