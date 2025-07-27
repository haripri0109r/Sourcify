// Raw Material Vendor Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initRawMaterialDashboard();
});

function initRawMaterialDashboard() {
    // Apply raw material theme
    document.body.classList.add('raw-material-theme');
    
    // Initialize components
    initStats();
    initOrderManagement();
    initProductManagement();
    initDeliveryTracking();
    initInventoryAlerts();
    initRevenueChart();
    initCustomerReviews();
    loadOrders();
    loadProducts();
}

// Initialize Statistics
function initStats() {
    const orders = getFromLocalStorage('rawMaterialOrders') || [];
    const products = getFromLocalStorage('rawMaterialProducts') || [];
    
    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalProducts = products.length;
    const totalCustomers = new Set(orders.map(order => order.customerId)).size;
    
    // Update UI
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalCustomers').textContent = totalCustomers;
}

// Order Management
function initOrderManagement() {
    const orderStatusFilter = document.getElementById('orderStatusFilter');
    
    orderStatusFilter.addEventListener('change', function() {
        filterOrders(this.value);
    });
}

function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    // Sample orders data (in real app, this would come from API)
    const orders = [
        {
            id: 'ORD001',
            customerId: 'CUST001',
            customerName: 'Raj Street Food',
            items: [
                { name: 'Fresh Tomatoes', quantity: 10, price: 80 },
                { name: 'Onions', quantity: 5, price: 40 }
            ],
            total: 1000,
            status: 'pending',
            orderDate: '2024-01-25',
            deliveryAddress: 'Connaught Place, Delhi'
        },
        {
            id: 'ORD002',
            customerId: 'CUST002',
            customerName: 'Spice Corner',
            items: [
                { name: 'Red Chili Powder', quantity: 2, price: 200 }
            ],
            total: 400,
            status: 'processing',
            orderDate: '2024-01-24',
            deliveryAddress: 'Karol Bagh, Delhi'
        },
        {
            id: 'ORD003',
            customerId: 'CUST003',
            customerName: 'Delhi Chaat',
            items: [
                { name: 'Basmati Rice', quantity: 20, price: 120 },
                { name: 'Fresh Milk', quantity: 10, price: 60 }
            ],
            total: 3000,
            status: 'shipped',
            orderDate: '2024-01-23',
            deliveryAddress: 'Chandni Chowk, Delhi'
        }
    ];
    
    // Save to localStorage for demo
    saveToLocalStorage('rawMaterialOrders', orders);
    
    renderOrders(orders);
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Orders Found</h3>
                <p>You don't have any orders yet. Orders will appear here when customers place them.</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item" data-status="${order.status}">
            <div class="order-header">
                <div class="order-id">${order.id}</div>
                <div class="order-status status-${order.status}">${order.status}</div>
            </div>
            <div class="order-customer">
                <i class="fas fa-user"></i> ${order.customerName}
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <div class="item-name">${item.name}</div>
                        <div class="item-quantity">${item.quantity} kg</div>
                        <div class="item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div class="order-total">Total: ₹${order.total.toLocaleString()}</div>
                <div class="order-actions">
                    <button class="btn btn-small btn-primary" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-small btn-raw-material" onclick="updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i> Update
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterOrders(status) {
    const orders = getFromLocalStorage('rawMaterialOrders') || [];
    const filteredOrders = status ? orders.filter(order => order.status === status) : orders;
    renderOrders(filteredOrders);
}

function viewOrderDetails(orderId) {
    const orders = getFromLocalStorage('rawMaterialOrders') || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const orderDetailsContent = document.getElementById('orderDetailsContent');
    orderDetailsContent.innerHTML = `
        <div class="order-details-section">
            <h4>Order Information</h4>
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${order.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${order.customerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${order.orderDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Delivery Address:</span>
                <span class="detail-value">${order.deliveryAddress}</span>
            </div>
        </div>
        
        <div class="order-details-section">
            <h4>Order Items</h4>
            ${order.items.map(item => `
                <div class="detail-row">
                    <span class="detail-label">${item.name} (${item.quantity} kg)</span>
                    <span class="detail-value">₹${(item.price * item.quantity).toLocaleString()}</span>
                </div>
            `).join('')}
            <div class="detail-row" style="border-top: 2px solid #e1e8ed; margin-top: 12px; padding-top: 12px;">
                <span class="detail-label"><strong>Total Amount:</strong></span>
                <span class="detail-value"><strong>₹${order.total.toLocaleString()}</strong></span>
            </div>
        </div>
        
        <div class="status-update-section">
            <h4>Update Order Status</h4>
            <div class="status-options">
                <div class="status-option ${order.status === 'pending' ? 'selected' : ''}" data-status="pending">Pending</div>
                <div class="status-option ${order.status === 'processing' ? 'selected' : ''}" data-status="processing">Processing</div>
                <div class="status-option ${order.status === 'shipped' ? 'selected' : ''}" data-status="shipped">Shipped</div>
                <div class="status-option ${order.status === 'delivered' ? 'selected' : ''}" data-status="delivered">Delivered</div>
            </div>
        </div>
    `;
    
    // Add event listeners for status options
    const statusOptions = orderDetailsContent.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            statusOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Store current order ID for updating
    document.getElementById('updateOrderStatus').setAttribute('data-order-id', orderId);
    
    openModal('orderDetailsModal');
}

function updateOrderStatus(orderId) {
    if (!orderId) {
        orderId = document.getElementById('updateOrderStatus').getAttribute('data-order-id');
    }
    
    const selectedStatus = document.querySelector('.status-option.selected');
    if (!selectedStatus) {
        showNotification('Please select a status', 'warning');
        return;
    }
    
    const newStatus = selectedStatus.getAttribute('data-status');
    const orders = getFromLocalStorage('rawMaterialOrders') || [];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        saveToLocalStorage('rawMaterialOrders', orders);
        
        showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        closeModal('orderDetailsModal');
        loadOrders();
        initStats();
    }
}

// Product Management
function initProductManagement() {
    const addProductBtn = document.getElementById('addProductBtn');
    const closeAddProduct = document.getElementById('closeAddProduct');
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    const saveProduct = document.getElementById('saveProduct');
    
    addProductBtn.addEventListener('click', function() {
        openModal('addProductModal');
    });
    
    closeAddProduct.addEventListener('click', function() {
        closeModal('addProductModal');
    });
    
    cancelAddProduct.addEventListener('click', function() {
        closeModal('addProductModal');
    });
    
    saveProduct.addEventListener('click', function() {
        saveNewProduct();
    });
    
    // Close order details modal
    document.getElementById('closeOrderDetails').addEventListener('click', function() {
        closeModal('orderDetailsModal');
    });
    
    document.getElementById('closeOrderDetailsBtn').addEventListener('click', function() {
        closeModal('orderDetailsModal');
    });
    
    document.getElementById('updateOrderStatus').addEventListener('click', function() {
        updateOrderStatus();
    });
}

function loadProducts() {
    const productsTable = document.getElementById('productsTable');
    
    // Sample products data
    const products = [
        {
            id: 'PROD001',
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            price: 80,
            stock: 500,
            image: 'https://images.unsplash.com/photo-1546470427-e5ac89c8ba3b?w=100&h=100&fit=crop'
        },
        {
            id: 'PROD002',
            name: 'Basmati Rice',
            category: 'grains',
            price: 120,
            stock: 200,
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop'
        },
        {
            id: 'PROD003',
            name: 'Red Chili Powder',
            category: 'spices',
            price: 200,
            stock: 50,
            image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100&h=100&fit=crop'
        },
        {
            id: 'PROD004',
            name: 'Fresh Milk',
            category: 'dairy',
            price: 60,
            stock: 100,
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop'
        },
        {
            id: 'PROD005',
            name: 'Onions',
            category: 'vegetables',
            price: 40,
            stock: 300,
            image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop'
        }
    ];
    
    // Save to localStorage for demo
    saveToLocalStorage('rawMaterialProducts', products);
    
    productsTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price/kg</th>
                    <th>Stock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td class="product-image-cell">
                            <img src="${product.image}" alt="${product.name}">
                        </td>
                        <td class="product-name-cell">${product.name}</td>
                        <td class="product-category-cell">${product.category}</td>
                        <td class="product-price-cell">₹${product.price}</td>
                        <td class="product-stock-cell">
                            <span class="${getStockClass(product.stock)}">${product.stock} kg</span>
                        </td>
                        <td class="product-actions-cell">
                            <button class="btn btn-small btn-primary" onclick="editProduct('${product.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteProduct('${product.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getStockClass(stock) {
    if (stock < 50) return 'stock-low';
    if (stock < 100) return 'stock-medium';
    return 'stock-high';
}

function saveNewProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    
    const product = {
        id: 'PROD' + Date.now(),
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseInt(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value,
        image: document.getElementById('productImage').value || 'https://via.placeholder.com/100x100'
    };
    
    // Validate form
    if (!product.name || !product.category || !product.price || !product.stock) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const products = getFromLocalStorage('rawMaterialProducts') || [];
    products.push(product);
    saveToLocalStorage('rawMaterialProducts', products);
    
    showNotification('Product added successfully', 'success');
    closeModal('addProductModal');
    form.reset();
    loadProducts();
    initStats();
}

function editProduct(productId) {
    showNotification('Edit product functionality would be implemented here', 'info');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        const products = getFromLocalStorage('rawMaterialProducts') || [];
        const updatedProducts = products.filter(p => p.id !== productId);
        saveToLocalStorage('rawMaterialProducts', updatedProducts);
        
        showNotification('Product deleted successfully', 'success');
        loadProducts();
        initStats();
    }
}

// Delivery Tracking
function initDeliveryTracking() {
    const deliveryTracking = document.getElementById('deliveryTracking');
    
    // Sample tracking data
    const trackingData = [
        {
            id: 'TRK001',
            orderId: 'ORD001',
            status: 'in-transit',
            location: 'Delhi Warehouse',
            estimatedDelivery: '2024-01-26'
        },
        {
            id: 'TRK002',
            orderId: 'ORD003',
            status: 'delivered',
            location: 'Chandni Chowk',
            estimatedDelivery: '2024-01-25'
        }
    ];
    
    if (trackingData.length === 0) {
        deliveryTracking.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-truck"></i>
                <p>No active deliveries</p>
            </div>
        `;
    } else {
        deliveryTracking.innerHTML = trackingData.map(tracking => `
            <div class="tracking-item">
                <div class="tracking-header">
                    <span class="tracking-id">${tracking.orderId}</span>
                    <span class="tracking-status status-${tracking.status}">${tracking.status}</span>
                </div>
                <div class="tracking-details">
                    <i class="fas fa-map-marker-alt"></i> ${tracking.location}
                </div>
                <div class="tracking-details">
                    <i class="fas fa-clock"></i> ETA: ${tracking.estimatedDelivery}
                </div>
                <div class="tracking-progress">
                    <div class="progress-step completed"></div>
                    <div class="progress-step ${tracking.status !== 'pending' ? 'completed' : ''}"></div>
                    <div class="progress-step ${tracking.status === 'delivered' ? 'completed' : ''}"></div>
                </div>
            </div>
        `).join('');
    }
}

// Inventory Alerts
function initInventoryAlerts() {
    const inventoryAlerts = document.getElementById('inventoryAlerts');
    const products = getFromLocalStorage('rawMaterialProducts') || [];
    
    const lowStockProducts = products.filter(product => product.stock < 50);
    const criticalStockProducts = products.filter(product => product.stock < 20);
    
    const alerts = [
        ...criticalStockProducts.map(product => ({
            type: 'critical',
            title: 'Critical Stock Level',
            description: `${product.name} has only ${product.stock} kg remaining`,
            product: product
        })),
        ...lowStockProducts.filter(p => p.stock >= 20).map(product => ({
            type: 'warning',
            title: 'Low Stock Alert',
            description: `${product.name} is running low (${product.stock} kg remaining)`,
            product: product
        }))
    ];
    
    if (alerts.length === 0) {
        inventoryAlerts.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>All products are well stocked</p>
            </div>
        `;
    } else {
        inventoryAlerts.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type === 'critical' ? 'alert-critical' : ''}">
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-description">${alert.description}</div>
                </div>
            </div>
        `).join('');
    }
}

// Revenue Chart
function initRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Sample revenue data for the last 7 days
    const revenueData = [1200, 1800, 1500, 2200, 1900, 2500, 2100];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue',
                data: revenueData,
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

// Customer Reviews
function initCustomerReviews() {
    const customerReviews = document.getElementById('customerReviews');
    
    // Sample reviews data
    const reviews = [
        {
            customer: 'Raj Street Food',
            rating: 5,
            text: 'Excellent quality tomatoes! Always fresh and delivered on time.',
            product: 'Fresh Tomatoes',
            date: '2024-01-24'
        },
        {
            customer: 'Spice Corner',
            rating: 4,
            text: 'Good quality rice, but packaging could be better.',
            product: 'Basmati Rice',
            date: '2024-01-23'
        },
        {
            customer: 'Delhi Chaat',
            rating: 5,
            text: 'Best supplier in the area! Highly recommended.',
            product: 'Red Chili Powder',
            date: '2024-01-22'
        }
    ];
    
    if (reviews.length === 0) {
        customerReviews.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No reviews yet</p>
            </div>
        `;
    } else {
        customerReviews.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-customer">${review.customer}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-product">Product: ${review.product}</div>
            </div>
        `).join('');
    }
}

// Make functions globally available
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;