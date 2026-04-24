import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./auth.js";
import { notesRouter } from "./notes.js";
import { tagsRouter } from "./tags.js";
import { adminRouter } from "./admin.js";
import { ensureDatabaseSchema } from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const bootstrap = async () => {
  await ensureDatabaseSchema();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Server bootstrap error:", error);
  process.exit(1);
});
