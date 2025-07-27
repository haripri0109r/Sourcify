# Sourcify Geolocation Services

## Overview
The Sourcify platform includes advanced geolocation services that enable street food vendors to find nearby collaboration partners based on their physical location. The system provides accurate location detection, vendor discovery, and distance calculations.

## Features

### 🌍 Location Detection
- **HTML5 Geolocation API**: Uses browser's native location services
- **Permission Management**: Handles location permission requests gracefully
- **Fallback Support**: Provides default location when geolocation fails
- **Caching System**: Stores location data locally for faster access
- **Accuracy Control**: Configurable accuracy and timeout settings

### 📍 Vendor Discovery
- **Radius-based Search**: Find vendors within specified distance (default 5km)
- **Real-time Distance Calculation**: Accurate distance measurements using Haversine formula
- **Location-based Sorting**: Vendors sorted by proximity to user
- **Area-specific Filtering**: Filter by neighborhood, city, or region

### 🗺️ Address Services
- **Reverse Geocoding**: Convert coordinates to human-readable addresses
- **City/Area Detection**: Identify user's city and local area
- **Address Formatting**: Consistent address display across the platform
- **Multi-language Support**: Location names in local languages

## Technical Implementation

### Core Components

#### 1. GeolocationService Class (`geolocation-service.js`)
```javascript
class GeolocationService {
  // Main service class handling all location operations
  constructor()
  getCurrentPosition()
  findNearbyVendors()
  calculateDistance()
  reverseGeocode()
}
```

#### 2. Key Methods

**Location Detection:**
```javascript
// Get current user location
const location = await geolocationService.getCurrentPosition();

// Find vendors within 5km radius
const vendors = await geolocationService.findNearbyVendors(5000);

// Calculate distance to specific vendor
const distance = geolocationService.calculateDistanceToVendor(lat, lng);
```

**Permission Handling:**
```javascript
// Check location permissions
const permission = await geolocationService.checkPermissions();

// Request location access
await geolocationService.requestLocationPermission();
```

### Configuration Options

```javascript
config: {
  enableHighAccuracy: true,    // Use GPS for better accuracy
  timeout: 15000,              // 15 second timeout
  maximumAge: 300000,          // 5 minute cache duration
  distanceThreshold: 100,      // 100 meter change threshold
  maxRetries: 3                // Maximum retry attempts
}
```

## Location Data Structure

### User Location Object
```javascript
{
  lat: 28.6139,                    // Latitude
  lng: 77.2090,                    // Longitude
  accuracy: 10,                    // Accuracy in meters
  timestamp: 1640995200000,        // Unix timestamp
  address: "Connaught Place",      // Formatted address
  city: "New Delhi",               // City name
  state: "Delhi",                  // State/Province
  country: "India",                // Country name
  countryCode: "IN",               // ISO country code
  postalCode: "110001",            // Postal/ZIP code
  district: "Central Delhi",       // District/Borough
  area: "Connaught Place"          // Local area/neighborhood
}
```

### Vendor Location Object
```javascript
{
  id: "v1",                        // Unique vendor ID
  name: "Chaat Corner",            // Vendor name
  lat: 28.6150,                    // Vendor latitude
  lng: 77.2080,                    // Vendor longitude
  distance: "0.5 km away",         // Formatted distance
  distanceMeters: 500,             // Distance in meters
  location: "123 Market St...",    // Full address
  area: "Connaught Place",         // Local area
  lastSeen: "5 minutes ago",       // Last activity
  // ... other vendor properties
}
```

## Error Handling

### Geolocation Errors
The service handles various error scenarios:

1. **Permission Denied**: User blocks location access
2. **Position Unavailable**: GPS/network issues
3. **Timeout**: Location request takes too long
4. **Service Unavailable**: Browser doesn't support geolocation

### Error Response Format
```javascript
{
  code: 1,                         // Error code (1=DENIED, 2=UNAVAILABLE, 3=TIMEOUT)
  message: "Location access denied",
  suggestion: "Please enable location access in browser settings"
}
```

### Fallback Mechanisms
- **Default Location**: Uses Delhi coordinates when location fails
- **Cached Location**: Uses previously stored location data
- **Manual Location**: Allows users to manually set their area
- **IP-based Location**: Future enhancement for rough location detection

## Privacy & Security

### Data Protection
- **No Server Storage**: Location data stored only in browser localStorage
- **Temporary Caching**: Location cache expires after 5 minutes
- **User Control**: Users can deny location access and still use the platform
- **Minimal Data**: Only essential location data is collected

### Permission Management
- **Explicit Consent**: Clear permission requests with explanations
- **Graceful Degradation**: Platform works without location access
- **Permission Status**: Real-time permission status monitoring
- **Re-request Handling**: Smart re-requesting of denied permissions

## Usage Examples

### Basic Location Detection
```javascript
// Initialize geolocation service
const geoService = new GeolocationService();

// Get current location
try {
  const location = await geoService.getCurrentPosition();
  console.log(`You are in ${location.city}, ${location.state}`);
} catch (error) {
  console.log('Location unavailable:', error.message);
}
```

### Find Nearby Vendors
```javascript
// Find vendors within 3km
const vendors = await geoService.findNearbyVendors(3000);

vendors.forEach(vendor => {
  console.log(`${vendor.name} - ${vendor.distance}`);
});
```

### Distance Calculations
```javascript
// Calculate distance to specific vendor
const distance = geoService.calculateDistanceToVendor(28.6150, 77.2080);
console.log(`Vendor is ${distance} away`);
```

### Location Watching
```javascript
// Watch for location changes
geoService.startWatching((location, error) => {
  if (location) {
    console.log('Location updated:', location.city);
  } else {
    console.log('Location error:', error);
  }
});

// Stop watching
geoService.stopWatching();
```

## Integration with Sourcify Platform

### Dashboard Integration
- **Location Status Indicator**: Shows current location in collaboration section
- **Automatic Vendor Discovery**: Finds vendors when user searches
- **Distance Display**: Shows distance to each vendor in search results
- **Location-based Recommendations**: Suggests vendors based on area

### Collaboration Features
- **Proximity Matching**: Prioritizes nearby vendors for collaboration
- **Area-based Grouping**: Groups vendors by neighborhood
- **Distance Filtering**: Allows filtering by maximum distance
- **Location Verification**: Ensures vendors are in serviceable areas

## Performance Optimization

### Caching Strategy
- **Location Caching**: Stores location for 5 minutes to avoid repeated requests
- **Vendor Caching**: Caches vendor search results
- **Address Caching**: Stores reverse geocoding results
- **Permission Caching**: Remembers permission status

### Network Optimization
- **Lazy Loading**: Loads location services only when needed
- **Batch Requests**: Combines multiple geocoding requests
- **Offline Support**: Works with cached data when offline
- **Progressive Enhancement**: Core features work without location

## Browser Compatibility

### Supported Browsers
- **Chrome**: 50+ (full support)
- **Firefox**: 55+ (full support)
- **Safari**: 10+ (full support)
- **Edge**: 79+ (full support)
- **Mobile Safari**: 10+ (full support)
- **Chrome Mobile**: 50+ (full support)

### Feature Detection
```javascript
// Check geolocation support
if ('geolocation' in navigator) {
  // Geolocation supported
} else {
  // Fallback to manual location entry
}

// Check permissions API support
if ('permissions' in navigator) {
  // Can check permission status
} else {
  // Use try/catch for permission handling
}
```

## Testing & Development

### Mock Data
The service includes comprehensive mock data for testing:
- **5 Sample Vendors**: Diverse vendor types with realistic data
- **Location Variations**: Different distances and areas
- **Status Simulation**: Available, busy, and offline vendors
- **Realistic Addresses**: Proper Indian addresses and areas

### Development Mode
```javascript
// Enable development mode for testing
geolocationService.config.developmentMode = true;

// Use mock location instead of GPS
geolocationService.setMockLocation(28.6139, 77.2090);
```

## Future Enhancements

### Planned Features
1. **Map Integration**: Visual map showing vendor locations
2. **Route Planning**: Optimal routes for vendor visits
3. **Geofencing**: Notifications when entering vendor areas
4. **Location History**: Track frequently visited areas
5. **Weather Integration**: Location-based weather information

### API Integrations
1. **Google Maps API**: Enhanced mapping and geocoding
2. **OpenStreetMap**: Open-source mapping alternative
3. **Government APIs**: Official address validation
4. **Traffic APIs**: Real-time traffic and route optimization

## Troubleshooting

### Common Issues

**Location Not Detected:**
- Check browser permissions
- Ensure HTTPS connection
- Try refreshing the page
- Check internet connection

**Inaccurate Location:**
- Enable high accuracy mode
- Move to open area (away from buildings)
- Wait for GPS lock
- Clear browser cache

**Vendors Not Found:**
- Increase search radius
- Check location permissions
- Verify internet connection
- Try different area

### Debug Information
```javascript
// Get debug information
const debugInfo = {
  isSupported: geolocationService.isGeolocationSupported(),
  currentLocation: geolocationService.getCurrentLocationInfo(),
  permissionStatus: await geolocationService.checkPermissions(),
  cacheStatus: localStorage.getItem('sourcify_location_cache')
};

console.log('Geolocation Debug:', debugInfo);
```

## Support & Maintenance

### Regular Updates
- **Accuracy Improvements**: Enhanced location detection algorithms
- **Performance Optimization**: Faster location detection and vendor search
- **Bug Fixes**: Regular fixes for edge cases and browser compatibility
- **Feature Enhancements**: New location-based features

### Monitoring
- **Error Tracking**: Monitor geolocation failures
- **Performance Metrics**: Track location detection speed
- **Usage Analytics**: Understand location feature usage
- **User Feedback**: Collect feedback on location accuracy

---

**Note**: This geolocation service is designed for the Indian market with specific focus on street food vendor communities. Location data is processed locally and not transmitted to external servers for privacy protection.