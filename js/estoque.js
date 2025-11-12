// Arquivo: js/estoque.js

const READ_DATA_URL = '/.netlify/functions/ler_dados_produto';

async function atualizarDadosDosProdutos() {
    const productCards = document.querySelectorAll('.product-card, .carousel-item');

    for (const card of productCards) {
        const idChave = card.dataset.id;
        if (!idChave) continue;

        console.log(`Buscando ID: ${idChave}`); 

        try {
            const response = await fetch(`${READ_DATA_URL}?id=${idChave}`);
            console.log(`Resposta para ID ${idChave}: ${response.status}`);  // Log novo

            if (response.ok) {
                const dadosProduto = await response.json();
                console.log(`Dados para ID ${idChave}:`, dadosProduto);  // Log: Veja se vem dados

                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    priceElement.textContent = dadosProduto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton) addToCartButton.dataset.price = dadosProduto.preco;
                }

                let stockElement = card.querySelector('.stock') || card.querySelector('.estoque-info');
                if (!stockElement) {
                    stockElement = document.createElement('p');
                    stockElement.classList.add('stock');
                    card.appendChild(stockElement);
                }

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
                console.warn(`Produto ID ${idChave} não encontrado.`);
            }
        } catch (error) {
            console.error(`Erro ao processar ID ${idChave}:`, error);
        }
    }
}

document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
