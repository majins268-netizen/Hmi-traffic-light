const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const path = require("path");

const SIM_PORT = Number(process.env.SIM_PORT || 3000);   // simulator.html
const HMI_PORT = Number(process.env.HMI_PORT || 3001);   // hmi.html
const PLC_PORT = Number(process.env.PLC_PORT || 3002);   // Virtual PLC (internal, 127.0.0.1)

function makeServer(folder, indexFile) {
  const app = express();
  app.use(express.static(path.join(__dirname, "public", folder), { index: indexFile }));
  return http.createServer(app);
}
const simServer = makeServer("simulator", "simulator.html");
const hmiServer = makeServer("hmi", "hmi.html");
const simWss = new WebSocket.Server({ server: simServer, path: "/ws" });
const hmiWss = new WebSocket.Server({ server: hmiServer, path: "/ws" });
const browserClients = () => [...simWss.clients, ...hmiWss.clients];

let plcSocket = null;
let plcConnected = false;
let latestStatus = {
  type: "STATUS", running: false, emergency: false,
  phase: "STOPPED", direction: "ALL", color: "RED",
  remaining: 0, settings: { green: 12, yellow: 3, allRed: 2 }
};

function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of browserClients()) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function connectPLC() {
  if (plcSocket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(plcSocket.readyState)) return;

  plcSocket = new WebSocket(`ws://127.0.0.1:${PLC_PORT}`);

  plcSocket.on("open", () => {
    plcConnected = true;
    broadcast({ type: "CONNECTION", plc: true });
    console.log("Gateway terhubung ke Virtual PLC");
  });

  plcSocket.on("message", raw => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === "STATUS") latestStatus = data;
      broadcast(data);
    } catch (error) {
      console.error("Pesan PLC tidak valid:", error.message);
    }
  });

  plcSocket.on("close", () => {
    plcConnected = false;
    broadcast({ type: "CONNECTION", plc: false });
    setTimeout(connectPLC, 2000);
  });

  plcSocket.on("error", () => {
    plcConnected = false;
    try { plcSocket.close(); } catch {}
  });
}

function onBrowser(browser) {
  browser.send(JSON.stringify({ type: "CONNECTION", plc: plcConnected }));
  browser.send(JSON.stringify(latestStatus));

  browser.on("message", raw => {
    try {
      const data = JSON.parse(raw.toString());
      if (!["START", "STOP", "EMERGENCY", "SETTINGS"].includes(data.type)) {
        browser.send(JSON.stringify({ type: "ERROR", message: "Perintah tidak diizinkan" }));
        return;
      }
      if (plcSocket && plcSocket.readyState === WebSocket.OPEN) {
        plcSocket.send(JSON.stringify(data));
      } else {
        browser.send(JSON.stringify({ type: "ERROR", message: "Virtual PLC belum terhubung" }));
      }
    } catch {
      browser.send(JSON.stringify({ type: "ERROR", message: "Format pesan tidak valid" }));
    }
  });
}
simWss.on("connection", onBrowser);
hmiWss.on("connection", onBrowser);

simServer.listen(SIM_PORT, "0.0.0.0", () => console.log(`Simulator aktif di port ${SIM_PORT}`));
hmiServer.listen(HMI_PORT, "0.0.0.0", () => {
  console.log(`HMI aktif di port ${HMI_PORT}`);
  connectPLC();
});
