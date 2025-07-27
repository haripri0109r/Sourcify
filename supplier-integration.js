// Supplier Integration Script
// Add this to your existing street vendor dashboard to integrate supplier search

document.addEventListener('DOMContentLoaded', function() {
    // Initialize supplier integration
    initSupplierIntegration();
});

function initSupplierIntegration() {
    // Add supplier search button to navigation if it doesn't exist
    addSupplierSearchButton();
    
    // Initialize supplier details modal
    initSupplierDetailsModal();
}

function addSupplierSearchToProducts() {
    // Find all product cards in the existing dashboard
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Add supplier info button to each product card
        const actionsDiv = card.querySelector('.product-actions');
        if (actionsDiv && !actionsDiv.querySelector('.supplier-info-btn')) {
            const supplierBtn = document.createElement('button');
            supplierBtn.className = 'btn btn-small btn-info supplier-info-btn';
            supplierBtn.innerHTML = '<i class="fas fa-info-circle"></i> Supplier Info';
            supplierBtn.onclick = () => showSupplierInfo(card);
            
            actionsDiv.appendChild(supplierBtn);
        }
    });
}

function addSupplierSearchButton() {
    // Add supplier search button to the header actions
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !headerActions.querySelector('.supplier-search-btn')) {
        const searchBtn = document.createElement('button');
        searchBtn.className = 'btn btn-street-vendor supplier-search-btn';
        searchBtn.innerHTML = `
            <i class="fas fa-search"></i> Find All Suppliers
        `;
        searchBtn.onclick = () => openSupplierSearch();
        
        headerActions.appendChild(searchBtn);
    }
}

// Initialize supplier details modal
function initSupplierDetailsModal() {
    const modal = document.getElementById('supplierDetailsModal');
    const closeBtn = document.getElementById('closeSupplierModal');
    const closeBtn2 = document.getElementById('closeSupplierDetailsBtn');
    const contactBtn = document.getElementById('contactSupplierBtn');
    const viewAllBtn = document.getElementById('viewAllSuppliersBtn');
    
    // Close modal events
    [closeBtn, closeBtn2].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeSupplierDetailsModal);
        }
    });
    
    // Contact supplier
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            if (window.currentSupplier) {
                contactSupplier(window.currentSupplier.id);
            }
        });
    }
    
    // View all suppliers
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            openSupplierSearch();
        });
    }
    
    // Close on outside click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSupplierDetailsModal();
            }
        });
    }
}

function showSupplierInfo(productCard) {
    // Extract product information
    const productName = productCard.querySelector('.product-title')?.textContent || 'Unknown Product';
    const supplierName = productCard.querySelector('.product-supplier')?.textContent?.replace('by ', '') || 'Unknown Supplier';
    
    // Create and show supplier info modal
    const modal = createSupplierInfoModal(productName, supplierName);
    document.body.appendChild(modal);
    
    // Show modal
    setTimeout(() => modal.classList.add('active'), 100);
    
    // Load supplier details
    loadSupplierDetails(supplierName, modal);
}

function createSupplierInfoModal(productName, supplierName) {
    const modal = document.createElement('div');
    modal.className = 'modal supplier-info-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Supplier Information</h3>
                <button class="close-btn" onclick="closeSupplierInfoModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="supplier-info-header">
                    <h4>${supplierName}</h4>
                    <p>Supplier for: ${productName}</p>
                </div>
                <div class="supplier-info-content" id="supplierInfoContent">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading supplier information...</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeSupplierInfoModal(this)">Close</button>
                <button class="btn btn-street-vendor" onclick="viewAllSuppliers()">
                    <i class="fas fa-search"></i> View All Suppliers
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

async function loadSupplierDetails(supplierName, modal) {
    try {
        // In a real implementation, you would search by supplier name
        // For demo, we'll use the first supplier from our system
        const response = await fetch('http://localhost:5000/api/suppliers/search?limit=1');
        const data = await response.json();
        
        if (data.success && data.data.regular_vendors.length > 0) {
            const supplier = data.data.regular_vendors[0];
            renderSupplierInfo(supplier, modal);
        } else {
            showSupplierNotFound(modal);
        }
    } catch (error) {
        console.error('Error loading supplier details:', error);
        showSupplierError(modal);
    }
}

function renderSupplierInfo(supplier, modal) {
    const content = modal.querySelector('#supplierInfoContent');
    
    // Generate star rating
    const stars = '★'.repeat(Math.floor(supplier.average_rating)) + 
                  '☆'.repeat(5 - Math.floor(supplier.average_rating));
    
    content.innerHTML = `
        <div class="supplier-details-grid">
            <div class="supplier-basic-info">
                <div class="info-row">
                    <span class="info-label">Rating:</span>
                    <span class="info-value">
                        <span class="rating-stars">${stars}</span>
                        ${supplier.average_rating.toFixed(1)} (${supplier.total_reviews} reviews)
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Location:</span>
                    <span class="info-value">${supplier.location}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${supplier.category}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Services:</span>
                    <span class="info-value">${supplier.services_offered.slice(0, 3).join(', ')}</span>
                </div>
            </div>
            
            <div class="supplier-badges">
                <h5>Certifications & Badges</h5>
                <div class="badges-list">
                    ${supplier.premium_badge ? 
                        `<span class="badge premium">${supplier.premium_badge.icon} ${supplier.premium_badge.text}</span>` : ''}
                    ${supplier.trust_badges.map(badge => 
                        `<span class="badge trust">${badge.icon} ${badge.text}</span>`
                    ).join('')}
                </div>
            </div>
            
            ${supplier.recent_review_highlights.length > 0 ? `
                <div class="recent-reviews">
                    <h5>Recent Reviews</h5>
                    ${supplier.recent_review_highlights.slice(0, 2).map(review => `
                        <div class="review-highlight">
                            <div class="review-title">${review.title}</div>
                            <div class="review-text">${review.comment}</div>
                            <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <div class="supplier-actions">
                <button class="btn btn-primary" onclick="contactSupplier('${supplier.id}')">
                    <i class="fas fa-phone"></i> Contact Supplier
                </button>
                <button class="btn btn-street-vendor" onclick="viewSupplierProfile('${supplier.id}')">
                    <i class="fas fa-user"></i> View Full Profile
                </button>
            </div>
        </div>
    `;
}

function showSupplierNotFound(modal) {
    const content = modal.querySelector('#supplierInfoContent');
    content.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h4>Supplier Not Found</h4>
            <p>We couldn't find detailed information for this supplier.</p>
            <button class="btn btn-primary" onclick="viewAllSuppliers()">
                Browse All Suppliers
            </button>
        </div>
    `;
}

function showSupplierError(modal) {
    const content = modal.querySelector('#supplierInfoContent');
    content.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Error Loading Supplier Info</h4>
            <p>There was an error loading supplier information. Please try again.</p>
            <button class="btn btn-primary" onclick="loadSupplierDetails('${supplierName}', this.closest('.modal'))">
                Retry
            </button>
        </div>
    `;
}

function closeSupplierInfoModal(element) {
    const modal = element.closest('.modal');
    modal.classList.remove('active');
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

function viewAllSuppliers() {
    window.open('templates/supplier_search.html', '_blank');
}

function contactSupplier(supplierId) {
    // Implement contact functionality
    showNotification('Contact feature would open communication channel with supplier', 'info');
}

function viewSupplierProfile(supplierId) {
    // Open supplier profile in new tab
    window.open(`templates/supplier_search.html#supplier=${supplierId}`, '_blank');
}

// Add CSS styles for the supplier info modal
const supplierModalStyles = `
    .supplier-info-modal .modal-content {
        max-width: 700px;
        width: 90vw;
    }
    
    /* Supplier Details Modal Styles */
    .supplier-details-full {
        display: grid;
        gap: 24px;
    }
    
    .supplier-header-full {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        padding: 24px;
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-radius: 12px;
        border-left: 4px solid var(--primary-color);
    }
    
    .supplier-main-info h2 {
        color: var(--primary-dark);
        margin-bottom: 12px;
        font-size: 1.8rem;
    }
    
    .supplier-rating-large {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }
    
    .rating-stars-large {
        color: #ffa000;
        font-size: 18px;
    }
    
    .rating-value-large {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--primary-dark);
    }
    
    .rating-count-large {
        color: #666;
        font-size: 14px;
    }
    
    .supplier-badges-large {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .badge.large {
        padding: 6px 12px;
        font-size: 12px;
    }
    
    .supplier-performance {
        display: flex;
        gap: 20px;
    }
    
    .performance-metric {
        text-align: center;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
    }
    
    .metric-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .supplier-details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
    }
    
    .details-section {
        background: white;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
    }
    
    .details-section h4 {
        color: var(--primary-dark);
        margin-bottom: 16px;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .details-list {
        display: grid;
        gap: 12px;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .detail-item:last-child {
        border-bottom: none;
    }
    
    .detail-label {
        font-weight: 600;
        color: #666;
        min-width: 80px;
    }
    
    .detail-value {
        font-weight: 500;
        color: var(--primary-dark);
        text-align: right;
        flex: 1;
    }
    
    .services-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
    }
    
    .service-tag {
        background: var(--primary-light);
        color: var(--primary-color);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }
    
    .supplier-description {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f0f0f0;
    }
    
    .supplier-description h5 {
        color: var(--primary-dark);
        margin-bottom: 8px;
    }
    
    .supplier-description p {
        color: #666;
        line-height: 1.5;
        font-size: 14px;
    }
    
    .analytics-section {
        background: white;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
    }
    
    .analytics-section h4 {
        color: var(--primary-dark);
        margin-bottom: 20px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }
    
    .analytics-card {
        text-align: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }
    
    .analytics-card:hover {
        border-color: var(--primary-color);
        transform: translateY(-2px);
    }
    
    .analytics-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 4px;
    }
    
    .analytics-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .rating-distribution h5 {
        color: var(--primary-dark);
        margin-bottom: 16px;
    }
    
    .rating-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }
    
    .rating-label {
        width: 30px;
        font-size: 14px;
        color: #ffa000;
    }
    
    .rating-progress {
        flex: 1;
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .rating-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffa000, #ff8f00);
        transition: width 0.3s ease;
    }
    
    .rating-count {
        width: 30px;
        text-align: right;
        font-size: 12px;
        color: #666;
    }
    
    .reviews-section {
        background: white;
        padding: 24px;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
    }
    
    .reviews-section h4 {
        color: var(--primary-dark);
        margin-bottom: 20px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .reviews-list {
        display: grid;
        gap: 16px;
    }
    
    .review-item-full {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    
    .review-customer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: var(--primary-dark);
    }
    
    .review-customer i {
        color: var(--primary-color);
        font-size: 16px;
    }
    
    .review-rating {
        color: #ffa000;
        font-size: 14px;
    }
    
    .review-title {
        font-weight: 600;
        color: var(--primary-dark);
        margin-bottom: 6px;
    }
    
    .review-content {
        color: #666;
        line-height: 1.5;
        margin-bottom: 8px;
    }
    
    .review-meta {
        font-size: 12px;
        color: #999;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
        .supplier-header-full {
            grid-template-columns: 1fr;
        }
        
        .supplier-performance {
            justify-content: center;
        }
        
        .supplier-details-grid {
            grid-template-columns: 1fr;
        }
        
        .analytics-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        
        .detail-value {
            text-align: left;
        }
        
        .services-tags {
            justify-content: flex-start;
        }
    }
    
    .supplier-info-header {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 24px;
    }
    
    .supplier-info-header h4 {
        color: var(--primary-dark);
        margin-bottom: 8px;
        font-size: 1.5rem;
    }
    
    .supplier-info-header p {
        color: #666;
        margin: 0;
    }
    
    .supplier-details-grid {
        display: grid;
        gap: 24px;
    }
    
    .supplier-basic-info .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .supplier-basic-info .info-row:last-child {
        border-bottom: none;
    }
    
    .info-label {
        font-weight: 600;
        color: #666;
    }
    
    .info-value {
        font-weight: 500;
        color: var(--primary-dark);
        text-align: right;
    }
    
    .rating-stars {
        color: #ffa000;
        margin-right: 8px;
    }
    
    .supplier-badges h5,
    .recent-reviews h5 {
        color: var(--primary-dark);
        margin-bottom: 12px;
        font-size: 1.1rem;
    }
    
    .badges-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .badge.premium {
        background: linear-gradient(135deg, #ff9800, #f57c00);
        color: white;
    }
    
    .badge.trust {
        background: linear-gradient(135deg, #2196f3, #1976d2);
        color: white;
    }
    
    .review-highlight {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        border-left: 4px solid var(--street-vendor-color);
    }
    
    .review-highlight:last-child {
        margin-bottom: 0;
    }
    
    .review-title {
        font-weight: 600;
        color: var(--primary-dark);
        margin-bottom: 4px;
        font-size: 13px;
    }
    
    .review-text {
        font-size: 12px;
        color: #666;
        line-height: 1.4;
        margin-bottom: 8px;
    }
    
    .review-rating {
        color: #ffa000;
        font-size: 12px;
    }
    
    .supplier-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        padding-top: 20px;
        border-top: 1px solid #f0f0f0;
    }
    
    .empty-state,
    .error-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .empty-state i,
    .error-state i {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .empty-state h4,
    .error-state h4 {
        margin-bottom: 12px;
        color: var(--primary-dark);
    }
    
    .btn.btn-info {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
        border: none;
    }
    
    .btn.btn-info:hover {
        background: linear-gradient(135deg, #138496, #117a8b);
    }
    
    @media (max-width: 768px) {
        .supplier-actions {
            flex-direction: column;
        }
        
        .info-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
        
        .info-value {
            text-align: left;
        }
    }
`;

// Inject the styles
const styleSheet = document.createElement('style');
styleSheet.textContent = supplierModalStyles;
document.head.appendChild(styleSheet);

// Supplier Details Modal Functions
async function showSupplierDetailsModal(supplierId) {
    const modal = document.getElementById('supplierDetailsModal');
    const title = document.getElementById('supplierModalTitle');
    const content = document.getElementById('supplierModalContent');
    
    // Show loading state
    content.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading supplier details...</p>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        // Load supplier details from API
        const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`);
        const data = await response.json();
        
        if (data.success) {
            renderSupplierDetails(data.data);
            window.currentSupplier = data.data.vendor;
        } else {
            showSupplierDetailsError();
        }
    } catch (error) {
        console.error('Error loading supplier details:', error);
        showSupplierDetailsError();
    }
}

function renderSupplierDetails(supplierData) {
    const { vendor, analytics, recent_reviews, premium_badge, trust_badges } = supplierData;
    const title = document.getElementById('supplierModalTitle');
    const content = document.getElementById('supplierModalContent');
    
    title.textContent = vendor.name;
    
    content.innerHTML = `
        <div class="supplier-details-full">
            <!-- Supplier Header -->
            <div class="supplier-header-full">
                <div class="supplier-main-info">
                    <h2>${vendor.name}</h2>
                    <div class="supplier-rating-large">
                        <span class="rating-stars-large">${generateStarRating(analytics.stats.average_rating)}</span>
                        <span class="rating-value-large">${analytics.stats.average_rating.toFixed(1)}</span>
                        <span class="rating-count-large">(${analytics.stats.total_reviews} reviews)</span>
                    </div>
                    <div class="supplier-badges-large">
                        ${premium_badge ? 
                            `<span class="badge premium large">${premium_badge.icon} ${premium_badge.text}</span>` : ''}
                        ${trust_badges.map(badge => 
                            `<span class="badge trust large">${badge.icon} ${badge.text}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="supplier-performance">
                    <div class="performance-metric">
                        <div class="metric-value">${analytics.current_score.toFixed(1)}</div>
                        <div class="metric-label">Performance Score</div>
                    </div>
                    <div class="performance-metric">
                        <div class="metric-value">${analytics.stats.recent_reviews_count}</div>
                        <div class="metric-label">Recent Reviews</div>
                    </div>
                </div>
            </div>
            
            <!-- Supplier Details Grid -->
            <div class="supplier-details-grid">
                <!-- Contact Information -->
                <div class="details-section">
                    <h4><i class="fas fa-address-card"></i> Contact Information</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${vendor.email}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${vendor.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${vendor.location}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Region:</span>
                            <span class="detail-value">${vendor.region}</span>
                        </div>
                        ${vendor.website ? `
                            <div class="detail-item">
                                <span class="detail-label">Website:</span>
                                <span class="detail-value">
                                    <a href="${vendor.website}" target="_blank">${vendor.website}</a>
                                </span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Business Information -->
                <div class="details-section">
                    <h4><i class="fas fa-building"></i> Business Information</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <span class="detail-label">Category:</span>
                            <span class="detail-value">${vendor.category}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Member Since:</span>
                            <span class="detail-value">${new Date(vendor.date_joined).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Services:</span>
                            <div class="services-tags">
                                ${vendor.services_offered.map(service => 
                                    `<span class="service-tag">${service}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    ${vendor.description ? `
                        <div class="supplier-description">
                            <h5>About</h5>
                            <p>${vendor.description}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Performance Analytics -->
            <div class="analytics-section">
                <h4><i class="fas fa-chart-bar"></i> Performance Analytics</h4>
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <div class="analytics-value">${analytics.stats.total_reviews}</div>
                        <div class="analytics-label">Total Reviews</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-value">${analytics.stats.average_rating.toFixed(1)}</div>
                        <div class="analytics-label">Average Rating</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-value">${analytics.stats.recent_reviews_count}</div>
                        <div class="analytics-label">Recent Reviews</div>
                    </div>
                    <div class="analytics-card">
                        <div class="analytics-value">${analytics.current_score.toFixed(1)}</div>
                        <div class="analytics-label">Quality Score</div>
                    </div>
                </div>
                
                <!-- Rating Distribution -->
                <div class="rating-distribution">
                    <h5>Rating Distribution</h5>
                    ${generateRatingDistribution(analytics.stats.rating_distribution)}
                </div>
            </div>
            
            <!-- Recent Reviews -->
            <div class="reviews-section">
                <h4><i class="fas fa-comments"></i> Recent Reviews (${recent_reviews.length})</h4>
                <div class="reviews-list">
                    ${recent_reviews.slice(0, 5).map(review => `
                        <div class="review-item-full">
                            <div class="review-header">
                                <div class="review-customer">
                                    <i class="fas fa-user-circle"></i>
                                    ${review.customer_name}
                                </div>
                                <div class="review-rating">
                                    ${generateStarRating(review.rating)}
                                </div>
                            </div>
                            <div class="review-title">${review.title}</div>
                            <div class="review-content">${review.comment}</div>
                            <div class="review-meta">
                                ${new Date(review.date_created).toLocaleDateString()}
                                ${review.verified_purchase ? ' • Verified Purchase' : ''}
                                ${review.helpful_votes > 0 ? ` • ${review.helpful_votes} found helpful` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function generateRatingDistribution(distribution) {
    let html = '';
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    
    for (let i = 5; i >= 1; i--) {
        const count = distribution[i] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        html += `
            <div class="rating-bar">
                <span class="rating-label">${i}★</span>
                <div class="rating-progress">
                    <div class="rating-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-count">${count}</span>
            </div>
        `;
    }
    return html;
}

function showSupplierDetailsError() {
    const content = document.getElementById('supplierModalContent');
    content.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>Unable to Load Supplier Details</h4>
            <p>We couldn't load supplier information at this time. Please try again later.</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Retry
            </button>
        </div>
    `;
}

function closeSupplierDetailsModal() {
    const modal = document.getElementById('supplierDetailsModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    window.currentSupplier = null;
}

// Generate star rating helper function
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

// Export functions for global access
window.closeSupplierInfoModal = closeSupplierInfoModal;
window.viewAllSuppliers = viewAllSuppliers;
window.contactSupplier = contactSupplier;
window.viewSupplierProfile = viewSupplierProfile;
window.showSupplierDetailsModal = showSupplierDetailsModal;
window.closeSupplierDetailsModal = closeSupplierDetailsModal;