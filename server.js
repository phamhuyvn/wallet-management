// server.js
// Wrapper to start the Next.js standalone server
// This file is placed in .next/standalone/ after build

const { createServer } = require('http');
const path = require('path');
const { parse } = require('url');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});

// The standalone build generates a server.js in .next/standalone
// We need to start that server
const NextServer = require('next/dist/server/next-server').default;
const http = require('http');

const app = new NextServer({
  hostname,
  port,
  dir: __dirname,
  dev: false,
  conf: require('./.next/required-server-files.json').config,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'production'}`);
  });
});
