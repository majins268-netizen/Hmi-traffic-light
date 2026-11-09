const WebSocket = require("ws");

const PORT = Number(process.env.PLC_PORT || 3002);
const wss = new WebSocket.Server({ host: "127.0.0.1", port: PORT });

const phases = [
  { phase: "NS_GREEN", direction: "NS", color: "GREEN", key: "green" },
  { phase: "NS_YELLOW", direction: "NS", color: "YELLOW", key: "yellow" },
  { phase: "ALL_RED_1", direction: "ALL", color: "RED", key: "allRed" },
  { phase: "EW_GREEN", direction: "EW", color: "GREEN", key: "green" },
  { phase: "EW_YELLOW", direction: "EW", color: "YELLOW", key: "yellow" },
  { phase: "ALL_RED_2", direction: "ALL", color: "RED", key: "allRed" }
];

const settings = { green: 12, yellow: 3, allRed: 2 };
let phaseIndex = 0;
let remaining = 0;
let running = false;
let emergency = false;

function snapshot() {
  const p = phases[phaseIndex];
  return {
    type: "STATUS",
    running,
    emergency,
    phase: emergency ? "EMERGENCY" : running ? p.phase : "STOPPED",
    direction: emergency || !running ? "ALL" : p.direction,
    color: emergency || !running ? "RED" : p.color,
    remaining: emergency || !running ? 0 : remaining,
    settings: { ...settings }
  };
}

function broadcast() {
  const payload = JSON.stringify(snapshot());
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}

function start() {
  if (emergency) return;
  phaseIndex = 0;
  remaining = settings.green;
  running = true;
  broadcast();
}

function stop() {
  running = false;
  remaining = 0;
  broadcast();
}

function command(data, socket) {
  if (data.type === "START") return start();
  if (data.type === "STOP") return stop();

  if (data.type === "EMERGENCY") {
    emergency = Boolean(data.enabled);
    if (emergency) {
      running = false;
      remaining = 0;
    }
    broadcast();
    return;
  }

  if (data.type === "SETTINGS") {
    const green = Number(data.green);
    const yellow = Number(data.yellow);
    const allRed = Number(data.allRed);

    if (!Number.isInteger(green) || green < 1 || green > 300 ||
        !Number.isInteger(yellow) || yellow < 1 || yellow > 60 ||
        !Number.isInteger(allRed) || allRed < 1 || allRed > 10) {
      socket.send(JSON.stringify({ type: "ERROR", message: "Durasi tidak valid" }));
      return;
    }

    settings.green = green;
    settings.yellow = yellow;
    settings.allRed = allRed;
    if (running) remaining = settings[phases[phaseIndex].key];
    broadcast();
    return;
  }

  socket.send(JSON.stringify({ type: "ERROR", message: "Perintah tidak dikenal" }));
}

wss.on("connection", socket => {
  socket.send(JSON.stringify(snapshot()));
  socket.on("message", raw => {
    try { command(JSON.parse(raw.toString()), socket); }
    catch { socket.send(JSON.stringify({ type: "ERROR", message: "Format perintah tidak valid" })); }
  });
});

setInterval(() => {
  if (!running || emergency) return;
  remaining--;
  if (remaining <= 0) {
    phaseIndex = (phaseIndex + 1) % phases.length;
    remaining = settings[phases[phaseIndex].key];
  }
  broadcast();
}, 1000);

console.log(`Virtual PLC aktif di 127.0.0.1:${PORT}`);
