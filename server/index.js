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
moment.locale("fr");

require("dotenv").config();

const path = require("path");

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
app.use("/charters", express.static(path.join(__dirname, "routes", "forms", "charters")));
app.use("/insurance", express.static(path.join(__dirname, "routes", "forms", "insurance")));
app.use("/client_charters", express.static(path.join(__dirname, "routes", "forms", "client_charters")));
app.use("/uploads/profile-pictures", express.static(path.join(__dirname, "uploads", "profile-pictures"))); // Add this line
app.use(bodyParser.json());
app.use(fileUpload());

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err);
  });

const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === "production";
const wss = new WebSocket.Server({ server });

const connectedClients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket server");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "join_village") {
        ws.village = parsedMessage.village;
        connectedClients.add(ws);
      }
    } catch (error) {
      console.error("Error parsing message or joining village:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    connectedClients.delete(ws);
  });
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      pool.query("SELECT village FROM users WHERE id = $1", [user.userId], (err, result) => {
        if (err || result.rows.length === 0) {
          console.error("Error fetching user village:", err);
          req.user = user;
        } else {
          req.user = { ...user, village: result.rows[0].village };
        }
        next();
      });
    });
  } else {
    res.status(401).json({ error: "No token provided" });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Unauthorized: Only admins can access this." });
  }
  next();
};

const authorizeVolunteer = (req, res, next) => {
  if (req.user.role !== "volunteer") {
    return res.status(403).json({ error: "Unauthorized: Only volunteers can access this." });
  }
  next();
};

const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const clientRoutes = require("./routes/clientRoutes");
const adminRoutes = require("./routes/adminRoutes");
const miscRoutes = require("./routes/miscRoutes");

app.use("/", authRoutes(pool, bcrypt, jwt, sendPasswordResetEmail));
app.use("/", volunteerRoutes(pool, authenticate, authorizeVolunteer, isValidTime, moment, connectedClients, WebSocket));
app.use("/", clientRoutes(pool, authenticate, moment, connectedClients, WebSocket, isValidTime));
app.use("/", adminRoutes(pool, authenticate, authorizeAdmin));
app.use("/", miscRoutes(pool));

app.get("/fetchUser", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userResult = await pool.query("SELECT village FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`WebSocket server running on ${isProduction ? "wss://chiensencavale.com" : "ws://localhost:" + port}`);
});