// standalone-server.js
// Simple server for Next.js standalone build
// Place this file in .next/standalone/ directory

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start server
const handler = require('./server.js');
const server = createServer(handler);

server.listen(port, hostname, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log(`> Environment: ${process.env.NODE_ENV || 'production'}`);
});
