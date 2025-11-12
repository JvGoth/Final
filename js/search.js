// REMOVIDO: O wrapper 'DOMContentLoaded'

// ===============================================
// 1. Lógica da Barra de Pesquisa (Redirecionamento/Atualização)
// ===============================================
const searchButton = document.querySelector('.search-bar button');
const searchInput = document.querySelector('.search-bar input');

const performSearch = () => {
    const query = searchInput.value.trim();
    const currentPagePath = window.location.pathname.toLowerCase();
    
    // Verifica se a página atual é uma página de listagem de produtos ou index com carousel/produtos
    const isProductPage = currentPagePath.includes('produtos.html') || currentPagePath.includes('canecas.html') || currentPagePath.includes('index.html');
    
    if (isProductPage) {
        // Atualiza a URL com o parâmetro de busca
        const newUrl = query 
            ? `${currentPagePath.split('?')[0]}?q=${encodeURIComponent(query)}` 
            : currentPagePath.split('?')[0];
        
        history.pushState(null, '', newUrl); 
        
        // Chama a função de filtro imediatamente
        filterProducts(query);
        
    } else {
        // Redireciona para produtos.html se não for página de produtos
        const targetUrl = query ? `produtos.html?q=${encodeURIComponent(query)}` : `produtos.html`;
        window.location.href = targetUrl;
    }
};

if (searchButton && searchInput) {
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
};

// ===============================================
// 2. Lógica para Exibir Resultados da Busca e Filtrar
// ===============================================

// Função de filtro isolada e robusta
function filterProducts(query) {
    const productCards = document.querySelectorAll('.product-card, .carousel-item');
    let titleElement = document.querySelector('section h2');
    if (window.location.pathname.includes('index.html')) {
        titleElement = document.querySelector('.dynamic-products h2'); // Título específico para index.html
    }
    
    // Determina a query atual
    const currentQuery = query !== undefined ? query : getQueryParam('q');

    if (!productCards.length) return; 
    
    const normalizedQuery = currentQuery ? currentQuery.toLowerCase().trim() : '';
    let found = false;

    // 2.1. Filtragem de Produtos
    productCards.forEach(card => {
        // Garante que o elemento exista antes de tentar pegar o conteúdo
        const nameElement = card.querySelector('h3') || card.querySelector('h4');
        const descElement = card.querySelector('p:not(.stock):not(.stock-info)');
        
        const name = nameElement ? nameElement.textContent.toLowerCase() : (card.dataset.name || '').toLowerCase();
        const description = descElement ? descElement.textContent.toLowerCase() : '';

        // Se a query estiver vazia (mostra tudo) ou se houver correspondência
        if (!normalizedQuery || name.includes(normalizedQuery) || description.includes(normalizedQuery)) {
            card.style.display = ''; // Reseta para display original (block/flex conforme CSS)
            if (normalizedQuery) found = true;
        } else {
            card.style.display = 'none';
        }
    });

    // 2.2. Atualiza Título (se elemento existir)
    if (titleElement) {
        if (normalizedQuery) {
            // Mostra a mensagem de resultado da busca
            if (found) {
                titleElement.textContent = `Resultados da busca por: "${normalizedQuery}"`;
            } else {
                titleElement.textContent = `Nenhum resultado encontrado para: "${normalizedQuery}"`;
            }
        } else {
            // Título padrão para páginas de listagem sem query
            let pageName = "Nossos Produtos";
            if (window.location.pathname.includes('canecas.html')) pageName = "Canecas Personalizadas";
            else if (window.location.pathname.includes('index.html')) pageName = "🛍️ Produtos da Loja";
            titleElement.textContent = pageName;
        }
    }
}

// 2.3. Executa o filtro no carregamento da página se houver query na URL
const initialSearchQuery = getQueryParam('q');
if (initialSearchQuery) {
    filterProducts(initialSearchQuery);
}


// Função utilitária para pegar o parâmetro 'q' (query) da URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
