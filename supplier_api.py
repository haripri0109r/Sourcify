"""
Supplier Ranking API
Flask API endpoints for the supplier ranking and optimization system
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from supplier_ranking_system import SupplierRankingSystem, Vendor, Review, ReviewStatus, PremiumTier
import datetime
import hashlib
import json
from typing import Dict, List

app = Flask(__name__)
CORS(app)

# Initialize the ranking system
ranking_system = SupplierRankingSystem()

# Premium tier pricing (in INR)
PREMIUM_PRICING = {
    'basic': {'monthly': 999, 'quarterly': 2499, 'yearly': 8999},
    'premium': {'monthly': 1999, 'quarterly': 4999, 'yearly': 17999},
    'enterprise': {'monthly': 4999, 'quarterly': 12499, 'yearly': 44999}
}

@app.route('/api/suppliers/search', methods=['GET'])
def search_suppliers():
    """
    Search and get ranked suppliers
    Query parameters: category, region, search, limit, sort_by
    """
    try:
        category = request.args.get('category')
        region = request.args.get('region')
        search_term = request.args.get('search', '').lower()
        limit = int(request.args.get('limit', 50))
        sort_by = request.args.get('sort_by', 'score')  # score, rating, reviews, name
        
        # Get ranked vendors
        vendors = ranking_system.get_ranked_vendors(category=category, region=region, limit=limit)
        
        # Apply search filter if provided
        if search_term:
            vendors = [v for v in vendors if 
                      search_term in v['name'].lower() or 
                      search_term in v['description'].lower() or
                      any(search_term in service.lower() for service in v['services_offered'])]
        
        # Apply additional sorting if requested
        if sort_by == 'rating':
            vendors.sort(key=lambda x: x['average_rating'], reverse=True)
        elif sort_by == 'reviews':
            vendors.sort(key=lambda x: x['total_reviews'], reverse=True)
        elif sort_by == 'name':
            vendors.sort(key=lambda x: x['name'])
        # Default is already sorted by score
        
        # Separate premium and regular vendors for display
        premium_vendors = [v for v in vendors if v['is_premium']]
        regular_vendors = [v for v in vendors if not v['is_premium']]
        
        return jsonify({
            'success': True,
            'data': {
                'premium_vendors': premium_vendors,
                'regular_vendors': regular_vendors,
                'total_count': len(vendors),
                'premium_count': len(premium_vendors),
                'filters_applied': {
                    'category': category,
                    'region': region,
                    'search': search_term,
                    'sort_by': sort_by
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/suppliers/<vendor_id>', methods=['GET'])
def get_supplier_details(vendor_id):
    """Get detailed information about a specific supplier"""
    try:
        # Get vendor analytics which includes comprehensive data
        analytics = ranking_system.get_vendor_analytics(vendor_id)
        
        if 'error' in analytics:
            return jsonify({
                'success': False,
                'error': analytics['error']
            }), 404
        
        # Get recent reviews
        import sqlite3
        conn = sqlite3.connect(ranking_system.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT r.*, v.name as customer_name
            FROM reviews r
            LEFT JOIN vendors v ON r.customer_id = v.id
            WHERE r.vendor_id = ? AND r.status = 'approved'
            ORDER BY r.date_created DESC
            LIMIT 10
        ''', (vendor_id,))
        
        reviews = cursor.fetchall()
        
        # Get vendor basic info
        cursor.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,))
        vendor_data = cursor.fetchone()
        
        conn.close()
        
        if not vendor_data:
            return jsonify({
                'success': False,
                'error': 'Vendor not found'
            }), 404
        
        vendor_info = {
            'id': vendor_data[0],
            'name': vendor_data[1],
            'email': vendor_data[2],
            'phone': vendor_data[3],
            'location': vendor_data[4],
            'region': vendor_data[5],
            'category': vendor_data[6],
            'services_offered': json.loads(vendor_data[7] or '[]'),
            'website': vendor_data[8],
            'description': vendor_data[9],
            'date_joined': vendor_data[10],
            'premium_tier': vendor_data[12],
            'custom_tags': json.loads(vendor_data[15] or '[]')
        }
        
        review_list = []
        for review in reviews:
            review_list.append({
                'id': review[0],
                'customer_name': review[11] or 'Anonymous',
                'rating': review[3],
                'title': review[4],
                'comment': review[5],
                'date_created': review[6],
                'helpful_votes': review[8],
                'verified_purchase': review[9]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'vendor': vendor_info,
                'analytics': analytics,
                'recent_reviews': review_list,
                'premium_badge': ranking_system.get_premium_badge(vendor_data[12]),
                'trust_badges': ranking_system.get_trust_badges(vendor_id)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/suppliers/<vendor_id>/reviews', methods=['GET', 'POST'])
def handle_reviews(vendor_id):
    """Get reviews for a vendor or add a new review"""
    
    if request.method == 'GET':
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            rating_filter = request.args.get('rating')
            
            import sqlite3
            conn = sqlite3.connect(ranking_system.db_path)
            cursor = conn.cursor()
            
            # Build query with filters
            query = '''
                SELECT r.*, v.name as customer_name
                FROM reviews r
                LEFT JOIN vendors v ON r.customer_id = v.id
                WHERE r.vendor_id = ? AND r.status = 'approved'
            '''
            params = [vendor_id]
            
            if rating_filter:
                query += ' AND r.rating = ?'
                params.append(float(rating_filter))
            
            query += ' ORDER BY r.date_created DESC LIMIT ? OFFSET ?'
            params.extend([per_page, (page - 1) * per_page])
            
            cursor.execute(query, params)
            reviews = cursor.fetchall()
            
            # Get total count
            count_query = '''
                SELECT COUNT(*) FROM reviews 
                WHERE vendor_id = ? AND status = 'approved'
            '''
            count_params = [vendor_id]
            
            if rating_filter:
                count_query += ' AND rating = ?'
                count_params.append(float(rating_filter))
            
            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            review_list = []
            for review in reviews:
                review_list.append({
                    'id': review[0],
                    'customer_name': review[11] or 'Anonymous',
                    'rating': review[3],
                    'title': review[4],
                    'comment': review[5],
                    'date_created': review[6],
                    'helpful_votes': review[8],
                    'verified_purchase': review[9]
                })
            
            return jsonify({
                'success': True,
                'data': {
                    'reviews': review_list,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total_count,
                        'pages': (total_count + per_page - 1) // per_page
                    }
                }
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['customer_id', 'rating', 'title', 'comment']
            for field in required_fields:
                if field not in data:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }), 400
            
            # Create review
            review = Review(
                id=hashlib.md5(f"{vendor_id}{data['customer_id']}{datetime.datetime.now()}".encode()).hexdigest(),
                vendor_id=vendor_id,
                customer_id=data['customer_id'],
                rating=float(data['rating']),
                title=data['title'],
                comment=data['comment'],
                date_created=datetime.datetime.now().isoformat(),
                status=ReviewStatus.APPROVED,  # Auto-approve for demo
                verified_purchase=data.get('verified_purchase', False),
                product_id=data.get('product_id')
            )
            
            success = ranking_system.add_review(review)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Review added successfully',
                    'review_id': review.id
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Failed to add review'
                }), 500
                
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

@app.route('/api/suppliers/<vendor_id>/premium-eligibility', methods=['GET'])
def check_premium_eligibility(vendor_id):
    """Check if vendor is eligible for premium optimization"""
    try:
        eligibility = ranking_system.check_premium_eligibility(vendor_id)
        
        # Add pricing information if eligible
        if eligibility['eligible']:
            eligibility['pricing'] = PREMIUM_PRICING
            eligibility['benefits'] = {
                'basic': [
                    'Promoted listing badge',
                    '10% ranking boost',
                    'Priority in search results',
                    'Basic analytics dashboard'
                ],
                'premium': [
                    'Premium Partner badge',
                    '20% ranking boost',
                    'Featured in top section',
                    'Advanced analytics',
                    'Customer inquiry insights',
                    'Priority customer support'
                ],
                'enterprise': [
                    'Enterprise Partner badge',
                    '30% ranking boost',
                    'Guaranteed top 3 placement',
                    'Comprehensive analytics suite',
                    'Dedicated account manager',
                    'Custom branding options',
                    'API access for integration'
                ]
            }
        
        return jsonify({
            'success': True,
            'data': eligibility
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/suppliers/<vendor_id>/upgrade-premium', methods=['POST'])
def upgrade_to_premium(vendor_id):
    """Upgrade vendor to premium status"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['tier', 'duration', 'payment_method', 'transaction_id']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        tier = data['tier']
        duration = data['duration']  # 'monthly', 'quarterly', 'yearly'
        
        # Validate tier and duration
        if tier not in PREMIUM_PRICING:
            return jsonify({
                'success': False,
                'error': 'Invalid premium tier'
            }), 400
        
        if duration not in PREMIUM_PRICING[tier]:
            return jsonify({
                'success': False,
                'error': 'Invalid duration'
            }), 400
        
        # Calculate amount and duration in months
        amount = PREMIUM_PRICING[tier][duration]
        duration_months = {'monthly': 1, 'quarterly': 3, 'yearly': 12}[duration]
        
        # Process upgrade
        result = ranking_system.upgrade_to_premium(
            vendor_id=vendor_id,
            tier=tier,
            duration_months=duration_months,
            payment_amount=amount,
            transaction_id=data['transaction_id']
        )
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            })
        else:
            return jsonify({
                'success': False,
                'error': result['message']
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/suppliers/<vendor_id>/analytics', methods=['GET'])
def get_vendor_analytics(vendor_id):
    """Get comprehensive analytics for a vendor"""
    try:
        analytics = ranking_system.get_vendor_analytics(vendor_id)
        
        if 'error' in analytics:
            return jsonify({
                'success': False,
                'error': analytics['error']
            }), 404
        
        return jsonify({
            'success': True,
            'data': analytics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        import sqlite3
        conn = sqlite3.connect(ranking_system.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT category FROM vendors WHERE is_active = 1')
        categories = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': categories
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/regions', methods=['GET'])
def get_regions():
    """Get all available regions"""
    try:
        import sqlite3
        conn = sqlite3.connect(ranking_system.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT region FROM vendors WHERE is_active = 1')
        regions = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': regions
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/admin/vendors', methods=['POST'])
def add_vendor():
    """Add a new vendor (admin endpoint)"""
    try:
        data = request.get_json()
        
        # Create vendor object
        vendor = Vendor(
            id=data.get('id', hashlib.md5(data['email'].encode()).hexdigest()),
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            location=data.get('location', ''),
            region=data.get('region', ''),
            category=data.get('category', ''),
            services_offered=data.get('services_offered', []),
            website=data.get('website'),
            description=data.get('description', ''),
            date_joined=datetime.datetime.now().isoformat()
        )
        
        success = ranking_system.add_vendor(vendor)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Vendor added successfully',
                'vendor_id': vendor.id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to add vendor'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Frontend integration endpoints
@app.route('/supplier-search')
def supplier_search_page():
    """Render supplier search page for buyers"""
    return render_template('supplier_search.html')

@app.route('/vendor-optimization')
def vendor_optimization_page():
    """Render vendor optimization page"""
    return render_template('vendor_optimization.html')

if __name__ == '__main__':
    # Create sample data for testing
    from supplier_ranking_system import create_sample_data
    create_sample_data()
    
    app.run(debug=True, host='0.0.0.0', port=5000)