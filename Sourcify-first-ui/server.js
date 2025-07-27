const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store the latest location
let latestLocation = null;

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  // Send the latest location to new clients
  if (latestLocation) {
    ws.send(JSON.stringify(latestLocation));
    console.log('Sent latest location to new client:', latestLocation);
  }

  ws.on('message', (message) => {
    console.log('Received message from client:', message);
    try {
      const data = JSON.parse(message);
      // If the message contains lat/lng, treat it as a location update
      if (typeof data.lat === 'number' && typeof data.lng === 'number') {
        latestLocation = { lat: data.lat, lng: data.lng };
        // Broadcast to all clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(latestLocation));
            console.log('Broadcasted location to client:', latestLocation);
          }
        });
      }
    } catch (e) {
      console.log('Error parsing message:', e);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
}); 