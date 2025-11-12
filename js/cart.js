/**
 * Este script espera o HTML principal ser carregado
 * e, em seguida, espera o cabeçalho (assíncrono) ser
 * injetado antes de inicializar o carrinho.
 */
document.addEventListener("DOMContentLoaded", function() {

    // Função principal que configura o carrinho
    function initializeCart() {

        // --- 1. Seletores do DOM ---
        const cartItemsContainer = document.getElementById("cart-items-container");
        const cartTotal = document.getElementById("cart-total");
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

            let whatsappCartBtn = document.querySelector('.whatsapp-cart-btn');
            if (!whatsappCartBtn) {
                whatsappCartBtn = document.createElement('a');
                whatsappCartBtn.classList.add('whatsapp-cart-btn');
                whatsappCartBtn.textContent = 'Comprar pelo WhatsApp';
                whatsappCartBtn.target = '_blank';
                if (cartTotal && cartTotal.parentNode) {
                    cartTotal.parentNode.appendChild(whatsappCartBtn);
                } else {
                    cartItemsContainer.appendChild(whatsappCartBtn);
                }
            }
            whatsappCartBtn.style.display = 'block';

            let message = 'Olá! Gostaria de comprar os seguintes itens do carrinho:\n';
            cart.forEach(item => {
                message += `- ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}\n`;
            });
            message += `\nTotal: ${formatCurrency(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}`;
            const whatsappNumber = '553599879068';
            whatsappCartBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        }

        function addToCart(product) {
            if (!product.price || product.price <= 0) {
                alert("Preço não disponível para este produto. Consulte via WhatsApp.");
                return;
            }
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

        // ==========================================================
        // FUNÇÃO CHECKOUT CORRIGIDA (HISTÓRICO)
        // ==========================================================
        function checkout() {
            if (cart.length === 0) {
                alert("Seu carrinho está vazio!");
                return;
            }

            // --- INÍCIO DA LÓGICA DE HISTÓRICO ---
            
            // 1. Tenta buscar o usuário logado
            let currentUser = JSON.parse(localStorage.getItem("currentUser"));
            
            if (currentUser) {
                try {
                    // 2. Prepara o objeto da compra
                    const newPurchase = {
                        date: new Date().toLocaleDateString("pt-BR"),
                        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                        items: cart.map(item => ({ name: item.name, quantity: item.quantity }))
                    };

                    // 3. Atualiza o currentUser
                    if (!currentUser.purchases) {
                        currentUser.purchases = [];
                    }
                    currentUser.purchases.push(newPurchase);
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));

                    // 4. Atualiza a lista geral de usuários (para persistir)
                    let users = JSON.parse(localStorage.getItem("users")) || [];
                    const userIndex = users.findIndex(u => u.email === currentUser.email);
                    
                    if (userIndex !== -1) {
                        users[userIndex] = currentUser; // Salva o usuário atualizado
                        localStorage.setItem("users", JSON.stringify(users));
                    }
                    
                    alert("Compra finalizada e salva no seu histórico!");

                } catch (error) {
                    console.error("Erro ao salvar histórico de compra:", error);
                    alert("Compra finalizada (simulação), mas houve um erro ao salvar seu histórico.");
                }

            } else {
                // Se não houver usuário logado, apenas simula
                alert("Redirecionando para o checkout... (simulação)\n(Faça login para salvar seu histórico!)");
            }
            // --- FIM DA LÓGICA DE HISTÓRICO ---

            // Limpa o carrinho
            cart = [];
            saveCart();
            updateCartUI();
        }
        // ==========================================================
        // FIM DA FUNÇÃO CHECKOUT
        // ==========================================================


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

        // ==========================================================
        // CORREÇÃO DO ERRO DE DIGITAÇÃO (BOTÃO ADD-TO-CART)
        // ==========================================================
        document.body.addEventListener("click", (e) => {
            if (e.target.matches(".add-to-cart")) {
                e.preventDefault();
                
                // CORRIGIDO: Era "e.taget" e falhava aqui
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
        // ==========================================================
        // FIM DA CORREÇÃO
        // ==========================================================


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
    const headerCheckInterval = setInterval(() => {
        if (document.querySelector(".cart-icon")) {
            clearInterval(headerCheckInterval); 
            initializeCart(); 
        }
    }, 100); 
    
});
