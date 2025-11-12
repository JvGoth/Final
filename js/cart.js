/**
 * Este script espera o HTML principal ser carregado
 * e, em seguida, espera o cabeçalho (assíncrono) ser
 * injetado antes de inicializar o carrinho.
 */
document.addEventListener("DOMContentLoaded", function() {

    // Função principal que configura o carrinho
    function initializeCart() {

        // --- 1. Seletores do DOM ---
        // Agora usando querySelector para IDs e Classes, baseado no style.css
        // IDs:
        const cartItemsContainer = document.getElementById("cart-items-container");
        const cartTotal = document.getElementById("cart-total"); // Este ID não estava no CSS, mantive do seu JS original.

        // Classes (baseado no style.css e lógica):
        const cartIcon = document.querySelector(".cart-icon");
        const cartModal = document.querySelector(".cart-modal");
        const closeCartBtn = document.querySelector(".close-cart");
        const cartCount = document.querySelector(".cart-count");
        const checkoutBtn = document.querySelector(".btn-checkout");

        // --- 2. Estado do Carrinho ---
        let cart = JSON.parse(localStorage.getItem("miauCart")) || [];

        // --- 3. Funções Principais ---

        function saveCart() {
            localStorage.setItem("miauCart", JSON.stringify(cart));
        }

        function formatCurrency(value) {
            return parseFloat(value).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            });
        }

        function updateCartSummary() {
            let totalItems = 0;
            let totalPrice = 0;

            cart.forEach(item => {
                totalItems += item.quantity;
                totalPrice += item.price * item.quantity;
            });

            if (cartCount) {
                cartCount.textContent = totalItems;
            }
            if (cartTotal) {
                cartTotal.textContent = formatCurrency(totalPrice);
            }
        }

        function renderCartItems() {
            if (!cartItemsContainer) return;

            cartItemsContainer.innerHTML = "";

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p class="cart-empty">Seu carrinho está vazio.</p>';
                // Esconde botão de WhatsApp se carrinho vazio
                const whatsappCartBtn = document.querySelector('.whatsapp-cart-btn');
                if (whatsappCartBtn) whatsappCartBtn.style.display = 'none';
                return;
            }

            cart.forEach((item, index) => {
                const itemImage = item.image || 'imagens/placeholder.jpg';
                const itemHTML = `
                    <div class="cart-item" data-index="${index}">
                        <img src="${itemImage}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>${formatCurrency(item.price)} cada</p>
                            <div class="quantity-controls">
                                <button class="decrease">-</button>
                                <span>${item.quantity}</span>
                                <button class="increase">+</button>
                            </div>
                            <p>Subtotal: ${formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <button class="remove-item">Remover</button>
                    </div>
                `;
                cartItemsContainer.innerHTML += itemHTML;
            });

            // Adiciona ou mostra o botão de WhatsApp no carrinho
            let whatsappCartBtn = document.querySelector('.whatsapp-cart-btn');
            if (!whatsappCartBtn) {
                whatsappCartBtn = document.createElement('a');
                whatsappCartBtn.classList.add('whatsapp-cart-btn');
                whatsappCartBtn.textContent = 'Comprar pelo WhatsApp';
                whatsappCartBtn.target = '_blank';
                // Insere após o total ou no final do modal
                if (cartTotal && cartTotal.parentNode) {
                    cartTotal.parentNode.appendChild(whatsappCartBtn);
                } else {
                    cartItemsContainer.appendChild(whatsappCartBtn);
                }
            }
            whatsappCartBtn.style.display = 'block';

            // Gera mensagem com todos os itens
            let message = 'Olá! Gostaria de comprar os seguintes itens do carrinho:\n';
            cart.forEach(item => {
                message += `- ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
            });
            message += `\nTotal: ${formatCurrency(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`;
            const whatsappNumber = '553599879068'; // Número da loja
            whatsappCartBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        }

        function addToCart(product) {
            const existingItem = cart.find(item => item.name === product.name);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            saveCart();
            updateCartUI();
            alert(`${product.name} adicionado ao carrinho!`);
        }

        function handleCartItemClick(e) {
            const itemElement = e.target.closest('.cart-item');
            if (!itemElement) return;

            const index = parseInt(itemElement.dataset.index);

            if (e.target.matches('.increase')) {
                cart[index].quantity += 1;
            } else if (e.target.matches('.decrease') && cart[index].quantity > 1) {
                cart[index].quantity -= 1;
            } else if (e.target.matches('.remove-item')) {
                cart.splice(index, 1);
            }

            saveCart();
            updateCartUI();
        }

        function checkout() {
            if (cart.length === 0) {
                alert("Seu carrinho está vazio!");
                return;
            }
            alert("Redirecionando para o checkout... (simulação)");
            // Aqui você pode integrar com pagamento real
            cart = [];
            saveCart();
            updateCartUI();
        }

        function updateCartUI() {
            renderCartItems();
            updateCartSummary();
        }

        // --- 4. Listeners de Eventos ---
        if (cartIcon) {
            cartIcon.addEventListener("click", () => {
                if (cartModal) cartModal.style.display = "flex";
                updateCartUI();
            });
        } else {
            console.error("Elemento .cart-icon não encontrado.");
        }

        if (closeCartBtn) {
            closeCartBtn.addEventListener("click", () => {
                if (cartModal) cartModal.style.display = "none";
            });
        } else {
             console.error("Elemento .close-cart não encontrado.");
        }

        if (cartModal) {
            window.addEventListener("click", (e) => {
                if (e.target === cartModal) {
                    cartModal.style.display = "none";
                }
            });
        }

        // Este listener (no body) funciona mesmo antes do header carregar
        document.body.addEventListener("click", (e) => {
            if (e.target.matches(".add-to-cart")) {
                e.preventDefault();
                const button = e.target;
                
                const product = {
                    name: button.dataset.name,
                    price: parseFloat(button.dataset.price),
                    image: button.dataset.image || button.closest('.product-card, .carousel-item')?.querySelector('img')?.src
                };

                if (product.name && product.price) {
                    addToCart(product);
                } else {
                    console.error("Botão .add-to-cart sem data-name ou data-price.");
                }
            }
        });

        if (cartItemsContainer) {
            cartItemsContainer.addEventListener("click", handleCartItemClick);
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener("click", checkout);
        } else {
             console.error("Elemento .btn-checkout não encontrado.");
        }

        // --- 5. Inicialização ---
        updateCartUI();
        console.log("Carrinho inicializado com sucesso!");

    } // Fim da função initializeCart()


    // --- Lógica de Espera (Resolver Race Condition) ---
    // Vamos verificar a cada 100ms se o header já foi carregado
    // Usamos ".cart-icon" como nossa "âncora"
    
    const headerCheckInterval = setInterval(() => {
        // Mude ".cart-icon" se o seletor principal do seu header for outro
        if (document.querySelector(".cart-icon")) {
            clearInterval(headerCheckInterval); // Para o verificador
            initializeCart(); // Roda o script do carrinho
        }
    }, 100); // Verifica a cada 100ms
    
});
