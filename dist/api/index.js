import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import morgan from "morgan";
import authrouter from "../routers/authroute.js";

dotenv.config();

/*
=====================================================
 APP INIT
=====================================================
*/
const app = express();
app.set("trust proxy", 1);

/*
=====================================================
 HTTP SERVER + SOCKET.IO
=====================================================
*/
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.SECOND_URL,
  process.env.THIRD_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket"],
  pingTimeout: 20000,
  pingInterval: 25000,
});

/*
=====================================================
 SOCKET ENGINE
=====================================================
*/
io.on("connection", (socket) => {
  console.log("🟢 Socket:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnect:", socket.id);
  });
});

/*
=====================================================
 GLOBAL SECURITY LAYER
=====================================================
*/

// 🔐 Helmet
app.use(helmet());

// 🔐 HPP
app.use(hpp());

// 🔐 Rate Limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/*
=====================================================
 PERFORMANCE LAYER
=====================================================
*/

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("combined"));

/*
=====================================================
 CORS
=====================================================
*/

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/*
=====================================================
 NO CACHE
=====================================================
*/

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/*
=====================================================
 TIMEOUT PROTECTION
=====================================================
*/

app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request Timeout" });
    }
  }, 60000);

  res.on("finish", () => clearTimeout(timeout));
  next();
});

/*
=====================================================
 DATABASE
=====================================================
*/

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 100,
      minPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 60000,
    });

    isConnected = true;
    console.log("✅ Mongo Connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

connectDB();

/*
=====================================================
 HEALTH ROUTES
=====================================================
*/

app.get("/", (_req, res) => {
  res.send("🚀 OwlBite API LIVE");
});

app.get("/health", (_req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    time: Date.now(),
  });
});

/*
=====================================================
 ROUTES
=====================================================
*/

app.use("/api/auth", authrouter);

/*
=====================================================
 GLOBAL ERROR HANDLER
=====================================================
*/

app.use((err, _req, res, _next) => {
  console.error("🔥 ERROR:", err);

  if (!res.headersSent) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

/*
=====================================================
 KEEP ALIVE
=====================================================
*/

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

/*
=====================================================
 START SERVER
=====================================================
*/

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`🚀 OwlBite running on ${PORT}`);
});