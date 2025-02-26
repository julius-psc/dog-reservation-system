const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const moment = require("moment");

module.exports = (pool, bcrypt, jwt, sendPasswordResetEmail) => {
  // Register endpoint
  router.post("/register", async (req, res) => {
    const { username, password, email, role, village, address, phoneNumber } = req.body;

    // Enhanced validation for regular signup
    if (!username || !password || !email || !role || !village) {
      return res.status(400).json({
        error: "Username, password, email, role, and village are required",
      });
    }

    // Optional phone number validation
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: "Numéro de téléphone invalide",
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await pool.query(
        `INSERT INTO users (
              username, 
              password, 
              email, 
              role, 
              village, 
              address, 
              phone_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING 
              id, 
              username, 
              email, 
              role, 
              village, 
              address, 
              phone_number`,
        [username, hashedPassword, email, role, village, address, phoneNumber]
      );

      res.status(201).json({
        message: "User registered successfully",
        user: newUser.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        const detail = error.detail.toLowerCase();
        if (detail.includes("username")) {
          return res.status(409).json({ error: "Ce nom d'utilisateur est déjà utilisé" });
        }
        if (detail.includes("email")) {
          return res.status(409).json({ error: "Cet email est déjà enregistré" });
        }
        return res.status(409).json({ error: "Violation de données uniques" });
      }
      console.error("Registration error:", error);
      res.status(500).json({
        error: "Échec de l'inscription",
        details: error.message,
      });
    }
  });

  // Login endpoint
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Veuillez entrer un nom d'utilisateur et un mot de passe." });
    }

    try {
      const userResult = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "Nom d'utilisateur / Mot de passe incorrect" });
      }

      const user = userResult.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Nom d'utilisateur / Mot de passe incorrect" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "Strict",
      });
      res.json({
        message: "Connexion réussie!",
        token: token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Échec de la connexion", details: error.message });
    }
  });

  // Logout endpoint (clear cookie)
  router.post("/logout", (req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "Strict" });
    res.json({ message: "Déconnexion réussie" });
  });

  router.post("/forgot-password", async (req, res) => {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: "Email ou nom d'utilisateur requis" });
    }

    try {
      const userResult = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR username = $2",
        [usernameOrEmail, usernameOrEmail]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      const user = userResult.rows[0];

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiration = moment().add(1, "hour").toISOString();

      await pool.query(
        "UPDATE users SET reset_password_token = $1, reset_password_expiry = $2 WHERE id = $3",
        [resetToken, resetTokenExpiration, user.id]
      );

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      await sendPasswordResetEmail(user.email, resetLink);

      res.json({ message: "Email de réinitialisation envoyé" });
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  router.post("/reset-password/:token", async (req, res) => {
    const { token, newPassword } = req.body;

    try {
      const userResult = await pool.query(
        "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expiry > NOW()",
        [token]
      );

      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: "Token invalide ou expiré" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expiry = NULL WHERE id = $2",
        [hashedPassword, userResult.rows[0].id]
      );

      res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (error) {
      console.error("Erreur de réinitialisation du mot de passe :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  return router;
};