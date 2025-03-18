const express = require("express");
const router = express.Router();
const { sendApprovalEmail } = require("../email/emailService.js");
const moment = require("moment");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const path = require("path");

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

  router.get("/admins/volunteers", authenticate, authorizeAdmin, async (req, res) => {
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
  
      const whereClause = [];
      const queryParams = [];
  
      if (village) {
        whereClause.push(`u.village = $${queryParams.length + 1}`);
        queryParams.push(village);
      }
      if (role) {
        whereClause.push(`u.role = $${queryParams.length + 1}`);
        queryParams.push(role);
      }
  
      if (whereClause.length > 0) {
        query += " AND " + whereClause.join(" AND ");
      }
  
      query += `
        GROUP BY
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
          u.commitments
      `;
  
      const volunteersResult = await pool.query(query, queryParams);
      res.json(volunteersResult.rows || []);
    } catch (error) {
      console.error("Error fetching volunteers (admin):", error);
      res.status(500).json({
        error: "Failed to fetch volunteers",
        details: error.message,
      });
    }
  });

  router.put(
    "/admin/volunteers/:volunteerId/personal-id",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const volunteerId = req.params.volunteerId;
        const { personal_id } = req.body;

        if (!volunteerId) {
          return res.status(400).json({ error: "Invalid volunteer ID" });
        }

        if (
          !personal_id ||
          typeof personal_id !== "string" ||
          personal_id.length > 50
        ) {
          return res.status(400).json({
            error: "Invalid personal_id. Must be a string with maximum length of 50 characters.",
          });
        }

        const volunteerCheck = await pool.query(
          "SELECT personal_id, personal_id_set FROM users WHERE id = $1 AND role = 'volunteer'",
          [volunteerId]
        );

        if (volunteerCheck.rows.length === 0) {
          return res.status(404).json({ error: "Volunteer not found" });
        }

        const { personal_id: existingId, personal_id_set } = volunteerCheck.rows[0];
        if (personal_id_set) {
          return res.status(403).json({
            error: "Personal ID has already been set and cannot be changed.",
          });
        }

        const uniqueCheck = await pool.query(
          "SELECT id FROM users WHERE personal_id = $1 AND id != $2",
          [personal_id, volunteerId]
        );
        if (uniqueCheck.rows.length > 0) {
          return res.status(400).json({ error: "Personal ID must be unique." });
        }

        const updatedVolunteer = await pool.query(
          "UPDATE users SET personal_id = $1, personal_id_set = TRUE WHERE id = $2 RETURNING *",
          [personal_id, volunteerId]
        );

        if (updatedVolunteer.rows.length > 0) {
          res.json({
            message: "Personal ID set successfully",
            volunteer: updatedVolunteer.rows[0],
          });
        } else {
          res.status(500).json({ error: "Failed to set personal ID" });
        }
      } catch (error) {
        console.error("Error setting personal ID:", error);
        res.status(500).json({
          error: "Failed to set personal ID",
          details: error.message,
        });
      }
    }
  );

  router.get("/admin/all-users", authenticate, async (req, res) => {
    try {
      const adminCheck = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [req.user.userId]
      );
      if (adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }
  
      const users = await pool.query(`
        SELECT 
          id,
          username,
          email,
          role,
          village,
          volunteer_status,
          insurance_file_path,
          subscription_paid,
          villages_covered,
          personal_id,
          is_adult,
          commitments,
          no_risk_confirmed,
          unable_to_walk_confirmed,
          photo_permission
        FROM users
      `);
      res.json(users.rows);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
  });

  router.put(
    "/admin/users/:userId/role",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const userId = req.params.userId;
        const { newRole } = req.body;

        if (!userId || isNaN(userId)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }

        if (
          !newRole ||
          !["client", "volunteer", "admin"].includes(newRole.toLowerCase())
        ) {
          return res.status(400).json({
            error: "Invalid user role. Must be 'client', 'volunteer', or 'admin'",
          });
        }

        const userCheck = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [userId]
        );
        if (userCheck.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await pool.query(
          "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
          [newRole, userId]
        );

        if (updatedUser.rows.length > 0) {
          res.json({
            message: `User role updated to ${newRole}`,
            user: updatedUser.rows[0],
          });
        } else {
          res.status(404).json({
            error: "User not found or role update failed",
          });
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({
          error: "Failed to update user role",
          details: error.message,
        });
      }
    }
  );  

  router.delete(
    "/admin/users/:userId",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const userId = req.params.userId;

        if (!userId || typeof userId !== "string" || !userId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
          return res.status(400).json({ error: "Invalid user ID format. Must be a valid UUID." });
        }

        const userCheck = await pool.query(
          "SELECT id FROM users WHERE id = $1",
          [userId]
        );
        if (userCheck.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const deletedUser = await pool.query(
          "DELETE FROM users WHERE id = $1 RETURNING id, username",
          [userId]
        );

        if (deletedUser.rows.length > 0) {
          res.json({
            message: `User ${deletedUser.rows[0].username} deleted successfully`,
            userId: deletedUser.rows[0].id,
          });
        } else {
          res.status(500).json({ error: "Failed to delete user" });
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
          error: "Failed to delete user",
          details: error.message,
        });
      }
    }
  );

  router.get("/admin/reservations", authenticate, authorizeAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update past reservations in the database
      await client.query(
        `
        UPDATE reservations
        SET status = CASE
          WHEN status = 'accepted' AND (reservation_date + end_time::time) < NOW() THEN 'completed'
          WHEN status = 'pending' AND (reservation_date + end_time::time) < NOW() THEN 'cancelled'
          ELSE status
        END
        WHERE status IN ('accepted', 'pending')
        AND (reservation_date + end_time::time) < NOW()
      `
      );

      const reservations = await client.query(`
        SELECT
          r.id,
          u.username AS client_name,
          v.username AS volunteer_name,
          d.name AS dog_name,
          r.reservation_date,
          TO_CHAR(r.start_time, 'HH24:MI') AS start_time,
          TO_CHAR(r.end_time, 'HH24:MI') AS end_time,
          r.status,
          u.village AS client_village
        FROM reservations r
        JOIN users u ON r.client_id = u.id
        JOIN users v ON r.volunteer_id = v.id
        JOIN dogs d ON r.dog_id = d.id
        ORDER BY r.reservation_date, r.start_time
      `);

      await client.query("COMMIT");
      res.json(reservations.rows);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error fetching all reservations:", error);
      res.status(500).json({
        error: "Failed to fetch reservations",
        details: error.message,
      });
    } finally {
      client.release();
    }
  });

  router.put(
    "/admin/volunteers/:volunteerId/status",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const volunteerId = req.params.volunteerId;
        const { status } = req.body;

        if (!["approved", "pending", "rejected"].includes(status)) {
          return res.status(400).json({
            error: "Invalid status. Must be 'approved', 'pending', or 'rejected'",
          });
        }

        const currentStatusCheck = await pool.query(
          "SELECT volunteer_status FROM users WHERE id = $1 AND role = 'volunteer'",
          [volunteerId]
        );

        if (currentStatusCheck.rows.length === 0) {
          return res.status(404).json({
            error: "Volunteer not found or not a volunteer role",
          });
        }

        const updatedVolunteer = await pool.query(
          "UPDATE users SET volunteer_status = $1 WHERE id = $2 AND role = 'volunteer' RETURNING *",
          [status, volunteerId]
        );

        if (updatedVolunteer.rows.length > 0) {
          res.json({
            message: `Volunteer status updated to ${status}`,
            volunteer: updatedVolunteer.rows[0],
          });
        } else {
          res.status(404).json({
            error: "Volunteer not found or status update failed",
          });
        }
      } catch (error) {
        console.error("Error updating volunteer status:", error);
        res.status(500).json({
          error: "Failed to update volunteer status",
          details: error.message,
        });
      }
    }
  );

  router.post(
    "/send-approval-email",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      const { email, username } = req.body;

      try {
        await sendApprovalEmail(email, username);
        res.status(200).json({ message: "Approval email sent successfully" });
      } catch (error) {
        console.error("Error sending approval email:", error);
        res.status(500).json({
          error: "Failed to send approval email",
          details: error.message,
        });
      }
    }
  );

  router.get(
    "/admin/other-village-requests",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const query = `
          SELECT id, name, email, phone_number, desired_village, request_date 
          FROM other_village_requests 
          ORDER BY request_date DESC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
      } catch (error) {
        console.error("Error fetching other village requests:", error);
        res.status(500).json({
          error: "Failed to fetch other village requests",
          details: error.message,
        });
      }
    }
  );

  router.get("/admins/volunteers/minimal", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { village, search, status, limit = 10, offset = 0 } = req.query;
  
      let query = `
        SELECT
          u.id,
          u.username,
          u.volunteer_status,
          u.personal_id
        FROM users u
        WHERE u.role = 'volunteer'
      `;
  
      const whereClause = [];
      const queryParams = [];
  
      if (village) {
        whereClause.push(`u.village = $${queryParams.length + 1}`);
        queryParams.push(village);
      }
      if (search) {
        whereClause.push(`u.username ILIKE $${queryParams.length + 1}`);
        queryParams.push(`%${search}%`);
      }
      if (status) {
        whereClause.push(`u.volunteer_status = $${queryParams.length + 1}`);
        queryParams.push(status);
      }
  
      if (whereClause.length > 0) {
        query += " AND " + whereClause.join(" AND ");
      }
  
      query += `
        ORDER BY u.username
        LIMIT $${queryParams.length + 1}
        OFFSET $${queryParams.length + 2}
      `;
      queryParams.push(limit, offset);
  
      const volunteersResult = await pool.query(query, queryParams);
      res.json(volunteersResult.rows || []);
    } catch (error) {
      console.error("Error fetching minimal volunteers:", error);
      res.status(500).json({ error: "Failed to fetch volunteers", details: error.message });
    }
  });

  router.get("/admin/volunteers/:id", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const volunteerId = req.params.id;

      const query = `
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
        WHERE u.id = $1 AND u.role = 'volunteer'
        GROUP BY
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
          u.commitments
      `;

      const volunteerResult = await pool.query(query, [volunteerId]);

      if (volunteerResult.rows.length === 0) {
        return res.status(404).json({ error: "Volunteer not found" });
      }

      res.json(volunteerResult.rows[0]);
    } catch (error) {
      console.error("Error fetching volunteer details (admin):", error);
      res.status(500).json({
        error: "Failed to fetch volunteer details",
        details: error.message,
      });
    }
  });

  return router;
};