import express from 'express';
import { createRequestHandler } from '@remix-run/express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url'; // Import for ES modules
import * as build from './build/server/index.js';
import { getSession } from './app/utils/session.js';

dotenv.config();

const app = express();

// Manually define __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Static assets path for client build
const clientBuildPath = path.join(process.cwd(), 'build', 'client');

// API base URL
const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
  console.error('API_BASE_URL is not defined in .env');
  process.exit(1);
}

// Serve static files
app.use(express.static(clientBuildPath));

// Proxy middleware for API requests
app.use(
  '/api',
  async (req, res, next) => {
    try {
      const session = await getSession(req);
      const user = session.get('user');

      if (user?.token) {
        req.headers['Authorization'] = `Bearer ${user.token}`;
        req.user = user;
        req.token = user.token;
      }
    } catch (error) {
      console.error('Error retrieving session:', error.message);
    }
    next();
  },
  createProxyMiddleware({
    target: API_BASE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    logLevel: 'debug',
    onError(err, req, res) {
      console.error('Proxy error:', err.message);
      if (!res.headersSent) {
        res.status(500).send('Proxy Error');
      }
    },
  })
);

// Fallback handler for Remix
app.all('*', async (req, res) => {
  try {
    if (fs.existsSync(clientBuildPath)) {
      const handler = createRequestHandler({ build });
      return await handler(req, res);
    }

    // Corrected maintenance file path
    const maintenancePath = path.join(__dirname, 'public', 'maintenance.html');

    // Check if maintenance.html exists before sending
    if (!fs.existsSync(maintenancePath)) {
      console.error('Error: maintenance.html not found at', maintenancePath);
      return res.status(404).send('Maintenance page not found');
    }

    return res.sendFile(maintenancePath);
  } catch (error) {
    console.error('Error in request handler:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
