class CollaborationManager {
  constructor() {
    // Initialize with current user and existing collaborations
    this.currentUser = this.getCurrentUser();
    this.collaborations = [];
    this.nearbyVendors = [];
    this.selectedVendors = [];
    this.requests = [];
    this.activeCollaborations = [];

    // Initialize event listeners
    this.initEventListeners();
    
    // Load data
    this.loadCollaborationRequests();
    this.loadActiveCollaborations();
    
    // Initialize geolocation if available
    this.initGeolocation();
  }

  initEventListeners() {
    // Main collaborate button redirect (from dashboard)
    document.getElementById('collaborateBtn')?.addEventListener('click', function() {
      window.location.href = 'collaboration.html';
    });

    // Search collaboration button
    document.getElementById('searchCollabBtn')?.addEventListener('click', () => {
      this.searchNearbyVendors();
    });

    // Bulk order button
    document.getElementById('createBulkOrderBtn')?.addEventListener('click', () => {
      this.openBulkOrderModal();
    });

    // Modal interactions
    document.addEventListener('click', (e) => {
      // Vendor profile card clicks
      if (e.target.closest('.vendor-profile-card')) {
        const vendorId = e.target.closest('.vendor-profile-card').dataset.id;
        if (vendorId) {
          this.showVendorDetails(vendorId);
        }
      }
      
      // Send invite button
      if (e.target.id === 'sendInviteBtn') {
        const vendorId = document.querySelector('#vendorModal').dataset.vendorId;
        this.sendCollaborationInvite(vendorId);
      }
      
      // Close vendor modal buttons
      if (e.target.id === 'closeModalBtn' || e.target.id === 'closeModalBtn2') {
        document.getElementById('vendorModal').style.display = 'none';
      }

      // Request details modal
      if (e.target.classList.contains('btn-view-details')) {
        const requestId = e.target.closest('.request-card').dataset.requestId;
        this.showRequestDetails(requestId);
      }

      // Accept/Reject request buttons
      if (e.target.id === 'acceptRequestBtn') {
        const requestId = document.querySelector('#requestDetailsModal').dataset.requestId;
        this.acceptCollaborationRequest(requestId);
      }

      if (e.target.id === 'rejectRequestBtn') {
        const requestId = document.querySelector('#requestDetailsModal').dataset.requestId;
        this.rejectCollaborationRequest(requestId);
      }

      // Close request modal buttons
      if (e.target.id === 'closeRequestModalBtn' || e.target.id === 'closeRequestModalBtn2') {
        document.getElementById('requestDetailsModal').style.display = 'none';
      }

      // Bulk order modal
      if (e.target.id === 'closeBulkOrderBtn' || e.target.id === 'cancelBulkOrder') {
        document.getElementById('bulkOrderModal').style.display = 'none';
      }

      if (e.target.id === 'createBulkOrder') {
        this.createBulkOrder();
      }

      // Manage collaboration buttons
      if (e.target.classList.contains('btn-manage-collab')) {
        const collabId = e.target.closest('.collaboration-card').dataset.collabId;
        this.manageCollaboration(collabId);
      }

      // Invite vendor buttons
      if (e.target.classList.contains('btn-invite-vendor')) {
        e.stopPropagation();
        const vendorId = e.target.getAttribute('data-vendor-id');
        this.sendCollaborationInvite(vendorId);
      }
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });
  }

  initGeolocation() {
    // Use existing geolocation service if available
    if (window.geolocationService) {
      this.geolocationService = window.geolocationService;
    }
  }

  searchNearbyVendors() {
    // Show loading state
    this.showLoading(document.getElementById('searchCollabBtn'), 'Finding vendors...');
    
    // Get current location
    if (this.geolocationService) {
      const position = this.geolocationService.getCurrentPositionInfo();
      if (position) {
        this.findVendorsNearLocation(position.latitude, position.longitude);
        return;
      }
    }

    // Fallback to browser geolocation
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        this.findVendorsNearLocation(latitude, longitude);
      },
      error => {
        console.error('Geolocation error:', error);
        this.showNotification('Could not get location. Showing sample vendors nearby.', 'warning');
        this.displaySampleVendors();
        this.hideLoading(document.getElementById('searchCollabBtn'));
      }
    );
  }

  findVendorsNearLocation(latitude, longitude) {
    // In a real implementation, this would make an API call
    // For now, we'll simulate with enhanced mock data
    setTimeout(() => {
      const mockVendors = [
        {
          id: 'v1',
          name: 'Chaat Corner',
          distance: '0.5 km away',
          products: ['Fresh Vegetables', 'Spices', 'Flour', 'Onions'],
          location: '123 Market Street, Stall #5',
          phone: '+91 9876543210',
          description: 'Family-run chaat stall since 2010. Specializing in authentic street food with fresh ingredients.',
          shopName: 'Chaat Corner',
          rating: 4.5,
          status: 'available',
          lastActive: '2 hours ago',
          totalOrders: 156,
          successRate: 98
        },
        {
          id: 'v2', 
          name: 'Samosa King',
          distance: '0.8 km away', 
          products: ['Potatoes', 'Flour', 'Spices', 'Oil', 'Peas'],
          location: '456 Food Plaza, Shop 12',
          phone: '+91 9876543211',
          description: 'Specializing in crispy samosas and snacks. Known for quality ingredients and timely delivery.',
          shopName: 'Samosa King',
          rating: 4.2,
          status: 'available',
          lastActive: '1 hour ago',
          totalOrders: 203,
          successRate: 95
        },
        {
          id: 'v3',
          name: 'Fresh Food Hub',
          distance: '1.2 km away',
          products: ['Vegetables', 'Fruits', 'Dairy', 'Herbs'],
          location: '789 Central Market, Stall #8',
          phone: '+91 9876543212',
          description: 'Fresh produce supplier for street vendors. Direct from farms with quality guarantee.',
          shopName: 'Fresh Food Hub',
          rating: 4.7,
          status: 'available',
          lastActive: '30 minutes ago',
          totalOrders: 89,
          successRate: 99
        },
        {
          id: 'v4',
          name: 'Spice Master',
          distance: '1.5 km away',
          products: ['Spices', 'Masalas', 'Dry Fruits', 'Condiments'],
          location: '321 Spice Bazaar, Shop 15',
          phone: '+91 9876543213',
          description: 'Premium spice supplier with authentic flavors. Bulk orders welcome.',
          shopName: 'Spice Master',
          rating: 4.6,
          status: 'busy',
          lastActive: '5 minutes ago',
          totalOrders: 134,
          successRate: 97
        },
        {
          id: 'v5',
          name: 'Dairy Fresh',
          distance: '2.0 km away',
          products: ['Milk', 'Paneer', 'Curd', 'Butter', 'Cheese'],
          location: '654 Dairy Lane, Unit 3',
          phone: '+91 9876543214',
          description: 'Fresh dairy products delivered daily. Organic and regular options available.',
          shopName: 'Dairy Fresh',
          rating: 4.4,
          status: 'available',
          lastActive: '1 hour ago',
          totalOrders: 78,
          successRate: 96
        }
      ];
      
      this.nearbyVendors = mockVendors;
      this.displayVendorProfiles(mockVendors);
      this.hideLoading(document.getElementById('searchCollabBtn'));
      
    }, 1500);
  }

  displaySampleVendors() {
    // Fallback sample vendors when location is not available
    const sampleVendors = [
      {
        id: 'v1',
        name: 'Local Chaat Stall',
        distance: 'Near you',
        products: ['Vegetables', 'Spices'],
        location: 'Location will be shared after connection',
        phone: 'Hidden until accepted',
        description: 'Local street food vendor looking for collaboration',
        shopName: 'Local Chaat Stall',
        rating: 4.0,
        status: 'available'
      }
    ];
    
    this.nearbyVendors = sampleVendors;
    this.displayVendorProfiles(sampleVendors);
  }

  displayVendorProfiles(vendors) {
    const vendorList = document.getElementById('vendorList');
    const vendorProfilesSection = document.getElementById('vendorProfilesSection');
    
    if (!vendorList || !vendorProfilesSection) return;
    
    vendorList.innerHTML = vendors.map(vendor => `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="vendor-profile-card" data-id="${vendor.id}">
          <div class="vendor-profile-header">
            <div class="vendor-profile-avatar">
              ${vendor.name.charAt(0)}
            </div>
            <div class="vendor-profile-info">
              <h4>${vendor.name}</h4>
              <p><i class="fas fa-map-marker-alt"></i> ${vendor.distance}</p>
            </div>
          </div>
          <div class="vendor-profile-details">
            <div class="vendor-detail-item">
              <i class="fas fa-store"></i>
              <span>${vendor.shopName}</span>
            </div>
            <div class="vendor-detail-item">
              <i class="fas fa-star"></i>
              <span>${vendor.rating} ★</span>
            </div>
            <div class="vendor-detail-item">
              <i class="fas fa-circle"></i>
              <span class="status ${vendor.status}">${vendor.status}</span>
            </div>
            ${vendor.lastActive ? `
            <div class="vendor-detail-item">
              <i class="fas fa-clock"></i>
              <span>Active ${vendor.lastActive}</span>
            </div>
            ` : ''}
          </div>
          <div class="vendor-products">
            <strong>Products:</strong> ${vendor.products.slice(0, 3).join(', ')}${vendor.products.length > 3 ? '...' : ''}
          </div>
          <div class="vendor-actions mt-3 text-center">
            <button class="btn btn-success btn-invite-vendor" data-vendor-id="${vendor.id}">
              <i class="fas fa-paper-plane"></i> Send Invite
            </button>
          </div>
        </div>
      </div>
    `).join('');
    
    vendorProfilesSection.style.display = 'block';
  }

  showVendorDetails(vendorId) {
    const vendor = this.nearbyVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const modal = document.getElementById('vendorModal');
    if (!modal) return;
    
    modal.dataset.vendorId = vendorId;
    
    // Update modal content
    document.getElementById('vendorName').textContent = vendor.name;
    document.getElementById('locationText').textContent = vendor.location;
    document.getElementById('shopNameText').textContent = vendor.shopName;
    document.getElementById('descriptionText').textContent = vendor.description;
    document.getElementById('phoneText').textContent = vendor.phone === 'Hidden until accepted' ? 
      'Phone number will be shown after acceptance' : vendor.phone;
    document.getElementById('ratingText').textContent = `${vendor.rating} ★`;
    
    // Update products list
    const productsList = document.getElementById('vendorProductsList');
    productsList.innerHTML = vendor.products.map(product => 
      `<li>${product}</li>`
    ).join('');
    
    modal.style.display = 'block';
  }

  sendCollaborationInvite(vendorId) {
    const vendor = this.nearbyVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    // Show loading state
    const button = document.querySelector(`[data-vendor-id="${vendorId}"]`) || document.getElementById('sendInviteBtn');
    this.showLoading(button, 'Sending...');

    // Simulate API call
    setTimeout(() => {
      this.showNotification(`Collaboration invite sent to ${vendor.name}!`, 'success');
      
      // Update button state
      if (button) {
        button.innerHTML = '<i class="fas fa-check"></i> Invite Sent';
        button.disabled = true;
        button.style.background = '#28a745';
      }
      
      // Close modal if open
      const modal = document.getElementById('vendorModal');
      if (modal && modal.style.display === 'block') {
        modal.style.display = 'none';
      }
      
      this.hideLoading(button);
    }, 1000);
  }

  loadCollaborationRequests() {
    // Load from localStorage or use mock data
    const savedRequests = this.getFromLocalStorage('collaborationRequests');
    
    this.requests = savedRequests || [
      {
        id: 'req1',
        vendorId: 'v2',
        vendorName: 'Samosa King',
        location: '456 Food Plaza, Shop 12',
        shopName: 'Samosa King',
        phone: '+91 9876543211',
        message: 'Hi! I\'m interested in collaborating for bulk potato orders. We can get better prices together and share transportation costs!',
        status: 'pending',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        products: ['Potatoes', 'Flour', 'Spices']
      },
      {
        id: 'req2',
        vendorId: 'v3',
        vendorName: 'Fresh Food Hub',
        location: '789 Central Market, Stall #8',
        shopName: 'Fresh Food Hub',
        phone: '+91 9876543212',
        message: 'Looking for collaboration partners for vegetable procurement. I have direct connections with farmers and can offer better rates for bulk orders.',
        status: 'pending',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        products: ['Vegetables', 'Fruits', 'Herbs']
      },
      {
        id: 'req3',
        vendorId: 'v4',
        vendorName: 'Spice Master',
        location: '321 Spice Bazaar, Shop 15',
        shopName: 'Spice Master',
        phone: '+91 9876543213',
        message: 'I specialize in premium spices and masalas. Let\'s collaborate for bulk spice orders to reduce costs and ensure quality.',
        status: 'pending',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        products: ['Spices', 'Masalas', 'Dry Fruits']
      }
    ];

    this.displayRequests();
  }

  displayRequests() {
    const requestsList = document.getElementById('requestsList');
    if (!requestsList) return;
    
    if (this.requests.length === 0) {
      requestsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox fa-3x"></i>
          <h3>No Collaboration Requests</h3>
          <p>You don't have any collaboration requests yet. Start by searching for nearby vendors!</p>
        </div>
      `;
      return;
    }

    requestsList.innerHTML = this.requests.map(request => `
      <div class="request-card" data-request-id="${request.id}">
        <div class="request-header">
          <div class="request-vendor-info">
            <div class="request-vendor-avatar">
              ${request.vendorName.charAt(0)}
            </div>
            <div class="request-vendor-details">
              <h5>${request.vendorName}</h5>
              <p><i class="fas fa-map-marker-alt"></i> ${request.location}</p>
              <p><i class="fas fa-clock"></i> ${this.formatTimestamp(request.timestamp)}</p>
            </div>
          </div>
          <span class="request-status ${request.status}">${request.status}</span>
        </div>
        <div class="request-message">
          "${request.message}"
        </div>
        <div class="request-actions">
          <button class="btn-view-details">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    `).join('');
  }

  showRequestDetails(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    const modal = document.getElementById('requestDetailsModal');
    if (!modal) return;
    
    modal.dataset.requestId = requestId;
    
    // Update modal content
    document.getElementById('requestVendorName').textContent = `Request from ${request.vendorName}`;
    document.getElementById('requestLocationText').textContent = request.location;
    document.getElementById('requestShopNameText').textContent = request.shopName;
    document.getElementById('requestPhoneText').textContent = request.phone;
    document.getElementById('requestMessageText').textContent = request.message;
    document.getElementById('requestTimestampText').textContent = this.formatTimestamp(request.timestamp);
    
    modal.style.display = 'block';
  }

  acceptCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Show loading
    const acceptBtn = document.getElementById('acceptRequestBtn');
    this.showLoading(acceptBtn, 'Accepting...');

    setTimeout(() => {
      // Update request status
      request.status = 'accepted';
      
      // Add to active collaborations
      this.activeCollaborations.push({
        id: 'collab_' + Date.now(),
        vendorId: request.vendorId,
        vendorName: request.vendorName,
        status: 'active',
        startDate: new Date().toISOString(),
        totalOrders: 0,
        totalSavings: 0,
        products: request.products || []
      });
      
      // Save to localStorage
      this.saveToLocalStorage('collaborationRequests', this.requests);
      this.saveToLocalStorage('activeCollaborations', this.activeCollaborations);
      
      this.showNotification(`Collaboration accepted with ${request.vendorName}! Phone numbers are now visible.`, 'success');
      
      // Update displays
      this.displayRequests();
      this.displayActiveCollaborations();
      
      // Close modal
      document.getElementById('requestDetailsModal').style.display = 'none';
      this.hideLoading(acceptBtn);
    }, 1000);
  }

  rejectCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Show loading
    const rejectBtn = document.getElementById('rejectRequestBtn');
    this.showLoading(rejectBtn, 'Rejecting...');

    setTimeout(() => {
      this.showNotification(`Collaboration request from ${request.vendorName} rejected.`, 'info');
      
      // Remove request from list
      this.requests = this.requests.filter(r => r.id !== requestId);
      this.saveToLocalStorage('collaborationRequests', this.requests);
      
      this.displayRequests();
      
      // Close modal
      document.getElementById('requestDetailsModal').style.display = 'none';
      this.hideLoading(rejectBtn);
    }, 800);
  }

  loadActiveCollaborations() {
    // Load from localStorage or use mock data
    const savedCollaborations = this.getFromLocalStorage('activeCollaborations');
    
    this.activeCollaborations = savedCollaborations || [
      {
        id: 'collab1',
        vendorId: 'v1',
        vendorName: 'Delhi Chaat Corner',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        totalOrders: 5,
        totalSavings: 1250,
        products: ['Vegetables', 'Spices']
      },
      {
        id: 'collab2',
        vendorId: 'v5',
        vendorName: 'Fresh Dairy Co.',
        status: 'active',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        totalOrders: 2,
        totalSavings: 800,
        products: ['Dairy Products']
      }
    ];

    this.displayActiveCollaborations();
  }

  displayActiveCollaborations() {
    const collaborationsList = document.getElementById('activeCollaborationsList');
    if (!collaborationsList) return;
    
    if (this.activeCollaborations.length === 0) {
      collaborationsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-handshake fa-3x"></i>
          <h3>No Active Collaborations</h3>
          <p>You don't have any active collaborations yet. Accept requests or search for vendors to start collaborating!</p>
        </div>
      `;
      return;
    }

    collaborationsList.innerHTML = this.activeCollaborations.map(collab => `
      <div class="collaboration-card" data-collab-id="${collab.id}">
        <div class="collaboration-header">
          <div class="collaboration-title">${collab.vendorName}</div>
          <div class="collaboration-status">${collab.status}</div>
        </div>
        <div class="collaboration-details">
          <div class="collaboration-detail">
            <span class="label">Started:</span>
            <span class="value">${this.formatDate(collab.startDate)}</span>
          </div>
          <div class="collaboration-detail">
            <span class="label">Total Orders:</span>
            <span class="value">${collab.totalOrders}</span>
          </div>
          <div class="collaboration-detail">
            <span class="label">Total Savings:</span>
            <span class="value">₹${collab.totalSavings.toLocaleString()}</span>
          </div>
          <div class="collaboration-detail">
            <span class="label">Products:</span>
            <span class="value">${collab.products.join(', ')}</span>
          </div>
        </div>
        <div class="collaboration-actions">
          <button class="btn-manage-collab">
            <i class="fas fa-cog"></i> Manage
          </button>
        </div>
      </div>
    `).join('');
  }

  manageCollaboration(collabId) {
    const collaboration = this.activeCollaborations.find(c => c.id === collabId);
    if (!collaboration) return;

    this.showNotification(`Managing collaboration with ${collaboration.vendorName}. Feature coming soon!`, 'info');
  }

  openBulkOrderModal() {
    const modal = document.getElementById('bulkOrderModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  createBulkOrder() {
    const form = document.getElementById('bulkOrderForm');
    if (!form) return;

    const formData = new FormData(form);
    const orderData = {
      category: document.getElementById('bulkProductCategory').value,
      productName: document.getElementById('bulkProductName').value,
      quantity: document.getElementById('bulkQuantity').value,
      targetPrice: document.getElementById('bulkTargetPrice').value,
      deliveryDate: document.getElementById('bulkDeliveryDate').value,
      notes: document.getElementById('bulkNotes').value
    };

    // Validate form
    if (!orderData.category || !orderData.productName || !orderData.quantity || !orderData.targetPrice) {
      this.showNotification('Please fill in all required fields.', 'warning');
      return;
    }

    // Show loading
    const createBtn = document.getElementById('createBulkOrder');
    this.showLoading(createBtn, 'Creating...');

    setTimeout(() => {
      this.showNotification(`Bulk order created for ${orderData.productName}! Other vendors will be notified.`, 'success');
      
      // Close modal
      document.getElementById('bulkOrderModal').style.display = 'none';
      
      // Reset form
      form.reset();
      
      this.hideLoading(createBtn);
    }, 1500);
  }

  // Utility functions
  getCurrentUser() {
    // Mock current user - replace with real user data
    return {
      id: 'user1',
      name: 'Street Vendor',
      location: 'Mumbai, India',
      phone: '+91 9876543210',
      shopName: 'My Street Food Stall'
    };
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  showLoading(button, message) {
    if (!button) return;
    button.setAttribute('data-original-content', button.innerHTML);
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    button.disabled = true;
  }

  hideLoading(button) {
    if (!button) return;
    const originalContent = button.getAttribute('data-original-content');
    if (originalContent) {
      button.innerHTML = originalContent;
      button.removeAttribute('data-original-content');
    }
    button.disabled = false;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto-hide after 5 seconds
    setTimeout(() => this.hideNotification(notification), 5000);

    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  getNotificationIcon(type) {
    const icons = {
      'success': 'check-circle',
      'error': 'exclamation-circle',
      'warning': 'exclamation-triangle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Local storage helpers
  saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
}

// Initialize collaboration manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if we're on the collaboration page or if collaboration elements exist
  if (document.body.classList.contains('collaboration-page') || 
      document.getElementById('searchCollabBtn') || 
      document.getElementById('collaborateBtn')) {
    
    window.collaborationManager = new CollaborationManager();
  }
});