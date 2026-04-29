#!/usr/bin/env node

/**
 * Hunkemöller Shipment Proxy Server
 * -----------------------------------
 * Runs locally and forwards requests from the web form to the API.
 *
 * Usage:
 *   node proxy.js
 *
 * Then open: http://localhost:8080
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT = 8080;

// ─── Load config ─────────────────────────────────────────────────────────────
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  console.error("[ERROR] config.json not found.");
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// ─── Forward request to Hunkemöller API ──────────────────────────────────────
function forwardToApi(apiUrl, body, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const parsed  = new URL(apiUrl);
    const options = {
      hostname : parsed.hostname,
      port     : parsed.port || 443,
      path     : parsed.pathname + parsed.search,
      method   : "POST",
      headers  : {
        "Content-Type"    : "application/json",
        "Content-Length"  : Buffer.byteLength(bodyStr),
        "x-client-id"     : clientId,
        "x-client-secret" : clientSecret,
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, body: raw });
      });
    });

    req.on("error", reject);
    req.write(bodyStr);
    req.end();
  });
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {

  // CORS headers — allow browser requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-client-id, x-client-secret");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve index.html
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "index.html");
    if (fs.existsSync(htmlPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(fs.readFileSync(htmlPath));
    } else {
      res.writeHead(404);
      res.end("index.html not found");
    }
    return;
  }

  // ── Proxy: Ship order ──
  if (req.method === "POST" && req.url === "/api/ship") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload      = JSON.parse(body);
        const clientId     = req.headers["x-client-id"]     || config.credentials.clientId;
        const clientSecret = req.headers["x-client-secret"] || config.credentials.clientSecret;

        console.log(`[${new Date().toISOString()}] SHIP → ${payload.ExternalOrderNumber}`);
        const result = await forwardToApi(config.endpoints.ship, payload, clientId, clientSecret);
        console.log(`[${new Date().toISOString()}] SHIP ← HTTP ${result.status}`);

        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(result.body || "{}");
      } catch (e) {
        console.error("SHIP error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Proxy: Return order ──
  if (req.method === "POST" && req.url === "/api/return") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload      = JSON.parse(body);
        const clientId     = req.headers["x-client-id"]     || config.credentials.clientId;
        const clientSecret = req.headers["x-client-secret"] || config.credentials.clientSecret;

        console.log(`[${new Date().toISOString()}] RETURN → ${payload.ExternalOrderNumber}`);
        const result = await forwardToApi(config.endpoints.return, payload, clientId, clientSecret);
        console.log(`[${new Date().toISOString()}] RETURN ← HTTP ${result.status}`);

        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(result.body || "{}");
      } catch (e) {
        console.error("RETURN error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Hunkemöller Shipment Proxy Server      ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n  Running at → http://localhost:${PORT}`);
  console.log(`  Ship API   → ${config.endpoints.ship}`);
  console.log(`  Return API → ${config.endpoints.return}`);
  console.log("\n  Press Ctrl+C to stop\n");
});
