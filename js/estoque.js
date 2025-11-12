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

                    // ATENÇÃO: Atualiza o data-price para que o cart.js possa funcionar (mas ignora em canecas.html)
                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton && !isCanecasPage) {
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
                const buyButton = card.querySelector('.add-to-cart') || card.querySelector('.whatsapp-buy-btn');

                if (stockElement) {
                    if (qtd > 0 && qtd <= 5) {
                        stockElement.textContent = `⚠ Restam apenas ${qtd} unidades!`;
                        stockElement.style.display = "block";
                    } else if (qtd > 5) {
                        stockElement.style.display = "none";
                    } else {
                        // Lógica para estoque 0: esconde mensagem e altera botão se necessário
                        stockElement.style.display = "none";
                        
                        if (buyButton && buyButton.classList.contains('add-to-cart')) {
                            // Para páginas normais: altera para WhatsApp se esgotado
                            const whatsappMessage = encodeURIComponent(`Olá! Gostaria de comprar o produto: ${card.dataset.name}`);
                            const whatsappNumber = '553599879068';
                            buyButton.outerHTML = `
                                <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}" 
                                   class="whatsapp-buy-btn" target="_blank">
                                    Comprar pelo WhatsApp
                                </a>
                            `;
                        }
                    }
                }

            } else {
                console.warn(`Produto ID ${idChave} não encontrado no cache do Bling. Mantendo dados estáticos.`);
                // Opcional: Se não encontrar, você pode desabilitar o botão de compra
            }

        } catch (error) {
            console.error(`Erro ao processar o ID ${idChave}:`, error);
        }
    }
}

// Garante que a função rode após a página carregar
document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
