// Arquivo: js/product_listing.js

const LIST_ALL_URL = '/.netlify/functions/list_all_products';
const DEFAULT_IMAGE = 'imagens/default.jpg';

/**
 * Função ATUALIZADA para criar o card completo, incluindo o status do estoque.
 */
function createProductCardHTML(id, produto) {
    const imageUrl = produto.imagemUrl || DEFAULT_IMAGE;
    
    // Lógica de Preço (Correta)
    const preco = produto.preco || 0;
    const precoFormatado = (preco > 0) ?
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(preco) :
        'Consultar';

    // Lógica de Estoque (Nova)
    const estoque = produto.estoque || 0;
    let stockHTML = '';
    if (estoque > 0 && estoque <= 5) {
        stockHTML = `<p class="stock-info" data-stock-status style="display: block;">⚠ Restam apenas ${estoque} unidades!</p>`;
    } else if (estoque <= 0) {
        stockHTML = `<p class="stock-info" data-stock-status style="display: block;">Esgotado</p>`;
    } else {
        stockHTML = `<p class="stock-info" data-stock-status style="display: none;"></p>`;
    }

    const whatsappMessage = encodeURIComponent(`Olá! Gostaria de comprar o produto: ${produto.nome}`);
    const whatsappNumber = '553599879068'; // Número do WhatsApp da loja

    return `
        <div class="product-card fade-in" data-id="${id}" data-name="${produto.nome}">
            <img src="${imageUrl}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <strong data-price>${precoFormatado}</strong>
            
            ${stockHTML}
            
            <div class="product-buttons">
                <button class="add-to-cart" 
                        data-name="${produto.nome}" 
                        data-price="${preco}"> Adicionar ao Carrinho
                </button>
                <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}" 
                   class="whatsapp-buy-btn" target="_blank">
                    Comprar pelo WhatsApp
                </a>
            </div>
        </div>
    `;
}

async function loadProductsFromBling() {
    const productListContainer = document.querySelector('.product-list');
    if (!productListContainer) {
        console.error('Container .product-list não encontrado no HTML.');
        return;
    }

    productListContainer.innerHTML = '<h2>Carregando produtos...</h2>';

    try {
        const response = await fetch(LIST_ALL_URL);
        console.log('Resposta do fetch:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Dados recebidos completos:', data);

        productListContainer.innerHTML = '';

        if (data.error) {
            productListContainer.innerHTML = '<h2>Erro ao carregar produtos: ' + data.error + '</h2>';
            return;
        }

        let htmlContent = '';
        let count = 0;
        for (const id in data) {
            const nomeLower = data[id].nome.toLowerCase();
            // Filtro para canecas.html
            if (window.location.pathname.includes('canecas.html') &&
                !(nomeLower.includes('caneca') ||
                    nomeLower.includes('garrafa') ||
                    nomeLower.includes('copo'))) {
                console.log('Produto pulado pelo filtro:', nomeLower);
                continue;
            }
            htmlContent += createProductCardHTML(id, data[id]);
            count++;
        }
        console.log(`Gerados ${count} cards de produtos.`);

        productListContainer.innerHTML = htmlContent || '<h2>Nenhum produto disponível no momento.</h2>';

        // REMOVIDO: O 'estoque.js' (atualizarDadosDosProdutos) não é mais chamado aqui.
        
    } catch (error) {
        console.error("Erro na listagem de produtos:", error);
        productListContainer.innerHTML = '<h2>Não foi possível conectar ao banco de dados: ' + error.message + '</h2>';
    }
}

document.addEventListener('DOMContentLoaded', loadProductsFromBling);
