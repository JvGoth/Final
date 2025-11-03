// header.js (Versão Corrigida - Inclui Variável CSS para Mobile)

// Variáveis de estado e elementos
var lastScrollTop = 0;
var delta = 5; // Tolerância em pixels para considerar a rolagem
var promoBar = document.querySelector('.promo-bar');
var header = document.getElementById('main-header');
var menuBar = document.getElementById('sticky-menu');

// Função para calcular alturas e ajustar posições iniciais
function adjustLayout() {
    // Garante que os elementos existam
    // Adicionado um pequeno delay para garantir que o DOM esteja pronto após o fetch
    setTimeout(() => {
        if (!header || !menuBar) {
            // Tenta encontrar os elementos novamente se falhar na primeira vez
            header = document.getElementById('main-header');
            menuBar = document.getElementById('sticky-menu');
            promoBar = document.querySelector('.promo-bar');
            if (!header || !menuBar) return;
        }

        var promoHeight = promoBar ? promoBar.offsetHeight : 0;
        var headerHeight = header.offsetHeight;
        var menuBarHeight = menuBar.offsetHeight;

        var totalOffset = promoHeight + headerHeight;

        // 1. Define a posição inicial correta dos elementos fixos (para o scroll)
        if (promoBar) {
            promoBar.style.top = '0px';
        }
        header.style.top = promoHeight + 'px'; // Header abaixo da barra de promoção
        menuBar.style.top = totalOffset + 'px'; // Menu abaixo do header

        // CHAVE: Define uma Variável CSS Global com a altura combinada
        // O CSS Mobile usa esta variável para posicionar o dropdown
        document.documentElement.style.setProperty('--menu-top-offset', totalOffset + 'px');
        
        // 2. Ajusta o padding superior do corpo da página para evitar que o conteúdo fique escondido
        // O CSS já tem 150px, aqui o JS ajusta para o valor exato.
        document.body.style.paddingTop = (totalOffset + menuBarHeight) + 'px';
    }, 10); // Um pequeno delay de 10ms ajuda a garantir que o innerHTML foi renderizado
}

// Função principal de rolagem para esconder/mostrar
function handleScroll() {
    // ... (Lógica de rolagem permanece a mesma) ...

    if (!header || !menuBar) return;

    var st = window.pageYOffset || document.documentElement.scrollTop;
    var promoHeight = promoBar ? promoBar.offsetHeight : 0;
    var headerHeight = header.offsetHeight;
    var totalOffset = promoHeight + headerHeight;

    if (Math.abs(lastScrollTop - st) <= delta) {
        return;
    }

    // 2. Lógica para rolar para baixo (Esconder)
    if (st > lastScrollTop && st > totalOffset) {
        header.style.top = -totalOffset + 'px';
        if (promoBar) {
            promoBar.style.top = -totalOffset + 'px';
        }
        menuBar.style.top = '0px';

    } 
    // 3. Lógica para rolar para cima (Mostrar)
    else {
        if (promoBar) {
            promoBar.style.top = '0px';
        }
        header.style.top = promoHeight + 'px';
        menuBar.style.top = totalOffset + 'px';
    }
    
    lastScrollTop = st;
}

// Adicionar listeners de scroll e resize
window.addEventListener('scroll', handleScroll);
window.addEventListener('resize', adjustLayout);

// REMOVIDO: window.addEventListener('load', adjustLayout);
// O 'load' já passou quando este script é carregado.

// ADICIONADO: Chama a função de ajuste imediatamente quando o script é carregado
adjustLayout();
