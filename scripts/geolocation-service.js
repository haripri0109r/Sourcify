// Enhanced Geolocation Service for Sourcify Platform
class GeolocationService {
  constructor() {
    this.currentPosition = null;
    this.watchId = null;
    this.isWatching = false;
    this.locationCache = new Map();
    this.defaultLocation = { lat: 28.6139, lng: 77.2090, city: 'Delhi', country: 'India' }; // Default to Delhi
    
    // Configuration
    this.config = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes cache
      distanceThreshold: 100, // meters
      maxRetries: 3
    };

    this.init();
  }

  async init() {
    // Check if geolocation is supported
    if (!this.isGeolocationSupported()) {
      console.warn('Geolocation is not supported by this browser');
      return;
    }

    // Try to get cached location first
    this.loadCachedLocation();
    
    // Check permissions
    await this.checkPermissions();
  }

  isGeolocationSupported() {
    return 'geolocation' in navigator;
  }

  async checkPermissions() {
    if (!('permissions' in navigator)) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.warn('Could not check geolocation permissions:', error);
      return 'unknown';
    }
  }

  async getCurrentPosition(options = {}) {
    const mergedOptions = { ...this.config, ...options };
    
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      // Show loading indicator
      this.showLocationLoading();

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData = await this.processPosition(position);
            this.currentPosition = locationData;
            this.cacheLocation(locationData);
            this.hideLocationLoading();
            resolve(locationData);
          } catch (error) {
            this.hideLocationLoading();
            reject(error);
          }
        },
        (error) => {
          this.hideLocationLoading();
          this.handleGeolocationError(error);
          reject(error);
        },
        mergedOptions
      );
    });
  }

  async processPosition(position) {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Get additional location information
    const locationInfo = await this.reverseGeocode(latitude, longitude);
    
    return {
      lat: latitude,
      lng: longitude,
      accuracy: accuracy,
      timestamp: position.timestamp,
      ...locationInfo
    };
  }

  async reverseGeocode(lat, lng) {
    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (this.locationCache.has(cacheKey)) {
      return this.locationCache.get(cacheKey);
    }

    try {
      // Using a free geocoding service (in production, use a proper API key)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();
      
      const locationInfo = {
        address: data.locality || data.city || 'Unknown Location',
        city: data.city || data.locality || 'Unknown City',
        state: data.principalSubdivision || 'Unknown State',
        country: data.countryName || 'Unknown Country',
        countryCode: data.countryCode || 'XX',
        postalCode: data.postcode || '',
        district: data.localityInfo?.administrative?.[2]?.name || '',
        area: data.localityInfo?.administrative?.[3]?.name || ''
      };

      // Cache the result
      this.locationCache.set(cacheKey, locationInfo);
      
      return locationInfo;
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return {
        address: 'Location detected',
        city: 'Unknown City',
        state: 'Unknown State',
        country: 'Unknown Country',
        countryCode: 'XX'
      };
    }
  }

  startWatching(callback, options = {}) {
    if (!this.isGeolocationSupported() || this.isWatching) {
      return;
    }

    const mergedOptions = { ...this.config, ...options };
    
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const locationData = await this.processPosition(position);
          
          // Check if location has changed significantly
          if (this.hasLocationChanged(locationData)) {
            this.currentPosition = locationData;
            this.cacheLocation(locationData);
            callback(locationData);
          }
        } catch (error) {
          console.error('Error processing watched position:', error);
        }
      },
      (error) => {
        this.handleGeolocationError(error);
        callback(null, error);
      },
      mergedOptions
    );

    this.isWatching = true;
  }

  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  hasLocationChanged(newLocation) {
    if (!this.currentPosition) return true;
    
    const distance = this.calculateDistance(
      this.currentPosition.lat,
      this.currentPosition.lng,
      newLocation.lat,
      newLocation.lng
    );
    
    return distance > this.config.distanceThreshold;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  calculateDistanceToVendor(vendorLat, vendorLng) {
    if (!this.currentPosition) {
      return null;
    }
    
    const distance = this.calculateDistance(
      this.currentPosition.lat,
      this.currentPosition.lng,
      vendorLat,
      vendorLng
    );
    
    return this.formatDistance(distance);
  }

  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    } else {
      return `${(meters / 1000).toFixed(1)}km away`;
    }
  }

  async findNearbyVendors(radius = 5000) { // 5km default radius
    if (!this.currentPosition) {
      try {
        await this.getCurrentPosition();
      } catch (error) {
        console.warn('Could not get current position, using default location');
        this.currentPosition = this.defaultLocation;
      }
    }

    // Generate mock vendors based on current location
    return this.generateNearbyVendors(radius);
  }

  generateNearbyVendors(radius) {
    const vendors = [
      {
        id: 'v1',
        name: 'Chaat Corner',
        shopName: 'Chaat Corner',
        products: ['Fresh Vegetables', 'Spices', 'Flour', 'Onions', 'Potatoes'],
        phone: '+91 9876543210',
        description: 'Family-run chaat stall since 2010. Specializes in North Indian street food with authentic flavors.',
        rating: 4.5,
        status: 'available',
        collaborationHistory: 12,
        avgOrderValue: 2500,
        specialties: ['Bulk Vegetable Orders', 'Spice Procurement'],
        workingHours: '6:00 AM - 10:00 PM',
        languages: ['Hindi', 'English']
      },
      {
        id: 'v2',
        name: 'Samosa King',
        shopName: 'Samosa King',
        products: ['Potatoes', 'Flour', 'Spices', 'Oil', 'Peas', 'Green Chilies'],
        phone: '+91 9876543211',
        description: 'Specializing in crispy samosas and snacks for over 15 years. Known for quality ingredients.',
        rating: 4.2,
        status: 'available',
        collaborationHistory: 8,
        avgOrderValue: 3200,
        specialties: ['Flour & Oil Bulk Orders', 'Spice Blending'],
        workingHours: '5:30 AM - 11:00 PM',
        languages: ['Hindi', 'Punjabi', 'English']
      },
      {
        id: 'v3',
        name: 'Fresh Food Hub',
        shopName: 'Fresh Food Hub',
        products: ['Vegetables', 'Fruits', 'Dairy', 'Herbs', 'Leafy Greens'],
        phone: '+91 9876543212',
        description: 'Fresh produce supplier for street vendors. Quality guaranteed with daily fresh stock.',
        rating: 4.7,
        status: 'available',
        collaborationHistory: 25,
        avgOrderValue: 4500,
        specialties: ['Fresh Produce', 'Daily Delivery', 'Quality Assurance'],
        workingHours: '4:00 AM - 9:00 PM',
        languages: ['Hindi', 'English', 'Bengali']
      },
      {
        id: 'v4',
        name: 'Spice Master',
        shopName: 'Spice Master',
        products: ['Spices', 'Masalas', 'Dry Fruits', 'Condiments', 'Pickles'],
        phone: '+91 9876543213',
        description: 'Premium spices and masalas for authentic flavors. Direct sourcing from spice gardens.',
        rating: 4.3,
        status: 'busy',
        collaborationHistory: 18,
        avgOrderValue: 2800,
        specialties: ['Premium Spices', 'Custom Blends', 'Wholesale Rates'],
        workingHours: '7:00 AM - 8:00 PM',
        languages: ['Hindi', 'Tamil', 'English']
      },
      {
        id: 'v5',
        name: 'Dosa Delight',
        shopName: 'Dosa Delight',
        products: ['Rice', 'Lentils', 'Coconut', 'Curry Leaves', 'Mustard Seeds'],
        phone: '+91 9876543214',
        description: 'South Indian specialties with authentic ingredients. Expert in dosa and idli preparations.',
        rating: 4.6,
        status: 'available',
        collaborationHistory: 15,
        avgOrderValue: 3800,
        specialties: ['South Indian Ingredients', 'Rice & Lentil Bulk Orders'],
        workingHours: '6:00 AM - 10:30 PM',
        languages: ['Tamil', 'Telugu', 'Hindi', 'English']
      }
    ];

    // Add location data to each vendor
    return vendors.map((vendor, index) => {
      const { lat, lng } = this.generateNearbyCoordinates(
        this.currentPosition.lat,
        this.currentPosition.lng,
        radius,
        index
      );
      
      const distance = this.calculateDistance(
        this.currentPosition.lat,
        this.currentPosition.lng,
        lat,
        lng
      );

      return {
        ...vendor,
        lat,
        lng,
        distance: this.formatDistance(distance),
        distanceMeters: Math.round(distance),
        location: this.generateVendorAddress(lat, lng, this.currentPosition.city),
        area: this.generateAreaName(index),
        lastSeen: this.generateLastSeenTime()
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters); // Sort by distance
  }

  generateNearbyCoordinates(centerLat, centerLng, radius, index) {
    // Generate coordinates within the specified radius
    const angle = (index * 72) * (Math.PI / 180); // Distribute vendors in different directions
    const distance = Math.random() * radius * 0.8 + radius * 0.2; // Random distance within radius
    
    const lat = centerLat + (distance / 111320) * Math.cos(angle);
    const lng = centerLng + (distance / (111320 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
    
    return { lat, lng };
  }

  generateVendorAddress(lat, lng, city) {
    const areas = [
      'Market Street', 'Food Plaza', 'Central Market', 'Spice Market', 'Commercial Complex',
      'Main Bazaar', 'Local Market', 'Shopping Center', 'Trade Center', 'Business District'
    ];
    
    const area = areas[Math.floor(Math.random() * areas.length)];
    const number = Math.floor(Math.random() * 500) + 1;
    const stall = Math.floor(Math.random() * 50) + 1;
    
    return `${number} ${area}, Stall #${stall}, ${city}`;
  }

  generateAreaName(index) {
    const areas = [
      'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Sarojini Nagar', 'Chandni Chowk',
      'Khan Market', 'Nehru Place', 'Rajouri Garden', 'Janpath', 'Palika Bazaar'
    ];
    return areas[index % areas.length];
  }

  generateLastSeenTime() {
    const minutes = Math.floor(Math.random() * 60) + 1;
    if (minutes < 5) return 'Online now';
    if (minutes < 30) return `${minutes} minutes ago`;
    return `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) > 1 ? 's' : ''} ago`;
  }

  handleGeolocationError(error) {
    let message = '';
    let suggestion = '';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user';
        suggestion = 'Please enable location access in your browser settings to find nearby vendors.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable';
        suggestion = 'Please check your internet connection and try again.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        suggestion = 'The location request took too long. Please try again.';
        break;
      default:
        message = 'An unknown error occurred while retrieving location';
        suggestion = 'Please try again or contact support if the problem persists.';
        break;
    }

    console.error('Geolocation error:', message);
    this.showLocationError(message, suggestion);
  }

  showLocationLoading() {
    const loadingElement = document.getElementById('locationLoading');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    // Update search button
    const searchBtn = document.getElementById('searchCollabBtn');
    if (searchBtn) {
      searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting your location...';
      searchBtn.disabled = true;
    }
  }

  hideLocationLoading() {
    const loadingElement = document.getElementById('locationLoading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    // Reset search button
    const searchBtn = document.getElementById('searchCollabBtn');
    if (searchBtn) {
      searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Collaboration';
      searchBtn.disabled = false;
    }
  }

  showLocationError(message, suggestion) {
    // Create or update error notification
    this.showNotification(`Location Error: ${message}. ${suggestion}`, 'error');
    
    // Use default location as fallback
    this.currentPosition = this.defaultLocation;
  }

  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 6000);
    }
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

  cacheLocation(locationData) {
    try {
      const cacheData = {
        ...locationData,
        cachedAt: Date.now()
      };
      localStorage.setItem('sourcify_location_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Could not cache location data:', error);
    }
  }

  loadCachedLocation() {
    try {
      const cached = localStorage.getItem('sourcify_location_cache');
      if (cached) {
        const locationData = JSON.parse(cached);
        const age = Date.now() - locationData.cachedAt;
        
        // Use cached location if it's less than 5 minutes old
        if (age < this.config.maximumAge) {
          this.currentPosition = locationData;
          return locationData;
        }
      }
    } catch (error) {
      console.warn('Could not load cached location:', error);
    }
    return null;
  }

  getCurrentLocationInfo() {
    return this.currentPosition;
  }

  async requestLocationPermission() {
    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation is not supported');
    }

    const permission = await this.checkPermissions();
    
    if (permission === 'denied') {
      throw new Error('Location permission denied. Please enable location access in your browser settings.');
    }

    if (permission === 'granted') {
      return true;
    }

    // Try to get location to trigger permission prompt
    try {
      await this.getCurrentPosition();
      return true;
    } catch (error) {
      throw new Error('Location permission required to find nearby vendors.');
    }
  }

  // Utility method to format location for display
  formatLocationDisplay(location) {
    if (!location) return 'Location not available';
    
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    
    return parts.join(', ') || 'Unknown Location';
  }

  // Method to get location-based recommendations
  getLocationBasedRecommendations() {
    if (!this.currentPosition) return [];

    const recommendations = [];
    
    // Add city-specific recommendations
    if (this.currentPosition.city) {
      recommendations.push({
        type: 'city',
        title: `Popular in ${this.currentPosition.city}`,
        description: 'Vendors frequently collaborated with in your city'
      });
    }

    // Add area-specific recommendations
    if (this.currentPosition.area) {
      recommendations.push({
        type: 'area',
        title: `Near ${this.currentPosition.area}`,
        description: 'Vendors in your immediate area'
      });
    }

    return recommendations;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeolocationService;
}

// Global instance
window.geolocationService = new GeolocationService();