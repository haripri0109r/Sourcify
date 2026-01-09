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

    // Toggle filter panel
    filterBtn.addEventListener('click', function() {
        filterPanel.classList.toggle('active');
    });

    // Apply filters
    const applyFilters = debounce(function() {
        const category = categoryFilter.value;
        const maxPrice = priceFilter.value;
        const location = locationFilter.value;
        const search = searchFilter.value.toLowerCase();

        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardPrice = parseInt(card.dataset.price);
            const cardName = card.dataset.name.toLowerCase();
            
            let show = true;
            
            if (category && cardCategory !== category) show = false;
            if (maxPrice && cardPrice > maxPrice) show = false;
            if (search && !cardName.includes(search)) show = false;
            
            card.style.display = show ? 'block' : 'none';
        });
        
        updateProductCount();
    }, 300);

    // Add event listeners
    [categoryFilter, priceFilter, locationFilter, searchFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
        filter.addEventListener('input', applyFilters);
    });

    // Price range display
    priceFilter.addEventListener('input', function() {
        document.querySelector('.price-value').textContent = `₹${this.value}`;
    });
}

function updateProductCount() {
    const visibleProducts = document.querySelectorAll('.product-card[style="display: block"], .product-card:not([style*="display: none"])').length;
    const countElement = document.querySelector('.product-count');
    if (countElement) {
        countElement.textContent = `${visibleProducts} products found`;
    }
}

// Shopping Cart
let cart = [];

function initShoppingCart() {
    updateCartDisplay();
    
    // Load cart from localStorage
    const savedCart = getFromLocalStorage('streetVendorCart');
    if (savedCart) {
        cart = savedCart;
        updateCartDisplay();
    }
}

function addToCart(productId, name, price, image, supplier) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: parseFloat(price),
            image: image,
            supplier: supplier,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveToLocalStorage('streetVendorCart', cart);
    showNotification(`${name} added to cart`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveToLocalStorage('streetVendorCart', cart);
    showNotification('Item removed from cart', 'info');
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartDisplay();
            saveToLocalStorage('streetVendorCart', cart);
        }
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    
    // Update cart items
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-supplier">by ${item.supplier}</div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Checkout Modal
function initCheckoutModal() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckout = document.getElementById('closeCheckout');
    const placeOrderBtn = document.getElementById('placeOrder');
    
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showNotification('Your cart is empty', 'warning');
            return;
        }
        
        updateCheckoutSummary();
        checkoutModal.classList.add('active');
    });
    
    closeCheckout.addEventListener('click', function() {
        checkoutModal.classList.remove('active');
    });
    
    placeOrderBtn.addEventListener('click', function() {
        processOrder();
    });
}

function updateCheckoutSummary() {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutDelivery = document.getElementById('checkoutDelivery');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 50; // Fixed delivery fee
    const total = subtotal + deliveryFee;
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    checkoutSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    checkoutDelivery.textContent = `₹${deliveryFee.toFixed(2)}`;
    checkoutTotal.textContent = `₹${total.toFixed(2)}`;
}

function processOrder() {
    // Simulate order processing
    const orderId = 'ORD' + Date.now();
    
    // Save order to localStorage
    const order = {
        id: orderId,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 50,
        status: 'confirmed',
        timestamp: new Date().toISOString(),
        deliveryAddress: document.getElementById('deliveryAddress').value,
        phone: document.getElementById('customerPhone').value
    };
    
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    orders.push(order);
    saveToLocalStorage('streetVendorOrders', orders);
    
    // Clear cart
    cart = [];
    updateCartDisplay();
    saveToLocalStorage('streetVendorCart', cart);
    
    // Close modal and show success
    document.getElementById('checkoutModal').classList.remove('active');
    showNotification(`Order placed successfully! Order ID: ${orderId}`, 'success');
    
    // Update order tracking
    updateOrderTracking();
}

// Collaboration Features
function initCollaboration() {
    const collaborateBtn = document.getElementById('collaborateBtn');
    const collaborationModal = document.getElementById('collaborationModal');
    const closeCollaboration = document.getElementById('closeCollaboration');
    const joinGroupBtn = document.getElementById('joinGroup');
    const createGroupBtn = document.getElementById('createGroup');
    
    if (collaborateBtn) {
        collaborateBtn.addEventListener('click', function() {
            collaborationModal.classList.add('active');
            loadCollaborationGroups();
        });
    }
    
    if (closeCollaboration) {
        closeCollaboration.addEventListener('click', function() {
            collaborationModal.classList.remove('active');
        });
    }
    
    if (joinGroupBtn) {
        joinGroupBtn.addEventListener('click', function() {
            joinCollaborationGroup();
        });
    }
    
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', function() {
            createCollaborationGroup();
        });
    }
}

function loadCollaborationGroups() {
    const groupsList = document.getElementById('collaborationGroups');
    
    // Sample collaboration groups
    const groups = [
        { id: 'GROUP001', name: 'Delhi Street Food Alliance', members: 15, savings: '₹2,500' },
        { id: 'GROUP002', name: 'Connaught Place Vendors', members: 8, savings: '₹1,800' },
        { id: 'GROUP003', name: 'Karol Bagh Food Court', members: 12, savings: '₹3,200' }
    ];
    
    groupsList.innerHTML = groups.map(group => `
        <div class="collaboration-group">
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-stats">${group.members} members • ${group.savings} saved</div>
            </div>
            <button class="btn btn-small btn-primary" onclick="requestToJoin('${group.id}')">
                Request to Join
            </button>
        </div>
    `).join('');
}

function requestToJoin(groupId) {
    showNotification('Join request sent! Group admin will review your request.', 'success');
}

function joinCollaborationGroup() {
    const groupCode = document.getElementById('groupCode').value;
    if (groupCode) {
        showNotification(`Joining group with code: ${groupCode}`, 'success');
        document.getElementById('collaborationModal').classList.remove('active');
    } else {
        showNotification('Please enter a group code', 'warning');
    }
}

function createCollaborationGroup() {
    const groupName = document.getElementById('newGroupName').value;
    if (groupName) {
        const groupCode = 'GRP' + Math.random().toString(36).substr(2, 6).toUpperCase();
        showNotification(`Group "${groupName}" created! Share code: ${groupCode}`, 'success');
        document.getElementById('collaborationModal').classList.remove('active');
    } else {
        showNotification('Please enter a group name', 'warning');
    }
}

// Order Tracking
function initOrderTracking() {
    updateOrderTracking();
}

function updateOrderTracking() {
    const ordersList = document.getElementById('ordersList');
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-orders">No orders yet</div>';
        return;
    }
    
    ordersList.innerHTML = orders.slice(-5).reverse().map(order => `
        <div class="order-item">
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-details">
                <div class="order-items">${order.items.length} items</div>
                <div class="order-total">₹${order.total.toFixed(2)}</div>
                <div class="order-date">${new Date(order.timestamp).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');
}

// Load Products
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const products = getProductsData();
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-category="${product.category}" data-price="${product.price}" data-name="${product.name}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.inStock ? '<div class="product-badge">In Stock</div>' : ''}
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-supplier">by ${product.supplier}</div>
                <div class="product-price">₹${product.price}/${product.unit}</div>
                <div class="product-rating">
                    <span class="rating-stars">${generateStarRating(product.rating)}</span>
                    <span class="rating-value">${product.rating}</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-small btn-primary" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-small btn-street-vendor" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}', '${product.supplier}')">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate star rating display
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

function viewProduct(productId) {
    // Find the product data
    const products = getProductsData();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }
    
    // Show product details modal with suppliers
    showProductDetailsWithSuppliers(product);
}

// Get products data (extracted from loadProducts function)
function getProductsData() {
    return [
        {
            id: 'PROD001',
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            price: 80,
            supplier: 'Green Valley Farms',
            supplierId: 'vendor_001',
            image: 'https://images.unsplash.com/photo-1546470427-e5ac89c8ba3b?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.5,
            description: 'Fresh, juicy tomatoes perfect for street food preparation. Sourced directly from organic farms.',
            unit: 'kg',
            minOrder: 5
        },
        {
            id: 'PROD002',
            name: 'Basmati Rice',
            category: 'grains',
            price: 120,
            supplier: 'Golden Grains Co.',
            supplierId: 'vendor_005',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.8,
            description: 'Premium quality Basmati rice with long grains and aromatic fragrance.',
            unit: 'kg',
            minOrder: 10
        },
        {
            id: 'PROD003',
            name: 'Red Chili Powder',
            category: 'spices',
            price: 200,
            supplier: 'Spice Masters',
            supplierId: 'vendor_003',
            image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.3,
            description: 'Pure red chili powder with perfect heat and color for authentic taste.',
            unit: 'kg',
            minOrder: 2
        },
        {
            id: 'PROD004',
            name: 'Fresh Milk',
            category: 'dairy',
            price: 60,
            supplier: 'Dairy Fresh',
            supplierId: 'vendor_006',
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.6,
            description: 'Fresh, pasteurized milk from healthy cows. Perfect for tea, coffee, and cooking.',
            unit: 'liter',
            minOrder: 10
        },
        {
            id: 'PROD005',
            name: 'Chicken Breast',
            category: 'meat',
            price: 300,
            supplier: 'Fresh Meat Co.',
            supplierId: 'vendor_007',
            image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.4,
            description: 'Fresh, tender chicken breast meat. Cleaned and ready for cooking.',
            unit: 'kg',
            minOrder: 3
        },
        {
            id: 'PROD006',
            name: 'Onions',
            category: 'vegetables',
            price: 40,
            supplier: 'Farm Fresh',
            supplierId: 'vendor_002',
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=200&fit=crop',
            inStock: true,
            rating: 4.2,
            description: 'Fresh red onions with strong flavor. Essential ingredient for street food.',
            unit: 'kg',
            minOrder: 5
        }
    ];
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

// Product Details Modal Functions
function showProductDetailsWithSuppliers(product) {
    const modal = document.getElementById('productDetailsModal');
    const title = document.getElementById('productModalTitle');
    const content = document.getElementById('productModalContent');
    
    title.textContent = product.name;
    
    // Show loading state
    content.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading product details and suppliers...</p>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load suppliers for this product
    loadSuppliersForProduct(product);
}

async function loadSuppliersForProduct(product) {
    const content = document.getElementById('productModalContent');
    
    try {
        // Search for suppliers of this product category
        const response = await fetch(`http://localhost:5000/api/suppliers/search?category=${product.category}&limit=10`);
        const data = await response.json();
        
        if (data.success) {
            renderProductDetailsWithSuppliers(product, data.data);
        } else {
            showProductDetailsError(product);
        }
    } catch (error) {
        console.error('Error loading suppliers:', error);
        showProductDetailsError(product);
    }
}

function renderProductDetailsWithSuppliers(product, suppliersData) {
    const content = document.getElementById('productModalContent');
    const allSuppliers = [...(suppliersData.premium_vendors || []), ...(suppliersData.regular_vendors || [])];
    
    // Find the current supplier
    const currentSupplier = allSuppliers.find(s => s.name === product.supplier) || allSuppliers[0];
    
    content.innerHTML = `
        <div class="product-details-container">
            <!-- Product Information -->
            <div class="product-main-info">
                <div class="product-image-large">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info-details">
                    <h3>${product.name}</h3>
                    <div class="product-meta">
                        <div class="meta-item">
                            <span class="meta-label">Category:</span>
                            <span class="meta-value">${product.category}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Price:</span>
                            <span class="meta-value">₹${product.price}/${product.unit}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Minimum Order:</span>
                            <span class="meta-value">${product.minOrder} ${product.unit}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Rating:</span>
                            <span class="meta-value">
                                <span class="rating-stars">${generateStarRating(product.rating)}</span>
                                ${product.rating}
                            </span>
                        </div>
                    </div>
                    <div class="product-description">
                        <h4>Description</h4>
                        <p>${product.description}</p>
                    </div>
                </div>
            </div>
            
            <!-- Suppliers Section -->
            <div class="suppliers-section">
                <h3><i class="fas fa-store"></i> Available Suppliers (${allSuppliers.length})</h3>
                
                ${suppliersData.premium_vendors && suppliersData.premium_vendors.length > 0 ? `
                    <div class="premium-suppliers">
                        <h4><i class="fas fa-crown"></i> Featured Suppliers</h4>
                        <div class="suppliers-list">
                            ${suppliersData.premium_vendors.map(supplier => createSupplierCard(supplier, product, true)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${suppliersData.regular_vendors && suppliersData.regular_vendors.length > 0 ? `
                    <div class="regular-suppliers">
                        <h4><i class="fas fa-store"></i> Other Suppliers</h4>
                        <div class="suppliers-list">
                            ${suppliersData.regular_vendors.slice(0, 5).map(supplier => createSupplierCard(supplier, product, false)).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="view-all-suppliers">
                    <button class="btn btn-primary" onclick="openSupplierSearch('${product.category}')">
                        <i class="fas fa-search"></i> View All ${product.category} Suppliers
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Store current product for modal actions
    window.currentModalProduct = product;
}

function createSupplierCard(supplier, product, isPremium = false) {
    const stars = generateStarRating(supplier.average_rating);
    
    return `
        <div class="supplier-card-modal ${isPremium ? 'premium' : ''}">
            <div class="supplier-header">
                <div class="supplier-name">
                    ${supplier.name}
                    ${isPremium ? '<i class="fas fa-crown premium-icon"></i>' : ''}
                </div>
                <div class="supplier-rating">
                    <span class="rating-stars">${stars}</span>
                    <span class="rating-value">${supplier.average_rating.toFixed(1)}</span>
                    <span class="rating-count">(${supplier.total_reviews})</span>
                </div>
            </div>
            
            <div class="supplier-info">
                <div class="info-row">
                    <span class="info-label">Location:</span>
                    <span class="info-value">${supplier.location}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Services:</span>
                    <span class="info-value">${supplier.services_offered.slice(0, 2).join(', ')}</span>
                </div>
            </div>
            
            <div class="supplier-badges">
                ${supplier.premium_badge ? 
                    `<span class="badge premium">${supplier.premium_badge.icon} ${supplier.premium_badge.text}</span>` : ''}
                ${supplier.trust_badges.slice(0, 2).map(badge => 
                    `<span class="badge trust">${badge.icon} ${badge.text}</span>`
                ).join('')}
            </div>
            
            ${supplier.recent_review_highlights && supplier.recent_review_highlights.length > 0 ? `
                <div class="recent-review">
                    <div class="review-text">"${supplier.recent_review_highlights[0].comment.substring(0, 80)}..."</div>
                    <div class="review-rating">${generateStarRating(supplier.recent_review_highlights[0].rating)}</div>
                </div>
            ` : ''}
            
            <div class="supplier-actions">
                <button class="btn btn-small btn-primary" onclick="viewSupplierDetails('${supplier.id}')">
                    <i class="fas fa-info-circle"></i> Details
                </button>
                <button class="btn btn-small btn-street-vendor" onclick="selectSupplierForProduct('${supplier.id}', '${supplier.name}', '${product.id}')">
                    <i class="fas fa-check"></i> Select
                </button>
            </div>
        </div>
    `;
}

function showProductDetailsError(product) {
    const content = document.getElementById('productModalContent');
    content.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Unable to Load Suppliers</h4>
            <p>We couldn't load supplier information at this time. Please try again later.</p>
            <div class="product-basic-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price-info">
                    <span class="price">₹${product.price}/${product.unit}</span>
                    <span class="supplier">by ${product.supplier}</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="loadSuppliersForProduct(window.currentModalProduct)">
                <i class="fas fa-refresh"></i> Retry
            </button>
        </div>
    `;
}

// Modal event handlers
function initProductModal() {
    const modal = document.getElementById('productDetailsModal');
    const closeBtn = document.getElementById('closeProductModal');
    const closeBtn2 = document.getElementById('closeProductDetailsBtn');
    const addToCartBtn = document.getElementById('addToCartFromModal');
    
    // Close modal events
    [closeBtn, closeBtn2].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeProductModal);
        }
    });
    
    // Add to cart from modal
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (window.currentModalProduct) {
                const product = window.currentModalProduct;
                addToCart(product.id, product.name, product.price, product.image, product.supplier);
                closeProductModal();
            }
        });
    }
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProductModal();
        }
    });
}

function closeProductModal() {
    const modal = document.getElementById('productDetailsModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    window.currentModalProduct = null;
}

// Supplier interaction functions
function viewSupplierDetails(supplierId) {
    // This will open the supplier details modal
    showSupplierDetailsModal(supplierId);
}

function selectSupplierForProduct(supplierId, supplierName, productId) {
    // Update the product to use this supplier
    showNotification(`Selected ${supplierName} as supplier for this product`, 'success');
    
    // You can update the product data here if needed
    const product = window.currentModalProduct;
    if (product) {
        product.supplier = supplierName;
        product.supplierId = supplierId;
    }
}

function openSupplierSearch(category = '') {
    // Open the supplier search page with category filter
    const url = category ? 
        `templates/supplier_search.html?category=${encodeURIComponent(category)}` : 
        'templates/supplier_search.html';
    window.open(url, '_blank');
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure all elements are loaded
    setTimeout(initProductModal, 100);
});

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.viewProduct = viewProduct;
window.viewSupplierDetails = viewSupplierDetails;
window.selectSupplierForProduct = selectSupplierForProduct;
window.openSupplierSearch = openSupplierSearch;
window.closeProductModal = closeProductModal;