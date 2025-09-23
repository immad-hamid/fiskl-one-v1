require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PROXY_PORT || 6000;
const FBR_TARGET_URL = process.env.FBR_TARGET_URL || 'http://157.241.63.25';

// Optional: log inbound requests
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  '/fbr',
  createProxyMiddleware({
    target: FBR_TARGET_URL,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    xfwd: true,
    proxyTimeout: 30000,
    timeout: 30000,

    // CRITICAL: Add the /fbr prefix back (Express strips it when mounting)
    pathRewrite: (path, req) => {
      const rewritten = '/fbr' + path; // e.g., '/validate-invoice' -> '/fbr/validate-invoice'
      console.log(`✏️  rewrite: ${path} -> ${rewritten}`);
      return rewritten;
    },

    onProxyReq: (proxyReq, req) => {
      // forward Authorization + Content-Type defensively
      const auth = req.headers['authorization'];
      if (auth) proxyReq.setHeader('authorization', auth);
      console.log(auth);
      const ct = req.headers['content-type'];
      if (ct) proxyReq.setHeader('content-type', ct);

      try {
        console.log(`🔄 ${req.method} ${req.originalUrl} -> ${proxyReq.getHeader('host')}${proxyReq.path || ''}`);
      } catch {}
    },

    onProxyRes: (proxyRes, req) => {
      console.log(`✅ ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },

    onError: (err, req, res) => {
      console.error(`❌ Proxy error for ${req.method} ${req.originalUrl}: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify({ message: 'Upstream proxy error', detail: err.message }));
    },
  })
);

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok', port: PORT }));

app.listen(PORT, () => {
  console.log(`🚀 Proxy on http://localhost:${PORT}`);
  console.log(`📡 /fbr/* -> ${FBR_TARGET_URL}/fbr/*`);
});
