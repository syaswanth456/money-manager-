import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import authRoutes from "./routes/auth.js";
import { initWebSocket } from "./websocket.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (_, res) => res.send("Money Manager API running"));

const server = http.createServer(app);

// WebSocket init
initWebSocket(server);

server.listen(process.env.PORT, () => {
  console.log("🚀 Server + WebSocket running on", process.env.PORT);
});
