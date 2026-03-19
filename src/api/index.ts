import express, { Application, Request, Response, NextFunction } from "express";
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
import sanitize from "mongo-sanitize";
import { globalZodMiddleware } from "../middlewares/globalZod.js";
import authrouter from "../routers/authroute.js";

dotenv.config();

/*
=====================================================
 APP INIT
=====================================================
*/

const app: Application = express();
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
].filter(Boolean) as string[];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ["websocket"], // force websocket (faster)
  pingTimeout: 20000,
  pingInterval: 25000,
});

/*
=====================================================
 SOCKET ENGINE (REALTIME CORE)
=====================================================
*/

io.on("connection", (socket) => {
  console.log("🟢 Socket:", socket.id);

  socket.on("join_room", (room: string) => {
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

// 🔐 Helmet (headers protection)
app.use(helmet());

// 🔐 Prevent HTTP param pollution
app.use(hpp());

// 🔐 Rate Limiter (ANTI DDOS / BRUTE FORCE)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// 🔐 Sanitize Mongo Queries
app.use((req, _res, next) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);

  // ❌ DO NOT overwrite req.query
  // ✅ Instead mutate safely
  if (req.query) {
    for (const key in req.query) {
      req.query[key] = sanitize(req.query[key]);
    }
  }

  next();
});

/*
=====================================================
 PERFORMANCE LAYER
=====================================================
*/

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// 📊 Logger (production safe)
app.use(morgan("combined"));

/*
=====================================================
 CORS (STRICT WHITELIST)
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
 NO CACHE (REALTIME SYSTEM)
=====================================================
*/

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/*
=====================================================
 REQUEST TIMEOUT PROTECTION
=====================================================
*/

app.use((req: Request, res: Response, next: NextFunction) => {
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
 DATABASE (HIGH PERFORMANCE POOL)
=====================================================
*/

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URL as string, {
      maxPoolSize: 100,
      minPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 60000,
    });

    isConnected = true;
    console.log("✅ Mongo Connected");
  } catch (err: any) {
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

app.get("/", (_req: Request, res: Response) => {
  res.send("🚀 OwlBite API LIVE");
});

app.get("/health", (_req: Request, res: Response) => {
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
app.use(globalZodMiddleware())
app.use("/api/auth", authrouter);

/*
=====================================================
 GLOBAL ERROR HANDLER
=====================================================
*/

app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 ERROR:", err);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
);

/*
=====================================================
 KEEP ALIVE (NO TIMEOUT CRASH)
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

server.listen(PORT, () => console.log(`🚀 OwlBite running on ${PORT}`));