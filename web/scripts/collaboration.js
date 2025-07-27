class CollaborationManager {
  constructor() {
    // Initialize with current user and existing collaborations
    this.currentUser = this.getCurrentUser();
    this.collaborations = [];
    this.nearbyVendors = [];
    this.selectedVendors = [];
    this.requests = [];

    // Initialize event listeners
    this.initEventListeners();
    
    // Load requests
    this.loadCollaborationRequests();
  }

  initEventListeners() {
    // Main collaborate button redirect
    document.getElementById('collaborateBtn')?.addEventListener('click', function() {
      window.location.href = 'collaboration.html';
    });

    // Search collaboration button
    document.getElementById('searchCollabBtn')?.addEventListener('click', () => {
      this.searchNearbyVendors();
    });

    // Vendor modal interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('vendor-profile-card')) {
        const vendorId = e.target.closest('.vendor-profile-card').dataset.id;
        this.showVendorDetails(vendorId);
      }
      
      if (e.target.id === 'sendInviteBtn') {
        const vendorId = document.querySelector('#vendorModal').dataset.vendorId;
        this.sendCollaborationInvite(vendorId);
      }
      
      if (e.target.id === 'closeModalBtn' || e.target.id === 'closeModalBtn2') {
        document.getElementById('vendorModal').style.display = 'none';
      }

      // Request details modal
      if (e.target.classList.contains('btn-view-details')) {
        const requestId = e.target.closest('.request-card').dataset.requestId;
        this.showRequestDetails(requestId);
      }

      if (e.target.id === 'acceptRequestBtn') {
        const requestId = document.querySelector('#requestDetailsModal').dataset.requestId;
        this.acceptCollaborationRequest(requestId);
      }

      if (e.target.id === 'rejectRequestBtn') {
        const requestId = document.querySelector('#requestDetailsModal').dataset.requestId;
        this.rejectCollaborationRequest(requestId);
      }

      if (e.target.id === 'closeRequestModalBtn' || e.target.id === 'closeRequestModalBtn2') {
        document.getElementById('requestDetailsModal').style.display = 'none';
      }
    });

    // Additional modal close handler (click outside modal)
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });
  }

  searchNearbyVendors() {
    // Show loading state
    this.showLoading(document.getElementById('searchCollabBtn'), 'Finding vendors...');
    
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      
      // Mock data - replace with API call in real implementation
      const mockVendors = [
        {
          id: 'v1',
          name: 'Chaat Corner',
          distance: '0.5 km away',
          products: ['Fresh Vegetables', 'Spices', 'Flour'],
          location: '123 Market Street, Stall #5',
          phone: '+91 9876543210',
          description: 'Family-run chaat stall since 2010',
          shopName: 'Chaat Corner',
          rating: 4.5,
          status: 'available'
        },
        {
          id: 'v2', 
          name: 'Samosa King',
          distance: '0.8 km away', 
          products: ['Potatoes', 'Flour', 'Spices', 'Oil'],
          location: '456 Food Plaza, Shop 12',
          phone: '+91 9876543211',
          description: 'Specializing in crispy samosas and snacks',
          shopName: 'Samosa King',
          rating: 4.2,
          status: 'available'
        },
        {
          id: 'v3',
          name: 'Fresh Food Hub',
          distance: '1.2 km away',
          products: ['Vegetables', 'Fruits', 'Dairy'],
          location: '789 Central Market, Stall #8',
          phone: '+91 9876543212',
          description: 'Fresh produce supplier for street vendors',
          shopName: 'Fresh Food Hub',
          rating: 4.7,
          status: 'available'
        }
      ];
      
      this.displayVendorProfiles(mockVendors);
      this.hideLoading(document.getElementById('searchCollabBtn'));
      
    }, error => {
      console.error('Geolocation error:', error);
      this.showNotification('Could not get location. Please enable location services.', 'error');
      this.hideLoading(document.getElementById('searchCollabBtn'));
    });
  }

  displayVendorProfiles(vendors) {
    const vendorList = document.getElementById('vendorList');
    const vendorProfilesSection = document.getElementById('vendorProfilesSection');
    
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
          </div>
          <div class="vendor-products">
            <strong>Products:</strong> ${vendor.products.slice(0, 3).join(', ')}${vendor.products.length > 3 ? '...' : ''}
          </div>
          <div class="vendor-actions mt-3 text-center">
            <button class="btn btn-success btn-invite-vendor" data-vendor-id="${vendor.id}"><i class="fas fa-paper-plane"></i> Invite</button>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add event listeners for invite buttons
    vendorList.querySelectorAll('.btn-invite-vendor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const vendorId = btn.getAttribute('data-vendor-id');
        this.sendCollaborationInvite(vendorId);
      });
    });
    
    vendorProfilesSection.style.display = 'block';
  }

  showVendorDetails(vendorId) {
    const vendor = this.nearbyVendors.find(v => v.id === vendorId) || {
      id: vendorId,
      name: 'Chaat Corner',
      location: '123 Market Street, Stall #5',
      shopName: 'Chaat Corner',
      phone: '+91 9876543210',
      description: 'Family-run chaat stall since 2010',
      products: ['Fresh Vegetables', 'Spices', 'Flour']
    };

    const modal = document.getElementById('vendorModal');
    modal.dataset.vendorId = vendorId;
    
    // Update modal content
    document.getElementById('vendorName').textContent = vendor.name;
    document.getElementById('locationText').textContent = vendor.location;
    document.getElementById('shopNameText').textContent = vendor.shopName;
    document.getElementById('descriptionText').textContent = vendor.description;
    document.getElementById('phoneText').textContent = 'Phone number will be shown after acceptance';
    
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

    // Mock API call - replace with real implementation
    this.showNotification(`Collaboration invite sent to ${vendor.name}!`, 'success');
    document.getElementById('vendorModal').style.display = 'none';
    
    // Update button state
    const sendInviteBtn = document.getElementById('sendInviteBtn');
    sendInviteBtn.textContent = 'Invite Sent';
    sendInviteBtn.disabled = true;
    sendInviteBtn.style.backgroundColor = '#28a745';
  }

  loadCollaborationRequests() {
    // Mock data - replace with API call
    this.requests = [
      {
        id: 'req1',
        vendorId: 'v2',
        vendorName: 'Samosa King',
        location: '456 Food Plaza, Shop 12',
        shopName: 'Samosa King',
        phone: '+91 9876543211',
        message: 'Hi! I\'m interested in collaborating for bulk potato orders. We can get better prices together!',
        status: 'pending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'req2',
        vendorId: 'v3',
        vendorName: 'Fresh Food Hub',
        location: '789 Central Market, Stall #8',
        shopName: 'Fresh Food Hub',
        phone: '+91 9876543212',
        message: 'Looking for collaboration partners for vegetable procurement. Let\'s work together!',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    ];

    this.displayRequests();
  }

  displayRequests() {
    const requestsList = document.getElementById('requestsList');
    
    if (this.requests.length === 0) {
      requestsList.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <p class="text-muted">No collaboration requests yet</p>
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
    modal.dataset.requestId = requestId;
    
    // Update modal content
    document.getElementById('requestVendorName').textContent = `Request from ${request.vendorName}`;
    document.getElementById('requestLocationText').textContent = request.location;
    document.getElementById('requestShopNameText').textContent = request.shopName;
    document.getElementById('requestPhoneText').textContent = request.phone;
    document.getElementById('requestMessageText').textContent = request.message;
    
    modal.style.display = 'block';
  }

  acceptCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Mock API call - replace with real implementation
    this.showNotification(`Collaboration accepted with ${request.vendorName}! Phone numbers are now visible.`, 'success');
    
    // Update request status
    request.status = 'accepted';
    this.displayRequests();
    
    // Close modal
    document.getElementById('requestDetailsModal').style.display = 'none';
    
    // Show phone numbers in the request card
    const requestCard = document.querySelector(`[data-request-id="${requestId}"]`);
    if (requestCard) {
      const actionsDiv = requestCard.querySelector('.request-actions');
      actionsDiv.innerHTML = `
        <div class="text-success">
          <i class="fas fa-check-circle"></i> Accepted
        </div>
        <div class="text-info">
          <i class="fas fa-phone"></i> ${request.phone}
        </div>
      `;
    }
  }

  rejectCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Mock API call - replace with real implementation
    this.showNotification(`Collaboration request from ${request.vendorName} rejected.`, 'info');
    
    // Remove request from list
    this.requests = this.requests.filter(r => r.id !== requestId);
    this.displayRequests();
    
    // Close modal
    document.getElementById('requestDetailsModal').style.display = 'none';
  }



  getCurrentUser() {
    // Mock current user - replace with real user data
    return {
      id: 'user1',
      name: 'Street Vendor',
      location: 'Mumbai, India',
      phone: '+91 9876543210'
    };
  }

  showLoading(button, message) {
    if (!button) return;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    button.disabled = true;
  }

  hideLoading(button) {
    if (!button) return;
    button.innerHTML = `<i class="fas fa-search"></i> Search Collaboration`;
    button.disabled = false;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  new CollaborationManager();
});