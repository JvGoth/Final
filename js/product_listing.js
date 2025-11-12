// Arquivo: js/product_listing.js (Versão Final)

const LIST_ALL_URL = '/.netlify/functions/list_all_products'; 
const DEFAULT_IMAGE = 'imagens/default.jpg'; // Altere para o caminho da sua imagem padrão

function createProductCardHTML(id, produto) {
    const imageUrl = produto.imagemUrl || DEFAULT_IMAGE;
    const precoFormatado = produto.preco ? 
                           new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco) : 
                           'R$ --,--';
    
    return `
        <div class="product-card fade-in" data-id="$$ {id}" data-name=" $${produto.nome}">
            <img src="$$ {imageUrl}" alt=" $${produto.nome}">
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

async function loadProductsFromBling() {
    const productListContainer = document.querySelector('.product-list');
    if (!productListContainer) return; 

    productListContainer.innerHTML = '<h2>Carregando produtos...</h2>';
    
    try {
        const response = await fetch(LIST_ALL_URL);
        console.log('Resposta do fetch:', response.status);  // Log: Veja no console do browser
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dados recebidos:', data);  // Log: Veja se vazio ou com produtos

        productListContainer.innerHTML = ''; 

        if (data.error) {
            productListContainer.innerHTML = '<h2>Erro ao carregar produtos. Tente mais tarde.</h2>';
            return;
        }

        let htmlContent = '';
        let count = 0;
        for (const id in data) {
            // Filtro só para canecas.html
            if (window.location.pathname.includes('canecas.html') && !data[id].nome.toLowerCase().includes('caneca')) continue;
            htmlContent += createProductCardHTML(id, data[id]);
            count++;
        }
        console.log(`Gerados ${count} cards de produtos.`);  // Log: Quantos mostrados
        
        productListContainer.innerHTML = htmlContent;
        
        if (typeof atualizarDadosDosProdutos === 'function') {
            atualizarDadosDosProdutos();
        }

    } catch (error) {
        console.error("Erro na listagem de produtos:", error);
        productListContainer.innerHTML = '<h2>Não foi possível conectar ao banco de dados.</h2>';
    }
}

document.addEventListener('DOMContentLoaded', loadProductsFromBling);
