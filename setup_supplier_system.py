#!/usr/bin/env python3
"""
Setup script for the Supplier Ranking System
This script initializes the database with sample data for testing
"""

import sys
import os
import datetime
import hashlib

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from supplier_ranking_system import SupplierRankingSystem, Vendor, Review, ReviewStatus, PremiumTier

def create_sample_vendors():
    """Create sample vendors with different categories and ratings"""
    vendors = [
        # Vegetables Suppliers
        Vendor(
            id="vendor_001",
            name="Green Valley Farms",
            email="contact@greenvalley.com",
            phone="+91-9876543210",
            location="Gurgaon, Haryana",
            region="North India",
            category="Vegetables",
            services_offered=["Fresh Vegetables", "Organic Produce", "Bulk Supply", "Daily Delivery"],
            website="https://greenvalley.com",
            description="Premium quality fresh vegetables supplier with 15+ years of experience. We specialize in organic farming and provide farm-to-table freshness.",
            date_joined=datetime.datetime.now().isoformat(),
            premium_tier=PremiumTier.PREMIUM,
            premium_expires=(datetime.datetime.now() + datetime.timedelta(days=90)).isoformat(),
            custom_tags=["Organic", "Farm Fresh", "Certified"]
        ),
        
        Vendor(
            id="vendor_002",
            name="Farm Fresh Vegetables",
            email="info@farmfresh.com",
            phone="+91-9876543211",
            location="Delhi",
            region="North India",
            category="Vegetables",
            services_offered=["Fresh Vegetables", "Seasonal Produce", "Wholesale"],
            website="https://farmfresh.com",
            description="Quality vegetables at competitive prices. Direct from farms to your business.",
            date_joined=datetime.datetime.now().isoformat(),
            custom_tags=["Wholesale", "Competitive Prices"]
        ),
        
        # Spices Suppliers
        Vendor(
            id="vendor_003",
            name="Spice Masters Ltd",
            email="info@spicemasters.com",
            phone="+91-9876543212",
            location="Delhi",
            region="North India",
            category="Spices",
            services_offered=["Spices", "Masalas", "Dry Fruits", "Bulk Orders"],
            website="https://spicemasters.com",
            description="Authentic Indian spices and masalas. Premium quality with traditional processing methods.",
            date_joined=datetime.datetime.now().isoformat(),
            premium_tier=PremiumTier.BASIC,
            premium_expires=(datetime.datetime.now() + datetime.timedelta(days=30)).isoformat(),
            custom_tags=["Authentic", "Traditional"]
        ),
        
        Vendor(
            id="vendor_004",
            name="Royal Spices Co.",
            email="contact@royalspices.com",
            phone="+91-9876543213",
            location="Mumbai, Maharashtra",
            region="West India",
            category="Spices",
            services_offered=["Premium Spices", "Custom Blends", "Export Quality"],
            website="https://royalspices.com",
            description="Export quality spices and custom spice blends for professional kitchens.",
            date_joined=datetime.datetime.now().isoformat(),
            custom_tags=["Export Quality", "Custom Blends"]
        ),
        
        # Grains Suppliers
        Vendor(
            id="vendor_005",
            name="Golden Grains Co.",
            email="sales@goldengrains.com",
            phone="+91-9876543214",
            location="Punjab",
            region="North India",
            category="Grains",
            services_offered=["Basmati Rice", "Wheat", "Pulses", "Bulk Supply"],
            website="https://goldengrains.com",
            description="Premium quality grains directly from Punjab farms. Specializing in Basmati rice and wheat.",
            date_joined=datetime.datetime.now().isoformat(),
            premium_tier=PremiumTier.ENTERPRISE,
            premium_expires=(datetime.datetime.now() + datetime.timedelta(days=365)).isoformat(),
            custom_tags=["Premium Quality", "Direct from Farms"]
        ),
        
        # Dairy Suppliers
        Vendor(
            id="vendor_006",
            name="Dairy Fresh",
            email="orders@dairyfresh.com",
            phone="+91-9876543215",
            location="Gurgaon, Haryana",
            region="North India",
            category="Dairy",
            services_offered=["Fresh Milk", "Paneer", "Curd", "Butter"],
            description="Fresh dairy products with daily delivery. Sourced from healthy, well-maintained cattle.",
            date_joined=datetime.datetime.now().isoformat(),
            custom_tags=["Daily Delivery", "Fresh"]
        ),
        
        # Meat Suppliers
        Vendor(
            id="vendor_007",
            name="Fresh Meat Co.",
            email="info@freshmeat.com",
            phone="+91-9876543216",
            location="Delhi",
            region="North India",
            category="Meat",
            services_offered=["Chicken", "Mutton", "Fish", "Processed Meat"],
            description="Fresh, hygienic meat products with proper cold chain maintenance.",
            date_joined=datetime.datetime.now().isoformat(),
            custom_tags=["Hygienic", "Cold Chain"]
        )
    ]
    
    return vendors

def create_sample_reviews():
    """Create sample reviews for the vendors"""
    reviews = [
        # Reviews for Green Valley Farms (vendor_001)
        Review(
            id="review_001",
            vendor_id="vendor_001",
            customer_id="customer_001",
            rating=4.8,
            title="Excellent Quality Vegetables",
            comment="Outstanding quality vegetables! Always fresh and delivered on time. The organic produce is worth the premium price. Highly recommended for street food vendors who care about quality.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=5)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=12
        ),
        
        Review(
            id="review_002",
            vendor_id="vendor_001",
            customer_id="customer_002",
            rating=5.0,
            title="Best Supplier in Delhi NCR",
            comment="Been ordering from Green Valley for 2 years now. Consistent quality, reliable delivery, and excellent customer service. They understand the needs of street food vendors.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=12)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=8
        ),
        
        Review(
            id="review_003",
            vendor_id="vendor_001",
            customer_id="customer_003",
            rating=4.5,
            title="Great for Bulk Orders",
            comment="Perfect for bulk orders. Good pricing for large quantities and they maintain quality even for big orders. Delivery is always on schedule.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=20)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=5
        ),
        
        # Reviews for Spice Masters (vendor_003)
        Review(
            id="review_004",
            vendor_id="vendor_003",
            customer_id="customer_004",
            rating=4.3,
            title="Authentic Spice Quality",
            comment="Good quality spices with authentic taste. Pricing is competitive and they have a wide variety. Sometimes delivery can be delayed during peak season.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=8)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=6
        ),
        
        Review(
            id="review_005",
            vendor_id="vendor_003",
            customer_id="customer_005",
            rating=4.7,
            title="Perfect for Street Food",
            comment="Their masala blends are perfect for street food. Customers always compliment the taste. The red chili powder has the right heat and color.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=15)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=9
        ),
        
        # Reviews for Golden Grains (vendor_005)
        Review(
            id="review_006",
            vendor_id="vendor_005",
            customer_id="customer_006",
            rating=4.9,
            title="Premium Basmati Rice",
            comment="The best Basmati rice I've found for my biryani stall. Long grains, perfect aroma, and consistent quality. Worth every rupee!",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=3)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=15
        ),
        
        Review(
            id="review_007",
            vendor_id="vendor_005",
            customer_id="customer_007",
            rating=4.8,
            title="Reliable Grain Supplier",
            comment="Very reliable for bulk grain orders. Quality is consistent and they have good storage facilities. Prices are reasonable for the quality provided.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=18)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=7
        ),
        
        # Reviews for Farm Fresh Vegetables (vendor_002)
        Review(
            id="review_008",
            vendor_id="vendor_002",
            customer_id="customer_008",
            rating=4.2,
            title="Good Value for Money",
            comment="Decent quality vegetables at competitive prices. Good for budget-conscious vendors. Quality is acceptable though not premium.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=10)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=4
        ),
        
        # Reviews for Dairy Fresh (vendor_006)
        Review(
            id="review_009",
            vendor_id="vendor_006",
            customer_id="customer_009",
            rating=4.6,
            title="Fresh Daily Delivery",
            comment="Excellent for daily milk requirements. Always fresh and delivered early morning. Their paneer quality is also very good for making dishes.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=7)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=11
        ),
        
        # Reviews for Fresh Meat Co. (vendor_007)
        Review(
            id="review_010",
            vendor_id="vendor_007",
            customer_id="customer_010",
            rating=4.4,
            title="Hygienic Meat Supply",
            comment="Good quality meat with proper hygiene standards. Cold chain is maintained well. Chicken is always fresh and properly cleaned.",
            date_created=(datetime.datetime.now() - datetime.timedelta(days=14)).isoformat(),
            status=ReviewStatus.APPROVED,
            verified_purchase=True,
            helpful_votes=8
        )
    ]
    
    return reviews

def setup_supplier_system():
    """Initialize the supplier ranking system with sample data"""
    print("Setting up Supplier Ranking System...")
    
    # Initialize the system
    system = SupplierRankingSystem()
    print("Database initialized")
    
    # Add sample vendors
    print("\nAdding sample vendors...")
    vendors = create_sample_vendors()
    
    for vendor in vendors:
        success = system.add_vendor(vendor)
        if success:
            print(f"Added vendor: {vendor.name}")
        else:
            print(f"Failed to add vendor: {vendor.name}")
    
    # Add sample reviews
    print("\nAdding sample reviews...")
    reviews = create_sample_reviews()
    
    for review in reviews:
        success = system.add_review(review)
        if success:
            print(f"Added review for vendor: {review.vendor_id}")
        else:
            print(f"Failed to add review for vendor: {review.vendor_id}")
    
    # Display system statistics
    print("\nSystem Statistics:")
    
    # Get ranked vendors
    try:
        ranked_vendors = system.get_ranked_vendors(limit=10)
    except Exception as e:
        print(f"Error getting ranked vendors: {e}")
        ranked_vendors = []
    
    print(f"Total Vendors: {len(vendors)}")
    print(f"Total Reviews: {len(reviews)}")
    print(f"Premium Vendors: {len([v for v in vendors if v.premium_tier != PremiumTier.NONE])}")
    
    print("\nTop Ranked Vendors:")
    for i, vendor in enumerate(ranked_vendors[:5], 1):
        premium_status = "PREMIUM" if vendor['is_premium'] else "REGULAR"
        print(f"{i}. [{premium_status}] {vendor['name']}: {vendor['score']:.2f} score, {vendor['average_rating']:.1f} stars ({vendor['total_reviews']} reviews)")
    
    # Test premium eligibility
    print("\nPremium Eligibility Check:")
    for vendor in vendors[:3]:
        eligibility = system.check_premium_eligibility(vendor.id)
        status = "ELIGIBLE" if eligibility['eligible'] else "NOT ELIGIBLE"
        print(f"{vendor.name}: {status}")
        if not eligibility['eligible']:
            print(f"   Reason: {eligibility['reason']}")
    
    print("\nSetup completed successfully!")
    print("\nTo start the API server, run:")
    print("   python supplier_api.py")
    print("\nThen open your street vendor dashboard and click 'View Details' on any product!")
    
    return system

if __name__ == "__main__":
    try:
        system = setup_supplier_system()
        
        print("\n" + "="*60)
        print("INTEGRATION INSTRUCTIONS")
        print("="*60)
        print("1. Start the API server:")
        print("   python supplier_api.py")
        print("\n2. Open street-vendor-dashboard.html in your browser")
        print("\n3. Click 'View Details' on any product to see suppliers")
        print("\n4. The system will show:")
        print("   - Premium suppliers at the top")
        print("   - Detailed supplier information")
        print("   - Reviews and ratings")
        print("   - Performance analytics")
        print("\n5. For vendor optimization, visit:")
        print("   http://localhost:5000/vendor-optimization")
        print("\n6. For supplier search, visit:")
        print("   http://localhost:5000/supplier-search")
        print("="*60)
        
    except Exception as e:
        print(f"Error during setup: {e}")
        print("Please check the error and try again.")
        sys.exit(1)