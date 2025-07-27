// Multilingual Support System
class MultilingualManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
        this.translations = {};
        this.init();
    }

    init() {
        this.loadTranslations();
        this.createLanguageSelector();
        this.applyTranslations();
    }

    loadTranslations() {
        this.translations = {
            en: {
                // Login Page
                'app_title': 'Sourcify',
                'app_subtitle': 'Connecting Street Food Vendors, Raw Material Suppliers & Transport Services',
                'street_vendor': 'Street Food Vendor',
                'raw_material': 'Raw Material Vendor',
                'transport_service': 'Transport Service',
                'username_email': 'Username or Email',
                'password': 'Password',
                'login_as_vendor': 'Login as Vendor',
                'login_as_supplier': 'Login as Supplier',
                'login_as_transport': 'Login as Transport',
                'forgot_password': 'Forgot Password?',
                'no_account': "Don't have an account?",
                'register': 'Register',
                'logging_in': 'Logging in...',
                
                // Dashboard Common
                'dashboard': 'Dashboard',
                'profile': 'Profile',
                'settings': 'Settings',
                'logout': 'Logout',
                'welcome': 'Welcome',
                'notifications': 'Notifications',
                'search': 'Search',
                'filter': 'Filter',
                'save': 'Save',
                'cancel': 'Cancel',
                'edit': 'Edit',
                'delete': 'Delete',
                'add': 'Add',
                'update': 'Update',
                'submit': 'Submit',
                'close': 'Close',
                
                // Street Vendor Dashboard
                'my_orders': 'My Orders',
                'inventory': 'Inventory',
                'suppliers': 'Suppliers',
                'transport': 'Transport',
                'analytics': 'Analytics',
                'order_history': 'Order History',
                'pending_orders': 'Pending Orders',
                'completed_orders': 'Completed Orders',
                'total_sales': 'Total Sales',
                'today_sales': "Today's Sales",
                'monthly_sales': 'Monthly Sales',
                
                // Raw Material Dashboard
                'my_products': 'My Products',
                'orders_received': 'Orders Received',
                'inventory_management': 'Inventory Management',
                'customer_management': 'Customer Management',
                'delivery_tracking': 'Delivery Tracking',
                'product_catalog': 'Product Catalog',
                'stock_levels': 'Stock Levels',
                'low_stock_alerts': 'Low Stock Alerts',
                
                // Transport Dashboard
                'available_routes': 'Available Routes',
                'my_vehicles': 'My Vehicles',
                'delivery_requests': 'Delivery Requests',
                'route_optimization': 'Route Optimization',
                'vehicle_tracking': 'Vehicle Tracking',
                'fuel_management': 'Fuel Management',
                'driver_management': 'Driver Management',
                
                // Common Actions
                'view_details': 'View Details',
                'accept': 'Accept',
                'reject': 'Reject',
                'pending': 'Pending',
                'completed': 'Completed',
                'in_progress': 'In Progress',
                'cancelled': 'Cancelled',
                'active': 'Active',
                'inactive': 'Inactive',
                
                // Additional Dashboard Elements
                'select_service_range': 'Select Your Service Range',
                'search_location': 'Search Location',
                'enter_location': 'Enter your location',
                'service_range': 'Service Range (km)',
                'save_range': 'Save Range',
                'raw_materials': 'Raw Materials',
                'filters': 'Filters',
                'cart': 'Cart',
                'checkout': 'Checkout',
                'wholesale_collaboration': 'Wholesale Collaboration',
                'order_tracking': 'Order Tracking',
                'view_details': 'View Details',
                'add_to_cart': 'Add to Cart',
                'your_cart_is_empty': 'Your cart is empty',
                'total': 'Total',
                'find_collaboration': 'Find Collaboration',
                'no_active_orders': 'No active orders',
                'all_categories': 'All Categories',
                'vegetables': 'Vegetables',
                'spices': 'Spices',
                'grains': 'Grains',
                'dairy': 'Dairy',
                'meat': 'Meat',
                'price_range': 'Price Range',
                'all_locations': 'All Locations',
                'within_range': 'Within Range',
                'same_city': 'Same City',
                'search_products': 'Search products...',
                
                // Geolocation
                'get_current_location': 'Get Current Location',
                'location_permission_denied': 'Location access denied by user',
                'location_unavailable': 'Location information is unavailable',
                'location_timeout': 'Location request timed out',
                'location_unknown_error': 'An unknown error occurred',
                'current_location': 'Current Location',
                'location_accuracy': 'Accuracy',
                'use_current_location': 'Use Current Location'
            },
            
            hi: {
                // Login Page
                'app_title': 'सोर्सिफाई',
                'app_subtitle': 'स्ट्रीट फूड विक्रेताओं, कच्चे माल आपूर्तिकर्ताओं और परिवहन सेवाओं को जोड़ना',
                'street_vendor': 'स्ट्रीट फूड विक्रेता',
                'raw_material': 'कच्चा माल विक्रेता',
                'transport_service': 'परिवहन सेवा',
                'username_email': 'उपयोगकर्ता नाम या ईमेल',
                'password': 'पासवर्ड',
                'login_as_vendor': 'विक्रेता के रूप में लॉगिन',
                'login_as_supplier': 'आपूर्तिकर्ता के रूप में लॉगिन',
                'login_as_transport': 'परिवहन के रूप में लॉगिन',
                'forgot_password': 'पासवर्ड भूल गए?',
                'no_account': 'खाता नहीं है?',
                'register': 'पंजीकरण',
                'logging_in': 'लॉग इन हो रहा है...',
                
                // Dashboard Common
                'dashboard': 'डैशबोर्ड',
                'profile': 'प्रोफाइल',
                'settings': 'सेटिंग्स',
                'logout': 'लॉगआउट',
                'welcome': 'स्वागत',
                'notifications': 'सूचनाएं',
                'search': 'खोजें',
                'filter': 'फिल्टर',
                'save': 'सेव करें',
                'cancel': 'रद्द करें',
                'edit': 'संपादित करें',
                'delete': 'हटाएं',
                'add': 'जोड़ें',
                'update': 'अपडेट करें',
                'submit': 'जमा करें',
                'close': 'बंद करें',
                
                // Street Vendor Dashboard
                'my_orders': 'मेरे ऑर्डर',
                'inventory': 'इन्वेंटरी',
                'suppliers': 'आपूर्तिकर्ता',
                'transport': 'परिवहन',
                'analytics': 'विश्लेषण',
                'order_history': 'ऑर्डर इतिहास',
                'pending_orders': 'लंबित ऑर्डर',
                'completed_orders': 'पूर्ण ऑर्डर',
                'total_sales': 'कुल बिक्री',
                'today_sales': 'आज की बिक्री',
                'monthly_sales': 'मासिक बिक्री',
                
                // Raw Material Dashboard
                'my_products': 'मेरे उत्पाद',
                'orders_received': 'प्राप्त ऑर्डर',
                'inventory_management': 'इन्वेंटरी प्रबंधन',
                'customer_management': 'ग्राहक प्रबंधन',
                'delivery_tracking': 'डिलीवरी ट्रैकिंग',
                'product_catalog': 'उत्पाद कैटलॉग',
                'stock_levels': 'स्टॉक स्तर',
                'low_stock_alerts': 'कम स्टॉक अलर्ट',
                
                // Transport Dashboard
                'available_routes': 'उपलब्ध मार्ग',
                'my_vehicles': 'मेरे वाहन',
                'delivery_requests': 'डिलीवरी अनुरोध',
                'route_optimization': 'मार्ग अनुकूलन',
                'vehicle_tracking': 'वाहन ट्रैकिंग',
                'fuel_management': 'ईंधन प्रबंधन',
                'driver_management': 'ड्राइवर प्रबंधन',
                
                // Common Actions
                'view_details': 'विवरण देखें',
                'accept': 'स्वीकार करें',
                'reject': 'अस्वीकार करें',
                'pending': 'लंबित',
                'completed': 'पूर्ण',
                'in_progress': 'प्रगति में',
                'cancelled': 'रद्द',
                'active': 'सक्रिय',
                'inactive': 'निष्क्रिय',
                
                // Additional Dashboard Elements
                'select_service_range': 'अपनी सेवा सीमा चुनें',
                'search_location': 'स्थान खोजें',
                'enter_location': 'अपना स्थान दर्ज करें',
                'service_range': 'सेवा सीमा (किमी)',
                'save_range': 'सीमा सेव करें',
                'raw_materials': 'कच्चा माल',
                'filters': 'फिल्टर',
                'cart': 'कार्ट',
                'checkout': 'चेकआउट',
                'wholesale_collaboration': 'थोक सहयोग',
                'order_tracking': 'ऑर्डर ट्रैकिंग',
                'view_details': 'विवरण देखें',
                'add_to_cart': 'कार्ट में जोड़ें',
                'your_cart_is_empty': 'आपका कार्ट खाली है',
                'total': 'कुल',
                'find_collaboration': 'सहयोग खोजें',
                'no_active_orders': 'कोई सक्रिय ऑर्डर नहीं',
                'all_categories': 'सभी श्रेणियां',
                'vegetables': 'सब्जियां',
                'spices': 'मसाले',
                'grains': 'अनाज',
                'dairy': 'डेयरी',
                'meat': 'मांस',
                'price_range': 'मूल्य सीमा',
                'all_locations': 'सभी स्थान',
                'within_range': 'सीमा के भीतर',
                'same_city': 'समान शहर',
                'search_products': 'उत्पाद खोजें...',
                
                // Geolocation
                'get_current_location': 'वर्तमान स्थान प्राप्त करें',
                'location_permission_denied': 'उपयोगकर्ता द्वारा स्थान पहुंच से इनकार',
                'location_unavailable': 'स्थान की जानकारी उपलब्ध नहीं है',
                'location_timeout': 'स्थान अनुरोध समय समाप्त',
                'location_unknown_error': 'एक अज्ञात त्रुटि हुई',
                'current_location': 'वर्तमान स्थान',
                'location_accuracy': 'सटीकता',
                'use_current_location': 'वर्तमान स्थान का उपयोग करें'
            },
            
            ta: {
                // Login Page
                'app_title': 'சோர்சிஃபை',
                'app_subtitle': 'தெரு உணவு விற்பனையாளர்கள், மூலப்பொருள் சப்ளையர்கள் மற்றும் போக்குவரத்து சேவைகளை இணைக்கிறது',
                'street_vendor': 'தெரு உணவு விற்பனையாளர்',
                'raw_material': 'மூலப்பொருள் விற்பனையாளர்',
                'transport_service': 'போக்குவரத்து சேவை',
                'username_email': 'பயனர் பெயர் அல்லது மின்னஞ்சல்',
                'password': 'கடவுச்சொல்',
                'login_as_vendor': 'விற்பனையாளராக உள்நுழைக',
                'login_as_supplier': 'சப்ளையராக உள்நுழைக',
                'login_as_transport': 'போக்குவரத்தாக உள்நுழைக',
                'forgot_password': 'கடவுச்சொல் மறந்துவிட்டதா?',
                'no_account': 'கணக்கு இல்லையா?',
                'register': 'பதிவு செய்க',
                'logging_in': 'உள்நுழைகிறது...',
                
                // Dashboard Common
                'dashboard': 'டாஷ்போர்டு',
                'profile': 'சுயவிவரம்',
                'settings': 'அமைப்புகள்',
                'logout': 'வெளியேறு',
                'welcome': 'வரவேற்கிறோம்',
                'notifications': 'அறிவிப்புகள்',
                'search': 'தேடு',
                'filter': 'வடிகட்டி',
                'save': 'சேமி',
                'cancel': 'ரத்து செய்',
                'edit': 'திருத்து',
                'delete': 'நீக்கு',
                'add': 'சேர்',
                'update': 'புதுப்பி',
                'submit': 'சமர்ப்பி',
                'close': 'மூடு',
                
                // Street Vendor Dashboard
                'my_orders': 'என் ஆர்டர்கள்',
                'inventory': 'சரக்கு',
                'suppliers': 'சப்ளையர்கள்',
                'transport': 'போக்குவரத்து',
                'analytics': 'பகுப்பாய்வு',
                'order_history': 'ஆர்டர் வரலாறு',
                'pending_orders': 'நிலுவையில் உள்ள ஆர்டர்கள்',
                'completed_orders': 'முடிக்கப்பட்ட ஆர்டர்கள்',
                'total_sales': 'மொத்த விற்பனை',
                'today_sales': 'இன்றைய விற்பனை',
                'monthly_sales': 'மாதாந்திர விற்பனை',
                
                // Raw Material Dashboard
                'my_products': 'என் தயாரிப்புகள்',
                'orders_received': 'பெறப்பட்ட ஆர்டர்கள்',
                'inventory_management': 'சரக்கு மேலாண்மை',
                'customer_management': 'வாடிக்கையாளர் மேலாண்மை',
                'delivery_tracking': 'டெலிவரி கண்காணிப்பு',
                'product_catalog': 'தயாரிப்பு பட்டியல்',
                'stock_levels': 'ஸ்டாக் நிலைகள்',
                'low_stock_alerts': 'குறைந்த ஸ்டாக் எச்சரிக்கைகள்',
                
                // Transport Dashboard
                'available_routes': 'கிடைக்கும் வழிகள்',
                'my_vehicles': 'என் வாகனங்கள்',
                'delivery_requests': 'டெலிவரி கோரிக்கைகள்',
                'route_optimization': 'வழி மேம்படுத்தல்',
                'vehicle_tracking': 'வாகன கண்காணிப்பு',
                'fuel_management': 'எரிபொருள் மேலாண்மை',
                'driver_management': 'ஓட்டுநர் மேலாண்மை',
                
                // Common Actions
                'view_details': 'விவரங்களைப் பார்க்க',
                'accept': 'ஏற்றுக்கொள்',
                'reject': 'நிராகரி',
                'pending': 'நிலுவையில்',
                'completed': 'முடிக்கப்பட்டது',
                'in_progress': 'முன்னேற்றத்தில்',
                'cancelled': 'ரத்து செய்யப்பட்டது',
                'active': 'செயலில்',
                'inactive': 'செயலற்ற',
                
                // Additional Dashboard Elements
                'select_service_range': 'உங்கள் சேவை வரம்பைத் தேர்ந்தெடுக்கவும்',
                'search_location': 'இடத்தைத் தேடுங்கள்',
                'enter_location': 'உங்கள் இடத்தை உள்ளிடவும்',
                'service_range': 'சேவை வரம்பு (கிமீ)',
                'save_range': 'வரம்பைச் சேமிக்கவும்',
                'raw_materials': 'மூலப்பொருட்கள்',
                'filters': 'வடிகட்டிகள்',
                'cart': 'கார்ட்',
                'checkout': 'செக்அவுட்',
                'wholesale_collaboration': 'மொத்த விற்பனை ஒத்துழைப்பு',
                'order_tracking': 'ஆர்டர் கண்காணிப்பு',
                'view_details': 'விவரங்களைப் பார்க்கவும்',
                'add_to_cart': 'கார்ட்டில் சேர்க்கவும்',
                'your_cart_is_empty': 'உங்கள் கார்ட் காலியாக உள்ளது',
                'total': 'மொத்தம்',
                'find_collaboration': 'ஒத்துழைப்பைக் கண்டறியவும்',
                'no_active_orders': 'செயலில் உள்ள ஆர்டர்கள் இல்லை',
                'all_categories': 'அனைத்து வகைகள்',
                'vegetables': 'காய்கறிகள்',
                'spices': 'மசாலாப் பொருட்கள்',
                'grains': 'தானியங்கள்',
                'dairy': 'பால் பொருட்கள்',
                'meat': 'இறைச்சி',
                'price_range': 'விலை வரம்பு',
                'all_locations': 'அனைத்து இடங்கள்',
                'within_range': 'வரம்பிற்குள்',
                'same_city': 'அதே நகரம்',
                'search_products': 'தயாரிப்புகளைத் தேடுங்கள்...',
                
                // Geolocation
                'get_current_location': 'தற்போதைய இடத்தைப் பெறுங்கள்',
                'location_permission_denied': 'பயனர் இடம் அணுகலை மறுத்தார்',
                'location_unavailable': 'இட தகவல் கிடைக்கவில்லை',
                'location_timeout': 'இட கோரிக்கை நேரம் முடிந்தது',
                'location_unknown_error': 'அறியப்படாத பிழை ஏற்பட்டது',
                'current_location': 'தற்போதைய இடம்',
                'location_accuracy': 'துல்லியம்',
                'use_current_location': 'தற்போதைய இடத்தைப் பயன்படுத்துங்கள்'
            }
        };
    }

    createLanguageSelector() {
        // Setup existing language selector
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            // Set current language
            languageSelect.value = this.currentLanguage;
            
            // Add event listener if not already added
            if (!languageSelect.hasAttribute('data-listener-added')) {
                languageSelect.addEventListener('change', (e) => {
                    this.changeLanguage(e.target.value);
                });
                languageSelect.setAttribute('data-listener-added', 'true');
            }
        }
    }

    changeLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        this.applyTranslations();
        
        // Update document language attribute
        document.documentElement.lang = language;
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || 
               this.translations['en'][key] || 
               key;
    }

    applyTranslations() {
        // Translate elements with data-translate attribute
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'email' || element.type === 'password')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate elements with data-translate-html attribute (for HTML content)
        const elementsWithHtml = document.querySelectorAll('[data-translate-html]');
        elementsWithHtml.forEach(element => {
            const key = element.getAttribute('data-translate-html');
            const translation = this.translate(key);
            element.innerHTML = translation;
        });

        // Update page title if it has translation
        const titleElement = document.querySelector('title');
        if (titleElement && titleElement.hasAttribute('data-translate')) {
            const key = titleElement.getAttribute('data-translate');
            titleElement.textContent = this.translate(key);
        }
    }

    // Method to add new translations dynamically
    addTranslations(language, translations) {
        if (!this.translations[language]) {
            this.translations[language] = {};
        }
        Object.assign(this.translations[language], translations);
    }

    // Method to get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    // Method to get all available languages
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    // Geolocation support methods
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let errorMessage = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = this.translate('location_permission_denied') || 'Location access denied by user.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = this.translate('location_unavailable') || 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = this.translate('location_timeout') || 'Location request timed out.';
                            break;
                        default:
                            errorMessage = this.translate('location_unknown_error') || 'An unknown error occurred.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Watch position for continuous tracking
    watchPosition(callback, errorCallback) {
        if (!navigator.geolocation) {
            errorCallback(new Error('Geolocation is not supported by this browser.'));
            return null;
        }

        return navigator.geolocation.watchPosition(
            (position) => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                let errorMessage = '';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = this.translate('location_permission_denied') || 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = this.translate('location_unavailable') || 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = this.translate('location_timeout') || 'Location request timed out.';
                        break;
                    default:
                        errorMessage = this.translate('location_unknown_error') || 'An unknown error occurred.';
                        break;
                }
                errorCallback(new Error(errorMessage));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    }

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in kilometers
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    // Reverse geocoding to get address from coordinates
    async reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                return data.results[0].formatted;
            }
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
    }
}

// Initialize multilingual support when DOM is loaded
let multilingualManager;

document.addEventListener('DOMContentLoaded', function() {
    multilingualManager = new MultilingualManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultilingualManager;
}