# Traffic Light Vice City (PLC + HMI Custom HTML)

Arsitektur: `simulator.html` / `hmi.html` (browser) <-> Gateway WebSocket (`app.js`) <-> Virtual PLC (`plc.js`)

| Halaman | Port | File | Domain (contoh) |
|---|---|---|---|
| Simulator perempatan + mobil | 3000 | `public/simulator/simulator.html` | `namakalian.my.id` |
| HMI operator | 3001 | `public/hmi/hmi.html` | `hmi.namakalian.my.id` |
| Virtual PLC (internal, 127.0.0.1) | 3002 | `plc.js` | tidak di-expose |

## Jalankan
```bash
npm install
npm start
```
- Simulator: http://127.0.0.1:3000
- HMI: http://127.0.0.1:3001

## Cloudflare Tunnel (`~/.cloudflared/config.yml`)
```yaml
ingress:
  - hostname: namakalian.my.id
    service: http://localhost:3000
  - hostname: hmi.namakalian.my.id
    service: http://localhost:3001
  - service: http_status:404
```
Jangan expose port 3002.

## Perintah HMI
START, STOP, AUTO (lepas darurat + siklus otomatis), DARURAT, SETTINGS durasi.
