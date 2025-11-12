// Arquivo: js/product_listing.js

const LIST_ALL_URL = '/.netlify/functions/list_all_products'; 
const DEFAULT_IMAGE = 'imagens/default.jpg';

function createProductCardHTML(id, produto) {
    const imageUrl = produto.imagemUrl || DEFAULT_IMAGE;
    const precoFormatado = produto.preco ? 
                           new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco) : 
                           'R$ --,--';
    
    // Verifica se é a página de canecas para customizar o botão
    const isCanecasPage = window.location.pathname.includes('canecas.html');
    let buttonHTML;
    
    if (isCanecasPage) {
        // Botão que leva ao WhatsApp em vez de adicionar ao carrinho
        const whatsappMessage = encodeURIComponent(`Olá! Gostaria de comprar o produto: ${produto.nome}`);
        const whatsappNumber = '553599879068'; // Número do WhatsApp da loja
        buttonHTML = `
            <a href="https://wa.me/${whatsappNumber}?text=${whatsappMessage}" 
               class="whatsapp-buy-btn" target="_blank">
                Comprar pelo WhatsApp
            </a>
        `;
    } else {
        // Botão padrão de adicionar ao carrinho
        buttonHTML = `
            <button class="add-to-cart" 
                    data-name="${produto.nome}" 
                    data-price="${produto.preco || 0}">
                Adicionar ao Carrinho
            </button>
        `;
    }
    
    return `
        <div class="product-card fade-in" data-id="${id}" data-name="${produto.nome}">
            <img src="${imageUrl}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            <strong data-price>${precoFormatado}</strong>
            <p class="stock-info" data-stock-status style="display: none;"></p>
            ${buttonHTML}
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
        console.log('Resposta do fetch:', response.status, response.statusText);  // Log detalhado
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${await response.text()}`);
        }
        const data = await response.json();
        console.log('Dados recebidos completos:', data);  // Log: Veja se vazio ou com erro

        productListContainer.innerHTML = ''; 

        if (data.error) {
            productListContainer.innerHTML = '<h2>Erro ao carregar produtos: ' + data.error + '</h2>';
            return;
        }

        let htmlContent = '';
        let count = 0;
        for (const id in data) {
            const nomeLower = data[id].nome.toLowerCase();
            // Filtro para canecas.html: só mostra se contém 'caneca', 'garrafa' ou 'copo'
            if (window.location.pathname.includes('canecas.html') && 
                !(nomeLower.includes('caneca') || 
                  nomeLower.includes('garrafa') || 
                  nomeLower.includes('copo'))) {
                continue;
            }
            htmlContent += createProductCardHTML(id, data[id]);
            count++;
        }
        console.log(`Gerados ${count} cards de produtos.`); 
        
        productListContainer.innerHTML = htmlContent || '<h2>Nenhum produto disponível no momento.</h2>';  // Mensagem se vazio
        
        if (typeof atualizarDadosDosProdutos === 'function') {
            atualizarDadosDosProdutos();
        }

    } catch (error) {
        console.error("Erro na listagem de produtos:", error);
        productListContainer.innerHTML = '<h2>Não foi possível conectar ao banco de dados: ' + error.message + '</h2>';
    }
}

document.addEventListener('DOMContentLoaded', loadProductsFromBling);
