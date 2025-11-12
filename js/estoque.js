// Arquivo: js/estoque.js

const READ_DATA_URL = '/.netlify/functions/ler_dados_produto';

async function atualizarDadosDosProdutos() {
    const productCards = document.querySelectorAll('.product-card, .carousel-item');

    for (const card of productCards) {
        const idChave = card.dataset.id;
        if (!idChave) {
            continue;
        }

        console.log(`Buscando ID (estoque.js): ${idChave}`);

        try {
            const response = await fetch(`${READ_DATA_URL}?id=${idChave}`);

            if (response.ok) {
                const dadosProduto = await response.json();

                // --- ATUALIZA O PREÇO (MODIFICADO) ---
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    const preco = dadosProduto.preco || 0;
                    // REMOVIDA A CONDIÇÃO (preco > 0). Sempre formata.
                    const precoFormatado = preco.toLocaleString('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                    });
                    
                    priceElement.textContent = precoFormatado;

                    const addToCartButton = card.querySelector('.add-to-cart');
                    if (addToCartButton) {
                        addToCartButton.dataset.price = preco; 
                    }
                }

                // --- ATUALIZA O ESTOQUE (MODIFICADO) ---
                let stockElement = card.querySelector('.stock-info'); 
                if (!stockElement) {
                    stockElement = card.querySelector('.stock') || card.querySelector('.estoque-info');
                }
                if (!stockElement) {
                    stockElement = document.createElement('p');
                    stockElement.classList.add('stock-info');
                    card.appendChild(stockElement);
                }

                const qtd = dadosProduto.estoque || 0;

                if (stockElement) {
                    if (qtd > 5) {
                        // MUDANÇA: Exibe estoque alto
                        stockElement.textContent = `Em estoque (${qtd})`;
                        stockElement.style.display = "block";
                        stockElement.style.color = "#4CAF50"; // Verde
                    } else if (qtd > 0) {
                        stockElement.textContent = `⚠ Restam apenas ${qtd} unidades!`;
                        stockElement.style.display = "block";
                        stockElement.style.color = ""; // Cor padrão
                    } else {
                        stockElement.textContent = `Esgotado`;
                        stockElement.style.display = "block";
                        stockElement.style.color = ""; // Cor padrão
                    }
                }

            } else {
                console.warn(`Produto ID ${idChave} não encontrado no cache. Mantendo dados estáticos.`);
                // Fallback (MODIFICADO)
                const priceElement = card.querySelector('.product-price') || card.querySelector('.price') || card.querySelector('strong');
                if (priceElement) {
                    // Mostra R$ 0,00 em vez de "Consultar"
                    priceElement.textContent = (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
                const addToCartButton = card.querySelector('.add-to-cart');
                if (addToCartButton) {
                    addToCartButton.dataset.price = 0;
                }
            }

        } catch (error) {
            console.error(`Erro ao processar o ID ${idChave} (estoque.js):`, error);
        }
    }
}

document.addEventListener("DOMContentLoaded", atualizarDadosDosProdutos);
