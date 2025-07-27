// Enhanced Cart Service for Sourcify
class CartService {
    constructor() {
        this.cart = [];
        this.filters = {
            category: '',
            priceRange: '',
            location: '',
            distance: 50,
            inStock: false,
            rating: 0,
            supplier: ''
        };
        this.callbacks = {
            onCartUpdate: [],
            onFilterUpdate: []
        };
        
        // Load cart from localStorage
        this.loadCart();
    }

    // Add item to cart with filtering support
    addToCart(product, quantity = 1, applyFilters = true) {
        // Check if product passes current filters
        if (applyFilters && !this.passesFilters(product)) {
            throw new Error('Product does not match current filters');
        }

        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
        } else {
            const cartItem = {
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: quantity,
                totalPrice: parseFloat(product.price) * quantity,
                image: product.image,
                supplier: product.supplier,
                category: product.category,
                unit: product.unit,
                rating: product.rating,
                inStock: product.inStock,
                location: product.location,
                latitude: product.latitude,
                longitude: product.longitude,
                addedAt: new Date().toISOString()
            };
            
            this.cart.push(cartItem);
        }
        
        this.saveCart();
        this.notifyCartUpdate();
        return this.cart;
    }

    // Remove item from cart
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index > -1) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.notifyCartUpdate();
        }
        return this.cart;
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                item.totalPrice = item.quantity * item.price;
                this.saveCart();
                this.notifyCartUpdate();
            }
        }
        return this.cart;
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.notifyCartUpdate();
    }

    // Get cart items
    getCart() {
        return this.cart;
    }

    // Get filtered cart items
    getFilteredCart() {
        return this.cart.filter(item => this.passesFilters(item));
    }

    // Get cart total
    getCartTotal() {
        return this.cart.reduce((total, item) => total + item.totalPrice, 0);
    }

    // Get filtered cart total
    getFilteredCartTotal() {
        return this.getFilteredCart().reduce((total, item) => total + item.totalPrice, 0);
    }

    // Get cart item count
    getCartItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    // Get filtered cart item count
    getFilteredCartItemCount() {
        return this.getFilteredCart().reduce((count, item) => count + item.quantity, 0);
    }

    // Set filters
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.notifyFilterUpdate();
        this.notifyCartUpdate(); // Update cart display with new filters
    }

    // Get current filters
    getFilters() {
        return { ...this.filters };
    }

    // Clear filters
    clearFilters() {
        this.filters = {
            category: '',
            priceRange: '',
            location: '',
            distance: 50,
            inStock: false,
            rating: 0,
            supplier: ''
        };
        this.notifyFilterUpdate();
        this.notifyCartUpdate();
    }

    // Check if item passes current filters
    passesFilters(item) {
        // Category filter
        if (this.filters.category && item.category !== this.filters.category) {
            return false;
        }

        // Price range filter
        if (this.filters.priceRange) {
            const [min, max] = this.parsePriceRange(this.filters.priceRange);
            if (item.price < min || (max && item.price > max)) {
                return false;
            }
        }

        // In stock filter
        if (this.filters.inStock && !item.inStock) {
            return false;
        }

        // Rating filter
        if (this.filters.rating && item.rating < this.filters.rating) {
            return false;
        }

        // Supplier filter
        if (this.filters.supplier && item.supplier !== this.filters.supplier) {
            return false;
        }

        // Location/Distance filter
        if (this.filters.location === 'nearby' && window.geolocationService) {
            try {
                const distance = window.geolocationService.getDistanceFromCurrent(
                    item.latitude || 0, 
                    item.longitude || 0
                );
                if (distance > this.filters.distance) {
                    return false;
                }
            } catch (error) {
                console.warn('Could not calculate distance for item:', item.name);
            }
        }

        return true;
    }

    // Parse price range string
    parsePriceRange(priceRange) {
        switch (priceRange) {
            case '0-100':
                return [0, 100];
            case '100-500':
                return [100, 500];
            case '500-1000':
                return [500, 1000];
            case '1000+':
                return [1000, null];
            default:
                return [0, null];
        }
    }

    // Add filtered products to cart
    async addFilteredProductsToCart(products, filters = null) {
        if (filters) {
            this.setFilters(filters);
        }

        const filteredProducts = products.filter(product => this.passesFilters(product));
        const addedProducts = [];

        for (const product of filteredProducts) {
            try {
                this.addToCart(product, 1, false); // Don't apply filters again
                addedProducts.push(product);
            } catch (error) {
                console.warn(`Could not add product ${product.name} to cart:`, error);
            }
        }

        return {
            added: addedProducts,
            total: addedProducts.length,
            filtered: filteredProducts.length
        };
    }

    // Get cart summary
    getCartSummary() {
        const allItems = this.cart;
        const filteredItems = this.getFilteredCart();
        
        return {
            totalItems: allItems.length,
            filteredItems: filteredItems.length,
            totalQuantity: this.getCartItemCount(),
            filteredQuantity: this.getFilteredCartItemCount(),
            totalValue: this.getCartTotal(),
            filteredValue: this.getFilteredCartTotal(),
            categories: [...new Set(allItems.map(item => item.category))],
            suppliers: [...new Set(allItems.map(item => item.supplier))],
            averageRating: allItems.reduce((sum, item) => sum + item.rating, 0) / allItems.length || 0
        };
    }

    // Get location-based cart recommendations
    async getLocationBasedRecommendations() {
        if (!window.geolocationService) {
            return [];
        }

        try {
            const cartCategories = [...new Set(this.cart.map(item => item.category))];
            const recommendations = [];

            for (const category of cartCategories) {
                const nearbyProducts = await window.geolocationService.getLocationBasedProducts(
                    category, 
                    this.filters.distance
                );
                recommendations.push(...nearbyProducts);
            }

            // Remove duplicates and items already in cart
            const uniqueRecommendations = recommendations.filter((product, index, self) => 
                index === self.findIndex(p => p.id === product.id) &&
                !this.cart.some(cartItem => cartItem.id === product.id)
            );

            return uniqueRecommendations.slice(0, 10); // Limit to 10 recommendations
        } catch (error) {
            console.error('Error getting location-based recommendations:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem('sourcify_cart', JSON.stringify(this.cart));
            localStorage.setItem('sourcify_cart_filters', JSON.stringify(this.filters));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem('sourcify_cart');
            const savedFilters = localStorage.getItem('sourcify_cart_filters');
            
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
            
            if (savedFilters) {
                this.filters = { ...this.filters, ...JSON.parse(savedFilters) };
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            this.cart = [];
        }
    }

    // Add callback for cart updates
    onCartUpdate(callback) {
        this.callbacks.onCartUpdate.push(callback);
    }

    // Add callback for filter updates
    onFilterUpdate(callback) {
        this.callbacks.onFilterUpdate.push(callback);
    }

    // Remove callback
    removeCallback(type, callback) {
        const index = this.callbacks[type].indexOf(callback);
        if (index > -1) {
            this.callbacks[type].splice(index, 1);
        }
    }

    // Notify cart update callbacks
    notifyCartUpdate() {
        this.callbacks.onCartUpdate.forEach(callback => {
            try {
                callback(this.cart, this.getCartSummary());
            } catch (error) {
                console.error('Error in cart update callback:', error);
            }
        });
    }

    // Notify filter update callbacks
    notifyFilterUpdate() {
        this.callbacks.onFilterUpdate.forEach(callback => {
            try {
                callback(this.filters);
            } catch (error) {
                console.error('Error in filter update callback:', error);
            }
        });
    }

    // Export cart data
    exportCart() {
        return {
            cart: this.cart,
            filters: this.filters,
            summary: this.getCartSummary(),
            exportedAt: new Date().toISOString()
        };
    }

    // Import cart data
    importCart(data) {
        if (data.cart) {
            this.cart = data.cart;
        }
        if (data.filters) {
            this.filters = data.filters;
        }
        this.saveCart();
        this.notifyCartUpdate();
        this.notifyFilterUpdate();
    }
}

// Create global instance
window.cartService = new CartService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartService;
}