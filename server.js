const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const server = http.createServer((req, res) => {
  // Serve static files
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const extname = path.extname(filePath);
  
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpg';
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

// Store delivery data
const deliveryData = new Map();
const orderStatuses = new Map();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  // Send existing delivery data to new clients
  deliveryData.forEach((data, orderId) => {
    ws.send(JSON.stringify({
      type: 'delivery_location',
      orderId: orderId,
      ...data
    }));
  });

  ws.on('message', (message) => {
    console.log('Received message from client:', message.toString());
    
    try {
      const data = JSON.parse(message);
      
      // Handle delivery location updates
      if (data.type === 'delivery_location') {
        const locationData = {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          status: data.status,
          deliveryPersonId: data.deliveryPersonId,
          timestamp: data.timestamp || Date.now()
        };
        
        deliveryData.set(data.orderId, locationData);
        
        // Broadcast to all clients
        const broadcastData = {
          type: 'delivery_location',
          orderId: data.orderId,
          ...locationData
        };
        
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(broadcastData));
          }
        });
        
        console.log(`Broadcasted delivery location for order ${data.orderId}:`, locationData);
      }
      
      // Handle order status updates
      else if (data.type === 'order_status_update') {
        orderStatuses.set(data.orderId, {
          status: data.status,
          timestamp: data.timestamp,
          deliveryPersonId: data.deliveryPersonId
        });
        
        // Broadcast status update
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
        
        console.log(`Order ${data.orderId} status updated to: ${data.status}`);
      }
      
      // Handle legacy location format (for backward compatibility)
      else if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        const legacyData = { 
          lat: data.lat, 
          lng: data.lng,
          timestamp: Date.now()
        };
        
        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(legacyData));
          }
        });
        
        console.log('Broadcasted legacy location:', legacyData);
      }
      
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.log('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});

// API endpoints for order management
server.on('request', (req, res) => {
  if (req.url.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Get delivery status for an order
    if (req.url.startsWith('/api/delivery/') && req.method === 'GET') {
      const orderId = req.url.split('/')[3];
      const deliveryInfo = deliveryData.get(orderId);
      const orderStatus = orderStatuses.get(orderId);
      
      if (deliveryInfo || orderStatus) {
        res.writeHead(200);
        res.end(JSON.stringify({
          orderId: orderId,
          location: deliveryInfo || null,
          status: orderStatus || null
        }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
      return;
    }

    // Get all active deliveries
    if (req.url === '/api/deliveries' && req.method === 'GET') {
      const activeDeliveries = [];
      deliveryData.forEach((data, orderId) => {
        const status = orderStatuses.get(orderId);
        activeDeliveries.push({
          orderId: orderId,
          location: data,
          status: status
        });
      });
      
      res.writeHead(200);
      res.end(JSON.stringify(activeDeliveries));
      return;
    }
  }
});