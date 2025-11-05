// js/custom-mug.js
const submitButton = document.getElementById('submit-custom-mug');
if (submitButton) {
  submitButton.addEventListener('click', function() {
    // Coleta os dados do formulário
    const nome = document.getElementById('nome').value || 'Não informado';
    const cor = document.getElementById('cor').value;
    const imagem = document.getElementById('imagem').files[0];

    // Constrói a mensagem para o WhatsApp
    let mensagem = `Olá! Gostaria de solicitar um orçamento para uma caneca personalizada.\n\n`;
    mensagem += `Nome/Frase: ${nome}\n`;
    mensagem += `Cor da Caneca: ${cor}\n`;

    if (imagem) {
      mensagem += `Enviei uma imagem opcional (irei enviar separadamente via WhatsApp).\n`;
    } else {
      mensagem += `Sem imagem opcional.\n`;
    }

    // Número do WhatsApp (corrigido para combinar com o HTML)
    const numeroWhatsApp = '553599879068';

    // Codifica a mensagem para URL
    const mensagemCodificada = encodeURIComponent(mensagem);

    // Abre o WhatsApp com a mensagem pré-preenchida
    window.open(`https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`, '_blank');

    // Limpa os campos (já que não é submit real)
    document.getElementById('nome').value = '';
    document.getElementById('cor').value = 'Branca';
    document.getElementById('imagem').value = '';

    // Nota sobre a imagem
    if (imagem) {
      alert('O chat do WhatsApp será aberto. Por favor, envie a imagem manualmente no chat.');
    }
  });
}