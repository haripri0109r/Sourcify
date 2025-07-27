const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store the latest location and order tracking data
let latestLocation = null;
let activeOrders = new Map(); // orderId -> order data
let orderLocations = new Map(); // orderId -> location data

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send the latest location to new clients
  if (latestLocation) {
    ws.send(JSON.stringify({
      type: 'location_update',
      data: latestLocation
    }));
    console.log('Sent latest location to new client:', latestLocation);
  }

  ws.on('message', (message) => {
    console.log('Received message from client:', message.toString());
    try {
      const data = JSON.parse(message);
      
      // Handle different message types
      switch (data.type) {
        case 'location_update':
          handleLocationUpdate(data, ws);
          break;
        case 'order_status_update':
          handleOrderStatusUpdate(data, ws);
          break;
        case 'subscribe_order':
          handleOrderSubscription(data, ws);
          break;
        case 'delivery_location':
          handleDeliveryLocationUpdate(data, ws);
          break;
        default:
          // Legacy support for direct lat/lng messages
          if (typeof data.lat === 'number' && typeof data.lng === 'number') {
            handleLocationUpdate({
              type: 'location_update',
              lat: data.lat,
              lng: data.lng,
              timestamp: Date.now()
            }, ws);
          }
      }
    } catch (e) {
      console.log('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

function handleLocationUpdate(data, senderWs) {
  const locationData = {
    lat: data.lat,
    lng: data.lng,
    timestamp: data.timestamp || Date.now(),
    orderId: data.orderId || null,
    deliveryPersonId: data.deliveryPersonId || null
  };

  if (data.orderId) {
    // Update specific order location
    orderLocations.set(data.orderId, locationData);
  } else {
    // Update general location
    latestLocation = locationData;
  }

  // Broadcast to all clients except sender
  const broadcastData = {
    type: 'location_update',
    data: locationData
  };

  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(broadcastData));
      console.log('Broadcasted location to client:', locationData);
    }
  });
}

function handleOrderStatusUpdate(data, senderWs) {
  const orderData = {
    orderId: data.orderId,
    status: data.status,
    timestamp: data.timestamp || Date.now(),
    location: data.location || null,
    estimatedDelivery: data.estimatedDelivery || null
  };

  activeOrders.set(data.orderId, orderData);

  // Broadcast order status update
  const broadcastData = {
    type: 'order_status_update',
    data: orderData
  };

  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(broadcastData));
      console.log('Broadcasted order status update:', orderData);
    }
  });
}

function handleOrderSubscription(data, ws) {
  const orderId = data.orderId;
  
  // Send current order status if available
  if (activeOrders.has(orderId)) {
    ws.send(JSON.stringify({
      type: 'order_status_update',
      data: activeOrders.get(orderId)
    }));
  }

  // Send current location for this order if available
  if (orderLocations.has(orderId)) {
    ws.send(JSON.stringify({
      type: 'location_update',
      data: orderLocations.get(orderId)
    }));
  }
}

function handleDeliveryLocationUpdate(data, senderWs) {
  const deliveryData = {
    orderId: data.orderId,
    lat: data.lat,
    lng: data.lng,
    timestamp: data.timestamp || Date.now(),
    deliveryPersonId: data.deliveryPersonId,
    status: data.status || 'in_transit'
  };

  orderLocations.set(data.orderId, deliveryData);

  // Broadcast to all clients except sender
  const broadcastData = {
    type: 'delivery_location_update',
    data: deliveryData
  };

  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(broadcastData));
      console.log('Broadcasted delivery location update:', deliveryData);
    }
  });
}

// Cleanup old orders (older than 24 hours)
setInterval(() => {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  for (const [orderId, orderData] of activeOrders.entries()) {
    if (orderData.timestamp < oneDayAgo) {
      activeOrders.delete(orderId);
      orderLocations.delete(orderId);
      console.log(`Cleaned up old order: ${orderId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket tracking server running on ws://localhost:${PORT}`);
  console.log('Server supports:');
  console.log('- Live location tracking');
  console.log('- Order status updates');
  console.log('- Multi-order tracking');
  console.log('- Delivery person tracking');
});