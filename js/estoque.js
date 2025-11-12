// URL base para sua função de leitura de dados do produto
const READ_DATA_URL = '/.netlify/functions/ler_dados_produto';

/**
 * Função principal para buscar e atualizar o estoque e preço de todos os produtos na página.
 * Ela itera sobre todos os elementos com a classe .product-card.
 */
async function atualizarDadosDosProdutos() {
    // Busca todos os cards que possuem o ID
    const productCards = document.querySelectorAll('.product-card, .carousel-item');

    // Verifica se é a página de canecas
    const isCanecasPage = window.location.pathname.includes('canecas.html');

    for (const card of productCards) {
        // Assume que o ID está no data-id do cartão
        const idChave = card.dataset.id;

        if (!idChave) {
            continue;
        }

        console.log(`Buscando ID: ${idChave}`); // CORRIGIDO: Movido para cá, com backticks e ponto-e-vírgula

        try {
            // 1. CHAMA A NETLIFY FUNCTION de forma segura, passando 'id'
            const response = await fetch(`/.netlify/functions/ler_dados_produto?id=${idChave}`);

            if (response.ok) {
                const dadosProduto = await response.json();

                // 2. ATUALIZA O PREÇO
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong'); // Adicionado 'strong' para o index.html
                if (priceElement) {
                    priceElement.textContent = dadosProduto.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    });

                    // ATENÇÃO: Atualiza o data-price para que o cart.js possa funcionar (agora atualiza em todas as páginas, incluindo canecas.html)
                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton) {
                        addToCartButton.dataset.price = dadosProduto.preco;
                    }
                }

                // 3. ATUALIZA O ESTOQUE
                let stockElement = card.querySelector('.stock') || card.querySelector('.estoque-info');
                if (!stockElement) {
                    stockElement = document.createElement('p');
                    stockElement.classList.add('stock');
                    card.appendChild(stockElement); // Adiciona ao final do card
                }

                const qtd = dadosProduto.estoque || 0;
                const buyButton = card.querySelector('.add-to-cart'); // Apenas o add-to-cart (não altera whatsapp)

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

                // 4. DESABILITA ADD-TO-CART SE ESTOQUE <=0 (mantém o botão visível)
                if (buyButton) {
                    if (qtd <= 0) {
                        buyButton.disabled = true;
                        buyButton.textContent = 'Esgotado';
                        buyButton.classList.add('disabled');
                    } else {
                        buyButton.disabled = false;
                        buyButton.textContent = 'Adicionar ao Carrinho';
                        buyButton.classList.remove('disabled');
                    }
                }

            } else {
                console.warn(`Produto ID ${idChave} não encontrado no cache do Bling. Mantendo dados estáticos.`);
                // Fallback: Define preço como "Consultar" e desabilita add-to-cart
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    priceElement.textContent = 'Consultar';
                }
                const addToCartButton = card.querySelector('.add-to-cart');
                if (addToCartButton) {
                    addToCartButton.disabled = true;
                    addToCartButton.textContent = 'Indisponível';
                    addToCartButton.classList.add('disabled');
                }
            }

        } catch (error) {
            console.error(`Erro ao processar o ID ${idChave}:`, error);
        }
    }
}

// Garante que a função rode após a página carregar
document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
