#!/usr/bin/env python3
"""
Integration Test Script for Supplier Ranking System
This script tests all components of the integration
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def test_file_exists(file_path, description):
    """Test if a file exists"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - NOT FOUND")
        return False

def test_api_endpoint(url, description):
    """Test if an API endpoint is accessible"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {description}: {url}")
            return True
        else:
            print(f"❌ {description}: {url} - Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ {description}: {url} - Error: {e}")
        return False

def main():
    print("🧪 Testing Supplier Ranking System Integration")
    print("=" * 60)
    
    base_path = "e:\\Programmingfiles\\web_develop"
    
    # Test core files
    print("\n📁 Testing Core Files:")
    core_files = [
        ("supplier_ranking_system.py", "Core ranking system"),
        ("supplier_api.py", "Flask API server"),
        ("setup_supplier_system.py", "Database setup script"),
        ("supplier-integration.js", "Frontend integration"),
    ]
    
    all_core_files_exist = True
    for file_name, description in core_files:
        file_path = os.path.join(base_path, file_name)
        if not test_file_exists(file_path, description):
            all_core_files_exist = False
    
    # Test template files
    print("\n📄 Testing Template Files:")
    template_files = [
        ("templates/supplier_search.html", "Supplier search interface"),
        ("templates/vendor_optimization.html", "Vendor optimization dashboard"),
    ]
    
    all_template_files_exist = True
    for file_name, description in template_files:
        file_path = os.path.join(base_path, file_name)
        if not test_file_exists(file_path, description):
            all_template_files_exist = False
    
    # Test modified files
    print("\n🔧 Testing Modified Files:")
    modified_files = [
        ("street-vendor-dashboard.html", "Main dashboard with modals"),
        ("scripts/street-vendor.js", "Enhanced JavaScript"),
        ("styles/street-vendor.css", "Enhanced styles"),
    ]
    
    all_modified_files_exist = True
    for file_name, description in modified_files:
        file_path = os.path.join(base_path, file_name)
        if not test_file_exists(file_path, description):
            all_modified_files_exist = False
    
    # Test if database can be initialized
    print("\n🗄️ Testing Database Initialization:")
    try:
        setup_script = os.path.join(base_path, "setup_supplier_system.py")
        if os.path.exists(setup_script):
            # Change to the correct directory
            os.chdir(base_path)
            result = subprocess.run([sys.executable, "setup_supplier_system.py"], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print("✅ Database initialization successful")
                database_ok = True
            else:
                print(f"❌ Database initialization failed: {result.stderr}")
                database_ok = False
        else:
            print("❌ Setup script not found")
            database_ok = False
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        database_ok = False
    
    # Test if API server can start (briefly)
    print("\n🌐 Testing API Server:")
    try:
        api_script = os.path.join(base_path, "supplier_api.py")
        if os.path.exists(api_script):
            print("⏳ Starting API server for testing...")
            # Start the server in background
            process = subprocess.Popen([sys.executable, "supplier_api.py"], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE)
            
            # Wait a moment for server to start
            time.sleep(3)
            
            # Test API endpoints
            api_tests = [
                ("http://localhost:5000/api/suppliers/search?category=vegetables", "Supplier search API"),
                ("http://localhost:5000/api/suppliers/vendor_001", "Supplier details API"),
            ]
            
            api_ok = True
            for url, description in api_tests:
                if not test_api_endpoint(url, description):
                    api_ok = False
            
            # Stop the server
            process.terminate()
            process.wait(timeout=5)
            
            if api_ok:
                print("✅ API server tests passed")
            else:
                print("❌ Some API tests failed")
        else:
            print("❌ API script not found")
            api_ok = False
    except Exception as e:
        print(f"❌ API server test error: {e}")
        api_ok = False
    
    # Test HTML file structure
    print("\n🌐 Testing HTML Integration:")
    html_file = os.path.join(base_path, "street-vendor-dashboard.html")
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        # Check for required modal elements
        required_elements = [
            'id="productDetailsModal"',
            'id="supplierDetailsModal"',
            'supplier-integration.js',
            'id="productModalContent"',
            'id="supplierModalContent"'
        ]
        
        html_ok = True
        for element in required_elements:
            if element in html_content:
                print(f"✅ HTML contains: {element}")
            else:
                print(f"❌ HTML missing: {element}")
                html_ok = False
    else:
        print("❌ HTML file not found")
        html_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    
    total_tests = 5
    passed_tests = 0
    
    if all_core_files_exist:
        print("✅ Core files: PASS")
        passed_tests += 1
    else:
        print("❌ Core files: FAIL")
    
    if all_template_files_exist:
        print("✅ Template files: PASS")
        passed_tests += 1
    else:
        print("❌ Template files: FAIL")
    
    if all_modified_files_exist:
        print("✅ Modified files: PASS")
        passed_tests += 1
    else:
        print("❌ Modified files: FAIL")
    
    if database_ok:
        print("✅ Database setup: PASS")
        passed_tests += 1
    else:
        print("❌ Database setup: FAIL")
    
    if html_ok:
        print("✅ HTML integration: PASS")
        passed_tests += 1
    else:
        print("❌ HTML integration: FAIL")
    
    print(f"\n🎯 Overall Score: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED! Integration is ready to use!")
        print("\n🚀 To start using the system:")
        print("1. Run: python supplier_api.py")
        print("2. Open: street-vendor-dashboard.html")
        print("3. Click 'View Details' on any product")
    else:
        print(f"\n⚠️  {total_tests - passed_tests} tests failed. Please check the issues above.")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Test failed with error: {e}")
        sys.exit(1)