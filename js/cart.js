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
                return;
            }

            cart.forEach((item, index) => {
                const itemImage = item.image || 'imagens/placeholder.jpg';
                const itemHTML = `
                    <div class="cart-item" data-index="${index}">
                        <img src="${itemImage}" alt="${item.name}">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p>${formatCurrency(item.price)}</p>
                        </div>
                        <div class="cart-item-controls">
                            <button class="quantity-change" data-action="decrease">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-change" data-action="increase">+</button>
                            <button class="remove-item">X</button>
                        </div>
                    </div>
                `;
                cartItemsContainer.innerHTML += itemHTML;
            });
        }

        function addToCart(product) {
            const existingItemIndex = cart.findIndex(item => item.name === product.name);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            saveCart();
            updateCartUI();
            showAddedConfirmation(product.name);
        }

        function showAddedConfirmation(productName) {
            if (cartIcon) {
                // 'shake' é uma animação opcional, você precisaria adicioná-la ao CSS
                cartIcon.classList.add('shake'); 
                console.log(`${productName} adicionado ao carrinho!`);
                setTimeout(() => {
                    cartIcon.classList.remove('shake');
                }, 500);
            }
        }

        function handleCartItemClick(e) {
            const target = e.target;
            const cartItem = target.closest(".cart-item");
            
            if (!cartItem) return;
            
            const index = parseInt(cartItem.dataset.index);

            if (target.classList.contains("remove-item")) {
                cart.splice(index, 1);
            }

            if (target.classList.contains("quantity-change")) {
                const action = target.dataset.action;
                if (action === "increase") {
                    cart[index].quantity += 1;
                } else if (action === "decrease") {
                    if (cart[index].quantity > 1) {
                        cart[index].quantity -= 1;
                    } else {
                        cart.splice(index, 1);
                    }
                }
            }
            
            saveCart();
            updateCartUI();
        }
        
        function checkout() {
            if (cart.length === 0) {
                alert("Seu carrinho está vazio!");
                return;
            }

            const numeroWhatsApp = "553599879068";
            let mensagem = "Olá, Miau Presentes! 👋\n\nGostaria de fazer o seguinte pedido:\n\n";

            cart.forEach(item => {
                mensagem += `*Produto:* ${item.name}\n`;
                mensagem += `*Qtd:* ${item.quantity}\n`;
                mensagem += `*Preço:* ${formatCurrency(item.price * item.quantity)}\n`;
                mensagem += "--------------------\n";
            });

            if (cartTotal) {
                 mensagem += `\n*Total do Pedido: ${cartTotal.textContent}*`;
            }

            const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
            window.open(linkWhatsApp, "_blank");

            // Salvar compra no histórico se usuário logado
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            if (currentUser) {
                const users = JSON.parse(localStorage.getItem("users")) || [];
                const userIndex = users.findIndex(u => u.email === currentUser.email);
            if (userIndex > -1) {
                const purchase = {
                date: new Date().toLocaleString("pt-BR"),
                items: cart,
                total: cartTotal.textContent
            };
            users[userIndex].purchases.push(purchase);
            localStorage.setItem("users", JSON.stringify(users));
            currentUser.purchases = users[userIndex].purchases;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
                }
            }

            // Limpar carrinho após checkout
            cart = [];
            saveCart();
            updateCartUI();
        }

        function updateCartUI() {
            renderCartItems();
            updateCartSummary();
        }

        // --- 4. Event Listeners ---
        // Todos os listeners agora são verificados para ver se o elemento existe

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
