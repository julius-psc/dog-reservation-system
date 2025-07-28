const express = require("express");
const router = express.Router();
const { sendApprovalEmail } = require("../email/emailService.js");
const moment = require("moment");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

module.exports = (pool, authenticate, authorizeAdmin) => {
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

  // Fetch all volunteers (admin view)
  router.get(
    "/admins/volunteers",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { village, role } = req.query;
        let query = `
          SELECT
            u.id,
            u.username,
            u.email,
            u.phone_number,
            u.village,
            u.volunteer_status,
            u.insurance_file_path,
            u.address,
            u.subscription_paid,
            u.villages_covered,
            u.personal_id,
            u.is_adult,
            u.commitments,
            COALESCE(json_agg(
              json_build_object(
                'day_of_week', a.day_of_week,
                'start_time', a.start_time,
                'end_time', a.end_time
              )
            ) FILTER (WHERE a.id IS NOT NULL), '[]') AS availabilities
          FROM users u
          LEFT JOIN availabilities a ON u.id = a.user_id
          WHERE u.role = 'volunteer'
        `;
        const where = [];
        const params = [];
        if (village) {
          params.push(village);
          where.push(`u.village = $${params.length}`);
        }
        if (role) {
          params.push(role);
          where.push(`u.role = $${params.length}`);
        }
        if (where.length) query += " AND " + where.join(" AND ");
        query +=
          " GROUP BY u.id, u.username, u.email, u.phone_number, u.village, u.volunteer_status, u.insurance_file_path, u.address, u.subscription_paid, u.villages_covered, u.personal_id, u.is_adult, u.commitments";
        const result = await pool.query(query, params);
        res.json(result.rows);
      } catch (err) {
        console.error("Error fetching volunteers (admin):", err);
        res.status(500).json({ error: "Failed to fetch volunteers" });
      }
    }
  );

  // Set personal ID for volunteer
  router.put(
    "/admin/volunteers/:volunteerId/personal-id",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { volunteerId } = req.params;
        const { personal_id } = req.body;
        if (
          !personal_id ||
          typeof personal_id !== "string" ||
          personal_id.length > 50
        ) {
          return res.status(400).json({ error: "Invalid personal_id" });
        }
        const check = await pool.query(
          "SELECT personal_id_set FROM users WHERE id = $1 AND role='volunteer'",
          [volunteerId]
        );
        if (!check.rows.length)
          return res.status(404).json({ error: "Volunteer not found" });
        if (check.rows[0].personal_id_set)
          return res.status(403).json({ error: "Personal ID already set" });
        await pool.query(
          "UPDATE users SET personal_id=$1, personal_id_set=TRUE WHERE id=$2",
          [personal_id, volunteerId]
        );
        res.json({ message: "Personal ID set" });
      } catch (err) {
        console.error("Error setting personal ID:", err);
        res.status(500).json({ error: "Failed to set personal ID" });
      }
    }
  );

  // Fetch all users
router.get(
  "/admin/all-users",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const search = req.query.search || "";
      const role = req.query.role;
      const village = req.query.village;
      const limit = parseInt(req.query.limit || "10", 10);
      const offset = parseInt(req.query.offset || "0", 10);

      const conditions = [];
      const params = [];

      if (search) {
        conditions.push(`username ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
      }

      if (role && role !== "all") {
        conditions.push(`role = $${params.length + 1}`);
        params.push(role);
      }

      if (village) {
        const idx1 = params.length + 1;
        const idx2 = params.length + 2;
        params.push(village, JSON.stringify([village]));
        conditions.push(`(village = $${idx1} OR villages_covered @> $${idx2}::jsonb)`);
      }

      const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

      const query = `
        SELECT id, username, email, role, village, no_risk_confirmed, unable_to_walk_confirmed, photo_permission
        FROM users
        ${whereClause}
        ORDER BY username
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const users = await pool.query(query, params);
      res.json(users.rows);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// Fetch users count only
router.get(
  "/admin/users/count",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const search = req.query.search || "";
      const role = req.query.role;

      const conditions = [];
      const params = [];

      if (search) {
        conditions.push(`username ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
      }
      if (role && role !== "all") {
        conditions.push(`role = $${params.length + 1}`);
        params.push(role);
      }
      const whereClause = conditions.length
        ? "WHERE " + conditions.join(" AND ")
        : "";

      const result = await pool.query(
        `SELECT COUNT(*) AS count FROM users ${whereClause}`,
        params
      );

      res.json({ count: parseInt(result.rows[0].count, 10) });
    } catch (err) {
      console.error("Error fetching users count:", err);
      res.status(500).json({ error: "Failed to fetch users count" });
    }
  }
);

  router.get(
    "/admin/volunteers/count",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) FROM users WHERE role = 'volunteer'`
        );
        res.json({ count: parseInt(result.rows[0].count, 10) });
      } catch (err) {
        console.error("Error fetching volunteer count:", err);
        res.status(500).json({ error: "Failed to fetch volunteer count" });
      }
    }
  );

  // Update user role
  router.put(
    "/admin/users/:userId/role",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const { newRole } = req.body;
        if (!["client", "volunteer", "admin"].includes(newRole)) {
          return res.status(400).json({ error: "Invalid role" });
        }
        const updated = await pool.query(
          "UPDATE users SET role=$1 WHERE id=$2 RETURNING id, role",
          [newRole, userId]
        );
        if (!updated.rows.length)
          return res.status(404).json({ error: "User not found" });
        res.json(updated.rows[0]);
      } catch (err) {
        console.error("Error updating user role:", err);
        res.status(500).json({ error: "Failed to update role" });
      }
    }
  );

  // Delete user
  router.delete(
    "/admin/users/:userId",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { userId } = req.params;
        const deleted = await pool.query(
          "DELETE FROM users WHERE id=$1 RETURNING id, username",
          [userId]
        );
        if (!deleted.rows.length)
          return res.status(404).json({ error: "User not found" });
        res.json({ message: `User ${deleted.rows[0].username} deleted` });
      } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ error: "Failed to delete user" });
      }
    }
  );

  // Fetch all reservations (admin)
  router.get(
    "/admin/reservations",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`
          UPDATE reservations
          SET status = CASE
            WHEN status='accepted' AND (reservation_date+end_time::time)<NOW() THEN 'completed'
            WHEN status='pending' AND (reservation_date+end_time::time)<NOW() THEN 'cancelled'
            ELSE status
          END
          WHERE status IN ('accepted','pending') AND (reservation_date+end_time::time)<NOW()
        `);
        const result = await client.query(`
SELECT r.id, 
       u.username AS client_name, 
       v.username AS volunteer_name, 
       d.name AS dog_name,
       u.village AS client_village,
       r.reservation_date,
       TO_CHAR(r.start_time,'HH24:MI') AS start_time,
       TO_CHAR(r.end_time,'HH24:MI') AS end_time,
       r.status

          FROM reservations r
          JOIN users u ON r.client_id=u.id
          JOIN users v ON r.volunteer_id=v.id
          JOIN dogs d ON r.dog_id=d.id
          ORDER BY r.reservation_date, r.start_time
        `);
        await client.query("COMMIT");
        res.json(result.rows);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error fetching reservations:", err);
        res.status(500).json({ error: "Failed to fetch reservations" });
      } finally {
        client.release();
      }
    }
  );

  // Fetch reservation stats
  router.get(
    "/admin/reservations/stats",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const totalResult = await pool.query(
          "SELECT COUNT(*) FROM reservations"
        );

        const completedResult = await pool.query(
          "SELECT COUNT(*) FROM reservations WHERE status = 'completed'"
        );

        const offPlatformResult = await pool.query(
          "SELECT COALESCE(SUM(amount), 0) AS sum FROM off_platform_reservations WHERE type = 'completed'"
        );

        const monthlyResult = await pool.query(`
        SELECT TO_CHAR(reservation_date, 'YYYY-MM') AS month, COUNT(*) AS count
        FROM reservations
        WHERE status = 'completed'
        GROUP BY month
        ORDER BY month
      `);

        // ✅ FIXED: use SUM(amount) instead of COUNT(*) for correct adjustment logic
        const offPlatformMonthly = await pool.query(`
        SELECT TO_CHAR(updated_at, 'YYYY-MM') AS month, SUM(amount)::int AS count
        FROM off_platform_reservations
        WHERE type = 'completed'
        GROUP BY month
      `);

        const monthlyMap = new Map();
        monthlyResult.rows.forEach(({ month, count }) => {
          monthlyMap.set(month, parseInt(count, 10));
        });
        offPlatformMonthly.rows.forEach(({ month, count }) => {
          const existing = monthlyMap.get(month) || 0;
          monthlyMap.set(month, existing + count);
        });
        const mergedMonthly = Object.fromEntries(monthlyMap.entries());

        const yearlyResult = await pool.query(`
        SELECT EXTRACT(YEAR FROM reservation_date)::TEXT AS year, COUNT(*) AS count
        FROM reservations
        WHERE status = 'completed'
        GROUP BY year
        ORDER BY year
      `);

        res.json({
          total: parseInt(totalResult.rows[0].count, 10),
          completed:
            parseInt(completedResult.rows[0].count, 10) +
            parseInt(offPlatformResult.rows[0].sum, 10),
          off_platform_adjustments: parseInt(offPlatformResult.rows[0].sum, 10),
          monthly: mergedMonthly,
          yearly: Object.fromEntries(
            yearlyResult.rows.map((r) => [r.year, parseInt(r.count, 10)])
          ),
        });
      } catch (err) {
        console.error("Error fetching reservation stats:", err);
        res.status(500).json({ error: "Failed to fetch reservation stats" });
      }
    }
  );

  router.post(
    "/admin/reservations/offplatform-adjust",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      const { amount, type } = req.body;

      if (!Number.isInteger(amount) || !["completed"].includes(type)) {
        return res.status(400).json({ error: "Invalid adjustment data" });
      }

      try {
        const currentTotal = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS sum FROM off_platform_reservations WHERE type = 'completed'`
        );

        const newTotal = parseInt(currentTotal.rows[0].sum, 10) + amount;
        if (newTotal < 0) {
          return res.status(400).json({ error: "Total cannot go below zero" });
        }

        await pool.query(
          `
        INSERT INTO off_platform_reservations (type, amount, updated_at)
        VALUES ($1, $2, NOW())
      `,
          [type, amount]
        );

        res.json({ message: "Adjustment applied" });
      } catch (err) {
        console.error("Error applying off-platform adjustment:", err);
        res.status(500).json({ error: "Failed to apply adjustment" });
      }
    }
  );

  // Update volunteer status
  router.put(
    "/admin/volunteers/:volunteerId/status",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { volunteerId } = req.params;
        const { status } = req.body;
        if (!["approved", "pending", "rejected"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        const updated = await pool.query(
          "UPDATE users SET volunteer_status=$1 WHERE id=$2 RETURNING id, volunteer_status",
          [status, volunteerId]
        );
        if (!updated.rows.length)
          return res.status(404).json({ error: "Volunteer not found" });
        res.json(updated.rows[0]);
      } catch (err) {
        console.error("Error updating volunteer status:", err);
        res.status(500).json({ error: "Failed to update status" });
      }
    }
  );

  // Send approval email
  router.post(
    "/send-approval-email",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { email, username } = req.body;
        await sendApprovalEmail(email, username);
        res.json({ message: "Approval email sent" });
      } catch (err) {
        console.error("Error sending approval email:", err);
        res.status(500).json({ error: "Failed to send email" });
      }
    }
  );

  // Other village requests
  router.get(
    "/admin/other-village-requests",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const result = await pool.query(
          "SELECT id, name, email, phone_number, desired_village, request_date FROM other_village_requests ORDER BY request_date DESC"
        );
        res.json(result.rows);
      } catch (err) {
        console.error("Error fetching village requests:", err);
        res.status(500).json({ error: "Failed to fetch requests" });
      }
    }
  );

  router.delete(
    "/admin/other-village-requests/:id",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query(
          "DELETE FROM other_village_requests WHERE id = $1 RETURNING *",
          [id]
        );
        if (result.rowCount === 0) {
          return res.status(404).json({ error: "Demande non trouvée" });
        }
        res.json({ message: "Demande supprimée" });
      } catch (err) {
        console.error("Error deleting village request:", err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
      }
    }
  );

  // Minimal volunteers
  router.get(
    "/admins/volunteers/minimal",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { village, search, status, limit = 10, offset = 0 } = req.query;
        let query = `SELECT u.id, u.username, u.volunteer_status, u.personal_id FROM users u WHERE u.role='volunteer'`;
        const where = [];
        const params = [];
        if (village) {
          params.push(village);
          where.push(`u.village=$${params.length}`);
        }
        if (search) {
          params.push(`%${search}%`);
          where.push(`u.username ILIKE $${params.length}`);
        }
        if (status) {
          params.push(status);
          where.push(`u.volunteer_status=$${params.length}`);
        }
        if (where.length) query += " AND " + where.join(" AND ");
        params.push(limit, offset);
        query += ` ORDER BY u.username LIMIT $${params.length - 1} OFFSET $${
          params.length
        }`;
        const result = await pool.query(query, params);
        res.json(result.rows);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch minimal volunteers" });
      }
    }
  );

  // Detailed volunteer
  router.get(
    "/admin/volunteers/:id",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const query = `
  SELECT u.id, u.username, u.email, u.phone_number, u.village, u.volunteer_status,
    u.insurance_file_path, u.address, u.subscription_paid, u.villages_covered,
    u.personal_id, u.is_adult, u.commitments,
    COALESCE(json_agg(json_build_object('day_of_week', a.day_of_week, 'start_time', a.start_time, 'end_time', a.end_time)) FILTER (WHERE a.id IS NOT NULL), '[]') AS availabilities
  FROM users u
  LEFT JOIN availabilities a ON u.id=a.user_id
  WHERE u.id=$1 AND u.role='volunteer'
  GROUP BY u.id, u.username, u.email, u.phone_number, u.village, u.volunteer_status,
           u.insurance_file_path, u.address, u.subscription_paid, u.villages_covered,
           u.personal_id, u.is_adult, u.commitments
`;

        const result = await pool.query(query, [id]);
        if (!result.rows.length)
          return res.status(404).json({ error: "Volunteer not found" });
        res.json(result.rows[0]);
      } catch (err) {
        console.error("Error fetching volunteer details:", err);
        res.status(500).json({ error: "Failed to fetch details" });
      }
    }
  );

  // Member image endpoints

  router.post(
    "/admin/member-images",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        if (!req.files || !req.files.image) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.files.image;
        const filename = `member_${Date.now()}.png`;
        const buffer = await sharp(file.data).resize(200, 200).png().toBuffer();

        let url;

        if (isProduction) {
          const key = `member-images/${filename}`;
          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: key,
              Body: buffer,
              ContentType: "image/png",
            })
          );

          url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } else {
          const uploadPath = path.join(
            __dirname,
            "..",
            "uploads",
            "member-images",
            filename
          );
          await fs.promises.writeFile(uploadPath, buffer);
          url = `/uploads/member-images/${filename}`;
        }

        const insert = await pool.query(
          "INSERT INTO member_images (url) VALUES ($1) RETURNING id, url",
          [url]
        );

        res.json(insert.rows[0]);
      } catch (err) {
        console.error("Image upload error:", err);
        res.status(500).json({ error: "Failed to upload image" });
      }
    }
  );

  router.delete(
    "/admin/member-images/:id",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query(
          "DELETE FROM member_images WHERE id=$1 RETURNING url",
          [id]
        );
        if (!result.rows.length)
          return res.status(404).json({ error: "Not found" });
        res.json({ message: "Deleted" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete image" });
      }
    }
  );

  // Set volunteer availabilities
  router.put(
  "/admin/volunteers/:volunteerId/availabilities",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { volunteerId } = req.params;
      const availabilities = req.body;

      if (!Array.isArray(availabilities)) {
        return res.status(400).json({ error: "Invalid availabilities format" });
      }

      await pool.query("DELETE FROM availabilities WHERE user_id = $1", [
        volunteerId,
      ]);

      for (const { dayOfWeek, startTime, endTime } of availabilities) {
        if (
          typeof dayOfWeek !== "number" ||
          dayOfWeek < 1 ||
          dayOfWeek > 7 ||
          typeof startTime !== "string" ||
          typeof endTime !== "string"
        ) {
          return res.status(400).json({ error: "Invalid availability data" });
        }

        await pool.query(
          "INSERT INTO availabilities (user_id, day_of_week, start_time, end_time, recurring) VALUES ($1, $2, $3, $4, $5)",
          [volunteerId, dayOfWeek, startTime, endTime, true]
        );
      }

      res.json({ message: "Availabilities updated successfully" });
    } catch (err) {
      console.error("Admin update availabilities error:", err);
      res.status(500).json({ error: "Failed to update availabilities" });
    }
  }
);

// Get volunteer reservation count
router.get(
  "/admin/volunteer/reservations-count",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT volunteer_id, COUNT(*) AS count
        FROM reservations
        WHERE status = 'completed' AND volunteer_id IS NOT NULL
        GROUP BY volunteer_id
      `);

      const counts = {};
      result.rows.forEach(({ volunteer_id, count }) => {
        counts[volunteer_id] = parseInt(count, 10);
      });

      res.json(counts);
    } catch (err) {
      console.error("Error fetching volunteer reservation counts:", err);
      res.status(500).json({ error: "Failed to fetch reservation counts" });
    }
  }
);
  return router;
};