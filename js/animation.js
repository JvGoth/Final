// Fade-in ao rolar com suporte a elementos dinâmicos
document.addEventListener('DOMContentLoaded', () => {
  const appearOptions = { threshold: 0.2 };

  const appearOnScroll = new IntersectionObserver(function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, appearOptions);

  // Função para observar todos os .fade-in atuais
  function observeFaders() {
    const faders = document.querySelectorAll('.fade-in:not(.show)'); // Evita re-observar já visíveis
    faders.forEach(fader => appearOnScroll.observe(fader));
  }

  // Observa mutações no DOM para elementos novos (ex: cards dinâmicos)
  const mutationObserver = new MutationObserver(observeFaders);
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Observa iniciais
  observeFaders();
});
