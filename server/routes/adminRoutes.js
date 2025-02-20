const express = require("express");
const router = express.Router();
const { sendApprovalEmail } = require("../email/emailService.js");

module.exports = (pool, authenticate, authorizeAdmin) => {
  // GET ALL VOLUNTEERS (ADMIN)
  router.get(
    "/admins/volunteers",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
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

        // Group by all non-aggregated columns from the users table
        query += `
          GROUP BY
              u.id,
              u.username,
              u.email,
              u.village,
              u.volunteer_status,
              u.charter_file_path,
              u.insurance_file_path
        `;

        const volunteers = await pool.query(query, queryParams);
        res.json(volunteers.rows || []);
      } catch (error) {
        console.error("Error fetching volunteers (admin):", error);
        res.status(500).json({ 
          error: "Failed to fetch volunteers",
          details: error.message 
        });
      }
    }
  );

  // FETCH ALL USERS (Admin)
  router.get(
    "/admin/all-users",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const allUsers = await pool.query("SELECT * FROM users"); // Simple query to fetch all users
        res.json(allUsers.rows); // Return the rows as JSON
      } catch (error) {
        console.error("Error fetching all users (admin):", error);
        res.status(500).json({ error: "Failed to fetch all users" });
      }
    }
  );

  // UPDATE USER ROLE (Admin)
  router.put(
    "/admin/users/:userId/role",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const userId = req.params.userId;
        const { newRole } = req.body; // Get the new role from the request body

        // Validate userId (optional, but good practice)
        if (!userId || isNaN(userId)) {
          return res.status(400).json({ error: "Invalid user ID." });
        }

        // Validate newRole (important to prevent invalid roles)
        if (
          !newRole ||
          !["client", "volunteer", "admin"].includes(newRole.toLowerCase())
        ) {
          return res.status(400).json({
            error:
              "Invalid user role. Must be 'client', 'volunteer', or 'admin'.",
          });
        }

        // Check if user exists (optional, but good practice)
        const userCheck = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [userId]
        );
        if (userCheck.rows.length === 0) {
          return res.status(404).json({ error: "User not found." });
        }

        // Update the user role in the database
        const updatedUser = await pool.query(
          "UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
          [newRole, userId]
        );

        if (updatedUser.rows.length > 0) {
          res.json({
            message: `User role updated to ${newRole}.`,
            user: updatedUser.rows[0],
          });
        } else {
          res
            .status(404)
            .json({ error: "User not found or role update failed." }); // Should not happen if userCheck passed, but good to have
        }
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Failed to update user role" });
      }
    }
  );

  // FETCH RESERVATIONS (Admin)
  router.get(
    "/admin/reservations",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const reservations = await pool.query(`
  SELECT
      r.id,
      u.username AS client_name,
      v.username AS volunteer_name,
      d.name AS dog_name,
      r.reservation_date,
      TO_CHAR(r.start_time, 'HH24:MI') as start_time,
      TO_CHAR(r.end_time, 'HH24:MI') as end_time,
      r.status,
      u.village AS client_village  -- Add this line to fetch client's village
  FROM reservations r
  JOIN users u ON r.client_id = u.id
  JOIN users v ON r.volunteer_id = v.id
  JOIN dogs d ON r.dog_id = d.id
  ORDER BY r.reservation_date, r.start_time;
      `);
        res.json(reservations.rows);
      } catch (error) {
        console.error("Error fetching all reservations:", error);
        res.status(500).json({ error: "Failed to fetch reservations" });
      }
    }
  );

  // ADMIN APPROVE/REJECT VOLUNTEER APPLICATION
  router.put(
    "/admin/volunteers/:volunteerId/status",
    authenticate,
    authorizeAdmin,
    async (req, res) => {
      try {
        const volunteerId = req.params.volunteerId;
        const { status } = req.body; // Status can be 'approved', 'pending', or 'rejected'

        if (!["approved", "pending", "rejected"].includes(status)) {
          return res.status(400).json({
            error:
              "Invalid status. Must be 'approved', 'pending', or 'rejected'.",
          });
        }

        const currentStatusCheck = await pool.query(
          "SELECT volunteer_status FROM users WHERE id = $1 AND role = 'volunteer'",
          [volunteerId]
        );

        if (currentStatusCheck.rows.length === 0) {
          return res
            .status(404)
            .json({ error: "Volunteer not found or not a volunteer role." });
        }

        const updatedVolunteer = await pool.query(
          "UPDATE users SET volunteer_status = $1 WHERE id = $2 AND role = 'volunteer' RETURNING *",
          [status, volunteerId]
        );

        if (updatedVolunteer.rows.length > 0) {
          res.json({
            message: `Volunteer status updated to ${status}.`,
            volunteer: updatedVolunteer.rows[0],
          });
        } else {
          res
            .status(404)
            .json({ error: "Volunteer not found or status update failed." });
        }
      } catch (error) {
        console.error("Error updating volunteer status:", error);
        res.status(500).json({ error: "Failed to update volunteer status" });
      }
    }
  );

  // SEND VOLUNTEER APPROVAL EMAIL
  router.post("/send-approval-email", async (req, res) => {
    const { email, username } = req.body;
  
    try {
      await sendApprovalEmail(email, username);
      res.status(200).json({ message: "Approval email sent successfully." });
    } catch (error) {
      console.error("Error sending approval email:", error);
      res.status(500).json({ error: "Failed to send approval email." });
    }
  });

  return router;
};
