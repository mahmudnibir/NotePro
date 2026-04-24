import { Request, Response, Router } from "express";
import { requireAdmin } from "./middleware.js";

export const realtimeRouter = Router();

// Store active connections
const clients: Set<Response> = new Set();

export const broadcastEvent = (type: string, data: any) => {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
};

realtimeRouter.get("/stream", requireAdmin, (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);
  
  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: "connected", data: { activeClients: clients.size } })}\n\n`);
  broadcastEvent("active_admins", { count: clients.size });

  req.on("close", () => {
    clients.delete(res);
    broadcastEvent("active_admins", { count: clients.size });
  });
});
