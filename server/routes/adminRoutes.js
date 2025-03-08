const express = require("express");
const router = express.Router();
const { sendApprovalEmail } = require("../email/emailService.js");
const moment = require("moment");

module.exports = (pool, authenticate, authorizeAdmin) => {
  // GET ALL VOLUNTEERS (ADMIN)
  router.get("/admins/volunteers", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const { village, role } = req.query; // Optional filters

      let query = `
        SELECT
            u.id,
            u.username,
            u.email,
            u.village,
            u.volunteer_status,
            u.charter_file_path,
            u.insurance_file_path,
            u.subscription_paid,
            u.villages_covered,
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
            u.village,
            u.volunteer_status,
            u.charter_file_path,
            u.insurance_file_path,
            u.subscription_paid,
            u.villages_covered
      `;

      const volunteers = await pool.query(query, queryParams);
      res.json(volunteers.rows || []);
    } catch (error) {
      console.error("Error fetching volunteers (admin):", error);
      res.status(500).json({
        error: "Failed to fetch volunteers",
        details: error.message,
      });
    }
  });

  // GET ALL USERS (ADMIN)
  router.get("/admin/all-users", authenticate, async (req, res) => {
    try {
      const adminCheck = await pool.query("SELECT role FROM users WHERE id = $1", [req.user.userId]);
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
          charter_file_path, 
          insurance_file_path,
          subscription_paid,
          villages_covered 
        FROM users
      `);
      res.json(users.rows);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users", details: error.message });
    }
  });

  // UPDATE USER ROLE (ADMIN)
  router.put("/admin/users/:userId/role", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { newRole } = req.body;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (!newRole || !["client", "volunteer", "admin"].includes(newRole.toLowerCase())) {
        return res.status(400).json({
          error: "Invalid user role. Must be 'client', 'volunteer', or 'admin'",
        });
      }

      const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
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
        res.status(404).json({ error: "User not found or role update failed" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role", details: error.message });
    }
  });

  // FETCH RESERVATIONS (ADMIN)
  router.get("/admin/reservations", authenticate, authorizeAdmin, async (req, res) => {
    try {
      const reservations = await pool.query(`
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

      // Update status to "completed" for past accepted reservations
      const now = moment();
      const updatedReservations = reservations.rows.map((reservation) => {
        const endDateTime = moment(
          `${reservation.reservation_date} ${reservation.end_time}`,
          "YYYY-MM-DD HH:mm"
        );
        if (endDateTime.isBefore(now) && reservation.status === "accepted") {
          return { ...reservation, status: "completed" };
        }
        return reservation;
      });

      res.json(updatedReservations);
    } catch (error) {
      console.error("Error fetching all reservations:", error);
      res.status(500).json({ error: "Failed to fetch reservations", details: error.message });
    }
  });

  // ADMIN APPROVE/REJECT VOLUNTEER APPLICATION
  router.put("/admin/volunteers/:volunteerId/status", authenticate, authorizeAdmin, async (req, res) => {
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
        return res.status(404).json({ error: "Volunteer not found or not a volunteer role" });
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
        res.status(404).json({ error: "Volunteer not found or status update failed" });
      }
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      res.status(500).json({ error: "Failed to update volunteer status", details: error.message });
    }
  });

  // SEND VOLUNTEER APPROVAL EMAIL
  router.post("/send-approval-email", authenticate, authorizeAdmin, async (req, res) => {
    const { email, username } = req.body;

    try {
      await sendApprovalEmail(email, username);
      res.status(200).json({ message: "Approval email sent successfully" });
    } catch (error) {
      console.error("Error sending approval email:", error);
      res.status(500).json({ error: "Failed to send approval email", details: error.message });
    }
  });

  // FETCH OTHER VILLAGE REQUESTS
  router.get("/admin/other-village-requests", authenticate, authorizeAdmin, async (req, res) => {
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
  });

  return router;
};