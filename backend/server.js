import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToMongoDb } from "./database/connectTomongoDb.js";
import userRoutes from "./routes/user.routes.js";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __dirname = path.resolve();

// Add error handling middleware first
app.use((err, req, res, next) => {
  console.error("Route Error:", err);
  res.status(500).send("Route handling error");
});

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Test basic route before mounting userRoutes
app.get("/api/healthcheck", (req, res) => {
  res.send("Server is healthy");
});

app.use("/api/user", userRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

// Add final error handler
app.use((err, req, res, next) => {
  console.error("Final error handler:", err);
  res.status(500).json({ error: err.message });
});

connectToMongoDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error", err);
  });
