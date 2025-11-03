// Exibir aviso de estoque baixo em páginas de produtos fixos
  document.querySelectorAll(".stock").forEach(el => {
    const qtd = parseInt(el.dataset.qtd);
    if (qtd <= 5) {
      el.textContent = `⚠ Restam apenas ${qtd} unidades!`;
      el.style.display = "block";
    } else {
      el.style.display = "none";
    }
  });
