"""
Supplier Ranking and Optimization System
A comprehensive system for ranking suppliers based on reviews and premium status
"""

import json
import datetime
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import hashlib

class PremiumTier(Enum):
    NONE = "none"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class ReviewStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

@dataclass
class Review:
    id: str
    vendor_id: str
    customer_id: str
    rating: float  # 1.0 to 5.0
    title: str
    comment: str
    date_created: str
    status: ReviewStatus
    helpful_votes: int = 0
    verified_purchase: bool = False
    product_id: Optional[str] = None

@dataclass
class Vendor:
    id: str
    name: str
    email: str
    phone: str
    location: str
    region: str
    category: str
    services_offered: List[str]
    website: Optional[str] = None
    description: str = ""
    date_joined: str = ""
    is_active: bool = True
    premium_tier: PremiumTier = PremiumTier.NONE
    premium_expires: Optional[str] = None
    custom_tags: List[str] = None
    
    def __post_init__(self):
        if self.custom_tags is None:
            self.custom_tags = []

@dataclass
class VendorStats:
    vendor_id: str
    total_reviews: int
    average_rating: float
    rating_distribution: Dict[int, int]  # {1: count, 2: count, ...}
    recent_reviews_count: int  # last 30 days
    response_rate: float
    delivery_score: float
    quality_score: float
    service_score: float
    last_updated: str

class SupplierRankingSystem:
    def __init__(self, db_path: str = "supplier_ranking.db"):
        self.db_path = db_path
        self.init_database()
        
        # Ranking configuration
        self.MINIMUM_REVIEWS_FOR_PREMIUM = 10
        self.MINIMUM_RATING_FOR_PREMIUM = 4.0
        self.PREMIUM_BOOST_FACTOR = 1.2
        self.RECENCY_DAYS = 30
        
        # Scoring weights
        self.RATING_WEIGHT = 0.7
        self.REVIEW_COUNT_WEIGHT = 0.2
        self.RECENCY_WEIGHT = 0.1
        
    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Vendors table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vendors (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT,
                location TEXT,
                region TEXT,
                category TEXT,
                services_offered TEXT,
                website TEXT,
                description TEXT,
                date_joined TEXT,
                is_active BOOLEAN DEFAULT 1,
                premium_tier TEXT DEFAULT 'none',
                premium_expires TEXT,
                custom_tags TEXT
            )
        ''')
        
        # Reviews table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                vendor_id TEXT,
                customer_id TEXT,
                rating REAL,
                title TEXT,
                comment TEXT,
                date_created TEXT,
                status TEXT DEFAULT 'pending',
                helpful_votes INTEGER DEFAULT 0,
                verified_purchase BOOLEAN DEFAULT 0,
                product_id TEXT,
                FOREIGN KEY (vendor_id) REFERENCES vendors (id)
            )
        ''')
        
        # Vendor stats table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vendor_stats (
                vendor_id TEXT PRIMARY KEY,
                total_reviews INTEGER DEFAULT 0,
                average_rating REAL DEFAULT 0.0,
                rating_distribution TEXT,
                recent_reviews_count INTEGER DEFAULT 0,
                response_rate REAL DEFAULT 0.0,
                delivery_score REAL DEFAULT 0.0,
                quality_score REAL DEFAULT 0.0,
                service_score REAL DEFAULT 0.0,
                last_updated TEXT,
                FOREIGN KEY (vendor_id) REFERENCES vendors (id)
            )
        ''')
        
        # Premium payments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS premium_payments (
                id TEXT PRIMARY KEY,
                vendor_id TEXT,
                tier TEXT,
                amount REAL,
                payment_date TEXT,
                expires_date TEXT,
                transaction_id TEXT,
                status TEXT DEFAULT 'active',
                FOREIGN KEY (vendor_id) REFERENCES vendors (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_vendor(self, vendor: Vendor) -> bool:
        """Add a new vendor to the system"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO vendors (
                    id, name, email, phone, location, region, category,
                    services_offered, website, description, date_joined,
                    is_active, premium_tier, premium_expires, custom_tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                vendor.id, vendor.name, vendor.email, vendor.phone,
                vendor.location, vendor.region, vendor.category,
                json.dumps(vendor.services_offered), vendor.website,
                vendor.description, vendor.date_joined, vendor.is_active,
                vendor.premium_tier.value, vendor.premium_expires,
                json.dumps(vendor.custom_tags)
            ))
            
            # Initialize vendor stats
            cursor.execute('''
                INSERT INTO vendor_stats (vendor_id, last_updated)
                VALUES (?, ?)
            ''', (vendor.id, datetime.datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding vendor: {e}")
            return False
    
    def add_review(self, review: Review) -> bool:
        """Add a new review for a vendor"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO reviews (
                    id, vendor_id, customer_id, rating, title, comment,
                    date_created, status, helpful_votes, verified_purchase, product_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                review.id, review.vendor_id, review.customer_id, review.rating,
                review.title, review.comment, review.date_created,
                review.status.value, review.helpful_votes,
                review.verified_purchase, review.product_id
            ))
            
            conn.commit()
            conn.close()
            
            # Update vendor stats after adding review
            self.update_vendor_stats(review.vendor_id)
            return True
        except Exception as e:
            print(f"Error adding review: {e}")
            return False
    
    def update_vendor_stats(self, vendor_id: str):
        """Update calculated statistics for a vendor"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get all approved reviews for this vendor
        cursor.execute('''
            SELECT rating, date_created FROM reviews 
            WHERE vendor_id = ? AND status = 'approved'
        ''', (vendor_id,))
        
        reviews = cursor.fetchall()
        
        if not reviews:
            conn.close()
            return
        
        # Calculate statistics
        ratings = [r[0] for r in reviews]
        total_reviews = len(ratings)
        average_rating = sum(ratings) / total_reviews
        
        # Rating distribution
        rating_dist = {i: ratings.count(i) for i in range(1, 6)}
        
        # Recent reviews (last 30 days)
        thirty_days_ago = (datetime.datetime.now() - datetime.timedelta(days=30)).isoformat()
        recent_reviews = [r for r in reviews if r[1] > thirty_days_ago]
        recent_count = len(recent_reviews)
        
        # Update stats in database
        cursor.execute('''
            UPDATE vendor_stats SET
                total_reviews = ?,
                average_rating = ?,
                rating_distribution = ?,
                recent_reviews_count = ?,
                last_updated = ?
            WHERE vendor_id = ?
        ''', (
            total_reviews, average_rating, json.dumps(rating_dist),
            recent_count, datetime.datetime.now().isoformat(), vendor_id
        ))
        
        conn.commit()
        conn.close()
    
    def calculate_vendor_score(self, vendor_id: str) -> float:
        """Calculate ranking score for a vendor"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get vendor stats
        cursor.execute('''
            SELECT total_reviews, average_rating, recent_reviews_count, last_updated
            FROM vendor_stats WHERE vendor_id = ?
        ''', (vendor_id,))
        
        stats = cursor.fetchone()
        if not stats:
            conn.close()
            return 0.0
        
        total_reviews, avg_rating, recent_count, last_updated = stats
        
        # Calculate recency factor (0.0 to 1.0)
        if last_updated:
            days_since_update = (datetime.datetime.now() - 
                               datetime.datetime.fromisoformat(last_updated)).days
            recency_factor = max(0, 1 - (days_since_update / 365))  # Decay over a year
        else:
            recency_factor = 0.0
        
        # Normalize review count (logarithmic scaling)
        import math
        normalized_reviews = min(1.0, math.log(total_reviews + 1) / math.log(100))
        
        # Calculate base score
        base_score = (
            avg_rating * self.RATING_WEIGHT +
            normalized_reviews * self.REVIEW_COUNT_WEIGHT +
            recency_factor * self.RECENCY_WEIGHT
        )
        
        # Check for premium status
        cursor.execute('''
            SELECT premium_tier, premium_expires FROM vendors WHERE id = ?
        ''', (vendor_id,))
        
        vendor_data = cursor.fetchone()
        conn.close()
        
        if vendor_data and vendor_data[0] != 'none':
            premium_tier, expires = vendor_data
            
            # Check if premium is still valid
            if expires and datetime.datetime.fromisoformat(expires) > datetime.datetime.now():
                # Apply premium boost only if vendor meets quality threshold
                if avg_rating >= self.MINIMUM_RATING_FOR_PREMIUM and total_reviews >= self.MINIMUM_REVIEWS_FOR_PREMIUM:
                    boost_factors = {
                        'basic': 1.1,
                        'premium': 1.2,
                        'enterprise': 1.3
                    }
                    base_score *= boost_factors.get(premium_tier, 1.0)
        
        return base_score
    
    def check_premium_eligibility(self, vendor_id: str) -> Dict[str, any]:
        """Check if vendor is eligible for premium optimization"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT total_reviews, average_rating FROM vendor_stats WHERE vendor_id = ?
        ''', (vendor_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if not stats:
            return {
                'eligible': False,
                'reason': 'No review data found',
                'requirements': {
                    'min_reviews': self.MINIMUM_REVIEWS_FOR_PREMIUM,
                    'min_rating': self.MINIMUM_RATING_FOR_PREMIUM
                }
            }
        
        total_reviews, avg_rating = stats
        
        eligible = (total_reviews >= self.MINIMUM_REVIEWS_FOR_PREMIUM and 
                   avg_rating >= self.MINIMUM_RATING_FOR_PREMIUM)
        
        return {
            'eligible': eligible,
            'current_reviews': total_reviews,
            'current_rating': avg_rating,
            'requirements': {
                'min_reviews': self.MINIMUM_REVIEWS_FOR_PREMIUM,
                'min_rating': self.MINIMUM_RATING_FOR_PREMIUM
            },
            'reason': 'Meets requirements' if eligible else 'Does not meet minimum requirements'
        }
    
    def get_ranked_vendors(self, category: str = None, region: str = None, 
                          limit: int = 50) -> List[Dict]:
        """Get ranked list of vendors with all display information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build query with filters
        query = '''
            SELECT v.id, v.name, v.email, v.phone, v.location, v.region, v.category, 
                   v.services_offered, v.website, v.description, v.date_joined, v.is_active,
                   v.premium_tier, v.premium_expires, v.custom_tags,
                   COALESCE(vs.total_reviews, 0) as total_reviews, 
                   COALESCE(vs.average_rating, 0.0) as average_rating, 
                   COALESCE(vs.recent_reviews_count, 0) as recent_reviews_count
            FROM vendors v
            LEFT JOIN vendor_stats vs ON v.id = vs.vendor_id
            WHERE v.is_active = 1
        '''
        params = []
        
        if category:
            query += ' AND v.category = ?'
            params.append(category)
        
        if region:
            query += ' AND v.region = ?'
            params.append(region)
        
        cursor.execute(query, params)
        vendors = cursor.fetchall()
        
        # Calculate scores and prepare vendor data
        vendor_list = []
        for vendor_data in vendors:
            vendor_id = vendor_data[0]
            score = self.calculate_vendor_score(vendor_id)
            
            # Get recent reviews for highlights
            cursor.execute('''
                SELECT title, comment, rating, date_created 
                FROM reviews 
                WHERE vendor_id = ? AND status = 'approved' 
                ORDER BY date_created DESC 
                LIMIT 3
            ''', (vendor_id,))
            
            recent_reviews = cursor.fetchall()
            
            vendor_info = {
                'id': vendor_data[0],
                'name': vendor_data[1],
                'email': vendor_data[2],
                'phone': vendor_data[3],
                'location': vendor_data[4],
                'region': vendor_data[5],
                'category': vendor_data[6],
                'services_offered': json.loads(vendor_data[7]) if isinstance(vendor_data[7], str) else (vendor_data[7] or []),
                'website': vendor_data[8],
                'description': vendor_data[9],
                'premium_tier': vendor_data[12],
                'custom_tags': json.loads(vendor_data[14]) if isinstance(vendor_data[14], str) else (vendor_data[14] or []),
                'total_reviews': vendor_data[15] or 0,
                'average_rating': vendor_data[16] or 0.0,
                'recent_reviews_count': vendor_data[17] or 0,
                'score': score,
                'recent_review_highlights': [
                    {
                        'title': r[0],
                        'comment': r[1][:100] + '...' if len(r[1]) > 100 else r[1],
                        'rating': r[2],
                        'date': r[3]
                    } for r in recent_reviews
                ],
                'is_premium': vendor_data[12] != 'none',
                'premium_badge': self.get_premium_badge(vendor_data[12]),
                'trust_badges': self.get_trust_badges(vendor_data[0])
            }
            
            vendor_list.append(vendor_info)
        
        conn.close()
        
        # Sort by score (highest first)
        vendor_list.sort(key=lambda x: x['score'], reverse=True)
        
        return vendor_list[:limit]
    
    def get_premium_badge(self, premium_tier: str) -> Dict[str, str]:
        """Get premium badge information"""
        badges = {
            'basic': {'text': 'Promoted', 'color': '#4CAF50', 'icon': '⭐'},
            'premium': {'text': 'Premium Partner', 'color': '#FF9800', 'icon': '👑'},
            'enterprise': {'text': 'Enterprise Partner', 'color': '#9C27B0', 'icon': '💎'},
            'none': None
        }
        return badges.get(premium_tier)
    
    def get_trust_badges(self, vendor_id: str) -> List[Dict[str, str]]:
        """Get trust badges based on vendor performance"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT total_reviews, average_rating, recent_reviews_count
            FROM vendor_stats WHERE vendor_id = ?
        ''', (vendor_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        if not stats:
            return []
        
        total_reviews, avg_rating, recent_count = stats
        badges = []
        
        # Trusted vendor badge
        if total_reviews >= 50 and avg_rating >= 4.5:
            badges.append({'text': 'Trusted Vendor', 'color': '#2196F3', 'icon': '🛡️'})
        
        # Fast delivery badge (based on reviews mentioning delivery)
        if avg_rating >= 4.0:
            badges.append({'text': 'Quality Assured', 'color': '#4CAF50', 'icon': '✅'})
        
        # Active vendor badge
        if recent_count >= 5:
            badges.append({'text': 'Active Vendor', 'color': '#FF5722', 'icon': '🔥'})
        
        return badges
    
    def upgrade_to_premium(self, vendor_id: str, tier: str, duration_months: int, 
                          payment_amount: float, transaction_id: str) -> Dict[str, any]:
        """Upgrade vendor to premium status"""
        # Check eligibility first
        eligibility = self.check_premium_eligibility(vendor_id)
        if not eligibility['eligible']:
            return {
                'success': False,
                'message': f"Vendor not eligible: {eligibility['reason']}",
                'eligibility': eligibility
            }
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Calculate expiry date
            expiry_date = (datetime.datetime.now() + 
                          datetime.timedelta(days=duration_months * 30)).isoformat()
            
            # Update vendor premium status
            cursor.execute('''
                UPDATE vendors SET premium_tier = ?, premium_expires = ?
                WHERE id = ?
            ''', (tier, expiry_date, vendor_id))
            
            # Record payment
            payment_id = hashlib.md5(f"{vendor_id}{transaction_id}".encode()).hexdigest()
            cursor.execute('''
                INSERT INTO premium_payments (
                    id, vendor_id, tier, amount, payment_date, expires_date,
                    transaction_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                payment_id, vendor_id, tier, payment_amount,
                datetime.datetime.now().isoformat(), expiry_date,
                transaction_id, 'active'
            ))
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'message': f'Successfully upgraded to {tier} tier',
                'expires': expiry_date,
                'payment_id': payment_id
            }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Error processing upgrade: {str(e)}'
            }
    
    def get_vendor_analytics(self, vendor_id: str) -> Dict[str, any]:
        """Get comprehensive analytics for a vendor"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get basic stats
        cursor.execute('''
            SELECT * FROM vendor_stats WHERE vendor_id = ?
        ''', (vendor_id,))
        
        stats = cursor.fetchone()
        if not stats:
            conn.close()
            return {'error': 'Vendor not found'}
        
        # Get review trends (last 6 months)
        six_months_ago = (datetime.datetime.now() - datetime.timedelta(days=180)).isoformat()
        cursor.execute('''
            SELECT DATE(date_created) as review_date, AVG(rating) as avg_rating, COUNT(*) as count
            FROM reviews 
            WHERE vendor_id = ? AND status = 'approved' AND date_created > ?
            GROUP BY DATE(date_created)
            ORDER BY review_date
        ''', (vendor_id, six_months_ago))
        
        review_trends = cursor.fetchall()
        
        # Get competitor comparison (same category)
        cursor.execute('''
            SELECT v.category FROM vendors v WHERE v.id = ?
        ''', (vendor_id,))
        
        category = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT AVG(vs.average_rating) as category_avg_rating,
                   AVG(vs.total_reviews) as category_avg_reviews
            FROM vendor_stats vs
            JOIN vendors v ON vs.vendor_id = v.id
            WHERE v.category = ? AND v.id != ?
        ''', (category, vendor_id))
        
        category_stats = cursor.fetchone()
        
        conn.close()
        
        return {
            'vendor_id': vendor_id,
            'current_score': self.calculate_vendor_score(vendor_id),
            'stats': {
                'total_reviews': stats[1],
                'average_rating': stats[2],
                'rating_distribution': json.loads(stats[3]) if isinstance(stats[3], str) else (stats[3] or {}),
                'recent_reviews_count': stats[4]
            },
            'trends': [
                {
                    'date': trend[0],
                    'average_rating': trend[1],
                    'review_count': trend[2]
                } for trend in review_trends
            ],
            'category_comparison': {
                'category': category,
                'category_avg_rating': category_stats[0] if category_stats else 0,
                'category_avg_reviews': category_stats[1] if category_stats else 0,
                'performance_vs_category': {
                    'rating_difference': stats[2] - (category_stats[0] if category_stats else 0),
                    'review_difference': stats[1] - (category_stats[1] if category_stats else 0)
                }
            },
            'premium_eligibility': self.check_premium_eligibility(vendor_id)
        }

# Example usage and testing functions
def create_sample_data():
    """Create sample data for testing"""
    system = SupplierRankingSystem()
    
    # Sample vendors
    vendors = [
        Vendor(
            id="vendor_001",
            name="Fresh Farm Supplies",
            email="contact@freshfarm.com",
            phone="+91-9876543210",
            location="Gurgaon, Haryana",
            region="North India",
            category="Vegetables",
            services_offered=["Fresh Vegetables", "Organic Produce", "Bulk Supply"],
            website="https://freshfarm.com",
            description="Premium quality fresh vegetables supplier",
            date_joined=datetime.datetime.now().isoformat()
        ),
        Vendor(
            id="vendor_002",
            name="Spice Masters Ltd",
            email="info@spicemasters.com",
            phone="+91-9876543211",
            location="Delhi",
            region="North India",
            category="Spices",
            services_offered=["Spices", "Masalas", "Dry Fruits"],
            website="https://spicemasters.com",
            description="Authentic Indian spices and masalas",
            date_joined=datetime.datetime.now().isoformat()
        )
    ]
    
    # Add vendors
    for vendor in vendors:
        system.add_vendor(vendor)
    
    # Sample reviews
    reviews = [
        Review(
            id="review_001",
            vendor_id="vendor_001",
            customer_id="customer_001",
            rating=4.5,
            title="Excellent Quality",
            comment="Fresh vegetables, timely delivery, great service!",
            date_created=datetime.datetime.now().isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True
        ),
        Review(
            id="review_002",
            vendor_id="vendor_001",
            customer_id="customer_002",
            rating=5.0,
            title="Best Supplier",
            comment="Always consistent quality and competitive prices.",
            date_created=datetime.datetime.now().isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True
        )
    ]
    
    # Add reviews
    for review in reviews:
        system.add_review(review)
    
    return system

if __name__ == "__main__":
    # Create sample data and test the system
    system = create_sample_data()
    
    # Test ranking
    ranked_vendors = system.get_ranked_vendors()
    print("Ranked Vendors:")
    for vendor in ranked_vendors:
        print(f"- {vendor['name']}: Score {vendor['score']:.2f}, Rating {vendor['average_rating']:.1f} ({vendor['total_reviews']} reviews)")
    
    # Test premium eligibility
    eligibility = system.check_premium_eligibility("vendor_001")
    print(f"\nPremium Eligibility: {eligibility}")
    
    # Test analytics
    analytics = system.get_vendor_analytics("vendor_001")
    print(f"\nVendor Analytics: {analytics}")