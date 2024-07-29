const express = require('express');
const axios = require('axios');

const app = express();

// Backend servers
const servers = [
  'http://localhost:8081',
  'http://localhost:8082'
];

// Current index of backend server
let currentIndex = 0;

// Function for getting next backend server
function getNextServer() {
  currentIndex++;
  if (currentIndex >= servers.length) {
    currentIndex = 0;
  }

  return servers[currentIndex];
}

// Health check
async function healthCheck() {
  
  // Loop through servers and health check each one
  for (let i = 0; i < servers.length; i++) {

    const result = await axios.get(servers[i] + '/health');

    // If unhealthy, remove from servers list
    if (result.status !== 200) {
      servers.splice(i, 1); 
      i--;
    }
  }

  // Add servers back once they become available
  setInterval(async () => {
    let serverAdded = false;
    for (let i = 0; i < servers.length; i++) {
      const result = await axios.get(servers[i] + '/health');
      if (result.status === 200 && !servers.includes(servers[i])) {
        servers.push(servers[i]);
        serverAdded = true;
      }
    }

    if (serverAdded) {
      console.log('Server added back to pool');
    }
  }, 5000);

}

// Run health check
healthCheck();

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Handler for incoming requests
app.get('*', async (req, res) => {

  // Get next backend server
  const server = getNextServer();

  // Forward request
  try {
    const result = await axios.get(server + req.url);
    res.status(result.status).send(result.data);
  } catch (err) {
    res.status(500).send('Failed to connect to backend');
  }
});

app.listen(80, () => {
  console.log('Load balancer running on port 80');
});