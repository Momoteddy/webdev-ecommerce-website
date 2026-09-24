(() => {
    const CART_STORAGE_KEY = 'muukoCart';
    const currencyFormatter = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0
    });

    function getCart() {
        try {
            const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.id === 'string' && Number.isFinite(Number(entry.quantity)) && Number(entry.quantity) > 0) : [];
        } catch (error) {
            console.error('Unable to read cart from localStorage.', error);
            return [];
        }
    }

    function saveCart(cartItems) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        updateCartBadge();
    }

    function getCartTotalQuantity() {
        return getCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
    }

    function formatCurrency(value) {
        return currencyFormatter.format(Number(value) || 0);
    }

    function getProductsPagePath() {
        return window.location.pathname.includes('/pages/') ? 'products.html' : 'pages/products.html';
    }

    function updateCartBadge() {
        const totalQuantity = getCartTotalQuantity();
        const cartButtons = document.querySelectorAll('.cart-button');

        cartButtons.forEach((button) => {
            const cartCount = button.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = String(totalQuantity);
            }

            const ariaLabel = button.getAttribute('aria-label') || 'Shopping cart';
            const label = `Shopping cart, ${totalQuantity} items`;
            button.setAttribute('aria-label', label);
        });
    }

    function findCartItemById(productId) {
        return getCart().find((item) => item.id === productId);
    }

    function addToCart(productId) {
        const cart = getCart();
        const existingItem = cart.find((item) => item.id === productId);

        if (existingItem) {
            existingItem.quantity = Number(existingItem.quantity || 0) + 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }

        saveCart(cart);
        renderCart();

        if (typeof window.openCartPanel === 'function') {
            window.openCartPanel();
        }
    }

    function removeFromCart(productId) {
        const updatedCart = getCart().filter((item) => item.id !== productId);
        saveCart(updatedCart);
        renderCart();
    }

    function updateQuantity(productId, change) {
        const cart = getCart();
        const target = cart.find((item) => item.id === productId);

        if (!target) {
            return;
        }

        target.quantity = Number(target.quantity || 1) + change;

        if (target.quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        saveCart(cart);
        renderCart();
    }

    function clearCart() {
        saveCart([]);
        renderCart();
    }

    function getProductMap() {
        return fetch('../data/products.json')
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Unable to load product data.');
                }
                return response.json();
            })
            .then((products) => {
                if (!Array.isArray(products)) {
                    return {};
                }

                return products.reduce((map, product) => {
                    if (product && product.id) {
                        map[product.id] = product;
                    }
                    return map;
                }, {});
            })
            .catch((error) => {
                console.error(error);
                return {};
            });
    }

    function renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartSummary = document.getElementById('cart-summary');

        if (!cartItems || !cartSummary) {
            return;
        }

        const cart = getCart();
        const cartProductMap = getProductMap();

        cartProductMap.then((productMap) => {
            const validCartItems = cart
                .map((entry) => {
                    const product = productMap[entry.id];
                    if (!product) {
                        return null;
                    }

                    return {
                        ...entry,
                        product
                    };
                })
                .filter(Boolean);

            if (!validCartItems.length) {
                cartItems.innerHTML = `
                    <div class="cart-empty-state">
                        <p class="cart-empty-title">Your cart is currently empty.</p>
                        <button class="btn btn-accent cart-continue-button" type="button">Continue Shopping</button>
                    </div>
                `;

                cartSummary.innerHTML = '';
                const continueButton = document.querySelector('.cart-continue-button');
                if (continueButton) {
                    continueButton.addEventListener('click', function () {
                        if (typeof window.closeCartPanel === 'function') {
                            window.closeCartPanel();
                        }
                        window.location.href = getProductsPagePath();
                    });
                }
                return;
            }

            const total = validCartItems.reduce((sum, item) => sum + (Number(item.product.price || 0) * Number(item.quantity || 0)), 0);

            cartItems.innerHTML = validCartItems.map((item) => `
                <div class="cart-item" data-product-id="${item.id}">
                    <img class="cart-item-image" src="${item.product.image || '../media/products/product-placeholder.jpg'}" alt="${item.product.name || 'Product'}">
                    <div class="cart-item-content">
                        <div class="cart-item-header">
                            <div>
                                <p class="cart-item-brand">${item.product.brand || 'MUUKO\'S EMPORIUM'}</p>
                                <h3>${item.product.name || 'Product'}</h3>
                            </div>
                        </div>
                        <p class="cart-item-price">${formatCurrency(item.product.price)}</p>
                        <div class="cart-item-controls">
                            <div class="cart-quantity-picker">
                                <button type="button" class="qty-button" data-action="decrease" data-product-id="${item.id}" aria-label="Decrease quantity">−</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button type="button" class="qty-button" data-action="increase" data-product-id="${item.id}" aria-label="Increase quantity">+</button>
                            </div>
                            <button type="button" class="cart-remove-button" data-product-id="${item.id}">Remove</button>
                        </div>
                        <p class="cart-item-subtotal">Subtotal: ${formatCurrency(Number(item.product.price || 0) * Number(item.quantity || 0))}</p>
                    </div>
                </div>
            `).join('');

            cartSummary.innerHTML = `
                <div class="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>${formatCurrency(total)}</strong>
                </div>
                <div class="cart-actions">
                    <button class="btn btn-outline-accent cart-clear-button" type="button">Clear Cart</button>
                    <button class="btn btn-accent cart-checkout-button" type="button">Checkout</button>
                </div>
                <p class="cart-status-message" aria-live="polite"></p>
            `;

            const clearButton = cartSummary.querySelector('.cart-clear-button');
            if (clearButton) {
                clearButton.addEventListener('click', function () {
                    clearCart();
                });
            }

            const checkoutButton = cartSummary.querySelector('.cart-checkout-button');
            if (checkoutButton) {
                checkoutButton.addEventListener('click', function () {
                    const statusMessage = document.querySelector('.cart-status-message');
                    if (statusMessage) {
                        statusMessage.textContent = 'Checkout functionality will be available soon.';
                    }
                });
            }

            document.querySelectorAll('.qty-button').forEach((button) => {
                button.addEventListener('click', function () {
                    const productId = this.dataset.productId;
                    const action = this.dataset.action;
                    updateQuantity(productId, action === 'increase' ? 1 : -1);
                });
            });

            document.querySelectorAll('.cart-remove-button').forEach((button) => {
                button.addEventListener('click', function () {
                    removeFromCart(this.dataset.productId);
                });
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateCartBadge();
        renderCart();

        const offcanvas = document.getElementById('cartOffcanvas');
        if (offcanvas) {
            offcanvas.addEventListener('shown.bs.offcanvas', function () {
                updateCartBadge();
            });
        }
    });

    window.addToCart = addToCart;
    window.renderCart = renderCart;
    window.clearCart = clearCart;
    window.updateCartBadge = updateCartBadge;
})();
