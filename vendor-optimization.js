// Vendor Optimization JavaScript
class VendorOptimizationSystem {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.vendorId = this.getVendorId(); // Get from session/localStorage
        this.selectedPlan = null;
        this.selectedDuration = 'monthly';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadVendorStatus();
        this.checkEligibility();
    }

    getVendorId() {
        // In a real application, this would come from authentication
        // For demo purposes, we'll use a sample vendor ID
        return localStorage.getItem('currentVendorId') || 'vendor_001';
    }

    bindEvents() {
        // Refresh status
        document.getElementById('refreshStatus').addEventListener('click', () => {
            this.loadVendorStatus();
        });

        // Plan selection
        document.querySelectorAll('.plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tier = e.target.dataset.tier;
                this.selectPlan(tier);
            });
        });

        // Price option selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.price-option')) {
                const option = e.target.closest('.price-option');
                const duration = option.dataset.duration;
                
                // Remove selected class from siblings
                option.parentNode.querySelectorAll('.price-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selected class
                option.classList.add('selected');
                this.selectedDuration = duration;
            }
        });

        // Payment modal events
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('cancelPayment').addEventListener('click', () => {
            this.closePaymentModal();
        });

        document.getElementById('processPayment').addEventListener('click', () => {
            this.processPayment();
        });

        // Payment method selection
        document.querySelectorAll('input[name="payment"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.togglePaymentDetails(e.target.value);
            });
        });
    }

    async loadVendorStatus() {
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/suppliers/${this.vendorId}/analytics`);
            const data = await response.json();

            if (data.success) {
                this.renderVendorStatus(data.data);
            } else {
                this.showError('Failed to load vendor status');
            }
        } catch (error) {
            console.error('Error loading vendor status:', error);
            this.showError('Network error occurred');
        } finally {
            this.hideLoading();
        }
    }

    renderVendorStatus(analytics) {
        const statusContent = document.getElementById('statusContent');
        
        // Calculate performance metrics
        const performanceScore = (analytics.current_score * 20).toFixed(1); // Convert to percentage
        const categoryRank = this.calculateCategoryRank(analytics);
        const growthRate = this.calculateGrowthRate(analytics.trends);

        statusContent.innerHTML = `
            <div class="status-grid">
                <div class="status-metric">
                    <div class="metric-value">${analytics.stats.average_rating.toFixed(1)}</div>
                    <div class="metric-label">Average Rating</div>
                    <div class="metric-change ${analytics.stats.average_rating >= 4.0 ? 'positive' : 'negative'}">
                        ${analytics.stats.average_rating >= 4.0 ? '↗' : '↘'} 
                        ${analytics.stats.average_rating >= 4.0 ? 'Excellent' : 'Needs Improvement'}
                    </div>
                </div>
                
                <div class="status-metric">
                    <div class="metric-value">${analytics.stats.total_reviews}</div>
                    <div class="metric-label">Total Reviews</div>
                    <div class="metric-change ${analytics.stats.recent_reviews_count > 0 ? 'positive' : 'negative'}">
                        ${analytics.stats.recent_reviews_count > 0 ? '↗' : '→'} 
                        ${analytics.stats.recent_reviews_count} this month
                    </div>
                </div>
                
                <div class="status-metric">
                    <div class="metric-value">${performanceScore}%</div>
                    <div class="metric-label">Performance Score</div>
                    <div class="metric-change ${performanceScore >= 70 ? 'positive' : 'negative'}">
                        ${performanceScore >= 70 ? '↗' : '↘'} 
                        ${performanceScore >= 70 ? 'Above Average' : 'Below Average'}
                    </div>
                </div>
                
                <div class="status-metric">
                    <div class="metric-value">#${categoryRank}</div>
                    <div class="metric-label">Category Rank</div>
                    <div class="metric-change ${categoryRank <= 10 ? 'positive' : 'negative'}">
                        ${categoryRank <= 10 ? '↗' : '↘'} 
                        in ${analytics.category_comparison.category}
                    </div>
                </div>
            </div>
            
            <div class="performance-insights">
                <h3><i class="fas fa-lightbulb"></i> Performance Insights</h3>
                <div class="insights-grid">
                    ${this.generateInsights(analytics)}
                </div>
            </div>
        `;
    }

    calculateCategoryRank(analytics) {
        // Simulate category ranking based on performance
        const score = analytics.current_score;
        if (score >= 4.5) return Math.floor(Math.random() * 5) + 1;
        if (score >= 4.0) return Math.floor(Math.random() * 10) + 6;
        if (score >= 3.5) return Math.floor(Math.random() * 20) + 11;
        return Math.floor(Math.random() * 50) + 31;
    }

    calculateGrowthRate(trends) {
        if (!trends || trends.length < 2) return 0;
        const recent = trends[trends.length - 1];
        const previous = trends[trends.length - 2];
        return ((recent.review_count - previous.review_count) / previous.review_count * 100).toFixed(1);
    }

    generateInsights(analytics) {
        const insights = [];
        
        if (analytics.stats.average_rating >= 4.5) {
            insights.push(`
                <div class="insight-item positive">
                    <i class="fas fa-star"></i>
                    <span>Excellent rating! You're in the top tier of suppliers.</span>
                </div>
            `);
        } else if (analytics.stats.average_rating < 4.0) {
            insights.push(`
                <div class="insight-item negative">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Focus on improving service quality to boost your rating.</span>
                </div>
            `);
        }
        
        if (analytics.stats.recent_reviews_count < 5) {
            insights.push(`
                <div class="insight-item warning">
                    <i class="fas fa-chart-line"></i>
                    <span>Encourage more customers to leave reviews to improve visibility.</span>
                </div>
            `);
        }
        
        if (analytics.category_comparison.performance_vs_category.rating_difference > 0.5) {
            insights.push(`
                <div class="insight-item positive">
                    <i class="fas fa-trophy"></i>
                    <span>You're performing ${analytics.category_comparison.performance_vs_category.rating_difference.toFixed(1)} points above category average!</span>
                </div>
            `);
        }
        
        return insights.join('');
    }

    async checkEligibility() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/suppliers/${this.vendorId}/premium-eligibility`);
            const data = await response.json();

            if (data.success) {
                this.renderEligibility(data.data);
            } else {
                this.showError('Failed to check eligibility');
            }
        } catch (error) {
            console.error('Error checking eligibility:', error);
            this.showError('Network error occurred');
        }
    }

    renderEligibility(eligibility) {
        const eligibilityCard = document.getElementById('eligibilityCard');
        const plansSection = document.getElementById('plansSection');
        
        if (eligibility.eligible) {
            eligibilityCard.className = 'eligibility-card eligibility-eligible';
            eligibilityCard.innerHTML = `
                <div class="eligibility-header eligible">
                    <div class="eligibility-icon">🎉</div>
                    <div class="eligibility-title">Congratulations!</div>
                    <div class="eligibility-subtitle">You're eligible for premium optimization</div>
                </div>
                <div class="eligibility-content">
                    <div class="requirements-grid">
                        <div class="requirement-item met">
                            <div class="requirement-icon met">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="requirement-text">
                                <div class="requirement-label">Minimum Reviews</div>
                                <div class="requirement-value">${eligibility.current_reviews} / ${eligibility.requirements.min_reviews} reviews</div>
                            </div>
                        </div>
                        
                        <div class="requirement-item met">
                            <div class="requirement-icon met">
                                <i class="fas fa-star"></i>
                            </div>
                            <div class="requirement-text">
                                <div class="requirement-label">Minimum Rating</div>
                                <div class="requirement-value">${eligibility.current_rating.toFixed(1)} / ${eligibility.requirements.min_rating} stars</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="eligibility-benefits">
                        <h4><i class="fas fa-gift"></i> What You'll Get</h4>
                        <ul>
                            <li>Higher visibility in search results</li>
                            <li>Premium badges and trust indicators</li>
                            <li>Advanced analytics and insights</li>
                            <li>Priority customer support</li>
                            <li>Increased customer inquiries</li>
                        </ul>
                    </div>
                </div>
            `;
            
            plansSection.style.display = 'block';
        } else {
            eligibilityCard.className = 'eligibility-card eligibility-not-eligible';
            eligibilityCard.innerHTML = `
                <div class="eligibility-header not-eligible">
                    <div class="eligibility-icon">⚠️</div>
                    <div class="eligibility-title">Not Eligible Yet</div>
                    <div class="eligibility-subtitle">You need to meet our quality standards first</div>
                </div>
                <div class="eligibility-content">
                    <div class="requirements-grid">
                        <div class="requirement-item ${eligibility.current_reviews >= eligibility.requirements.min_reviews ? 'met' : 'not-met'}">
                            <div class="requirement-icon ${eligibility.current_reviews >= eligibility.requirements.min_reviews ? 'met' : 'not-met'}">
                                <i class="fas fa-${eligibility.current_reviews >= eligibility.requirements.min_reviews ? 'check-circle' : 'times-circle'}"></i>
                            </div>
                            <div class="requirement-text">
                                <div class="requirement-label">Minimum Reviews</div>
                                <div class="requirement-value">${eligibility.current_reviews} / ${eligibility.requirements.min_reviews} reviews</div>
                            </div>
                        </div>
                        
                        <div class="requirement-item ${eligibility.current_rating >= eligibility.requirements.min_rating ? 'met' : 'not-met'}">
                            <div class="requirement-icon ${eligibility.current_rating >= eligibility.requirements.min_rating ? 'met' : 'not-met'}">
                                <i class="fas fa-${eligibility.current_rating >= eligibility.requirements.min_rating ? 'check-circle' : 'times-circle'}"></i>
                            </div>
                            <div class="requirement-text">
                                <div class="requirement-label">Minimum Rating</div>
                                <div class="requirement-value">${eligibility.current_rating.toFixed(1)} / ${eligibility.requirements.min_rating} stars</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="improvement-tips">
                        <h4><i class="fas fa-lightbulb"></i> How to Become Eligible</h4>
                        <ul>
                            ${eligibility.current_reviews < eligibility.requirements.min_reviews ? 
                                `<li>Get ${eligibility.requirements.min_reviews - eligibility.current_reviews} more customer reviews</li>` : ''}
                            ${eligibility.current_rating < eligibility.requirements.min_rating ? 
                                `<li>Improve your service quality to reach ${eligibility.requirements.min_rating}+ star rating</li>` : ''}
                            <li>Respond promptly to customer inquiries</li>
                            <li>Maintain consistent product quality</li>
                            <li>Provide excellent customer service</li>
                        </ul>
                    </div>
                </div>
            `;
            
            plansSection.style.display = 'none';
        }
    }

    selectPlan(tier) {
        this.selectedPlan = tier;
        
        // Get pricing for the plan
        const pricing = this.getPlanPricing(tier);
        
        this.openPaymentModal(tier, pricing);
    }

    getPlanPricing(tier) {
        const pricing = {
            basic: { monthly: 999, quarterly: 2499, yearly: 8999 },
            premium: { monthly: 1999, quarterly: 4999, yearly: 17999 },
            enterprise: { monthly: 4999, quarterly: 12499, yearly: 44999 }
        };
        
        return pricing[tier];
    }

    openPaymentModal(tier, pricing) {
        const modal = document.getElementById('paymentModal');
        const title = document.getElementById('paymentModalTitle');
        const summary = document.getElementById('paymentSummary');
        
        title.textContent = `Upgrade to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`;
        
        const planNames = {
            basic: 'Basic Promotion',
            premium: 'Premium Partner',
            enterprise: 'Enterprise Partner'
        };
        
        const currentPrice = pricing[this.selectedDuration];
        const savings = this.calculateSavings(pricing, this.selectedDuration);
        
        summary.innerHTML = `
            <div class="summary-row">
                <span>Plan:</span>
                <span>${planNames[tier]}</span>
            </div>
            <div class="summary-row">
                <span>Duration:</span>
                <span>${this.selectedDuration.charAt(0).toUpperCase() + this.selectedDuration.slice(1)}</span>
            </div>
            ${savings > 0 ? `
                <div class="summary-row">
                    <span>Savings:</span>
                    <span style="color: #4caf50;">₹${savings} (${this.calculateSavingsPercentage(pricing, this.selectedDuration)}%)</span>
                </div>
            ` : ''}
            <div class="summary-row">
                <span>Total Amount:</span>
                <span>₹${currentPrice.toLocaleString()}</span>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    calculateSavings(pricing, duration) {
        if (duration === 'monthly') return 0;
        
        const monthlyTotal = pricing.monthly * (duration === 'quarterly' ? 3 : 12);
        const discountedPrice = pricing[duration];
        
        return monthlyTotal - discountedPrice;
    }

    calculateSavingsPercentage(pricing, duration) {
        if (duration === 'monthly') return 0;
        
        const savings = this.calculateSavings(pricing, duration);
        const monthlyTotal = pricing.monthly * (duration === 'quarterly' ? 3 : 12);
        
        return Math.round((savings / monthlyTotal) * 100);
    }

    togglePaymentDetails(method) {
        const cardDetails = document.getElementById('cardDetails');
        
        if (method === 'card') {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    }

    async processPayment() {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const pricing = this.getPlanPricing(this.selectedPlan);
        const amount = pricing[this.selectedDuration];
        
        // Generate a mock transaction ID
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/suppliers/${this.vendorId}/upgrade-premium`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tier: this.selectedPlan,
                    duration: this.selectedDuration,
                    payment_method: paymentMethod,
                    transaction_id: transactionId,
                    amount: amount
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccessMessage(data.data);
                this.closePaymentModal();
                
                // Refresh the page data
                setTimeout(() => {
                    this.loadVendorStatus();
                    this.checkEligibility();
                }, 2000);
            } else {
                this.showError(data.error);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showError('Payment processing failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    showSuccessMessage(data) {
        const message = `
            🎉 Congratulations! Your upgrade to ${this.selectedPlan} plan is successful!
            
            Transaction ID: ${data.payment_id}
            Valid until: ${new Date(data.expires).toLocaleDateString()}
            
            Your enhanced listing will be active within 24 hours.
        `;
        
        alert(message); // In a real app, use a proper notification system
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    showError(message) {
        console.error(message);
        alert('Error: ' + message); // In a real app, use a proper notification system
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VendorOptimizationSystem();
});

// Add some sample CSS for insights
const additionalStyles = `
    .performance-insights {
        margin-top: 32px;
        padding-top: 32px;
        border-top: 1px solid #e0e0e0;
    }
    
    .performance-insights h3 {
        color: var(--primary-dark);
        margin-bottom: 20px;
        font-size: 1.3rem;
    }
    
    .insights-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .insight-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
    }
    
    .insight-item.positive {
        background: #e8f5e8;
        color: #2e7d32;
        border-left: 4px solid #4caf50;
    }
    
    .insight-item.negative {
        background: #ffebee;
        color: #c62828;
        border-left: 4px solid #f44336;
    }
    
    .insight-item.warning {
        background: #fff3e0;
        color: #ef6c00;
        border-left: 4px solid #ff9800;
    }
    
    .eligibility-benefits,
    .improvement-tips {
        margin-top: 24px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;
    }
    
    .eligibility-benefits h4,
    .improvement-tips h4 {
        color: var(--primary-dark);
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .eligibility-benefits ul,
    .improvement-tips ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .eligibility-benefits li,
    .improvement-tips li {
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
    }
    
    .eligibility-benefits li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #4caf50;
        font-weight: bold;
    }
    
    .improvement-tips li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: var(--primary-color);
        font-weight: bold;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);