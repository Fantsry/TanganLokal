
// Global Variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedShipping = 'reguler';
let shippingCost = 15000;
let codFee = 0;
let selectedPayment = 'bankTransfer';
let currentProduct = null;

// ==================== RUPIAH ====================
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}


let searchTimeout = null;
let allProducts = [];

async function loadAllProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        allProducts = await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function setupSearchBar() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    loadAllProducts();

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim();
            if (query.length >= 2) {
                searchProducts(query);
            } else {
                clearSearchResults();
            }
        }, 300);
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = this.value.trim();
            if (query.length >= 2) {
                searchProducts(query);
            }
        }
    });
}

function searchProducts(query) {
    if (allProducts.length === 0) return;
    
    const filteredProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase())
    );
    
    displaySearchResults(filteredProducts, query);
}

function displaySearchResults(products, query) {
    const searchResultsContainer = document.getElementById('search-results');
    if (!searchResultsContainer) return;
    
    searchResultsContainer.innerHTML = '';
    searchResultsContainer.classList.remove('hidden');
    
    if (products.length === 0) {
        searchResultsContainer.innerHTML = `
            <div class="p-4 text-center">
                <p class="text-gray-500">Tidak ditemukan produk untuk "${query}"</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const resultItem = document.createElement('a');
        resultItem.href = `produk.html?id=${product.id}`;
        resultItem.className = 'flex items-center p-3 hover:bg-gray-100 transition-colors';
        
        resultItem.innerHTML = `
            <img src="${product.image}" alt="${product.title}" class="w-12 h-12 object-contain mr-3 bg-white p-1 rounded">
            <div>
                <h3 class="font-medium text-sm line-clamp-1">${product.title}</h3>
                <p class="text-tangan-orange text-sm">${formatRupiah(product.price * 15000)}</p>
            </div>
        `;
        searchResultsContainer.appendChild(resultItem);
    });
}

function clearSearchResults() {
    const searchResultsContainer = document.getElementById('search-results');
    if (searchResultsContainer) {
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.classList.add('hidden');
    }
}

// ==================== CART FUNCTIONS ====================
function toggleCartModal(event) {
    event?.preventDefault();
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.classList.toggle('hidden');
        renderCartItems();
    }
}

function addToCart() {
    if (!currentProduct) {
        alert('Produk belum dimuat');
        return;
    }
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    const existingItem = cart.find(item => item.id === currentProduct.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...currentProduct,
            quantity: quantity,
            selected: true
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast();
    updateCartBadge();
}

function addToCartWithProduct(product) {
    const quantity = 1;
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity,
            selected: true
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast();
    updateCartBadge();
}

function beliLangsung() {
    addToCart();
    window.location.href = 'checkout.html';
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartBadge();
    if (document.getElementById('checkout-items')) {
        renderCheckoutItems();
    }
}

function renderCartItems() {
    const cartList = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartList || !totalElement) return;

    cartList.innerHTML = '';
    let totalIDR = 0;

    cart.forEach(item => {
        const priceIDR = Math.round(item.price * 15000);
        const itemTotalIDR = priceIDR * item.quantity;
        if (item.selected) {
            totalIDR += itemTotalIDR;
        }
        const formattedPrice = formatRupiah(priceIDR);
        const formattedItemTotal = formatRupiah(itemTotalIDR);

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 border-b';
        li.innerHTML = `
            <div class="flex-1 flex items-center gap-4">
                <input type="checkbox" 
                    ${item.selected ? 'checked' : ''} 
                    onchange="toggleSelectItem(${item.id})" 
                    class="form-checkbox h-4 w-4 text-tangan-button rounded">
                <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain bg-white rounded border">
                <div>
                    <h3 class="font-semibold">${item.title}</h3>
                    <div class="flex items-center gap-2 mt-1">
                        <button onclick="updateCartItemQuantity(${item.id}, -1)" 
                            class="bg-tangan-button text-white px-2 py-1 rounded-md text-sm">-</button>
                        <span class="w-8 text-center">${item.quantity}</span>
                        <button onclick="updateCartItemQuantity(${item.id}, 1)" 
                            class="bg-tangan-button text-white px-2 py-1 rounded-md text-sm">+</button>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">Rp ${formattedPrice}/pcs</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold">Rp ${formattedItemTotal}</p>
                <button onclick="removeFromCart(${item.id})" 
                    class="text-red-500 hover:text-red-700 text-sm mt-1">Hapus</button>
            </div>
        `;
        cartList.appendChild(li);
    });

    totalElement.textContent = formatRupiah(totalIDR);
}

function updateCartItemQuantity(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity < 1) cart[itemIndex].quantity = 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        updateCartBadge();
        if (document.getElementById('checkout-items')) {
            renderCheckoutItems();
        }
    }
}

function toggleSelectItem(productId) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.selected = !item.selected;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
        if (document.getElementById('checkout-items')) {
            renderCheckoutItems();
        }
    }
}

function showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ==================== PRODUCT FUNCTIONS ====================
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;
    let newValue = parseInt(quantityInput.value) + change;
    if (newValue < 1) newValue = 1;
    quantityInput.value = newValue;
}

async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;
    try {
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        const product = await response.json();
        currentProduct = product;
        // Update tampilan
        if (document.getElementById('product-title')) {
            document.getElementById('product-title').textContent = product.title;
        }
        if (document.getElementById('product-image')) {
            document.getElementById('product-image').src = product.image;
        }
        if (document.getElementById('product-price')) {
            document.getElementById('product-price').textContent = `Rp${formatRupiah(Math.round(product.price * 15000))}`;
        }
        if (document.getElementById('product-description')) {
            document.getElementById('product-description').textContent = product.description;
        }
        if (document.getElementById('product-sold')) {
            document.getElementById('product-sold').textContent = product.rating.count;
        }
        const details = document.getElementById('product-details');
        if (details) {
            details.innerHTML = `
                <div class="flex justify-between">
                    <span class="text-tangan-text">Kategori</span>
                    <span class="text-tangan-dark-brown">${product.category}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-tangan-text">Rating</span>
                    <span class="text-tangan-dark-brown">${product.rating.rate}/5 (${product.rating.count} ulasan)</span>
                </div>
            `;
        }
        const reviews = document.getElementById('reviews');
        if (reviews) {
            reviews.innerHTML = `
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-3xl font-bold text-tangan-text">${product.rating.rate}</span>
                    <div class="flex text-tangan-orange">
                        ${'★'.repeat(Math.round(product.rating.rate))}${'☆'.repeat(5 - Math.round(product.rating.rate))}
                    </div>
                </div>
                <button class="w-full mt-6 text-center text-tangan-orange hover:text-tangan-dark-brown">
                    Lihat Semua ${product.rating.count} Ulasan
                </button>
            `;
        }
    } catch (error) {
        console.error('Error loading product:', error);
        if (document.getElementById('product-detail')) {
            document.getElementById('product-detail').innerHTML = `
                <div class="text-center py-10">
                    <p class="text-red-500">Gagal memuat produk. Silakan coba lagi.</p>
                </div>
            `;
        }
    }
}

// ==================== HOME PAGE FUNCTIONS ====================
function fillGrid(gridId, products) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'flex flex-col bg-white rounded-lg overflow-hidden shadow h-full cursor-pointer hover:shadow-lg transition-shadow';
        card.onclick = () => navigateToProduct(product.id);
        const formattedPrice = formatRupiah(Math.round(product.price * 15000));

        card.innerHTML = `
            <div class="flex flex-col h-full">
                <img src="${product.image}" alt="${product.title}" 
                     class="w-full h-40 object-contain p-2 bg-white">
                <div class="flex-grow p-2 bg-tangan-orange flex flex-col justify-between">
                    <hr class="border-t-2 border-white my-2">
                    <p class="text-xs text-white">${product.title}</p>
                    <p class="font-bold text-tangan-text">Rp${formattedPrice}</p>
                    <button 
                        onclick="event.stopPropagation(); addToCartWithProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                        class="mt-2 bg-tangan-cream text-xs rounded py-1 px-2 font-medium text-tangan-text hover:bg-tangan-feature">
                        Tambah ke Keranjang
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function navigateToProduct(productId) {
    window.location.href = `produk.html?id=${productId}`;
}

// ==================== CHECKOUT FUNCTIONS ====================
function checkout() {
    const selectedItems = cart.filter(item => item.selected);
    if (selectedItems.length === 0) {
        alert('Silakan pilih produk yang ingin di-checkout!');
        return;
    }
    const addressElement = document.querySelector('input[name="address"]:checked')?.closest('.address-card');
    if (!addressElement) {
        alert('Silakan pilih alamat pengiriman!');
        return;
    }
    const address = addressElement.querySelector('h4').textContent + ', ' +
                   addressElement.querySelector('p').textContent;
    const note = document.getElementById('order-note')?.value || '';

    
    const subtotalIDR = selectedItems.reduce((sum, item) => {
        return sum + Math.round(item.price * 15000) * item.quantity;
    }, 0);

    const serviceFee = 2000;
    const totalIDR = subtotalIDR + shippingCost + serviceFee + codFee;

    const orderData = {
        items: selectedItems,
        subtotal: subtotalIDR,
        shippingCost: shippingCost,
        codFee: codFee,
        serviceFee: serviceFee,
        total: totalIDR,
        address: address,
        paymentMethod: selectedPayment === 'bankTransfer' ? 'Transfer Bank' :
                       selectedPayment === 'eWallet' ? 'E-Wallet' : 'COD',
        shippingMethod: selectedShipping === 'reguler' ? 'Reguler' : 'Express',
        note: note,
        date: new Date().toLocaleString('id-ID'),
        orderId: 'ORD-' + Date.now().toString().slice(-6)
    };

    showConfirmationModal(orderData);

    // Hapus item yang dipesan
    cart = cart.filter(item => !item.selected);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    if (document.getElementById('checkout-items')) {
        renderCheckoutItems();
    }
}

function showConfirmationModal(orderData) {
    const confirmationDetails = document.getElementById('confirmation-details');
    if (!confirmationDetails) return;

    let itemsHtml = '';
    orderData.items.forEach(item => {
        const priceIDR = Math.round(item.price * 15000);
        const itemTotalIDR = priceIDR * item.quantity;
        const formattedPrice = formatRupiah(priceIDR);
        const formattedItemTotal = formatRupiah(itemTotalIDR);
        itemsHtml += `
            <div class="flex justify-between items-center py-2 border-b">
                <div>
                    <p class="font-medium">${item.title}</p>
                    <p class="text-sm text-gray-600">${item.quantity} x Rp ${formattedPrice}</p>
                </div>
                <p class="font-medium">Rp ${formattedItemTotal}</p>
            </div>
        `;
    });

    confirmationDetails.innerHTML = `
        <p class="text-green-600 font-medium">Terima kasih sudah berbelanja di TanganLokal!</p>
        <div class="mt-4">
            <p class="font-medium">ID Pesanan: <span class="text-tangan-orange">${orderData.orderId}</span></p>
            <p class="mt-2">Tanggal: ${orderData.date}</p>
            <div class="mt-4">
                <p class="font-medium">Detail Pesanan:</p>
                ${itemsHtml}
            </div>
            <div class="mt-4 space-y-2">
                <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp ${formatRupiah(orderData.subtotal)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Pengiriman (${orderData.shippingMethod}):</span>
                    <span>Rp ${formatRupiah(orderData.shippingCost)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Biaya Layanan:</span>
                    <span>Rp ${formatRupiah(orderData.serviceFee)}</span>
                </div>
                ${orderData.codFee > 0 ? `
                <div class="flex justify-between">
                    <span>Biaya COD:</span>
                    <span>Rp ${formatRupiah(orderData.codFee)}</span>
                </div>` : ''}
                <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>Rp ${formatRupiah(orderData.total)}</span>
                </div>
            </div>
            <div class="mt-4">
                <p class="font-medium">Alamat Pengiriman:</p>
                <p class="mt-1">${orderData.address}</p>
            </div>
            <div class="mt-4">
                <p class="font-medium">Metode Pembayaran:</p>
                <p class="mt-1">${orderData.paymentMethod}</p>
            </div>
            ${orderData.note ? `
            <div class="mt-4">
                <p class="font-medium">Catatan untuk Penjual:</p>
                <p class="mt-1">${orderData.note}</p>
            </div>` : ''}
            <p class="mt-6 text-center text-tangan-orange font-medium">Barang akan dikirim secepatnya!</p>
        </div>
    `;

    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.classList.add('hidden');
            window.location.href = 'home.html';
        }, 300);
    } else {
        window.location.href = 'home.html';
    }
}

function renderCheckoutItems() {
    const cartItems = cart.filter(item => item.selected);
    const container = document.getElementById('checkout-items');
    const subtotalElement = document.getElementById('subtotal');
    if (!container || !subtotalElement) return;

    container.innerHTML = '';

    if (cartItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">Tidak ada produk di keranjang</p>';
        subtotalElement.textContent = 'Rp 0';
        const totalEl = document.getElementById('total');
        if (totalEl) totalEl.textContent = 'Rp 0';
        return;
    }

    let subtotalIDR = 0;
    cartItems.forEach(item => {
        const priceIDR = Math.round(item.price * 15000);
        const itemTotalIDR = priceIDR * item.quantity;
        subtotalIDR += itemTotalIDR;
        const formattedPrice = formatRupiah(priceIDR);
        const formattedItemTotal = formatRupiah(itemTotalIDR);

        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-start mb-4';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="w-16 h-16 object-contain bg-white rounded border">
            <div class="ml-3 flex-1">
                <h3 class="font-medium text-tangan-text text-sm line-clamp-2">${item.title}</h3>
                <div class="flex justify-between items-center mt-1">
                    <span class="text-gray-600 text-sm">${item.quantity} x Rp ${formattedPrice}</span>
                    <span class="text-tangan-text font-medium">Rp ${formattedItemTotal}</span>
                </div>
            </div>
        `;
        container.appendChild(itemElement);
    });

    subtotalElement.textContent = 'Rp ' + formatRupiah(subtotalIDR);
    updateTotal(subtotalIDR);
}

function updateTotal(subtotalValue) {
    // Jika dipanggil dengan subtotalValue, gunakan itu; jika tidak, hitung ulang:
    let subtotalIDR = 0;
    if (typeof subtotalValue === 'number') {
        subtotalIDR = subtotalValue;
    } else {
        cart.filter(item => item.selected).forEach(item => {
            subtotalIDR += Math.round(item.price * 15000) * item.quantity;
        });
    }
    const serviceFee = 2000;
    const totalIDR = subtotalIDR + shippingCost + serviceFee + codFee;
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = 'Rp ' + formatRupiah(totalIDR);
    }
}

// ==================== SHIPPING / PAYMENT / ADDRESS SETUP ====================
function setupShippingOptions() {
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    if (!shippingOptions.length) return;
    shippingOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.shipping-option').forEach(option => {
                option.classList.remove('border-tangan-button', 'bg-tangan-cream/50');
            });
            this.closest('.shipping-option').classList.add('border-tangan-button', 'bg-tangan-cream/50');
            shippingCost = this.value === 'express' ? 25000 : 15000;
            selectedShipping = this.value;
            const shippingElement = document.getElementById('shipping');
            if (shippingElement) {
                shippingElement.textContent = `Rp ${formatRupiah(shippingCost)}`;
            }
            updateTotal();
        });
    });
}

function setupPaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    if (!paymentMethods.length) return;
    paymentMethods.forEach(radio => {
        radio.addEventListener('change', function() {
            const bankDetails = document.getElementById('bankTransferDetails');
            const eWalletDetails = document.getElementById('eWalletDetails');
            const codDetails = document.getElementById('codDetails');
            if (bankDetails) bankDetails.classList.add('hidden');
            if (eWalletDetails) eWalletDetails.classList.add('hidden');
            if (codDetails) codDetails.classList.add('hidden');
            if (this.id === 'bankTransfer' && bankDetails) {
                bankDetails.classList.remove('hidden');
                codFee = 0;
                selectedPayment = 'bankTransfer';
            } else if (this.id === 'eWallet' && eWalletDetails) {
                eWalletDetails.classList.remove('hidden');
                codFee = 0;
                selectedPayment = 'eWallet';
            } else if (this.id === 'cod' && codDetails) {
                codDetails.classList.remove('hidden');
                codFee = 5000;
                selectedPayment = 'cod';
            }
            updateTotal();
        });
    });
}

function setupAddressSelection() {
    const addressOptions = document.querySelectorAll('input[name="address"]');
    if (!addressOptions.length) return;
    addressOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            document.querySelectorAll('.address-card').forEach(card => {
                card.classList.remove('border-tangan-orange', 'border-2');
            });
            this.closest('.address-card').classList.add('border-tangan-orange', 'border-2');
        });
    });
}

function initCheckoutPage() {
    renderCheckoutItems();
    setupAddressSelection();
    setupShippingOptions();
    setupPaymentMethods();
    const checkedAddress = document.querySelector('input[name="address"]:checked');
    if (checkedAddress) {
        checkedAddress.closest('.address-card').classList.add('border-tangan-orange', 'border-2');
    }
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', checkout);
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupSearchBar();
    updateCartBadge();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#search-container')) {
            clearSearchResults();
        }
    });
    

    if (document.getElementById('checkout-items')) {
        initCheckoutPage();
    } else if (document.getElementById('product-detail')) {
        loadProduct();
    } else if (document.getElementById('product-grid-pencarian')) {
        fetch('https://fakestoreapi.com/products')
            .then(res => res.json())
            .then(data => {
                fillGrid('product-grid-pencarian', data.slice(0, 5));
                fillGrid('product-grid-sports', data.slice(5, 10));
                fillGrid('product-grid-elektronik', data.slice(10, 15));
            });
    }
});