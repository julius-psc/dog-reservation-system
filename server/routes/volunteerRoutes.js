const express = require("express");
const fs = require("fs").promises;
const router = express.Router();
const path = require("path");
const {
  sendReservationApprovedEmail,
  sendVolunteerConfirmationEmail,
  sendReservationRejectedEmail,
} = require("../email/emailService");

module.exports = (
  pool,
  authenticate,
  authorizeVolunteer,
  isValidTime,
  moment,
  connectedClients,
  WebSocket
) => {
  router.get("/volunteer/availabilities", authenticate, async (req, res) => {
    try {
      const volunteerId = req.user.userId;
      const availabilities = await pool.query(
        "SELECT * FROM availabilities WHERE user_id = $1",
        [volunteerId]
      );
      res.json(availabilities.rows);
    } catch (error) {
      console.error("Error fetching volunteer availabilities:", error);
      res.status(500).json({ error: "Failed to fetch availabilities" });
    }
  });

  // SETTING VOLUNTEER AVAILABILITIES
  router.post(
    "/availabilities",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const availabilities = req.body;
        if (!Array.isArray(availabilities)) {
          return res
            .status(400)
            .json({ error: "Invalid input: Availabilities must be an array." });
        }
        for (const availability of availabilities) {
          const { dayOfWeek, startTime, endTime } = availability;
          if (
            typeof dayOfWeek !== "number" ||
            dayOfWeek < 1 ||
            dayOfWeek > 7 ||
            typeof startTime !== "string" ||
            !isValidTime(startTime) ||
            typeof endTime !== "string" ||
            !isValidTime(endTime)
          ) {
            return res
              .status(400)
              .json({ error: "Invalid availability data." });
          }
          const user_id = req.user.userId;
          await pool.query(
            "INSERT INTO availabilities (user_id, day_of_week, start_time, end_time, recurring) VALUES ($1, $2, $3, $4, $5)",
            [user_id, dayOfWeek, startTime, endTime, true] // Always set recurring to true for now
          );
        }
        res.status(201).json({ message: "Availabilities saved successfully" });
      } catch (error) {
        console.error("Error saving availabilities:", error);
        res.status(500).json({ error: "Failed to save availabilities" });
      }
    }
  );

  // GET VILLAGES COVERED BY VOLUNTEER
  router.get(
    "/volunteer/villages-covered",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const volunteer = await pool.query(
          "SELECT villages_covered FROM users WHERE id = $1",
          [volunteerId]
        );
        if (volunteer.rows.length > 0) {
          res.json({
            villages_covered: volunteer.rows[0].villages_covered || [],
          }); // Return villages_covered or empty array if null
        } else {
          res.status(404).json({ error: "Volunteer not found" });
        }
      } catch (error) {
        console.error("Error fetching villages covered:", error);
        res.status(500).json({ error: "Failed to fetch villages covered" });
      }
    }
  );

  // UPDATE VILLAGES COVERED BY VOLUNTEER
  router.put(
    "/volunteer/villages-covered",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const { villagesCovered } = req.body;

        if (!Array.isArray(villagesCovered)) {
          return res
            .status(400)
            .json({ error: "Villages covered must be an array." });
        }

        // Explicitly stringify the villagesCovered array to JSON
        const villagesCoveredJSON = JSON.stringify(villagesCovered);

        await pool.query(
          "UPDATE users SET villages_covered = $1 WHERE id = $2",
          [villagesCoveredJSON, volunteerId]
        );
        res.json({ message: "Villages covered updated successfully" });
      } catch (error) {
        console.error("Error updating villages covered:", error);
        res.status(500).json({ error: "Failed to update villages covered" });
      }
    }
  );

  // FETCH VOLUNTEERS
  router.get("/volunteers", authenticate, async (req, res) => {
    try {
      const clientVillage = req.user.village; // Village of the client making the request
      const context = req.query.context; // "client" or "volunteer"
      const date = req.query.date; // <--- Get the date from the query

      if (!date) {
        return res.status(400).json({ error: "Date parameter is required." });
      }

      const dayOfWeek = moment(date, "YYYY-MM-DD").isoWeekday();
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD." });
      }

      let volunteersQuery = `
            SELECT
                u.id,
                u.username,
                u.email,
                u.villages_covered, -- Include villages_covered in the select
                COALESCE(json_agg(
                    json_build_object('day_of_week', a.day_of_week, 'start_time', a.start_time::TEXT, 'end_time', a.end_time::TEXT)
                ) FILTER (WHERE a.id IS NOT NULL), '[]'::json) AS availabilities
            FROM users u
            LEFT JOIN availabilities a ON u.id = a.user_id AND a.day_of_week = $1
            WHERE u.role = 'volunteer'
            AND u.holiday_mode IS NOT TRUE  -- ADDED: Exclude volunteers in holiday mode
        `;

      const queryParams = [dayOfWeek];

      if (context === "client") {
        volunteersQuery += ` AND $2 = ANY(u.villages_covered)`; // Filter by villages_covered for clients
        queryParams.push(clientVillage);
      } else if (context === "volunteer") {
        volunteersQuery += " AND u.id = $3"; // original volunteer context filter
        queryParams.push(req.user.userId);
      }
      // No village filter for general volunteer listing (e.g., admin view if needed, or if volunteer wants to see all)

      volunteersQuery +=
        " GROUP BY u.id, u.username, u.email, u.villages_covered";

      console.log("Executing volunteers query:", volunteersQuery, queryParams); // Log the query!
      const volunteers = await pool.query(volunteersQuery, queryParams);

      // Fetch reservations (common for both client and volunteer context)
      const reservationsQuery = `
            SELECT r.reservation_date, r.start_time, r.end_time, r.volunteer_id, r.id,
                   u.username AS client_name,
                   d.name AS dog_name
            FROM reservations r
            JOIN users u ON r.client_id = u.id
            JOIN dogs d ON r.dog_id = d.id
            WHERE r.reservation_date = $1
            AND r.volunteer_id IN (SELECT id FROM users WHERE role = 'volunteer' AND $2 = ANY(villages_covered))
        `;

      const reservations = await pool.query(reservationsQuery, [
        date,
        clientVillage,
      ]); // Use clientVillage here for reservations query too

      console.log("Executing reservations query:", reservationsQuery, [
        date,
        clientVillage,
      ]); // Log this too!

      res.json({
        volunteers: volunteers.rows,
        reservations: reservations.rows,
      });
    } catch (err) {
      console.error("Error fetching volunteers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // FETCH CLIENT RESERVATION (volunteer)
  router.get(
    "/volunteer/reservations",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const reservations = await pool.query(
          `
                        SELECT
                            r.id,
                            u.username AS client_name,
                            d.name AS dog_name,
                            r.reservation_date,
                            TO_CHAR(r.start_time, 'HH24:MI') as start_time, -- Format start_time
                            TO_CHAR(r.end_time, 'HH24:MI') as end_time, -- Format end_time
                            r.status
                        FROM reservations r
                        JOIN users u ON r.client_id = u.id
                        JOIN dogs d ON r.dog_id = d.id
                        WHERE r.volunteer_id = $1
                        ORDER BY r.reservation_date, r.start_time;
                    `,
          [volunteerId]
        );
        res.json(reservations.rows);
      } catch (error) {
        console.error("Error fetching volunteer reservations:", error);
        res.status(500).json({ error: "Failed to fetch reservations" });
      }
    }
  );

  // UPDATE RESERVATION STATUS
  router.put(
    "/reservations/:id",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const reservationId = req.params.id;
        const { status } = req.body;

        if (
          !status ||
          !["pending", "accepted", "rejected", "cancelled"].includes(status)
        ) {
          return res.status(400).json({ error: "Invalid reservation status." });
        }

        const reservationCheck = await pool.query(
          "SELECT volunteer_id FROM reservations WHERE id = $1",
          [reservationId]
        );

        if (
          reservationCheck.rows.length === 0 ||
          reservationCheck.rows[0].volunteer_id !== req.user.userId
        ) {
          return res
            .status(403)
            .json({ error: "Unauthorized to update this reservation." });
        }

        const updatedReservationResult = await pool.query(
          "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
          [status, reservationId]
        );

        if (updatedReservationResult.rows.length === 0) {
          return res.status(404).json({ error: "Reservation not found." });
        }

        const updatedReservation = updatedReservationResult.rows[0];

        connectedClients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            client.village === req.user.village
          ) {
            client.send(
              JSON.stringify({
                type: "reservation_update",
                reservation: updatedReservation,
              })
            );
          }
        });

        // **SEND EMAILS ON ACCEPTANCE and REJECTION**
        if (status === "accepted") {
          // Get client and volunteer details
          const detailsQuery = `
                SELECT
                    r.reservation_date,
                    TO_CHAR(r.start_time, 'HH24:MI') as start_time,
                    TO_CHAR(r.end_time, 'HH24:MI') as end_time,
                    c.email AS client_email,
                    c.username AS client_name,
                    c.address AS client_address,
                    c.phone_number AS client_phone,
                    d.name AS dog_name,
                    v.email AS volunteer_email,
                    v.username AS volunteer_name
                FROM reservations r
                JOIN users c ON r.client_id = c.id
                JOIN users v ON r.volunteer_id = v.id
                JOIN dogs d ON r.dog_id = d.id
                WHERE r.id = $1;
            `;
          const detailsResult = await pool.query(detailsQuery, [reservationId]);

          if (detailsResult.rows.length > 0) {
            const {
              client_email,
              client_name,
              dog_name,
              reservation_date,
              start_time,
              end_time,
              volunteer_email,
              volunteer_name,
              client_address,
              client_phone,
            } = detailsResult.rows[0];

            // Format date
            const formattedDate = new Date(reservation_date).toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );

            // Send email to CLIENT
            await sendReservationApprovedEmail(
              client_email,
              client_name,
              dog_name,
              formattedDate, // Use formatted date
              start_time,
              end_time
            );

            // Send email to VOLUNTEER (NEW)
            await sendVolunteerConfirmationEmail(
              // Implement this function!
              volunteer_email,
              volunteer_name,
              client_name,
              dog_name,
              formattedDate,
              start_time,
              end_time,
              client_address,
              client_email,
              client_phone
            );
          } else {
            console.error("Could not retrieve reservation details for email.");
          }
        } else if (status === "rejected") {
          // Get client details for rejection email
          const rejectionDetailsQuery = `
                SELECT
                    r.reservation_date,
                    TO_CHAR(r.start_time, 'HH24:MI') as start_time,
                    TO_CHAR(r.end_time, 'HH24:MI') as end_time,
                    c.email AS client_email,
                    c.username AS client_name,
                    d.name AS dog_name
                FROM reservations r
                JOIN users c ON r.client_id = c.id
                JOIN dogs d ON r.dog_id = d.id
                WHERE r.id = $1;
            `;
          const rejectionDetailsResult = await pool.query(
            rejectionDetailsQuery,
            [reservationId]
          );

          if (rejectionDetailsResult.rows.length > 0) {
            const {
              client_email,
              client_name,
              dog_name,
              reservation_date,
              start_time,
              end_time,
            } = rejectionDetailsResult.rows[0];

            // Format date for rejection email
            const formattedDate = new Date(reservation_date).toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );

            // Send REJECTION email to CLIENT
            await sendReservationRejectedEmail(
              client_email,
              client_name,
              dog_name,
              formattedDate,
              start_time,
              end_time
            );
          } else {
            console.error(
              "Could not retrieve reservation details for rejection email."
            );
          }
        }

        res.json(updatedReservation);
      } catch (error) {
        console.error("Error updating reservation status:", error);
        res.status(500).json({ error: "Failed to update reservation status." });
      }
    }
  );

  // UPDATE CHARTER STATUS AND FILE UPLOADS
  router.post(
    "/update-charter",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;

        // 1. File Handling - Ensure files are uploaded
        if (!req.files || !req.files.charter || !req.files.insurance) {
          return res
            .status(400)
            .json({ error: "Please upload both charter and insurance files." });
        }

        const charterFile = req.files.charter;
        const insuranceFile = req.files.insurance;

        // 2. Generate Unique Filenames
        const charterFilename = `charter_${userId}_${Date.now()}${path.extname(
          charterFile.name
        )}`;
        const insuranceFilename = `insurance_${userId}_${Date.now()}${path.extname(
          insuranceFile.name
        )}`;

        // 3. Define Upload Paths
        const chartersUploadDir = path.join(
          __dirname,
          "..",
          "forms",
          "charters"
        );
        const insuranceUploadDir = path.join(
          __dirname,
          "..",
          "forms",
          "insurance"
        );

        // 4. Move files using mv() method from express-fileupload
        await charterFile.mv(path.join(chartersUploadDir, charterFilename));
        await insuranceFile.mv(
          path.join(insuranceUploadDir, insuranceFilename)
        );

        // 5. Store Relative File Paths in Database
        const result = await pool.query(
          "UPDATE users SET volunteer_status = $1, charter_file_path = $2, insurance_file_path = $3 WHERE id = $4 RETURNING *",
          [
            "pending",
            `/charters/${charterFilename}`,
            `/insurance/${insuranceFilename}`,
            userId,
          ]
        );

        res.json({
          message: "Documents submitted successfully!",
          user: result.rows[0],
        });
      } catch (error) {
        console.error("Error updating charter status:", error);
        res.status(500).json({
          error: error.message || "Failed to process documents",
        });
      }
    }
  );

  // GET volunteer status
  router.get(
    "/volunteers/status",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteer = await pool.query(
          "SELECT volunteer_status FROM users WHERE id = $1",
          [req.user.userId]
        );
        if (volunteer.rows.length === 0) {
          return res.status(404).json({ error: "Volunteer not found" });
        }
        res.json({ status: volunteer.rows[0].volunteer_status });
      } catch (error) {
        console.error("Error fetching volunteer status:", error);
        res.status(500).json({ error: "Failed to fetch status" });
      }
    }
  );

  // UPDATE volunteer status (admin endpoint)
  router.put("/volunteers/:id/status", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Verify admin role
      const adminCheck = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [req.user.userId]
      );
      if (adminCheck.rows[0].role !== "admin") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const result = await pool.query(
        "UPDATE users SET volunteer_status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating volunteer status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // GET HOLIDAY MODE STATUS
  router.get(
    "/volunteer/holiday-mode",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const volunteer = await pool.query(
          "SELECT holiday_mode FROM users WHERE id = $1",
          [volunteerId]
        );
        if (volunteer.rows.length > 0) {
          res.json({ holidayMode: volunteer.rows[0].holiday_mode });
        } else {
          res.status(404).json({ error: "Volunteer not found" });
        }
      } catch (error) {
        console.error("Error fetching holiday mode status:", error);
        res.status(500).json({ error: "Failed to fetch holiday mode status" });
      }
    }
  );

  // UPDATE HOLIDAY MODE STATUS
  router.put(
    "/volunteer/holiday-mode",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const { holidayMode } = req.body;

        if (typeof holidayMode !== "boolean") {
          return res.status(400).json({ error: "Invalid holiday mode value." });
        }

        await pool.query("UPDATE users SET holiday_mode = $1 WHERE id = $2", [
          holidayMode,
          volunteerId,
        ]);
        res.json({
          message: "Holiday mode updated successfully",
          holidayMode: holidayMode,
        });
      } catch (error) {
        console.error("Error updating holiday mode status:", error);
        res.status(500).json({ error: "Failed to update holiday mode status" });
      }
    }
  );

  return router;
};
