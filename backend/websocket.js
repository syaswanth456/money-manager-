import { WebSocketServer } from "ws";
import { supabase } from "./supabase.js";

const clients = new Map(); // userId -> ws

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const token = new URL(req.url, "http://localhost")
        .searchParams.get("token");

      if (!token) {
        ws.close();
        return;
      }

      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        ws.close();
        return;
      }

      const userId = data.user.id;
      clients.set(userId, ws);

      console.log("🟢 WS Authenticated:", userId);

      ws.on("message", (msg) => {
        const event = JSON.parse(msg);
        handleEvent(userId, event);
      });

      ws.on("close", () => {
        clients.delete(userId);
        console.log("🔴 WS Disconnected:", userId);
      });

    } catch {
      ws.close();
    }
  });
}

function handleEvent(userId, event) {
  // echo only to that user
  const ws = clients.get(userId);
  if (ws?.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

export function emitToUser(userId, event) {
  const ws = clients.get(userId);
  if (ws?.readyState === ws.OPEN) {
    ws.send(JSON.stringify(event));
  }
}
