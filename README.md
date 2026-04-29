# HKM Shipment Tool

A web-based tool for sending ship and return orders to the Hunkemöller transport API.

---

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | The web form — open this in your browser |
| `proxy.js` | Local proxy server — required to run the tool |
| `config.example.json` | Credentials template — rename to `config.json` and fill in your details |

---

## Requirements

- [Node.js](https://nodejs.org) v14 or higher

---

## Setup (first time only)

**1. Download all files** from this repo and save them in a folder, e.g. `C:\hkm-shipment\`

**2. Create your config file** — rename `config.example.json` to `config.json` and fill in your credentials:

```json
{
  "credentials": {
    "clientId":     "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET"
  },
  "endpoints": {
    "ship":   "https://x-jd-api-acc.de-c1.eu1.cloudhub.io/hunkemoller/transport/x/v1/order/update",
    "return": "https://x-jd-api-acc.de-c1.eu1.cloudhub.io/hunkemoller/transport/x/v1/order/return"
  },
  "logFile": "./shipment.log"
}
```

**3. Start the proxy server** — open PowerShell, navigate to your folder and run:

```powershell
cd C:\hkm-shipment
node proxy.js
```

You should see:
```
Running at → http://localhost:8080
```

**4. Open the tool** in your browser:

```
http://localhost:8080
```

---

## Daily use

1. Open PowerShell and run `node proxy.js` in your folder
2. Open `http://localhost:8080` in your browser
3. Fill in the form and click **Send ship order** or **Send return order**
4. ✅ Green = success (HTTP 204) &nbsp; ❌ Red = error with details
5. Close PowerShell when done

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Can't reach localhost:8080 | Make sure `node proxy.js` is running in PowerShell |
| HTTP 400 Bad request | Check your credentials in `config.json` |
| HTTP 500 Server error | Make sure all mandatory fields are filled in |
| Page not loading | Hard refresh: Ctrl+Shift+R in browser |
| `node` is not recognized | Install Node.js from nodejs.org and restart PowerShell |
