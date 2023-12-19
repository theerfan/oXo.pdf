const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Function to dynamically determine the target URL
function getTarget(req) {
    // Extract the target URL from the request path
    const targetUrl = req.url.slice(1).split('/').slice(1).join('/');
    return targetUrl;
}

// Custom routing function for the proxy
const proxyOptions = {
    router: function(req) {
        const targetUrl = getTarget(req);
        // Check if the target URL is for a PDF file
        if (!targetUrl.toLowerCase().endsWith('.pdf')) {
            return null; // Reject non-PDF requests
        }
        // Use the WHATWG URL API to parse the target URL
        try {
            const parsedUrl = new URL(targetUrl);
            return `${parsedUrl.protocol}//${parsedUrl.host}`;
        } catch (error) {
            // Handle invalid URL
            return null;
        }
    },
    changeOrigin: true,
    pathRewrite: function(path, req) {
        // Rewrite the path to remove the proxy path and target URL
        return '/' + path.split('/').slice(3).join('/');
    },
    onProxyRes: function(proxyRes, req, res) {
        // Add CORS headers
        res.header('Access-Control-Allow-Origin', '*');
    }
};

// Proxy endpoints
app.use('/proxy/*', createProxyMiddleware(proxyOptions));

const PORT = 3000; // Proxy server port
app.listen(PORT, () => {
    console.log(`CORS proxy running on http://localhost:${PORT}`);
});
