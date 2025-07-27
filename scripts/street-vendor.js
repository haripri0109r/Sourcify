// Street Vendor Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initStreetVendorDashboard();
});

function initStreetVendorDashboard() {
    // Apply street vendor theme
    document.body.classList.add('street-vendor-theme');
    
    // Initialize services
    initGeolocationService();
    initCartService();
    
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

// Initialize Geolocation Service
function initGeolocationService() {
    if (window.geolocationService) {
        // Set up location update callbacks
        window.geolocationService.onLocationUpdate((position) => {
            console.log('Location updated:', position);
            updateLocationDisplay(position);
            updateNearbyProducts();
        });

        window.geolocationService.onError((error) => {
            console.error('Geolocation error:', error);
            showNotification(error, 'error');
        });
    }
}

// Initialize Cart Service
function initCartService() {
    if (window.cartService) {
        // Set up cart update callbacks
        window.cartService.onCartUpdate((cart, summary) => {
            updateCartDisplay(cart, summary);
        });

        window.cartService.onFilterUpdate((filters) => {
            updateFilterDisplay(filters);
        });

        // Initialize cart display
        updateCartDisplay(window.cartService.getCart(), window.cartService.getCartSummary());
    }
}

// Update location display
function updateLocationDisplay(position) {
    const locationInfo = document.getElementById('locationInfo');
    const currentLocationText = document.getElementById('currentLocationText');
    const locationAccuracy = document.getElementById('locationAccuracy');
    
    if (locationInfo && currentLocationText && locationAccuracy) {
        currentLocationText.textContent = `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`;
        locationAccuracy.textContent = Math.round(position.accuracy);
        locationInfo.style.display = 'block';
    }
}

// Update nearby products based on location
async function updateNearbyProducts() {
    if (window.geolocationService && window.geolocationService.getCurrentPositionInfo()) {
        try {
            const nearbySuppliers = await window.geolocationService.getNearbySuppliers(50);
            console.log('Nearby suppliers:', nearbySuppliers);
            // Update products display with location-based sorting
            loadProducts(true);
        } catch (error) {
            console.error('Error updating nearby products:', error);
        }
    }
}

// Update cart display
function updateCartDisplay(cart, summary) {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    // Update cart count
    if (cartCount) {
        cartCount.textContent = summary.totalQuantity;
    }
    
    // Update cart total
    if (cartTotal) {
        cartTotal.textContent = summary.totalValue.toFixed(2);
    }
    
    // Update checkout button
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
    
    // Update cart items display
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p data-translate="your_cart_is_empty">Your cart is empty</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-supplier">by ${item.supplier}</div>
                        <div class="cart-item-price">₹${item.price}/${item.unit}</div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="btn btn-small" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="btn btn-small" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="cart-item-total">₹${item.totalPrice.toFixed(2)}</div>
                        <button class="btn btn-small btn-danger" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Apply translations to dynamic content
        if (window.multilingualManager) {
            window.multilingualManager.applyTranslations();
        }
    }
    
    // Update summary display
    updateCartSummaryDisplay(summary);
}

// Update cart summary display
function updateCartSummaryDisplay(summary) {
    const cartItemCount = document.getElementById('cartItemCount');
    const filteredItemCount = document.getElementById('filteredItemCount');
    const cartValue = document.getElementById('cartValue');
    const filteredTotalAmount = document.getElementById('filteredTotalAmount');
    
    if (cartItemCount) cartItemCount.textContent = summary.totalItems;
    if (filteredItemCount) filteredItemCount.textContent = summary.filteredItems;
    if (cartValue) cartValue.textContent = summary.totalValue.toFixed(2);
    if (filteredTotalAmount) filteredTotalAmount.textContent = summary.filteredValue.toFixed(2);
}

// Update filter display
function updateFilterDisplay(filters) {
    // Update filter controls to reflect current filters
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const locationFilter = document.getElementById('locationFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const inStockFilter = document.getElementById('inStockFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const distanceDisplay = document.getElementById('distanceDisplay');
    
    if (categoryFilter) categoryFilter.value = filters.category || '';
    if (priceFilter) priceFilter.value = filters.priceRange || '';
    if (locationFilter) locationFilter.value = filters.location || '';
    if (ratingFilter) ratingFilter.value = filters.rating || '0';
    if (inStockFilter) inStockFilter.checked = filters.inStock || false;
    if (distanceFilter) {
        distanceFilter.value = filters.distance || 50;
        if (distanceDisplay) distanceDisplay.textContent = `${filters.distance || 50} km`;
    }
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
    const getCurrentLocationBtn = document.getElementById('getCurrentLocationBtn');
    const locationInfo = document.getElementById('locationInfo');
    const currentLocationText = document.getElementById('currentLocationText');
    const locationAccuracy = document.getElementById('locationAccuracy');

    rangeSlider.addEventListener('input', function() {
        const range = this.value;
        rangeValue.textContent = `${range} km`;
        updateRangeCircle(range);
    });

    // Get current location button
    getCurrentLocationBtn.addEventListener('click', async function() {
        const btn = this;
        const originalText = btn.innerHTML;
        
        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Location...';
            btn.disabled = true;
            
            if (window.geolocationService) {
                const location = await window.geolocationService.getCurrentPosition();
                currentLocation = [location.latitude, location.longitude];
                
                // Update map view
                map.setView(currentLocation, 15);
                
                // Add marker for current location
                L.marker(currentLocation)
                    .addTo(map)
                    .bindPopup(multilingualManager ? multilingualManager.translate('current_location') : 'Current Location')
                    .openPopup();
                
                // Update range circle
                updateRangeCircle(rangeSlider.value);
                
                // Update location search input with address
                try {
                    const address = await window.geolocationService.getAddressFromCoordinates(
                        location.latitude, 
                        location.longitude
                    );
                    locationSearch.value = address.formatted;
                } catch (error) {
                    locationSearch.value = `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
                }
                
                // Apply translations to dynamic content
                if (multilingualManager) {
                    multilingualManager.applyTranslations();
                }
                
            } else {
                throw new Error('Geolocation service not available');
            }
        } catch (error) {
            alert(error.message || error);
            console.error('Geolocation error:', error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
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
    const ratingFilter = document.getElementById('ratingFilter');
    const inStockFilter = document.getElementById('inStockFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const distanceDisplay = document.getElementById('distanceDisplay');

    // Toggle filter panel
    filterBtn.addEventListener('click', function() {
        filterPanel.classList.toggle('active');
    });
    
    // Distance slider
    if (distanceFilter && distanceDisplay) {
        distanceFilter.addEventListener('input', function() {
            distanceDisplay.textContent = `${this.value} km`;
        });
    }
    
    // Filter control buttons
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const addFilteredToCartBtn = document.getElementById('addFilteredToCartBtn');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => applyFilters());
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    if (addFilteredToCartBtn) {
        addFilteredToCartBtn.addEventListener('click', addFilteredProductsToCart);
    }
    
    // Cart controls
    const toggleCartFilterBtn = document.getElementById('toggleCartFilterBtn');
    const cartRecommendationsBtn = document.getElementById('cartRecommendationsBtn');
    
    if (toggleCartFilterBtn) {
        toggleCartFilterBtn.addEventListener('click', toggleCartFilterView);
    }
    
    if (cartRecommendationsBtn) {
        cartRecommendationsBtn.addEventListener('click', showCartRecommendations);
    }

    // Apply filters
    const applyFilters = debounce(function() {
        const category = categoryFilter?.value || '';
        const priceRange = priceFilter?.value || '';
        const location = locationFilter?.value || '';
        const search = searchFilter?.value.toLowerCase() || '';
        const rating = parseFloat(ratingFilter?.value || '0');
        const inStockOnly = inStockFilter?.checked || false;
        const maxDistance = parseFloat(distanceFilter?.value || '100');

        const productCards = document.querySelectorAll('.product-card');
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardPrice = parseFloat(card.dataset.price);
            const cardName = card.dataset.name.toLowerCase();
            const cardRating = parseFloat(card.dataset.rating || '0');
            const cardInStock = card.dataset.inStock === 'true';
            const cardDistance = parseFloat(card.dataset.distance || '0');
            
            let show = true;
            
            // Category filter
            if (category && cardCategory !== category) show = false;
            
            // Price range filter
            if (priceRange && !isPriceInRange(cardPrice, priceRange)) show = false;
            
            // Location filter
            if (location === 'nearby' && cardDistance > maxDistance) show = false;
            if (location === 'city' && cardDistance > 50) show = false; // Assume city limit is 50km
            
            // Search filter
            if (search && !cardName.includes(search)) show = false;
            
            // Rating filter
            if (rating > 0 && cardRating < rating) show = false;
            
            // Stock filter
            if (inStockOnly && !cardInStock) show = false;
            
            // Distance filter
            if (cardDistance > maxDistance) show = false;
            
            card.style.display = show ? 'block' : 'none';
            if (show) visibleCount++;
        });
        
        updateProductCount(visibleCount);
        updateFilterSummary();
    }, 300);

    function isPriceInRange(price, range) {
        switch (range) {
            case '0-100': return price >= 0 && price <= 100;
            case '100-500': return price > 100 && price <= 500;
            case '500-1000': return price > 500 && price <= 1000;
            case '1000+': return price > 1000;
            default: return true;
        }
    }

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

function updateProductCount(count) {
    const visibleProducts = count !== undefined ? count : 
        document.querySelectorAll('.product-card[style="display: block"], .product-card:not([style*="display: none"])').length;
    const countElement = document.querySelector('.product-count');
    if (countElement) {
        countElement.textContent = `${visibleProducts} products found`;
    }
}

function updateFilterSummary() {
    // Update filter summary display
    const activeFilters = [];
    
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const locationFilter = document.getElementById('locationFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const inStockFilter = document.getElementById('inStockFilter');
    const searchFilter = document.getElementById('searchFilter');
    
    if (categoryFilter?.value) activeFilters.push(`Category: ${categoryFilter.value}`);
    if (priceFilter?.value) activeFilters.push(`Price: ${priceFilter.value}`);
    if (locationFilter?.value) activeFilters.push(`Location: ${locationFilter.value}`);
    if (ratingFilter?.value && ratingFilter.value !== '0') activeFilters.push(`Rating: ${ratingFilter.value}+ stars`);
    if (inStockFilter?.checked) activeFilters.push('In Stock Only');
    if (searchFilter?.value) activeFilters.push(`Search: "${searchFilter.value}"`);
    
    // Update filter summary display (if exists)
    const filterSummary = document.querySelector('.filter-summary');
    if (filterSummary) {
        if (activeFilters.length > 0) {
            filterSummary.innerHTML = `<strong>Active Filters:</strong> ${activeFilters.join(', ')}`;
            filterSummary.style.display = 'block';
        } else {
            filterSummary.style.display = 'none';
        }
    }
}

function clearFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const locationFilter = document.getElementById('locationFilter');
    const searchFilter = document.getElementById('searchFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const inStockFilter = document.getElementById('inStockFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    const distanceDisplay = document.getElementById('distanceDisplay');
    
    if (categoryFilter) categoryFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (searchFilter) searchFilter.value = '';
    if (ratingFilter) ratingFilter.value = '0';
    if (inStockFilter) inStockFilter.checked = false;
    if (distanceFilter) {
        distanceFilter.value = '50';
        if (distanceDisplay) distanceDisplay.textContent = '50 km';
    }
    
    // Show all products
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.style.display = 'block';
    });
    
    updateProductCount();
    updateFilterSummary();
    showNotification('Filters cleared', 'success');
}

function addFilteredProductsToCart() {
    const visibleProducts = document.querySelectorAll('.product-card[style="display: block"], .product-card:not([style*="display: none"])');
    
    if (visibleProducts.length === 0) {
        showNotification('No products match the current filters', 'warning');
        return;
    }
    
    if (visibleProducts.length > 20) {
        if (!confirm(`This will add ${visibleProducts.length} products to your cart. Continue?`)) {
            return;
        }
    }
    
    let addedCount = 0;
    
    visibleProducts.forEach(card => {
        const productId = card.dataset.id;
        const productName = card.dataset.name;
        const productPrice = card.dataset.price;
        const productImage = card.querySelector('.product-image img')?.src || '';
        const productSupplier = card.querySelector('.product-supplier')?.textContent.replace('by ', '') || '';
        
        if (window.cartService) {
            try {
                const products = getProductsData();
                const product = products.find(p => p.id === productId);
                if (product) {
                    window.cartService.addToCart(product, 1, false);
                    addedCount++;
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
            }
        }
    });
    
    if (addedCount > 0) {
        showNotification(`${addedCount} products added to cart`, 'success');
    } else {
        showNotification('No products were added to cart', 'error');
    }
}

function toggleCartFilterView() {
    const cartSummary = document.getElementById('cartSummary');
    const filteredTotal = document.getElementById('filteredTotal');
    
    if (cartSummary) {
        const isVisible = cartSummary.style.display !== 'none';
        cartSummary.style.display = isVisible ? 'none' : 'block';
        
        if (filteredTotal) {
            filteredTotal.style.display = isVisible ? 'none' : 'inline';
        }
    }
}

function showCartRecommendations() {
    if (!window.cartService) {
        showNotification('Cart service not available', 'error');
        return;
    }
    
    const cart = window.cartService.getCart();
    if (cart.length === 0) {
        showNotification('Add some items to cart to get recommendations', 'info');
        return;
    }
    
    // Generate recommendations based on cart items
    const recommendations = generateCartRecommendations(cart);
    
    if (recommendations.length === 0) {
        showNotification('No recommendations available at the moment', 'info');
        return;
    }
    
    // Show recommendations modal
    const recommendationsHtml = recommendations.map(product => `
        <div class="recommendation-item">
            <img src="${product.image}" alt="${product.name}" class="recommendation-image">
            <div class="recommendation-details">
                <h5>${product.name}</h5>
                <p>by ${product.supplier}</p>
                <div class="recommendation-price">₹${product.price}/${product.unit}</div>
                <div class="recommendation-reason">${product.reason}</div>
            </div>
            <button class="btn btn-small btn-street-vendor" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}', '${product.supplier}')">
                Add to Cart
            </button>
        </div>
    `).join('');
    
    showModal('Cart Recommendations', `
        <div class="recommendations-container">
            <p>Based on your cart items, we recommend:</p>
            ${recommendationsHtml}
        </div>
    `);
}

function generateCartRecommendations(cart) {
    const products = getProductsData();
    const cartCategories = [...new Set(cart.map(item => item.category))];
    const recommendations = [];
    
    // Find complementary products
    cartCategories.forEach(category => {
        const complementaryProducts = products.filter(product => 
            product.category === category && 
            !cart.some(cartItem => cartItem.id === product.id)
        ).slice(0, 2);
        
        complementaryProducts.forEach(product => {
            recommendations.push({
                ...product,
                reason: `Complements your ${category} items`
            });
        });
    });
    
    // Add popular products from different categories
    const otherCategories = products.filter(product => 
        !cartCategories.includes(product.category) &&
        product.rating >= 4.0
    ).slice(0, 3);
    
    otherCategories.forEach(product => {
        recommendations.push({
            ...product,
            reason: 'Popular choice among vendors'
        });
    });
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
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
    if (window.cartService) {
        // Find the full product data
        const products = getProductsData();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            try {
                window.cartService.addToCart(product, 1, false);
                showNotification(`${name} added to cart`, 'success');
            } catch (error) {
                console.error('Error adding to cart:', error);
                showNotification('Error adding item to cart', 'error');
            }
        } else {
            // Fallback for legacy calls
            const productData = {
                id: productId,
                name: name,
                price: parseFloat(price),
                image: image,
                supplier: supplier,
                category: 'unknown',
                unit: 'piece',
                rating: 0,
                inStock: true,
                location: 'unknown',
                latitude: 0,
                longitude: 0
            };
            
            try {
                window.cartService.addToCart(productData, 1, false);
                showNotification(`${name} added to cart`, 'success');
            } catch (error) {
                console.error('Error adding to cart:', error);
                showNotification('Error adding item to cart', 'error');
            }
        }
    } else {
        // Fallback to old cart system
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
    const createBulkOrderBtn = document.getElementById('createBulkOrderBtn');
    
    // Main collaborate button - redirect to collaboration page
    if (collaborateBtn) {
        collaborateBtn.addEventListener('click', function() {
            window.location.href = 'collaboration.html';
        });
    }
    
    // Create bulk order button
    if (createBulkOrderBtn) {
        createBulkOrderBtn.addEventListener('click', function() {
            if (window.collaborationManager) {
                window.collaborationManager.openBulkOrderModal();
            } else {
                showNotification('Collaboration system is loading. Please try again.', 'info');
            }
        });
    }
    
    // Load and display collaboration data in sidebar
    loadCollaborationSidebar();
}

function loadCollaborationSidebar() {
    // Load active collaborations
    loadActiveCollaborations();
    
    // Load collaboration requests
    loadCollaborationRequests();
}

function loadActiveCollaborations() {
    const activeCollaborationsContainer = document.getElementById('activeCollaborations');
    if (!activeCollaborationsContainer) return;
    
    // Get data from localStorage or use sample data
    const collaborations = getFromLocalStorage('activeCollaborations') || [
        {
            id: 'collab1',
            vendorName: 'Delhi Chaat Corner',
            status: 'active',
            totalSavings: 1250,
            totalOrders: 5
        },
        {
            id: 'collab2',
            vendorName: 'Fresh Dairy Co.',
            status: 'active',
            totalSavings: 800,
            totalOrders: 2
        }
    ];
    
    if (collaborations.length === 0) {
        activeCollaborationsContainer.innerHTML = `
            <div class="text-center text-muted py-3">
                <small>No active collaborations yet</small>
            </div>
        `;
        return;
    }
    
    activeCollaborationsContainer.innerHTML = collaborations.map(collab => `
        <div class="collaboration-item">
            <div class="collaboration-item-header">
                <div class="collaboration-item-title">${collab.vendorName}</div>
                <div class="collaboration-item-status">${collab.status}</div>
            </div>
            <div class="collaboration-item-details">
                ${collab.totalOrders} orders • ₹${collab.totalSavings.toLocaleString()} saved
            </div>
        </div>
    `).join('');
}

function loadCollaborationRequests() {
    const requestsContainer = document.getElementById('collaborationRequests');
    if (!requestsContainer) return;
    
    // Get data from localStorage or use sample data
    const requests = getFromLocalStorage('collaborationRequests') || [
        {
            id: 'req1',
            vendorName: 'Samosa King',
            message: 'Interested in bulk potato orders',
            status: 'pending'
        }
    ];
    
    const pendingRequests = requests.filter(req => req.status === 'pending');
    
    if (pendingRequests.length === 0) {
        requestsContainer.innerHTML = '';
        return;
    }
    
    requestsContainer.innerHTML = `
        <div class="collaboration-requests-header">
            <h5><i class="fas fa-envelope"></i> Pending Requests (${pendingRequests.length})</h5>
        </div>
        ${pendingRequests.map(request => `
            <div class="collaboration-request">
                <div class="collaboration-request-header">
                    <div class="collaboration-request-title">${request.vendorName}</div>
                    <div class="collaboration-request-actions">
                        <button class="btn btn-accept" onclick="acceptCollaborationRequest('${request.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-decline" onclick="declineCollaborationRequest('${request.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="collaboration-request-message">${request.message}</div>
            </div>
        `).join('')}
    `;
}

function acceptCollaborationRequest(requestId) {
    const requests = getFromLocalStorage('collaborationRequests') || [];
    const request = requests.find(r => r.id === requestId);
    
    if (request) {
        request.status = 'accepted';
        saveToLocalStorage('collaborationRequests', requests);
        
        // Add to active collaborations
        const activeCollaborations = getFromLocalStorage('activeCollaborations') || [];
        activeCollaborations.push({
            id: 'collab_' + Date.now(),
            vendorName: request.vendorName,
            status: 'active',
            totalSavings: 0,
            totalOrders: 0
        });
        saveToLocalStorage('activeCollaborations', activeCollaborations);
        
        showNotification(`Collaboration accepted with ${request.vendorName}!`, 'success');
        loadCollaborationSidebar();
    }
}

function declineCollaborationRequest(requestId) {
    const requests = getFromLocalStorage('collaborationRequests') || [];
    const updatedRequests = requests.filter(r => r.id !== requestId);
    saveToLocalStorage('collaborationRequests', updatedRequests);
    
    showNotification('Collaboration request declined.', 'info');
    loadCollaborationSidebar();
}

// Order Tracking
function initOrderTracking() {
    updateOrderTracking();
    initLiveTrackingPreview();
    setupOrderTrackingEventListeners();
}

function setupOrderTrackingEventListeners() {
    // Refresh orders button
    const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', () => {
            updateOrderTracking();
            showNotification('Orders refreshed', 'success');
        });
    }

    // Open live tracking button
    const openLiveTrackingBtn = document.getElementById('openLiveTrackingBtn');
    if (openLiveTrackingBtn) {
        openLiveTrackingBtn.addEventListener('click', () => {
            // Open live tracking page with the latest order
            const orders = getFromLocalStorage('streetVendorOrders') || [];
            const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null;
            const orderId = latestOrder ? latestOrder.id : 'ORD-2024-001';
            window.open(`live-tracking.html?orderId=${orderId}`, '_blank');
        });
    }
}

function updateOrderTracking() {
    const ordersList = document.getElementById('ordersList');
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-clipboard-list"></i>
                <p data-translate="no_orders_yet">No orders yet</p>
                <small data-translate="orders_will_appear_here">Your orders will appear here once you make a purchase</small>
            </div>
        `;
        return;
    }
    
    // Update tracking statistics
    updateTrackingStatistics(orders);
    
    ordersList.innerHTML = orders.slice(-5).reverse().map(order => `
        <div class="order-item" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-id-section">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${new Date(order.timestamp).toLocaleDateString()}</div>
                </div>
                <div class="order-status-section">
                    <div class="order-status status-${order.status}">
                        <i class="fas ${getStatusIcon(order.status)}"></i>
                        ${formatOrderStatus(order.status)}
                    </div>
                </div>
            </div>
            <div class="order-details">
                <div class="order-summary">
                    <div class="order-items">
                        <i class="fas fa-box"></i>
                        ${order.items.length} items
                    </div>
                    <div class="order-total">
                        <i class="fas fa-rupee-sign"></i>
                        ₹${order.total.toFixed(2)}
                    </div>
                    ${order.estimatedDelivery ? `
                        <div class="order-eta">
                            <i class="fas fa-clock"></i>
                            ETA: ${order.estimatedDelivery}
                        </div>
                    ` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-small btn-primary" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> <span data-translate="view_details">Details</span>
                    </button>
                    ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                        <button class="btn btn-small btn-street-vendor" onclick="trackOrderLive('${order.id}')">
                            <i class="fas fa-map-marker-alt"></i> <span data-translate="track_live">Track Live</span>
                        </button>
                    ` : ''}
                    ${order.status === 'delivered' ? `
                        <button class="btn btn-small btn-success" onclick="reorderItems('${order.id}')">
                            <i class="fas fa-redo"></i> <span data-translate="reorder">Reorder</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    // Apply translations to dynamic content
    if (window.multilingualManager) {
        window.multilingualManager.applyTranslations();
    }
}

function getStatusIcon(status) {
    const statusIcons = {
        'pending': 'fa-clock',
        'confirmed': 'fa-check-circle',
        'preparing': 'fa-utensils',
        'pickup': 'fa-box',
        'transit': 'fa-truck',
        'delivered': 'fa-check-double',
        'cancelled': 'fa-times-circle'
    };
    return statusIcons[status] || 'fa-question-circle';
}

function formatOrderStatus(status) {
    const statusLabels = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'pickup': 'Picked Up',
        'transit': 'In Transit',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return statusLabels[status] || status;
}

function updateTrackingStatistics(orders) {
    const today = new Date().toDateString();
    const activeOrders = orders.filter(order => 
        order.status !== 'delivered' && order.status !== 'cancelled'
    );
    const completedToday = orders.filter(order => 
        order.status === 'delivered' && 
        new Date(order.timestamp).toDateString() === today
    );
    
    // Calculate average delivery time for completed orders
    const deliveredOrders = orders.filter(order => order.status === 'delivered' && order.deliveryTime);
    const avgDeliveryTime = deliveredOrders.length > 0 
        ? Math.round(deliveredOrders.reduce((sum, order) => sum + order.deliveryTime, 0) / deliveredOrders.length)
        : 0;
    
    // Update UI elements
    const activeDeliveriesCount = document.getElementById('activeDeliveriesCount');
    const avgDeliveryTimeElement = document.getElementById('avgDeliveryTime');
    const completedTodayCount = document.getElementById('completedTodayCount');
    
    if (activeDeliveriesCount) activeDeliveriesCount.textContent = activeOrders.length;
    if (avgDeliveryTimeElement) avgDeliveryTimeElement.textContent = avgDeliveryTime > 0 ? `${avgDeliveryTime} min` : '-- min';
    if (completedTodayCount) completedTodayCount.textContent = completedToday.length;
}

function initLiveTrackingPreview() {
    // Initialize preview map
    const previewMapElement = document.getElementById('previewMap');
    if (previewMapElement) {
        try {
            const previewMap = L.map('previewMap', {
                zoomControl: false,
                dragging: false,
                touchZoom: false,
                doubleClickZoom: false,
                scrollWheelZoom: false,
                boxZoom: false,
                keyboard: false
            }).setView([11.0168, 76.9558], 12);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(previewMap);
            
            // Add sample markers
            const supplierMarker = L.marker([11.0004, 76.9661]).addTo(previewMap);
            const customerMarker = L.marker([11.0168, 76.9558]).addTo(previewMap);
            
            // Add route line
            L.polyline([[11.0004, 76.9661], [11.0168, 76.9558]], {
                color: '#0066cc',
                weight: 3,
                opacity: 0.7
            }).addTo(previewMap);
            
        } catch (error) {
            console.error('Error initializing preview map:', error);
            previewMapElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6c757d;"><i class="fas fa-map"></i> Map Preview</div>';
        }
    }
}

function viewOrderDetails(orderId) {
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }
    
    // Create order details modal content
    const modalContent = `
        <div class="order-details-modal">
            <div class="order-header-details">
                <h4>Order #${order.id}</h4>
                <div class="order-status status-${order.status}">
                    <i class="fas ${getStatusIcon(order.status)}"></i>
                    ${formatOrderStatus(order.status)}
                </div>
            </div>
            <div class="order-info-grid">
                <div class="info-item">
                    <label>Order Date:</label>
                    <span>${new Date(order.timestamp).toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <label>Total Amount:</label>
                    <span>₹${order.total.toFixed(2)}</span>
                </div>
                <div class="info-item">
                    <label>Payment Method:</label>
                    <span>${order.paymentMethod || 'Pay Now'}</span>
                </div>
                ${order.estimatedDelivery ? `
                    <div class="info-item">
                        <label>Estimated Delivery:</label>
                        <span>${order.estimatedDelivery}</span>
                    </div>
                ` : ''}
            </div>
            <div class="order-items-details">
                <h5>Order Items:</h5>
                <div class="items-list">
                    ${order.items.map(item => `
                        <div class="item-row">
                            <div class="item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-supplier">by ${item.supplier}</span>
                            </div>
                            <div class="item-quantity">Qty: ${item.quantity}</div>
                            <div class="item-price">₹${item.totalPrice.toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                <div class="order-actions-modal">
                    <button class="btn btn-street-vendor" onclick="trackOrderLive('${order.id}')">
                        <i class="fas fa-map-marker-alt"></i> Track Live
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show modal (you'll need to implement showModal function)
    showModal('Order Details', modalContent);
}

function trackOrderLive(orderId) {
    window.open(`live-tracking.html?orderId=${orderId}`, '_blank');
}

function reorderItems(orderId) {
    const orders = getFromLocalStorage('streetVendorOrders') || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showNotification('Order not found', 'error');
        return;
    }
    
    // Add all items from the order to cart
    if (window.cartService) {
        order.items.forEach(item => {
            window.cartService.addItem({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                supplier: item.supplier,
                unit: item.unit || 'kg'
            }, item.quantity);
        });
        
        showNotification(`${order.items.length} items added to cart from order #${orderId}`, 'success');
    } else {
        showNotification('Cart service not available', 'error');
    }
}

// Load Products
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const products = getProductsData();
    
    productsGrid.innerHTML = products.map(product => {
        // Calculate distance from current location (mock calculation for demo)
        const distance = Math.random() * 50; // Random distance between 0-50km
        
        return `
        <div class="product-card" 
             data-id="${product.id}"
             data-category="${product.category}" 
             data-price="${product.price}" 
             data-name="${product.name}"
             data-rating="${product.rating || 0}"
             data-in-stock="${product.inStock || false}"
             data-distance="${distance.toFixed(1)}"
             data-supplier="${product.supplier}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.inStock ? '<div class="product-badge in-stock">In Stock</div>' : '<div class="product-badge out-of-stock">Out of Stock</div>'}
                <div class="product-distance-badge">${distance.toFixed(1)} km</div>
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-supplier">by ${product.supplier}</div>
                <div class="product-price">₹${product.price}/${product.unit || 'kg'}</div>
                <div class="product-rating">
                    <span class="rating-stars">${generateStarRating(product.rating || 0)}</span>
                    <span class="rating-value">${product.rating || 0}</span>
                    <span class="rating-count">(${Math.floor(Math.random() * 100) + 10} reviews)</span>
                </div>
                <div class="product-meta">
                    <span class="product-category-tag">${product.category}</span>
                    ${product.organic ? '<span class="product-organic-tag">Organic</span>' : ''}
                    ${distance < 10 ? '<span class="product-nearby-tag">Nearby</span>' : ''}
                </div>
                <div class="product-actions">
                    <button class="btn btn-small btn-primary" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i> <span data-translate="view_details">View Details</span>
                    </button>
                    <button class="btn btn-small btn-street-vendor" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}', '${product.supplier}')" ${!product.inStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> <span data-translate="add_to_cart">Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Apply translations to dynamically generated content
    if (window.multilingualManager) {
        window.multilingualManager.applyTranslations();
    }
    
    // Update product count
    updateProductCount();
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
    
    // Show supplier details for this product
    showSupplierDetailsForProduct(product);
}

// Show supplier details for a specific product
async function showSupplierDetailsForProduct(product) {
    try {
        // Fetch suppliers for this product category
        const response = await fetch(`http://localhost:5000/api/suppliers/search?category=${product.category}&limit=10`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch supplier data');
        }
        
        const suppliers = await response.json();
        
        // Show supplier details modal
        const modal = document.getElementById('supplierDetailsModal');
        const modalTitle = document.getElementById('supplierModalTitle');
        const modalContent = document.getElementById('supplierModalContent');
        
        modalTitle.textContent = `Suppliers for ${product.name}`;
        
        modalContent.innerHTML = `
            <div class="product-supplier-info">
                <div class="product-header">
                    <img src="${product.image}" alt="${product.name}" class="product-modal-image">
                    <div class="product-modal-details">
                        <h4>${product.name}</h4>
                        <p class="product-modal-price">₹${product.price}/${product.unit}</p>
                        <div class="product-modal-rating">
                            <span class="rating-stars">${generateStarRating(product.rating)}</span>
                            <span class="rating-value">${product.rating}</span>
                        </div>
                    </div>
                </div>
                
                <div class="suppliers-list">
                    <h5>Available Suppliers (${suppliers.length})</h5>
                    ${suppliers.map(supplier => `
                        <div class="supplier-card ${supplier.premium_tier !== 'none' ? 'premium-supplier' : ''}">
                            <div class="supplier-header">
                                <div class="supplier-info">
                                    <h6>${supplier.name} ${supplier.premium_tier !== 'none' ? '<span class="premium-badge">PREMIUM</span>' : ''}</h6>
                                    <p class="supplier-location"><i class="fas fa-map-marker-alt"></i> ${supplier.location}, ${supplier.region}</p>
                                </div>
                                <div class="supplier-rating">
                                    <div class="rating-stars">${generateStarRating(supplier.average_rating)}</div>
                                    <div class="rating-info">${supplier.average_rating.toFixed(1)} (${supplier.total_reviews} reviews)</div>
                                </div>
                            </div>
                            
                            <div class="supplier-details">
                                <p class="supplier-description">${supplier.description}</p>
                                <div class="supplier-services">
                                    <strong>Services:</strong> ${supplier.services_offered.join(', ')}
                                </div>
                                <div class="supplier-contact">
                                    <span><i class="fas fa-phone"></i> ${supplier.phone}</span>
                                    <span><i class="fas fa-envelope"></i> ${supplier.email}</span>
                                </div>
                            </div>
                            
                            <div class="supplier-actions">
                                <button class="btn btn-small btn-primary" onclick="contactSupplier('${supplier.id}')">
                                    <i class="fas fa-phone"></i> Contact
                                </button>
                                <button class="btn btn-small btn-street-vendor" onclick="viewSupplierReviews('${supplier.id}')">
                                    <i class="fas fa-star"></i> Reviews
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching supplier details:', error);
        showNotification('Failed to load supplier details. Please make sure the supplier API is running.', 'error');
    }
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
window.contactSupplier = contactSupplier;
window.viewSupplierReviews = viewSupplierReviews;
window.closeSupplierModal = closeSupplierModal;

// Contact supplier function
function contactSupplier(supplierId) {
    // Simple contact functionality - could be enhanced with modal
    alert(`Contacting supplier ${supplierId}. This would open a contact form or initiate a call.`);
}

// View supplier reviews function
function viewSupplierReviews(supplierId) {
    // Simple reviews functionality - could be enhanced with modal
    alert(`Viewing reviews for supplier ${supplierId}. This would show detailed reviews and ratings.`);
}

// Close supplier modal function
function closeSupplierModal() {
    const modal = document.getElementById('supplierDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Enhanced filter functions
function applyFilters() {
    if (!window.cartService) return;
    
    const filters = {
        category: document.getElementById('categoryFilter')?.value || '',
        priceRange: document.getElementById('priceFilter')?.value || '',
        location: document.getElementById('locationFilter')?.value || '',
        rating: parseFloat(document.getElementById('ratingFilter')?.value || '0'),
        inStock: document.getElementById('inStockFilter')?.checked || false,
        distance: parseFloat(document.getElementById('distanceFilter')?.value || '50'),
        search: document.getElementById('searchFilter')?.value.toLowerCase() || ''
    };
    
    window.cartService.setFilters(filters);
    filterProducts(filters);
}

function clearFilters() {
    if (window.cartService) {
        window.cartService.clearFilters();
    }
    
    // Reset filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const locationFilter = document.getElementById('locationFilter');
    const searchFilter = document.getElementById('searchFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const inStockFilter = document.getElementById('inStockFilter');
    const distanceFilter = document.getElementById('distanceFilter');
    
    if (categoryFilter) categoryFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (searchFilter) searchFilter.value = '';
    if (ratingFilter) ratingFilter.value = '0';
    if (inStockFilter) inStockFilter.checked = false;
    if (distanceFilter) distanceFilter.value = '50';
    
    // Reload products without filters
    loadProducts();
}

function filterProducts(filters) {
    const products = getProductsData();
    const filteredProducts = products.filter(product => {
        // Category filter
        if (filters.category && product.category !== filters.category) {
            return false;
        }
        
        // Price filter
        if (filters.priceRange) {
            const [min, max] = parsePriceRange(filters.priceRange);
            if (product.price < min || (max && product.price > max)) {
                return false;
            }
        }
        
        // Rating filter
        if (filters.rating && product.rating < filters.rating) {
            return false;
        }
        
        // Stock filter
        if (filters.inStock && !product.inStock) {
            return false;
        }
        
        // Search filter
        if (filters.search && !product.name.toLowerCase().includes(filters.search)) {
            return false;
        }
        
        // Location/Distance filter
        if (filters.location === 'nearby' && window.geolocationService) {
            try {
                const distance = window.geolocationService.getDistanceFromCurrent(
                    product.latitude || 0, 
                    product.longitude || 0
                );
                if (distance > filters.distance) {
                    return false;
                }
            } catch (error) {
                console.warn('Could not calculate distance for product:', product.name);
            }
        }
        
        return true;
    });
    
    displayProducts(filteredProducts);
}

function parsePriceRange(priceRange) {
    switch (priceRange) {
        case '0-100': return [0, 100];
        case '100-500': return [100, 500];
        case '500-1000': return [500, 1000];
        case '1000+': return [1000, null];
        default: return [0, null];
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
            </div>
        `;
        return;
    }
    
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
                        <i class="fas fa-eye"></i> <span data-translate="view_details">View Details</span>
                    </button>
                    <button class="btn btn-small btn-street-vendor" onclick="addToCart('${product.id}', '${product.name}', '${product.price}', '${product.image}', '${product.supplier}')">
                        <i class="fas fa-cart-plus"></i> <span data-translate="add_to_cart">Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Apply translations to dynamic content
    if (window.multilingualManager) {
        window.multilingualManager.applyTranslations();
    }
}

async function addFilteredProductsToCart() {
    if (!window.cartService) return;
    
    try {
        const products = getProductsData();
        const filters = window.cartService.getFilters();
        
        const result = await window.cartService.addFilteredProductsToCart(products, filters);
        
        showNotification(
            `Added ${result.added.length} products to cart (${result.filtered} matched filters)`,
            'success'
        );
    } catch (error) {
        console.error('Error adding filtered products to cart:', error);
        showNotification('Error adding products to cart', 'error');
    }
}

function toggleCartFilterView() {
    const cartSummary = document.getElementById('cartSummary');
    const filteredTotal = document.getElementById('filteredTotal');
    
    if (cartSummary) {
        cartSummary.style.display = cartSummary.style.display === 'none' ? 'block' : 'none';
    }
    
    if (filteredTotal) {
        filteredTotal.style.display = filteredTotal.style.display === 'none' ? 'inline' : 'none';
    }
}

async function showCartRecommendations() {
    if (!window.cartService) return;
    
    try {
        const recommendations = await window.cartService.getLocationBasedRecommendations();
        
        if (recommendations.length === 0) {
            showNotification('No recommendations available', 'info');
            return;
        }
        
        // Display recommendations in a modal or notification
        const recommendationText = recommendations.slice(0, 3)
            .map(item => item.name)
            .join(', ');
            
        showNotification(
            `Recommended nearby products: ${recommendationText}`,
            'info'
        );
    } catch (error) {
        console.error('Error getting recommendations:', error);
        showNotification('Error getting recommendations', 'error');
    }
}

// Enhanced cart functions
function updateCartQuantity(productId, quantity) {
    if (window.cartService) {
        window.cartService.updateQuantity(productId, quantity);
    }
}

function removeFromCart(productId) {
    if (window.cartService) {
        window.cartService.removeFromCart(productId);
    }
}