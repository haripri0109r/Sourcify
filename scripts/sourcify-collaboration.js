// Sourcify Collaboration Manager
class SourceifyCollaborationManager {
  constructor() {
    this.currentUser = this.getCurrentUser();
    this.collaborations = [];
    this.nearbyVendors = [];
    this.selectedVendors = [];
    this.requests = [];
    this.activeCollaborations = [];

    // Initialize event listeners
    this.initEventListeners();
    
    // Load initial data
    this.loadCollaborationRequests();
    this.loadActiveCollaborations();
  }

  initEventListeners() {
    // Main collaborate button redirect
    document.getElementById('collaborateBtn')?.addEventListener('click', () => {
      this.showCollaborationDashboard();
    });

    // Search collaboration button
    document.getElementById('searchCollabBtn')?.addEventListener('click', () => {
      this.searchNearbyVendors();
    });

    // Bulk order creation
    document.getElementById('createBulkOrderBtn')?.addEventListener('click', () => {
      this.showBulkOrderModal();
    });

    // Modal interactions
    this.setupModalHandlers();
  }

  setupModalHandlers() {
    // Vendor modal handlers
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('vendor-card')) {
        const vendorId = e.target.dataset.id;
        this.showVendorDetails(vendorId);
      }
      
      if (e.target.id === 'sendInviteBtn') {
        const vendorId = document.querySelector('#vendorModal').dataset.vendorId;
        this.sendCollaborationInvite(vendorId);
      }
      
      if (e.target.classList.contains('close-btn') || e.target.classList.contains('modal-close')) {
        this.closeAllModals();
      }

      // Request handling
      if (e.target.classList.contains('btn-accept')) {
        const requestId = e.target.closest('.notification-item').dataset.requestId;
        this.acceptCollaborationRequest(requestId);
      }

      if (e.target.classList.contains('btn-decline')) {
        const requestId = e.target.closest('.notification-item').dataset.requestId;
        this.rejectCollaborationRequest(requestId);
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeAllModals();
      }
    });
  }

  showCollaborationDashboard() {
    // Switch to collaboration tab
    const collaborationTab = document.getElementById('nav-collaboration');
    const collaborationDashboard = document.getElementById('collaboration-dashboard');
    
    if (collaborationTab && collaborationDashboard) {
      // Hide all sections
      document.querySelectorAll('.dashboard-section').forEach(section => {
        section.hidden = true;
      });
      
      // Remove active class from all nav buttons
      document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      });
      
      // Show collaboration dashboard
      collaborationDashboard.hidden = false;
      collaborationTab.classList.add('active');
      collaborationTab.setAttribute('aria-current', 'page');
    }
  }

  async searchNearbyVendors() {
    const searchBtn = document.getElementById('searchCollabBtn');
    this.showLoading(searchBtn, 'Finding vendors...');
    
    try {
      // Use the enhanced geolocation service
      const vendors = await window.geolocationService.findNearbyVendors(5000); // 5km radius
      this.nearbyVendors = vendors;
      this.displayVendorProfiles(vendors);
      this.hideLoading(searchBtn);
      
      // Show location info
      const locationInfo = window.geolocationService.getCurrentLocationInfo();
      if (locationInfo) {
        this.showNotification(
          `Found ${vendors.length} vendors near ${locationInfo.city || 'your location'}`, 
          'success'
        );
      }
    } catch (error) {
      console.error('Error finding vendors:', error);
      this.showNotification('Could not find nearby vendors. Please try again.', 'error');
      this.hideLoading(searchBtn);
    }
  }

  // This method is now replaced by the geolocation service
  // Keeping for backward compatibility
  fetchNearbyVendors(lat, lng) {
    console.warn('fetchNearbyVendors is deprecated. Use geolocationService.findNearbyVendors instead.');
  }

  displayVendorProfiles(vendors) {
    const vendorList = document.getElementById('vendorList');
    const vendorProfilesSection = document.getElementById('vendorProfilesSection');
    
    if (!vendorList || !vendorProfilesSection) return;
    
    vendorList.innerHTML = vendors.map(vendor => `
      <div class="vendor-profile-card" data-id="${vendor.id}">
        <div class="vendor-profile-header">
          <div class="vendor-profile-avatar">
            ${vendor.name.charAt(0)}
          </div>
          <div class="vendor-profile-info">
            <h4>${vendor.name}</h4>
            <p><i class="fas fa-map-marker-alt"></i> ${vendor.distance}</p>
            <p><i class="fas fa-clock"></i> ${vendor.lastSeen || 'Recently active'}</p>
            <div class="vendor-status ${vendor.status}">
              <i class="fas fa-circle"></i> ${vendor.status}
            </div>
          </div>
        </div>
        
        <div class="vendor-profile-stats">
          <div class="stat-item">
            <span class="stat-value">⭐ ${vendor.rating}</span>
            <span class="stat-label">Rating</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${vendor.collaborationHistory}</span>
            <span class="stat-label">Collaborations</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">₹${vendor.avgOrderValue}</span>
            <span class="stat-label">Avg Order</span>
          </div>
        </div>
        
        <div class="vendor-products">
          <strong>Products:</strong> 
          <div class="product-tags">
            ${vendor.products.slice(0, 3).map(product => 
              `<span class="product-tag">${product}</span>`
            ).join('')}
            ${vendor.products.length > 3 ? `<span class="product-tag more">+${vendor.products.length - 3} more</span>` : ''}
          </div>
        </div>
        
        <div class="vendor-actions">
          <button class="btn-view-profile" onclick="sourcifyCollaboration.showVendorDetails('${vendor.id}')">
            <i class="fas fa-eye"></i> View Profile
          </button>
          <button class="btn-invite-vendor ${vendor.status === 'busy' ? 'disabled' : ''}" 
                  onclick="sourcifyCollaboration.sendCollaborationInvite('${vendor.id}')"
                  ${vendor.status === 'busy' ? 'disabled' : ''}>
            <i class="fas fa-paper-plane"></i> 
            ${vendor.status === 'busy' ? 'Busy' : 'Invite'}
          </button>
        </div>
      </div>
    `).join('');
    
    vendorProfilesSection.style.display = 'block';
  }

  showVendorDetails(vendorId) {
    const vendor = this.nearbyVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    // Create or update vendor modal
    let modal = document.getElementById('vendorDetailsModal');
    if (!modal) {
      modal = this.createVendorModal();
    }

    modal.dataset.vendorId = vendorId;
    
    // Update modal content
    modal.querySelector('#modalVendorName').textContent = vendor.name;
    modal.querySelector('#modalVendorLocation').textContent = vendor.location;
    modal.querySelector('#modalVendorArea').textContent = vendor.area || 'Local Area';
    modal.querySelector('#modalVendorDistance').textContent = vendor.distance;
    modal.querySelector('#modalVendorShop').textContent = vendor.shopName;
    modal.querySelector('#modalVendorDescription').textContent = vendor.description;
    modal.querySelector('#modalVendorPhone').textContent = 'Phone number will be shown after collaboration acceptance';
    modal.querySelector('#modalVendorRating').textContent = vendor.rating;
    modal.querySelector('#modalVendorCollabs').textContent = vendor.collaborationHistory;
    modal.querySelector('#modalVendorAvgOrder').textContent = `₹${vendor.avgOrderValue}`;
    
    // Update products list
    const productsList = modal.querySelector('#modalVendorProducts');
    productsList.innerHTML = vendor.products.map(product => 
      `<li class="product-item">${product}</li>`
    ).join('');
    
    modal.style.display = 'block';
  }

  createVendorModal() {
    const modal = document.createElement('div');
    modal.id = 'vendorDetailsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalVendorName">Vendor Name</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="vendor-details-grid">
            <div class="vendor-info-section">
              <h4><i class="fas fa-info-circle"></i> Vendor Information</h4>
              <div class="info-item">
                <span class="info-label">Shop Name:</span>
                <span class="info-value" id="modalVendorShop"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Location:</span>
                <span class="info-value" id="modalVendorLocation"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Area:</span>
                <span class="info-value" id="modalVendorArea"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Distance:</span>
                <span class="info-value" id="modalVendorDistance"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value" id="modalVendorPhone"></span>
              </div>
              <div class="info-item">
                <span class="info-label">Description:</span>
                <span class="info-value" id="modalVendorDescription"></span>
              </div>
            </div>
            
            <div class="vendor-stats-section">
              <h4><i class="fas fa-chart-bar"></i> Statistics</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-number" id="modalVendorRating"></span>
                  <span class="stat-label">⭐ Rating</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number" id="modalVendorCollabs"></span>
                  <span class="stat-label">Collaborations</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number" id="modalVendorAvgOrder"></span>
                  <span class="stat-label">Avg Order</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="vendor-products-section">
            <h4><i class="fas fa-box"></i> Available Products</h4>
            <ul id="modalVendorProducts" class="products-list">
              <!-- Products will be listed here -->
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary modal-close">Close</button>
          <button id="modalSendInvite" class="btn-primary">
            <i class="fas fa-paper-plane"></i> Send Collaboration Invite
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for send invite button
    modal.querySelector('#modalSendInvite').addEventListener('click', () => {
      const vendorId = modal.dataset.vendorId;
      this.sendCollaborationInvite(vendorId);
    });
    
    return modal;
  }

  sendCollaborationInvite(vendorId) {
    const vendor = this.nearbyVendors.find(v => v.id === vendorId);
    if (!vendor) return;

    // Simulate API call
    this.showNotification(`Collaboration invite sent to ${vendor.name}!`, 'success');
    
    // Close modal if open
    this.closeAllModals();
    
    // Add to pending invites (simulate)
    this.addToPendingInvites(vendor);
  }

  addToPendingInvites(vendor) {
    const pendingInvites = this.getFromLocalStorage('pendingInvites') || [];
    pendingInvites.push({
      id: `invite_${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: 'pending',
      sentAt: new Date().toISOString()
    });
    this.saveToLocalStorage('pendingInvites', pendingInvites);
  }

  loadCollaborationRequests() {
    // Mock collaboration requests
    this.requests = [
      {
        id: 'req1',
        vendorId: 'v2',
        vendorName: 'Samosa King',
        location: '456 Food Plaza, Shop 12',
        shopName: 'Samosa King',
        phone: '+91 9876543211',
        message: 'Hi! I\'m interested in collaborating for bulk potato and flour orders. We can get better wholesale prices together!',
        status: 'pending',
        timestamp: new Date().toISOString(),
        proposedOrder: {
          items: ['Potatoes - 50kg', 'Flour - 25kg'],
          estimatedSavings: '15-20%'
        }
      },
      {
        id: 'req2',
        vendorId: 'v3',
        vendorName: 'Fresh Food Hub',
        location: '789 Central Market, Stall #8',
        shopName: 'Fresh Food Hub',
        phone: '+91 9876543212',
        message: 'Looking for collaboration partners for vegetable procurement. I have connections with wholesale suppliers. Let\'s work together!',
        status: 'pending',
        timestamp: new Date().toISOString(),
        proposedOrder: {
          items: ['Mixed Vegetables - 100kg', 'Fresh Herbs - 10kg'],
          estimatedSavings: '20-25%'
        }
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
          <p>When other vendors send you collaboration requests, they'll appear here.</p>
        </div>
      `;
      return;
    }

    requestsList.innerHTML = this.requests.map(request => `
      <div class="collaboration-request-card" data-request-id="${request.id}">
        <div class="request-header">
          <div class="vendor-info">
            <div class="vendor-avatar">${request.vendorName.charAt(0)}</div>
            <div class="vendor-details">
              <h5>${request.vendorName}</h5>
              <p><i class="fas fa-map-marker-alt"></i> ${request.location}</p>
              <p><i class="fas fa-store"></i> ${request.shopName}</p>
            </div>
          </div>
          <div class="request-status ${request.status}">${request.status}</div>
        </div>
        
        <div class="request-content">
          <div class="request-message">
            <i class="fas fa-quote-left"></i>
            <p>${request.message}</p>
          </div>
          
          <div class="proposed-order">
            <h6><i class="fas fa-shopping-cart"></i> Proposed Collaboration</h6>
            <ul class="order-items">
              ${request.proposedOrder.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <div class="estimated-savings">
              <i class="fas fa-piggy-bank"></i> 
              Estimated Savings: <strong>${request.proposedOrder.estimatedSavings}</strong>
            </div>
          </div>
        </div>
        
        <div class="request-actions">
          <button class="btn-view-details" onclick="sourcifyCollaboration.showRequestDetails('${request.id}')">
            <i class="fas fa-eye"></i> View Details
          </button>
          <button class="btn-accept" onclick="sourcifyCollaboration.acceptCollaborationRequest('${request.id}')">
            <i class="fas fa-check"></i> Accept
          </button>
          <button class="btn-decline" onclick="sourcifyCollaboration.rejectCollaborationRequest('${request.id}')">
            <i class="fas fa-times"></i> Decline
          </button>
        </div>
      </div>
    `).join('');
  }

  acceptCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    // Move to active collaborations
    this.activeCollaborations.push({
      ...request,
      status: 'active',
      acceptedAt: new Date().toISOString()
    });

    // Remove from requests
    this.requests = this.requests.filter(r => r.id !== requestId);
    
    this.showNotification(`Collaboration accepted with ${request.vendorName}! Contact details are now available.`, 'success');
    this.displayRequests();
    this.updateCollaborationNotifications();
  }

  rejectCollaborationRequest(requestId) {
    const request = this.requests.find(r => r.id === requestId);
    if (!request) return;

    this.requests = this.requests.filter(r => r.id !== requestId);
    this.showNotification(`Collaboration request from ${request.vendorName} declined.`, 'info');
    this.displayRequests();
    this.updateCollaborationNotifications();
  }

  updateCollaborationNotifications() {
    const notificationsSection = document.getElementById('collaborationNotifications');
    const notificationsList = document.getElementById('notificationsList');
    
    if (!notificationsSection || !notificationsList) return;
    
    if (this.requests.length === 0) {
      notificationsSection.style.display = 'none';
    } else {
      notificationsSection.style.display = 'block';
      notificationsList.innerHTML = this.requests.map(request => `
        <div class="notification-item" data-request-id="${request.id}">
          <div class="notification-content">
            <strong>${request.vendorName}</strong>
            <p>${request.message.substring(0, 100)}...</p>
          </div>
          <div class="notification-actions">
            <button class="btn-accept" onclick="sourcifyCollaboration.acceptCollaborationRequest('${request.id}')">Accept</button>
            <button class="btn-decline" onclick="sourcifyCollaboration.rejectCollaborationRequest('${request.id}')">Decline</button>
          </div>
        </div>
      `).join('');
    }
  }

  loadActiveCollaborations() {
    // Load active collaborations from localStorage or API
    this.activeCollaborations = this.getFromLocalStorage('activeCollaborations') || [];
  }

  // Utility methods
  getCurrentUser() {
    return {
      id: 'user1',
      name: 'Street Vendor',
      location: 'Mumbai, India',
      phone: '+91 9876543210',
      shopName: 'My Street Food Stall'
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
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
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

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }

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

// Initialize the collaboration manager
const sourcifyCollaboration = new SourceifyCollaborationManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SourceifyCollaborationManager;
}