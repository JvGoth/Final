// REMOVIDO: O wrapper 'DOMContentLoaded'

// ===============================================
// 1. Lógica da Barra de Pesquisa (Redirecionamento/Atualização)
// ===============================================
const searchButton = document.querySelector('.search-bar button');
const searchInput = document.querySelector('.search-bar input');

const performSearch = () => {
    const query = searchInput.value.trim();
    const currentPagePath = window.location.pathname.toLowerCase();
    
    // Verifica se a página atual é uma página de listagem de produtos
    const isProductListingPage = currentPagePath.includes('produtos.html') || currentPagePath.includes('canecas.html');
    
    if (isProductListingPage) {
        // Se estiver em uma página de listagem:
        // 1. Atualiza a URL com o parâmetro de busca (ex: canecas.html?q=caneca)
        const newUrl = query 
            ? `${currentPagePath.split('?')[0]}?q=${encodeURIComponent(query)}` 
            : currentPagePath.split('?')[0]; // Remove o 'q' se a busca for vazia
        
        // Usa pushState para atualizar a URL sem recarregar a página
        history.pushState(null, '', newUrl); 
        
        // 2. Chama a função de filtro imediatamente para atualizar os produtos na tela
        filterProducts(query);
        
    } else {
        // Se estiver na Home ou outra página:
        // Redireciona para a página principal de produtos como resultado de busca
        const targetUrl = query ? `produtos.html?q=${encodeURIComponent(query)}` : `produtos.html`;
        window.location.href = targetUrl;
    }
};

if (searchButton && searchInput) {
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Impede o submit padrão do formulário
            performSearch();
        }
    });
};

// ===============================================
// 2. Lógica para Exibir Resultados da Busca e Filtrar
// ===============================================

// Função de filtro isolada e robusta
function filterProducts(query) {
    const productCards = document.querySelectorAll('.product-card');
    const titleElement = document.querySelector('section h2');
    
    // Determina a query atual
    const currentQuery = query !== undefined ? query : getQueryParam('q');

    if (!productCards.length) return; 
    
    const normalizedQuery = currentQuery ? currentQuery.toLowerCase().trim() : '';
    let found = false;

    // 2.1. Filtragem de Produtos (agora apenas pelo NOME)
    productCards.forEach(card => {
        // Garante que o elemento exista antes de tentar pegar o conteúdo
        const name = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';

        // Se a query estiver vazia (mostra tudo) ou se houver correspondência apenas no NOME
        if (!normalizedQuery || name.includes(normalizedQuery)) {
            card.style.display = 'flex'; // Garante o display correto conforme seu CSS
            if (normalizedQuery) found = true; // Só marca como encontrado se houver query
        } else {
            card.style.display = 'none'; // Esconde se não for compatível
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
            const pageName = window.location.pathname.includes('canecas.html') ? "Canecas Personalizadas" : "Produtos da Loja";
            titleElement.textContent = `🛍️ ${pageName}`;
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
