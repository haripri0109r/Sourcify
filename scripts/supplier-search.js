// Supplier Search JavaScript
class SupplierSearchSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.currentView = 'grid';
        this.currentFilters = {
            search: '',
            category: '',
            region: '',
            sort: 'score'
        };
        this.suppliers = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadRegions();
        this.searchSuppliers();
    }

    bindEvents() {
        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Filter changes
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.searchSuppliers();
        });

        document.getElementById('regionFilter').addEventListener('change', (e) => {
            this.currentFilters.region = e.target.value;
            this.searchSuppliers();
        });

        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.searchSuppliers();
        });

        // View toggle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleView(e.target.dataset.view);
            });
        });

        // Modal events
        document.getElementById('closeSupplierModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('supplierModal').addEventListener('click', (e) => {
            if (e.target.id === 'supplierModal') {
                this.closeModal();
            }
        });
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/categories`);
            const data = await response.json();
            
            if (data.success) {
                const categoryFilter = document.getElementById('categoryFilter');
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadRegions() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/regions`);
            const data = await response.json();
            
            if (data.success) {
                const regionFilter = document.getElementById('regionFilter');
                data.data.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region;
                    option.textContent = region;
                    regionFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading regions:', error);
        }
    }

    performSearch() {
        this.currentFilters.search = document.getElementById('searchInput').value;
        this.searchSuppliers();
    }

    async searchSuppliers() {
        this.showLoading();

        try {
            const params = new URLSearchParams();
            if (this.currentFilters.search) params.append('search', this.currentFilters.search);
            if (this.currentFilters.category) params.append('category', this.currentFilters.category);
            if (this.currentFilters.region) params.append('region', this.currentFilters.region);
            if (this.currentFilters.sort) params.append('sort_by', this.currentFilters.sort);
            params.append('limit', '50');

            const response = await fetch(`${this.apiBaseUrl}/suppliers/search?${params}`);
            const data = await response.json();

            if (data.success) {
                this.suppliers = data.data;
                this.renderSuppliers();
                this.updateResultsSummary();
            } else {
                this.showError('Failed to load suppliers');
            }
        } catch (error) {
            console.error('Error searching suppliers:', error);
            this.showError('Network error occurred');
        } finally {
            this.hideLoading();
        }
    }

    renderSuppliers() {
        const premiumSection = document.getElementById('premiumSection');
        const premiumContainer = document.getElementById('premiumSuppliers');
        const regularContainer = document.getElementById('regularSuppliers');
        const regularTitle = document.getElementById('regularSuppliersTitle');

        // Clear existing content
        premiumContainer.innerHTML = '';
        regularContainer.innerHTML = '';

        // Show/hide premium section
        if (this.suppliers.premium_vendors && this.suppliers.premium_vendors.length > 0) {
            premiumSection.style.display = 'block';
            regularTitle.textContent = 'Other Suppliers';
            
            this.suppliers.premium_vendors.forEach(supplier => {
                premiumContainer.appendChild(this.createSupplierCard(supplier, true));
            });
        } else {
            premiumSection.style.display = 'none';
            regularTitle.textContent = 'All Suppliers';
        }

        // Render regular suppliers
        if (this.suppliers.regular_vendors && this.suppliers.regular_vendors.length > 0) {
            this.suppliers.regular_vendors.forEach(supplier => {
                regularContainer.appendChild(this.createSupplierCard(supplier, false));
            });
        }

        // Show empty state if no suppliers
        if (this.suppliers.total_count === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }
    }

    createSupplierCard(supplier, isPremium = false) {
        const card = document.createElement('div');
        card.className = `supplier-card ${isPremium ? 'premium' : ''}`;
        card.addEventListener('click', () => this.showSupplierDetails(supplier.id));

        // Generate star rating
        const stars = this.generateStarRating(supplier.average_rating);
        
        // Generate badges
        const badges = this.generateBadges(supplier);
        
        // Generate recent reviews
        const recentReviews = this.generateRecentReviews(supplier.recent_review_highlights);

        card.innerHTML = `
            <div class="supplier-header">
                <div class="supplier-name">
                    ${supplier.name}
                    ${isPremium ? '<i class="fas fa-crown" style="color: #ffd700;"></i>' : ''}
                </div>
                <div class="supplier-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${supplier.location}
                </div>
                <div class="supplier-rating">
                    <div class="rating-stars">${stars}</div>
                    <span class="rating-text">${supplier.average_rating.toFixed(1)}</span>
                    <span class="rating-count">(${supplier.total_reviews} reviews)</span>
                </div>
            </div>
            
            <div class="supplier-body">
                <div class="supplier-category">${supplier.category}</div>
                
                <div class="supplier-services">
                    <h4>Services Offered</h4>
                    <div class="services-list">
                        ${supplier.services_offered.slice(0, 3).map(service => 
                            `<span class="service-tag">${service}</span>`
                        ).join('')}
                        ${supplier.services_offered.length > 3 ? 
                            `<span class="service-tag">+${supplier.services_offered.length - 3} more</span>` : ''}
                    </div>
                </div>
                
                <div class="supplier-badges">
                    ${badges}
                </div>
                
                ${recentReviews}
            </div>
            
            <div class="supplier-footer">
                <div class="contact-info">
                    ${supplier.phone ? `<a href="tel:${supplier.phone}" class="contact-btn" onclick="event.stopPropagation()">
                        <i class="fas fa-phone"></i>
                    </a>` : ''}
                    ${supplier.website ? `<a href="${supplier.website}" target="_blank" class="contact-btn" onclick="event.stopPropagation()">
                        <i class="fas fa-globe"></i>
                    </a>` : ''}
                </div>
                <button class="view-details-btn">View Details</button>
            </div>
        `;

        return card;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    generateBadges(supplier) {
        let badges = '';
        
        if (supplier.premium_badge) {
            badges += `<span class="badge premium">${supplier.premium_badge.icon} ${supplier.premium_badge.text}</span>`;
        }
        
        supplier.trust_badges.forEach(badge => {
            badges += `<span class="badge ${badge.text.toLowerCase().replace(' ', '')}">${badge.icon} ${badge.text}</span>`;
        });
        
        return badges;
    }

    generateRecentReviews(reviews) {
        if (!reviews || reviews.length === 0) {
            return '';
        }

        const reviewsHtml = reviews.slice(0, 2).map(review => `
            <div class="review-highlight">
                <div class="review-title">${review.title}</div>
                <div class="review-text">${review.comment}</div>
            </div>
        `).join('');

        return `
            <div class="recent-reviews">
                <h4>Recent Reviews</h4>
                ${reviewsHtml}
            </div>
        `;
    }

    async showSupplierDetails(supplierId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/suppliers/${supplierId}`);
            const data = await response.json();

            if (data.success) {
                this.renderSupplierModal(data.data);
                this.openModal();
            } else {
                this.showError('Failed to load supplier details');
            }
        } catch (error) {
            console.error('Error loading supplier details:', error);
            this.showError('Network error occurred');
        }
    }

    renderSupplierModal(supplierData) {
        const { vendor, analytics, recent_reviews, premium_badge, trust_badges } = supplierData;
        
        document.getElementById('supplierModalTitle').textContent = vendor.name;
        
        const modalContent = document.getElementById('supplierModalContent');
        modalContent.innerHTML = `
            <div class="supplier-details">
                <div class="supplier-info">
                    <div class="info-section">
                        <h4>Contact Information</h4>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${vendor.email}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${vendor.phone || 'Not provided'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Location:</span>
                            <span class="info-value">${vendor.location}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Website:</span>
                            <span class="info-value">
                                ${vendor.website ? `<a href="${vendor.website}" target="_blank">${vendor.website}</a>` : 'Not provided'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Business Information</h4>
                        <div class="info-row">
                            <span class="info-label">Category:</span>
                            <span class="info-value">${vendor.category}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Region:</span>
                            <span class="info-value">${vendor.region}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Member Since:</span>
                            <span class="info-value">${new Date(vendor.date_joined).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Services Offered</h4>
                        <div class="services-list">
                            ${vendor.services_offered.map(service => 
                                `<span class="service-tag">${service}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    ${vendor.description ? `
                        <div class="info-section">
                            <h4>Description</h4>
                            <p>${vendor.description}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="supplier-analytics">
                    <div class="info-section">
                        <h4>Performance Metrics</h4>
                        <div class="info-row">
                            <span class="info-label">Overall Rating:</span>
                            <span class="info-value">
                                ${this.generateStarRating(analytics.stats.average_rating)} 
                                ${analytics.stats.average_rating.toFixed(1)}
                            </span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total Reviews:</span>
                            <span class="info-value">${analytics.stats.total_reviews}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Recent Reviews:</span>
                            <span class="info-value">${analytics.stats.recent_reviews_count} (last 30 days)</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Ranking Score:</span>
                            <span class="info-value">${analytics.current_score.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4>Rating Distribution</h4>
                        ${this.generateRatingDistribution(analytics.stats.rating_distribution)}
                    </div>
                    
                    <div class="info-section">
                        <h4>Badges & Certifications</h4>
                        <div class="supplier-badges">
                            ${premium_badge ? `<span class="badge premium">${premium_badge.icon} ${premium_badge.text}</span>` : ''}
                            ${trust_badges.map(badge => 
                                `<span class="badge ${badge.text.toLowerCase().replace(' ', '')}">${badge.icon} ${badge.text}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="reviews-section">
                    <h4>Recent Reviews (${recent_reviews.length})</h4>
                    ${recent_reviews.map(review => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="review-customer">${review.customer_name}</span>
                                <span class="review-rating">${this.generateStarRating(review.rating)}</span>
                            </div>
                            <div class="review-title">${review.title}</div>
                            <div class="review-content">${review.comment}</div>
                            <div style="font-size: 12px; color: #999; margin-top: 8px;">
                                ${new Date(review.date_created).toLocaleDateString()}
                                ${review.verified_purchase ? ' • Verified Purchase' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateRatingDistribution(distribution) {
        let html = '';
        for (let i = 5; i >= 1; i--) {
            const count = distribution[i] || 0;
            const percentage = Object.values(distribution).reduce((a, b) => a + b, 0) > 0 ? 
                (count / Object.values(distribution).reduce((a, b) => a + b, 0)) * 100 : 0;
            
            html += `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="width: 20px;">${i}★</span>
                    <div style="flex: 1; background: #f0f0f0; height: 8px; border-radius: 4px; margin: 0 12px;">
                        <div style="width: ${percentage}%; height: 100%; background: #ffa000; border-radius: 4px;"></div>
                    </div>
                    <span style="width: 30px; text-align: right; font-size: 12px;">${count}</span>
                </div>
            `;
        }
        return html;
    }

    toggleView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update grid classes
        document.querySelectorAll('.suppliers-grid').forEach(grid => {
            grid.classList.toggle('list-view', view === 'list');
        });
    }

    updateResultsSummary() {
        const count = this.suppliers.total_count || 0;
        const countText = count === 1 ? '1 supplier found' : `${count} suppliers found`;
        document.getElementById('resultsCount').textContent = countText;
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('premiumSection').style.display = 'none';
        document.querySelector('.suppliers-section').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingState').style.display = 'none';
        document.querySelector('.suppliers-section').style.display = 'block';
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.querySelector('.suppliers-section').style.display = 'none';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
    }

    showError(message) {
        // You can implement a toast notification system here
        console.error(message);
        alert(message); // Simple fallback
    }

    openModal() {
        document.getElementById('supplierModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('supplierModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SupplierSearchSystem();
});