// Função para inicializar o sistema de usuário
    function initializeUserSystem() {
        // Seletores
        const profileIcon = document.getElementById("profile-icon");
        const profileModal = document.getElementById("profile-modal");
        const closeProfile = document.getElementById("close-profile");
        const profileInfo = document.getElementById("profile-info");
        const authForms = document.getElementById("auth-forms");
        const logoutBtn = document.getElementById("logout-btn");
        const registerForm = document.getElementById("register-form");
        const loginForm = document.getElementById("login-form");

        // Estado do Usuário
        let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
        let users = JSON.parse(localStorage.getItem("users")) || [];

        // Funções Auxiliares
        function saveUsers() {
            localStorage.setItem("users", JSON.stringify(users));
        }

        function saveCurrentUser() {
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        function updateProfileUI() {
            if (!profileInfo) return;

            if (currentUser) {
                authForms.style.display = "none";
                logoutBtn.style.display = "block";

                let historyHTML = "";
                if (currentUser.purchases && currentUser.purchases.length > 0) {
                    historyHTML = `
                        <div class="purchase-history">
                            <h3>Histórico de Compras</h3>
                            <ul>
                                ${currentUser.purchases.map(purchase => `
                                    <li>
                                        <strong>Data:</strong> ${purchase.date}<br>
                                        <strong>Total:</strong> ${purchase.total}<br>
                                        <strong>Itens:</strong> ${purchase.items.map(item => `${item.name} (x${item.quantity})`).join(", ")}
                                    </li>
                                `).join("")}
                            </ul>
                        </div>
                    `;
                } else {
                    historyHTML = "<p>Nenhuma compra registrada ainda.</p>";
                }

                profileInfo.innerHTML = `
                    <p><strong>Nome:</strong> ${currentUser.name}</p>
                    <p><strong>Email:</strong> ${currentUser.email}</p>
                    ${historyHTML}
                `;
            } else {
                authForms.style.display = "block";
                logoutBtn.style.display = "none";
                profileInfo.innerHTML = "<p>Faça login ou crie uma conta para ver seus dados.</p>";
            }
        }

        // Registro
        if (registerForm) {
            registerForm.addEventListener("submit", function(e) {
                e.preventDefault();
                const name = document.getElementById("reg-name").value;
                const email = document.getElementById("reg-email").value;
                const password = document.getElementById("reg-password").value;

                if (users.find(u => u.email === email)) {
                    alert("Email já registrado!");
                    return;
                }

                const newUser = { name, email, password, purchases: [] };
                users.push(newUser);
                saveUsers();
                alert("Conta criada com sucesso! Faça login.");
                registerForm.reset();
            });
        }

        // Login
        if (loginForm) {
            loginForm.addEventListener("submit", function(e) {
                e.preventDefault();
                const email = document.getElementById("login-email").value;
                const password = document.getElementById("login-password").value;

                const user = users.find(u => u.email === email && u.password === password);
                if (user) {
                    currentUser = user;
                    saveCurrentUser();
                    updateProfileUI();
                    alert("Login realizado com sucesso!");
                } else {
                    alert("Email ou senha incorretos!");
                }
                loginForm.reset();
            });
        }

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function() {
                currentUser = null;
                saveCurrentUser();
                updateProfileUI();
                profileModal.style.display = "none";
                alert("Logout realizado!");
            });
        }

        // Abrir/Fechar Modal
        if (profileIcon) {
            profileIcon.addEventListener("click", () => {
                profileModal.style.display = "flex";
                updateProfileUI();
            });
        }

        if (closeProfile) {
            closeProfile.addEventListener("click", () => {
                profileModal.style.display = "none";
            });
        }

        if (profileModal) {
            window.addEventListener("click", (e) => {
                if (e.target === profileModal) {
                    profileModal.style.display = "none";
                }
            });
        }

        console.log("Sistema de usuário inicializado!");
    }

    // Espera o header carregar (similar ao cart.js)
    const userCheckInterval = setInterval(() => {
        if (document.getElementById("profile-icon")) {
            clearInterval(userCheckInterval);
            initializeUserSystem();
        }
    }, 100);
