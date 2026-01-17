// Street Vendor Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initStreetVendorDashboard();
});

function initStreetVendorDashboard() {
    // Apply street vendor theme
    document.body.classList.add('street-vendor-theme');
    
    // Initialize components
    initLocationSelector();
    initProductFilters();
    initShoppingCart();
    initCheckoutModal();
    initCollaboration();
    initOrderTracking();
    loadProducts();
    loadTransportServices();
}

// Location Selector with Map
function initLocationSelector() {
    // Initialize Leaflet map
    const map = L.map('map').setView([28.6139, 77.2090], 13); // Default to Delhi

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let rangeCircle = null;
    let currentLocation = [28.6139, 77.2090];

    // Range slider
    const rangeSlider = document.getElementById('rangeSlider');
    const rangeValue = document.querySelector('.range-value');
    const saveRangeBtn = document.getElementById('saveRange');
    const locationSearch = document.getElementById('locationSearch');

    rangeSlider.addEventListener('input', function() {
        const range = this.value;
        rangeValue.textContent = `${range} km`;
        updateRangeCircle(range);
    });

    function updateRangeCircle(range) {
        if (rangeCircle) {
            map.removeLayer(rangeCircle);
        }
        
        rangeCircle = L.circle(currentLocation, {
            color: '#ff6b6b',
            fillColor: '#ff6b6b',
            fillOpacity: 0.2,
            radius: range * 1000 // Convert km to meters
        }).addTo(map);
    }

    // Location search
    locationSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation(this.value);
        }
    });

    function searchLocation(query) {
        // This would typically use a geocoding service
        // For demo purposes, we'll simulate it
        showNotification('Location search feature would integrate with geocoding service', 'info');
    }

    // Save range
    saveRangeBtn.addEventListener('click', function() {
        const range = rangeSlider.value;
        saveToLocalStorage('serviceRange', {
            location: currentLocation,
            range: range
        });
        showNotification(`Service range saved: ${range} km`, 'success');
    });

    // Initialize with default range
    updateRangeCircle(10);

    // Map click to set location
    map.on('click', function(e) {
        currentLocation = [e.latlng.lat, e.latlng.lng];
        updateRangeCircle(rangeSlider.value);
    });
}

// Product Filters
function initProductFilters() {
    const filterBtn = document.getElementById('filterBtn');
    const filterPanel = document.getElementById('filterPanel');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const locationFilter = document.getElementById('locationFilter');
    const searchFilter = document.getElementById('searchFilter');

    filterBtn.addEventListener('click', function() {
        filterPanel.classList.toggle('active');
    });

    // Filter event listeners
    [categoryFilter, priceFilter, locationFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    searchFilter.addEventListener('input', debounce(applyFilters, 300));
}

function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const price = document.getElementById('priceFilter').value;
    const location = document.getElementById('locationFilter').value;
    const search = document.getElementById('searchFilter').value.toLowerCase();

    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        let show = true;
        
        // Category filter
        if (category && !product.dataset.category.includes(category)) {
            show = false;
        }
        
        // Price filter
        if (price && !isPriceInRange(product.dataset.price, price)) {
            show = false;
        }
        
        // Search filter
        if (search && !product.dataset.name.toLowerCase().includes(search)) {
            show = false;
        }
        
        product.style.display = show ? 'block' : 'none';
    });
}

function isPriceInRange(price, range) {
    const numPrice = parseInt(price);
    switch(range) {
        case '0-100': return numPrice <= 100;
        case '100-500': return numPrice > 100 && numPrice <= 500;
        case '500-1000': return numPrice > 500 && numPrice <= 1000;
        case '1000+': return numPrice > 1000;
        default: return true;
    }
}

// Shopping Cart
let cart = [];

function initShoppingCart() {
    // Load cart from localStorage
    cart = getFromLocalStorage('streetVendorCart') || [];
    updateCartDisplay();
}

function addToCart(productId, name, price, image, supplierId) {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId,
            name,
            price: parseInt(price),
            image,
            supplierId,
            quantity: 1
        });
    }
    
    saveToLocalStorage('streetVendorCart', cart);
    updateCartDisplay();
    showNotification(`${name} added to cart`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveToLocalStorage('streetVendorCart', cart);
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveToLocalStorage('streetVendorCart', cart);
            updateCartDisplay();
        }
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        cartCount.textContent = '0';
        cartTotal.textContent = '0';
        checkoutBtn.disabled = true;
    } else {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartCount.textContent = totalItems;
        cartTotal.textContent = totalPrice.toLocaleString();
        checkoutBtn.disabled = false;
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
                    <button class="quantity-btn" onclick="removeFromCart('${item.productId}')" style="margin-left: 8px; color: #f44336;">×</button>
                </div>
            </div>
        `).join('');
    }
}

// Checkout Modal
function initCheckoutModal() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckout = document.getElementById('closeCheckout');
    const confirmOrder = document.getElementById('confirmOrder');
    const cancelOrder = document.getElementById('cancelOrder');
    const needTransport = document.getElementById('needTransport');
    const transportDetails = document.getElementById('transportDetails');

    checkoutBtn.addEventListener('click', function() {
        openCheckoutModal();
    });

    closeCheckout.addEventListener('click', function() {
        closeModal('checkoutModal');
    });

    cancelOrder.addEventListener('click', function() {
        closeModal('checkoutModal');
    });

    confirmOrder.addEventListener('click', function() {
        processOrder();
    });

    needTransport.addEventListener('change', function() {
        transportDetails.style.display = this.checked ? 'block' : 'none';
    });
}

function openCheckoutModal() {
    const checkoutSummary = document.getElementById('checkoutSummary');
    const buyNowPayLaterOption = document.getElementById('buyNowPayLaterOption');
    
    // Check if user is regular customer (simulate)
    const isRegularCustomer = getFromLocalStorage('isRegularCustomer') || false;
    
    if (isRegularCustomer) {
        buyNowPayLaterOption.style.display = 'block';
    }
    
    // Generate order summary
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    checkoutSummary.innerHTML = `
        <h4>Order Summary</h4>
        ${cart.map(item => `
            <div class="checkout-item">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('')}
        <div class="checkout-total">
            <span>Total</span>
            <span>₹${totalPrice.toLocaleString()}</span>
        </div>
    `;
    
    openModal('checkoutModal');
}

function processOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const needTransport = document.getElementById('needTransport').checked;
    const transportService = document.getElementById('transportService').value;
    
    showLoading(document.getElementById('confirmOrder'), 'Processing...');
    
    // Simulate order processing
    setTimeout(() => {
        const orderId = 'ORD' + Date.now();
        
        // Save order
        const order = {
            id: orderId,
            items: [...cart],
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            paymentMethod,
            needTransport,
            transportService,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        const orders = getFromLocalStorage('streetVendorOrders') || [];
        orders.push(order);
        saveToLocalStorage('streetVendorOrders', orders);
        
        // Clear cart
        cart = [];
        saveToLocalStorage('streetVendorCart', cart);
        updateCartDisplay();
        
        // Close modal
        closeModal('checkoutModal');
        hideLoading(document.getElementById('confirmOrder'));
        
        // Show success message
        showNotification(`Order ${orderId} placed successfully!`, 'success');
        
        // Update order tracking
        updateOrderTracking();
        
    }, 2000);
}

// Collaboration
function initCollaboration() {
    const joinCollaboration = document.getElementById('joinCollaboration');
    const activeCollaborations = document.getElementById('activeCollaborations');
    
    joinCollaboration.addEventListener('click', function() {
        showCollaborationModal();
    });
    
    loadActiveCollaborations();
}

function showCollaborationModal() {
    // This would show a modal with available collaborations
    showNotification('Collaboration feature would show available group orders', 'info');
}

function loadActiveCollaborations() {
    const activeCollaborations = document.getElementById('activeCollaborations');
    
    // Simulate active collaborations
    const collaborations = [
        {
            id: 'COLLAB001',
            title: 'Bulk Vegetable Order',
            members: 5,
            targetQuantity: 100,
            currentQuantity: 75,
            savings: '15%',
            deadline: '2024-01-30'
        }
    ];
    
    if (collaborations.length > 0) {
        activeCollaborations.innerHTML = collaborations.map(collab => `
            <div class="collaboration-item">
                <div class="collaboration-title">${collab.title}</div>
                <div class="collaboration-members">
                    ${Array.from({length: Math.min(collab.members, 5)}, (_, i) => 
                        `<div class="member-avatar">${String.fromCharCode(65 + i)}</div>`
                    ).join('')}
                    ${collab.members > 5 ? `<span>+${collab.members - 5}</span>` : ''}
                </div>
                <div class="collaboration-details">
                    Progress: ${collab.currentQuantity}/${collab.targetQuantity} kg
                </div>
                <div class="collaboration-savings">Save ${collab.savings}</div>
                <div class="collaboration-actions">
                    <button class="btn btn-small btn-primary">Join</button>
                    <button class="btn btn-small btn-street-vendor">View Details</button>
                </div>
            </div>
        `).join('');
    }
}

// Order Tracking
function initOrderTracking() {
    updateOrderTracking();
}

function updateOrderTracking() {
    const trackingContent = document.getElementById('trackingContent');
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    
    if (orders.length === 0) {
        trackingContent.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-clipboard-list"></i>
                <p>No active orders</p>
            </div>
        `;
    } else {
        trackingContent.innerHTML = orders.slice(-3).map(order => `
            <div class="tracking-item">
                <div class="tracking-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="tracking-progress">
                    <div class="progress-step ${order.status !== 'pending' ? 'completed' : ''}"></div>
                    <div class="progress-step ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}"></div>
                    <div class="progress-step ${['shipped', 'delivered'].includes(order.status) ? 'completed' : ''}"></div>
                    <div class="progress-step ${order.status === 'delivered' ? 'completed' : ''}"></div>
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 8px;">
                    Total: ₹${order.total.toLocaleString()}
                </div>
            </div>
        `).join('');
    }
}

// Load Products
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    // Sample products data
    const products = [
        {
            id: 'PROD001',
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            price: 80,
            supplier: 'Green Valley Farms',
            image: 'https://images.unsplash.com/photo-1546470427-e5ac89c8ba3b?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.5
        },
        {
            id: 'PROD002',
            name: 'Basmati Rice',
            category: 'grains',
            price: 120,
            supplier: 'Golden Grains Co.',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.8
        },
        {
            id: 'PROD003',
            name: 'Red Chili Powder',
            category: 'spices',
            price: 200,
            supplier: 'Spice Masters',
            image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.3
        },
        {
            id: 'PROD004',
            name: 'Fresh Milk',
            category: 'dairy',
            price: 60,
            supplier: 'Dairy Fresh',
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.6
        },
        {
            id: 'PROD005',
            name: 'Chicken Breast',
            category: 'meat',
            price: 300,
            supplier: 'Fresh Meat Co.',
            image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.4
        },
        {
            id: 'PROD006',
            name: 'Onions',
            category: 'vegetables',
            price: 40,
            supplier: 'Farm Fresh',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.2
        }
    ];
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}" data-price="${product.price}" data-name="${product.name}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.inStock ? '<div class="product-badge">In Stock</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-supplier">by ${product.supplier}</div>
                <div class="product-price">₹${product.price}/kg</div>
                <div class="product-actions">
                    <button class="btn btn-small btn-primary" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-small btn-street-vendor" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}', '${product.supplier}')">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewProduct(productId) {
    showNotification('Product details modal would open here', 'info');
}

// Load Transport Services
function loadTransportServices() {
    const transportService = document.getElementById('transportService');
    
    const services = [
        { id: 'TRANS001', name: 'Quick Delivery', price: 50, rating: 4.5 },
        { id: 'TRANS002', name: 'Express Transport', price: 80, rating: 4.8 },
        { id: 'TRANS003', name: 'Economy Shipping', price: 30, rating: 4.2 }
    ];
    
    if (transportService) {
        transportService.innerHTML = '<option value="">Select Transport Service</option>' +
            services.map(service => 
                `<option value="${service.id}">${service.name} - ₹${service.price} (${service.rating}★)</option>`
            ).join('');
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.viewProduct = viewProduct;