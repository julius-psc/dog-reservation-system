const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const moment = require("moment");
const path = require("path"); // For local file handling and file extension
const fs = require("fs").promises; // For local file operations
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); // AWS S3 SDK
const { sendAdminDocumentSubmissionEmail } = require("../email/emailService"); // Import email service

module.exports = (pool, bcrypt, jwt, sendPasswordResetEmail) => {
  // Initialize S3 client based on environment
  const isProduction = process.env.NODE_ENV === "production";
  const s3Client = isProduction
    ? new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

  // Register endpoint
  router.post("/register", async (req, res) => {
    const {
      username,
      password,
      email,
      role,
      village,
      address,
      phoneNumber,
      isAdult,
      commitments,
      noRiskConfirmed,
      unableToWalkConfirmed,
      photoPermission,
    } = req.body;
    const insuranceFile = req.files?.insurance;

    // Base validation for all roles
    if (!username || !password || !email || !role || !village) {
      return res.status(400).json({ error: "Tous les champs de base requis doivent être fournis" });
    }

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Numéro de téléphone invalide (10 chiffres requis)" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      let insurancePath;

      const baseUrl = isProduction
        ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`
        : `http://localhost:${process.env.PORT || 3000}`;

      // Role-specific logic
      if (role === "volunteer") {
        // Volunteer-specific validation
        if (isAdult === undefined || !commitments || !insuranceFile) {
          return res.status(400).json({
            error: "Tous les champs requis pour les bénévoles doivent être fournis, y compris l'assurance",
          });
        }

        if (!Object.values(JSON.parse(commitments)).every((val) => val)) {
          return res.status(400).json({ error: "Tous les engagements doivent être acceptés" });
        }

        const insuranceFilename = `insurance_${username}_${Date.now()}${path.extname(insuranceFile.name)}`;

        if (isProduction) {
          const uploadToS3 = async (file, key) => {
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `insurance/${key}`,
              Body: file.data,
              ContentType: file.mimetype,
            };
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            return `${baseUrl}/insurance/${key}`;
          };
          insurancePath = await uploadToS3(insuranceFile, insuranceFilename);
        } else {
          const insuranceUploadDir = path.join(__dirname, "../forms/insurance");
          await fs.mkdir(insuranceUploadDir, { recursive: true });
          insurancePath = `/insurance/${insuranceFilename}`;
          const insuranceFullPath = path.join(insuranceUploadDir, insuranceFilename);
          await insuranceFile.mv(insuranceFullPath);
          insurancePath = `${baseUrl}${insurancePath}`;
        }
      } else if (role === "client") {
        // Client-specific validation
        if (noRiskConfirmed === undefined || unableToWalkConfirmed === undefined) {
          return res.status(400).json({
            error: "Les attestations 'noRiskConfirmed' et 'unableToWalkConfirmed' sont requises pour les clients",
          });
        }
        if (!noRiskConfirmed || !unableToWalkConfirmed) {
          return res.status(400).json({
            error: "Vous devez cocher les cases 'noRiskConfirmed' et 'unableToWalkConfirmed'",
          });
        }
      }

      // Insert user based on role
      const query =
        role === "volunteer"
          ? `INSERT INTO users (
              username, password, email, role, village, address, phone_number, is_adult, commitments, volunteer_status, insurance_file_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, username, email, role, volunteer_status`
          : `INSERT INTO users (
              username, password, email, role, village, address, phone_number, no_risk_confirmed, unable_to_walk_confirmed, photo_permission
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, username, email, role`;

      const values =
        role === "volunteer"
          ? [
              username,
              hashedPassword,
              email,
              role,
              village,
              address,
              phoneNumber,
              isAdult,
              commitments,
              "pending",
              insurancePath,
            ]
          : [
              username,
              hashedPassword,
              email,
              role,
              village,
              address,
              phoneNumber,
              noRiskConfirmed,
              unableToWalkConfirmed,
              photoPermission || false, // Default to false if not provided
            ];

      const newUser = await pool.query(query, values);
      const token = jwt.sign({ userId: newUser.rows[0].id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

      if (role === "volunteer") {
        await sendAdminDocumentSubmissionEmail(
          "admin@example.com",
          username,
          null,
          insurancePath
        );
      }

      res.status(201).json({
        message: "Utilisateur enregistré avec succès",
        user: newUser.rows[0],
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === "23505") {
        const detail = error.detail.toLowerCase();
        if (detail.includes("username")) return res.status(409).json({ error: "Ce nom d'utilisateur est déjà utilisé" });
        if (detail.includes("email")) return res.status(409).json({ error: "Cet email est déjà enregistré" });
        return res.status(409).json({ error: "Violation de données uniques" });
      }
      res.status(500).json({ error: "Échec de l'inscription", details: error.message });
    }
  });

  // Login endpoint
  router.post("/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Veuillez entrer un identifiant (email ou nom d'utilisateur) et un mot de passe." });
    }

    try {
      const userResult = await pool.query(
        "SELECT * FROM users WHERE username = $1 OR email = $1",
        [identifier]
      );
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
      }

      const user = userResult.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
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
        message: "Connexion réussie !",
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

  router.get("/villages", async (req, res) => {
    try {
      const query = `
        SELECT DISTINCT village_name
        FROM (
          SELECT jsonb_array_elements_text(
            jsonb_build_array(village) || 
            COALESCE(villages_covered, '[]'::jsonb)
          ) AS village_name
          FROM users
          WHERE role = 'volunteer'
        ) AS villages
        WHERE village_name IS NOT NULL
      `;
      const result = await pool.query(query);

      const villages = result.rows.map((row) => row.village_name);
      res.json({ villages });
    } catch (error) {
      console.error("Error fetching villages:", error);
      res.status(500).json({ error: "Échec de la récupération des villages", details: error.message });
    }
  });

  return router;
};