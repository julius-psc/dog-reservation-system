const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const moment = require("moment");
const fileUpload = require("express-fileupload");
const http = require("http");
const fs = require("fs");
const path = require("path");

moment.locale("fr");
require("dotenv").config();

const emailService = require("./email/emailService");
const sendPasswordResetEmail = emailService.sendPasswordResetEmail;

function isValidTime(time) {
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) return false;
  const [hours, minutes] = time.split(":");
  const hoursNum = parseInt(hours, 10);
  const minutesNum = parseInt(minutes, 10);
  return hoursNum >= 0 && hoursNum <= 23 && minutesNum >= 0 && minutesNum <= 59;
}

const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// --- PostgreSQL connection ---
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL database"))
  .catch((err) => console.error("Error connecting to PostgreSQL:", err));

// Make pool accessible to routers via req.app.get("db")
app.set("db", pool);

// --- Mount Stripe webhook BEFORE any body parsers or CORS ---
const stripeWebhook = require("./routes/stripeWebhook"); // exports an Express Router
app.use("/webhooks/stripe", stripeWebhook); // final URL: POST /webhooks/stripe

// --- CORS configuration ---
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://chiensencavale.com",
      "http://localhost:5173",
      `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`,
    ];
    if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// Ensure upload directories exist
fs.mkdirSync(path.join(__dirname, "uploads", "profile-pictures"), { recursive: true });
fs.mkdirSync(path.join(__dirname, "uploads", "member-images"), { recursive: true });

// Static file serving
app.use("/charters", express.static(path.join(__dirname, "routes", "forms", "charters")));
app.use("/insurance", express.static(path.join(__dirname, "routes", "forms", "insurance")));
app.use("/client_charters", express.static(path.join(__dirname, "routes", "forms", "client_charters")));
app.use("/uploads/profile-pictures", express.static(path.join(__dirname, "uploads", "profile-pictures")));
app.use("/uploads/member-images", express.static(path.join(__dirname, "uploads", "member-images")));

// Middleware for parsing — AFTER webhook
app.use(bodyParser.json());
app.use(fileUpload());

// --- HTTP & WebSocket server ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const connectedClients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket server");
  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === "join_village") {
        ws.village = msg.village;
        connectedClients.add(ws);
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  });
  ws.on("close", () => connectedClients.delete(ws));
});

// --- Auth middleware ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    pool.query("SELECT village, role FROM users WHERE id = $1", [user.userId], (qErr, result) => {
      if (!qErr && result.rows.length) {
        req.user = { ...user, village: result.rows[0].village, role: result.rows[0].role };
      } else {
        req.user = user;
      }
      next();
    });
  });
};
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  next();
};
const authorizeVolunteer = (req, res, next) => {
  if (req.user.role !== "volunteer") return res.status(403).json({ error: "Unauthorized" });
  next();
};

// --- Routes ---
const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const clientRoutes = require("./routes/clientRoutes");
const adminRoutes = require("./routes/adminRoutes");
const miscRoutes = require("./routes/miscRoutes");

app.use("/", authRoutes(pool, bcrypt, jwt, sendPasswordResetEmail));
app.use(
  "/",
  volunteerRoutes(
    pool,
    authenticate,
    authorizeVolunteer,
    isValidTime,
    moment,
    connectedClients,
    WebSocket
  )
);
app.use("/", clientRoutes(pool, authenticate, moment, connectedClients, WebSocket, isValidTime));
app.use("/", adminRoutes(pool, authenticate, authorizeAdmin));
app.use("/", miscRoutes(pool));

// Fetch current user info
app.get("/fetchUser", authenticate, async (req, res) => {
  try {
    const result = await pool.query("SELECT village, role FROM users WHERE id = $1", [req.user.userId]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

app.get("/member-images", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, url FROM member_images ORDER BY uploaded_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching member images:", err);
    res.status(500).json({ error: "Failed to fetch member images" });
  }
});

// --- Start server ---
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(
    `WebSocket server running on ${isProduction ? `wss://chiensencavale.com` : `ws://localhost:${port}`}`
  );
});