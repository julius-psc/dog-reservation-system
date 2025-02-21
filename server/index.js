const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const moment = require("moment");
const fileUpload = require("express-fileupload");
const http = require("http"); // Add this for production WebSocket setup
moment.locale("fr");

require("dotenv").config();

const path = require("path");

// Import email service module
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
// Use the port provided by Render or default to 3001 for local development
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.PRODUCTION_URL || "http://localhost:3000", // Allow local dev URL as fallback
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(fileUpload());

// PostgreSQL connection pool
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

// Test database connection
pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err);
  });

// Create an HTTP server for Express
const server = http.createServer(app);

// Initialize WebSocket server
let wss;
const connectedClients = new Set();

if (process.env.NODE_ENV === "production") {
  // In production (Render), attach WebSocket to the same HTTP server as Express
  wss = new WebSocket.Server({ server });
} else {
  // In development, use a separate port for WebSocket (e.g., 8081)
  wss = new WebSocket.Server({ port: 8081 });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "join_village") {
        ws.village = parsedMessage.village;
        connectedClients.add(ws);
      }
    } catch (error) {
      console.error("Error parsing message or joining village", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    connectedClients.delete(ws);
  });
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "No token provided" });
  }
};

// Authorization middleware
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

// Route modules
const authRoutes = require("./routes/authRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const clientRoutes = require("./routes/clientRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Mount route modules with /api prefix
app.use("/", authRoutes(pool, bcrypt, jwt, sendPasswordResetEmail));
app.use("/", volunteerRoutes(pool, authenticate, authorizeVolunteer, isValidTime, moment, connectedClients, WebSocket));
app.use("/", clientRoutes(pool, authenticate, moment, connectedClients, WebSocket, isValidTime));
app.use("/", adminRoutes(pool, authenticate, authorizeAdmin));

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`WebSocket server running on port 8081 (development)`);
  } else {
    console.log(`WebSocket server running on port ${port} (production)`);
  }
});