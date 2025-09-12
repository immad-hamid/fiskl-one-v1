const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4200;

// Serve static files from the dist/frontend/browser directory
const distPath = path.join(__dirname, 'dist', 'frontend', 'browser');
app.use(express.static(distPath));

// Handle Angular routing - send all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});