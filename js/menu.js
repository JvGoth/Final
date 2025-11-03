// ATENÇÃO: Use querySelector para selecionar a CLASSE
const menuToggle = document.querySelector('.menu-toggle'); 
const navList = document.querySelector('.nav-list');       

// REMOVIDO: O wrapper 'DOMContentLoaded'
if (menuToggle && navList) {
    menuToggle.addEventListener('click', () => {
        // Alterna a classe 'active' no ícone (para a animação X)
        menuToggle.classList.toggle('active');
        
        // Alterna a classe 'active' na lista de navegação (para mostrar/esconder o menu)
        navList.classList.toggle('active');

        // [NOVO] Adiciona/Remove classe no body para travar o scroll
        document.body.classList.toggle('menu-open');
    });

    // Opcional: Fechar o menu ao clicar em um link
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navList.classList.remove('active');

            // [NOVO] Garante que o scroll seja liberado ao clicar em um link
            document.body.classList.remove('menu-open');
        });
    });
}
