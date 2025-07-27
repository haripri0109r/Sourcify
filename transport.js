// Transport Service Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initTransportDashboard();
});

function initTransportDashboard() {
    // Apply transport theme
    document.body.classList.add('transport-theme');
    
    // Initialize components
    initStats();
    initDeliveryRequests();
    initLiveTracking();
    initVehicleStatus();
    initEarningsChart();
    initReviews();
    initQuickActions();
    initModals();
    loadDeliveryRequests();
}

// Initialize Statistics
function initStats() {
    const deliveries = getFromLocalStorage('transportDeliveries') || [];
    const earnings = getFromLocalStorage('transportEarnings') || [];
    
    // Calculate stats
    const totalDeliveries = deliveries.length;
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const activeRoutes = deliveries.filter(d => d.status === 'in-transit').length;
    const reviews = getFromLocalStorage('transportReviews') || [];
    const averageRating = reviews.length > 0 ? 
        (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : 0;
    
    // Update UI
    document.getElementById('totalDeliveries').textContent = totalDeliveries;
    document.getElementById('totalEarnings').textContent = `₹${totalEarnings.toLocaleString()}`;
    document.getElementById('activeRoutes').textContent = activeRoutes;
    document.getElementById('averageRating').textContent = averageRating;
    
    // Update earnings summary
    const today = new Date().toDateString();
    const thisWeek = getWeekStart(new Date());
    const thisMonth = new Date().getMonth();
    
    const todayEarnings = earnings.filter(e => new Date(e.date).toDateString() === today)
        .reduce((sum, e) => sum + e.amount, 0);
    const weekEarnings = earnings.filter(e => new Date(e.date) >= thisWeek)
        .reduce((sum, e) => sum + e.amount, 0);
    const monthEarnings = earnings.filter(e => new Date(e.date).getMonth() === thisMonth)
        .reduce((sum, e) => sum + e.amount, 0);
    
    document.getElementById('todayEarnings').textContent = `₹${todayEarnings}`;
    document.getElementById('weekEarnings').textContent = `₹${weekEarnings}`;
    document.getElementById('monthEarnings').textContent = `₹${monthEarnings}`;
}

// Delivery Requests Management
function initDeliveryRequests() {
    const requestStatusFilter = document.getElementById('requestStatusFilter');
    
    requestStatusFilter.addEventListener('change', function() {
        filterRequests(this.value);
    });
}

function loadDeliveryRequests() {
    const requestsList = document.getElementById('requestsList');
    
    // Sample delivery requests data
    const requests = [
        {
            id: 'REQ001',
            customerId: 'CUST001',
            customerName: 'Raj Street Food',
            pickupLocation: 'Green Valley Farms, Gurgaon',
            deliveryLocation: 'Connaught Place, Delhi',
            distance: 25,
            weight: 50,
            price: 300,
            status: 'pending',
            requestTime: '2024-01-25T10:30:00',
            items: ['Fresh Tomatoes - 30kg', 'Onions - 20kg']
        },
        {
            id: 'REQ002',
            customerId: 'CUST002',
            customerName: 'Spice Corner',
            pickupLocation: 'Spice Masters, Karol Bagh',
            deliveryLocation: 'Chandni Chowk, Delhi',
            distance: 8,
            weight: 10,
            price: 120,
            status: 'accepted',
            requestTime: '2024-01-25T09:15:00',
            items: ['Red Chili Powder - 10kg']
        },
        {
            id: 'REQ003',
            customerId: 'CUST003',
            customerName: 'Delhi Chaat',
            pickupLocation: 'Golden Grains Co., Rohini',
            deliveryLocation: 'Lajpat Nagar, Delhi',
            distance: 18,
            weight: 100,
            price: 450,
            status: 'in-transit',
            requestTime: '2024-01-25T08:00:00',
            items: ['Basmati Rice - 80kg', 'Wheat Flour - 20kg']
        }
    ];
    
    // Save to localStorage for demo
    saveToLocalStorage('transportRequests', requests);
    
    renderRequests(requests);
}

function renderRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        requestsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Delivery Requests</h3>
                <p>New delivery requests will appear here when customers request transport services.</p>
            </div>
        `;
        return;
    }
    
    requestsList.innerHTML = requests.map(request => `
        <div class="request-item" data-status="${request.status}">
            <div class="request-header">
                <div class="request-id">${request.id}</div>
                <div class="request-status status-${request.status}">${request.status}</div>
            </div>
            <div class="request-details">
                <div class="detail-group">
                    <div class="detail-label">Customer</div>
                    <div class="detail-value">${request.customerName}</div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Weight</div>
                    <div class="detail-value">${request.weight} kg</div>
                </div>
                <div class="detail-group">
                    <div class="pickup-location">
                        <i class="fas fa-circle"></i>
                        <span>${request.pickupLocation}</span>
                    </div>
                </div>
                <div class="detail-group">
                    <div class="delivery-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${request.deliveryLocation}</span>
                    </div>
                </div>
            </div>
            <div class="request-footer">
                <div>
                    <div class="request-price">₹${request.price}</div>
                    <div class="request-distance">${request.distance} km</div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-small btn-primary" onclick="viewRequestDetails('${request.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${request.status === 'pending' ? `
                        <button class="btn btn-small btn-transport" onclick="acceptRequest('${request.id}')">
                            <i class="fas fa-check"></i> Accept
                        </button>
                    ` : ''}
                    ${request.status === 'accepted' || request.status === 'in-transit' ? `
                        <button class="btn btn-small btn-transport" onclick="updateDeliveryStatus('${request.id}')">
                            <i class="fas fa-truck"></i> Update
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function filterRequests(status) {
    const requests = getFromLocalStorage('transportRequests') || [];
    const filteredRequests = status ? requests.filter(request => request.status === status) : requests;
    renderRequests(filteredRequests);
}

function viewRequestDetails(requestId) {
    const requests = getFromLocalStorage('transportRequests') || [];
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return;
    
    const requestDetailsContent = document.getElementById('requestDetailsContent');
    requestDetailsContent.innerHTML = `
        <div class="request-details-section">
            <h4>Request Information</h4>
            <div class="detail-row">
                <span class="detail-row-label">Request ID:</span>
                <span class="detail-row-value">${request.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Customer:</span>
                <span class="detail-row-value">${request.customerName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Request Time:</span>
                <span class="detail-row-value">${new Date(request.requestTime).toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Status:</span>
                <span class="detail-row-value status-${request.status}">${request.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="request-details-section">
            <h4>Delivery Details</h4>
            <div class="detail-row">
                <span class="detail-row-label">Pickup Location:</span>
                <span class="detail-row-value">${request.pickupLocation}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Delivery Location:</span>
                <span class="detail-row-value">${request.deliveryLocation}</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Distance:</span>
                <span class="detail-row-value">${request.distance} km</span>
            </div>
            <div class="detail-row">
                <span class="detail-row-label">Weight:</span>
                <span class="detail-row-value">${request.weight} kg</span>
            </div>
        </div>
        
        <div class="request-details-section">
            <h4>Items to Transport</h4>
            ${request.items.map(item => `
                <div class="detail-row">
                    <span class="detail-row-value">${item}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="estimated-earnings">
            <h4>Estimated Earnings</h4>
            <div class="earnings-amount">₹${request.price}</div>
        </div>
    `;
    
    // Show/hide action buttons based on status
    const acceptBtn = document.getElementById('acceptRequest');
    const rejectBtn = document.getElementById('rejectRequest');
    
    if (request.status === 'pending') {
        acceptBtn.style.display = 'inline-block';
        rejectBtn.style.display = 'inline-block';
        acceptBtn.setAttribute('data-request-id', requestId);
        rejectBtn.setAttribute('data-request-id', requestId);
    } else {
        acceptBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    openModal('requestDetailsModal');
}

function acceptRequest(requestId) {
    const requests = getFromLocalStorage('transportRequests') || [];
    const requestIndex = requests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        requests[requestIndex].status = 'accepted';
        saveToLocalStorage('transportRequests', requests);
        
        showNotification(`Request ${requestId} accepted successfully!`, 'success');
        closeModal('requestDetailsModal');
        loadDeliveryRequests();
        initStats();
    }
}

function rejectRequest(requestId) {
    if (confirm('Are you sure you want to reject this request?')) {
        const requests = getFromLocalStorage('transportRequests') || [];
        const updatedRequests = requests.filter(r => r.id !== requestId);
        saveToLocalStorage('transportRequests', updatedRequests);
        
        showNotification(`Request ${requestId} rejected`, 'info');
        closeModal('requestDetailsModal');
        loadDeliveryRequests();
        initStats();
    }
}

function updateDeliveryStatus(requestId) {
    const requests = getFromLocalStorage('transportRequests') || [];
    const request = requests.find(r => r.id === requestId);
    
    if (!request) return;
    
    let newStatus;
    if (request.status === 'accepted') {
        newStatus = 'in-transit';
    } else if (request.status === 'in-transit') {
        newStatus = 'delivered';
    }
    
    if (newStatus) {
        const requestIndex = requests.findIndex(r => r.id === requestId);
        requests[requestIndex].status = newStatus;
        saveToLocalStorage('transportRequests', requests);
        
        // Add to earnings if delivered
        if (newStatus === 'delivered') {
            const earnings = getFromLocalStorage('transportEarnings') || [];
            earnings.push({
                requestId: requestId,
                amount: request.price,
                date: new Date().toISOString(),
                customer: request.customerName
            });
            saveToLocalStorage('transportEarnings', earnings);
        }
        
        showNotification(`Request ${requestId} status updated to ${newStatus}`, 'success');
        loadDeliveryRequests();
        initStats();
    }
}

// Live Tracking Map
function initLiveTracking() {
    // Initialize Leaflet map
    const map = L.map('trackingMap').setView([28.6139, 77.2090], 11); // Delhi

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add sample markers for active deliveries
    const activeRequests = getFromLocalStorage('transportRequests') || [];
    const inTransitRequests = activeRequests.filter(r => r.status === 'in-transit');
    
    inTransitRequests.forEach(request => {
        // Pickup marker (green)
        L.circleMarker([28.6139 + Math.random() * 0.1, 77.2090 + Math.random() * 0.1], {
            color: '#4caf50',
            fillColor: '#4caf50',
            fillOpacity: 0.8,
            radius: 8
        }).addTo(map).bindPopup(`Pickup: ${request.pickupLocation}`);
        
        // Delivery marker (red)
        L.circleMarker([28.6139 + Math.random() * 0.1, 77.2090 + Math.random() * 0.1], {
            color: '#f44336',
            fillColor: '#f44336',
            fillOpacity: 0.8,
            radius: 8
        }).addTo(map).bindPopup(`Delivery: ${request.deliveryLocation}`);
        
        // Vehicle marker (blue)
        L.circleMarker([28.6139 + Math.random() * 0.1, 77.2090 + Math.random() * 0.1], {
            color: '#2196f3',
            fillColor: '#2196f3',
            fillOpacity: 0.8,
            radius: 10
        }).addTo(map).bindPopup(`Vehicle - ${request.id}`);
    });
    
    // Refresh map button
    document.getElementById('refreshMap').addEventListener('click', function() {
        showNotification('Map refreshed with latest locations', 'info');
        // In real app, this would update vehicle positions
    });
}

// Vehicle Status
function initVehicleStatus() {
    const vehicleStatus = document.getElementById('vehicleStatus');
    
    // Sample vehicle data
    const vehicle = getFromLocalStorage('vehicleInfo') || {
        type: 'Van',
        number: 'DL-01-AB-1234',
        capacity: 500,
        status: 'online',
        currentLocation: 'Connaught Place, Delhi',
        fuelLevel: 75
    };
    
    vehicleStatus.innerHTML = `
        <div class="vehicle-info">
            <div class="vehicle-header">
                <div class="vehicle-name">${vehicle.type} - ${vehicle.number}</div>
                <div class="vehicle-status-badge status-${vehicle.status}">${vehicle.status.toUpperCase()}</div>
            </div>
            <div class="vehicle-details">
                <div class="vehicle-detail">
                    <div class="vehicle-detail-label">Capacity</div>
                    <div class="vehicle-detail-value">${vehicle.capacity} kg</div>
                </div>
                <div class="vehicle-detail">
                    <div class="vehicle-detail-label">Current Location</div>
                    <div class="vehicle-detail-value">${vehicle.currentLocation}</div>
                </div>
                <div class="vehicle-detail">
                    <div class="vehicle-detail-label">Fuel Level</div>
                    <div class="vehicle-detail-value">${vehicle.fuelLevel}%</div>
                </div>
                <div class="vehicle-detail">
                    <div class="vehicle-detail-label">Status</div>
                    <div class="vehicle-detail-value">
                        <span class="status-indicator ${vehicle.status}"></span>
                        ${vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Earnings Chart
function initEarningsChart() {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    
    // Sample earnings data for the last 7 days
    const earningsData = [200, 350, 280, 420, 380, 500, 450];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Earnings',
                data: earningsData,
                backgroundColor: 'rgba(69, 183, 209, 0.8)',
                borderColor: '#45b7d1',
                borderWidth: 2,
                borderRadius: 4
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

// Reviews
function initReviews() {
    const transportReviews = document.getElementById('transportReviews');
    
    // Sample reviews data
    const reviews = [
        {
            customer: 'Raj Street Food',
            rating: 5,
            text: 'Excellent service! Always on time and handles goods with care.',
            date: '2024-01-24'
        },
        {
            customer: 'Spice Corner',
            rating: 4,
            text: 'Good driver, but could improve communication during delivery.',
            date: '2024-01-23'
        },
        {
            customer: 'Delhi Chaat',
            rating: 5,
            text: 'Best transport service in the area! Highly recommended.',
            date: '2024-01-22'
        }
    ];
    
    // Save to localStorage for demo
    saveToLocalStorage('transportReviews', reviews);
    
    if (reviews.length === 0) {
        transportReviews.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>No reviews yet</p>
            </div>
        `;
    } else {
        transportReviews.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-customer">${review.customer}</span>
                    <span class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                </div>
                <div class="review-text">${review.text}</div>
                <div class="review-date">${review.date}</div>
            </div>
        `).join('');
    }
}

// Quick Actions
function initQuickActions() {
    const toggleAvailability = document.getElementById('toggleAvailability');
    const viewEarningsReport = document.getElementById('viewEarningsReport');
    const updateVehicleInfo = document.getElementById('updateVehicleInfo');
    
    let isOnline = false;
    
    toggleAvailability.addEventListener('click', function() {
        isOnline = !isOnline;
        
        if (isOnline) {
            this.innerHTML = '<i class="fas fa-power-off"></i> Go Offline';
            this.classList.remove('btn-transport');
            this.classList.add('availability-toggle', 'online');
            showNotification('You are now online and available for deliveries', 'success');
        } else {
            this.innerHTML = '<i class="fas fa-power-off"></i> Go Online';
            this.classList.remove('availability-toggle', 'online');
            this.classList.add('btn-transport');
            showNotification('You are now offline', 'info');
        }
        
        // Update vehicle status
        const vehicle = getFromLocalStorage('vehicleInfo') || {};
        vehicle.status = isOnline ? 'online' : 'offline';
        saveToLocalStorage('vehicleInfo', vehicle);
        initVehicleStatus();
    });
    
    viewEarningsReport.addEventListener('click', function() {
        showNotification('Earnings report feature would generate detailed reports', 'info');
    });
    
    updateVehicleInfo.addEventListener('click', function() {
        openModal('vehicleInfoModal');
        loadVehicleInfo();
    });
}

// Modal Management
function initModals() {
    // Request details modal
    document.getElementById('closeRequestDetails').addEventListener('click', function() {
        closeModal('requestDetailsModal');
    });
    
    document.getElementById('closeRequestDetailsBtn').addEventListener('click', function() {
        closeModal('requestDetailsModal');
    });
    
    document.getElementById('acceptRequest').addEventListener('click', function() {
        const requestId = this.getAttribute('data-request-id');
        acceptRequest(requestId);
    });
    
    document.getElementById('rejectRequest').addEventListener('click', function() {
        const requestId = this.getAttribute('data-request-id');
        rejectRequest(requestId);
    });
    
    // Vehicle info modal
    document.getElementById('closeVehicleInfo').addEventListener('click', function() {
        closeModal('vehicleInfoModal');
    });
    
    document.getElementById('cancelVehicleInfo').addEventListener('click', function() {
        closeModal('vehicleInfoModal');
    });
    
    document.getElementById('saveVehicleInfo').addEventListener('click', function() {
        saveVehicleInfo();
    });
}

function loadVehicleInfo() {
    const vehicle = getFromLocalStorage('vehicleInfo') || {};
    
    document.getElementById('vehicleType').value = vehicle.type || '';
    document.getElementById('vehicleNumber').value = vehicle.number || '';
    document.getElementById('vehicleCapacity').value = vehicle.capacity || '';
    document.getElementById('ratePerKm').value = vehicle.ratePerKm || '';
    document.getElementById('serviceAreas').value = vehicle.serviceAreas || '';
}

function saveVehicleInfo() {
    const vehicle = {
        type: document.getElementById('vehicleType').value,
        number: document.getElementById('vehicleNumber').value,
        capacity: parseInt(document.getElementById('vehicleCapacity').value),
        ratePerKm: parseInt(document.getElementById('ratePerKm').value),
        serviceAreas: document.getElementById('serviceAreas').value,
        status: 'offline',
        currentLocation: 'Delhi',
        fuelLevel: 75
    };
    
    // Validate form
    if (!vehicle.type || !vehicle.number || !vehicle.capacity || !vehicle.ratePerKm) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    saveToLocalStorage('vehicleInfo', vehicle);
    showNotification('Vehicle information updated successfully', 'success');
    closeModal('vehicleInfoModal');
    initVehicleStatus();
}

// Utility Functions
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

// Make functions globally available
window.viewRequestDetails = viewRequestDetails;
window.acceptRequest = acceptRequest;
window.rejectRequest = rejectRequest;
window.updateDeliveryStatus = updateDeliveryStatus;