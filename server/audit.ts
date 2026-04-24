import { db } from "./db.js";
import { v4 as uuidv4 } from "uuid";
import { broadcastEvent } from "./realtime.js";

export const logAudit = async (
  action_type: string,
  actor_id: string | null,
  target_id: string | null,
  metadata: Record<string, any> = {}
) => {
  try {
    const id = uuidv4();
    await db.execute({
      sql: "INSERT INTO audit_logs (id, action_type, actor_id, target_id, metadata) VALUES (?, ?, ?, ?, ?)",
      args: [id, action_type, actor_id, target_id, JSON.stringify(metadata)],
    });
    
    // Broadcast for realtime dashboard
    broadcastEvent("audit", {
      id,
      action_type,
      actor_id,
      target_id,
      metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
