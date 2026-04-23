import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./auth.js";
import { notesRouter } from "./notes.js";
import { tagsRouter } from "./tags.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/tags", tagsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
