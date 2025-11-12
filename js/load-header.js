// 1. Encontra o local onde o header deve ser inserido
    const headerPlaceholder = document.getElementById("header-placeholder");
    
    if (headerPlaceholder) {
        // 2. Busca o conteúdo do arquivo header.html
        fetch("header.html")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erro ao carregar header.html: " + response.statusText);
                }
                return response.text();
            })
            .then(data => {
                // 3. Insere o HTML do header no local
                headerPlaceholder.innerHTML = data;
                
                // 4. Carrega os scripts que dependem do header
                loadScript("js/header.js");
                loadScript("js/menu.js");
                loadScript("js/search.js");
                loadScript("js/cart.js");
                loadScript("js/user.js");
                loadScript("js/carrosel.js");
            })
            .catch(error => {
                console.error("Falha ao carregar o header:", error);
                headerPlaceholder.innerHTML = "<p style='text-align:center; color:red; padding:20px;'>Erro ao carregar o menu. Tente recarregar a página.</p>";
            });
    }

// Função auxiliar para carregar scripts dinamicamente
function loadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
}
