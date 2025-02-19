const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const moment = require("moment");
const fileUpload = require('express-fileupload');
moment.locale("fr");

require("dotenv").config();

const path = require('path');

// Import email service module and the sendPasswordResetEmail function
const emailService = require('./email/emailService');
const sendPasswordResetEmail = emailService.sendPasswordResetEmail;

function isValidTime(time) {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) return false; // Basic format check

    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);

    return hoursNum >= 0 && hoursNum <= 23 && minutesNum >= 0 && minutesNum <= 59; // Check range
}

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration (important!)
const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"], // Include 'Authorization'
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(fileUpload());

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER, // Use environment variables for database credentials
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false, // Keep for development, consider removing or configuring for production
    },
});

// Test the database connection
pool
    .connect()
    .then(() => {
        console.log("Connected to PostgreSQL database");
    })
    .catch((err) => {
        console.error("Error connecting to PostgreSQL:", err);
    });


// Initialize WS server
const wss = new WebSocket.Server({ port: 8081 });

// Keep track of connected clients
const connectedClients = new Set();

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (message) => {
        console.log(`Received: ${message}`);
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === "join_village") {
                ws.village = parsedMessage.village; // Store the village for this client
                connectedClients.add(ws); // Add to connectedClients *after* setting village
            }
        } catch (error) {
            console.error("Error parsing message or joining village", error);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        connectedClients.delete(ws); // Remove client from the set
    });
});

// ------------------ AUTHENTICATION MIDDLEWARE ---------------------- //

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

// PROTECTING ROUTES
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res
            .status(403)
            .json({ error: "Unauthorized: Only admins can access this." });
    }
    next();
};

const authorizeVolunteer = (req, res, next) => {
    if (req.user.role !== "volunteer") {
        return res
            .status(403)
            .json({ error: "Unauthorized: Only volunteers can access this." });
    }
    next();
};

// ------------------ ROUTE MODULES ---------------------- //
const authRoutes = require('./routes/authRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const clientRoutes = require('./routes/clientRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount route modules - keep the base path as '/' to maintain existing endpoints
app.use('/', authRoutes(pool, bcrypt, jwt, sendPasswordResetEmail)); // Pass sendPasswordResetEmail function (now imported from emailService)
app.use('/', volunteerRoutes(pool, authenticate, authorizeVolunteer, isValidTime, moment, connectedClients, WebSocket));
app.use('/', clientRoutes(pool, authenticate, moment, connectedClients, WebSocket, isValidTime));
app.use('/', adminRoutes(pool, authenticate, authorizeAdmin));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});