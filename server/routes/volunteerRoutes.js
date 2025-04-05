const express = require("express");
const fs = require("fs").promises;
const router = express.Router();
const path = require("path");
const {
  sendReservationApprovedEmail,
  sendVolunteerConfirmationEmail,
  sendReservationRejectedEmail,
  sendAdminDocumentSubmissionEmail,
  sendReservationRequestEmailToVolunteer,
} = require("../email/emailService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

module.exports = (
  pool,
  authenticate,
  authorizeVolunteer,
  isValidTime,
  moment,
  connectedClients,
  WebSocket
) => {
  // VOLUNTEER PROFILE
  router.get(
    "/volunteer/profile",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;
        const user = await pool.query(
          "SELECT username, personal_id, personal_id_set, subscription_paid, subscription_expiry_date, profile_picture_url, time_updated_at FROM users WHERE id = $1",
          [userId]
        );
        if (user.rows.length > 0) {
          const personalIdSet = user.rows[0].personal_id !== null; // Derive personal_id_set
          res.json({
            username: user.rows[0].username,
            personalId: user.rows[0].personal_id,
            subscriptionPaid: user.rows[0].subscription_paid || false,
            subscriptionExpiryDate:
              user.rows[0].subscription_expiry_date || null,
            profilePictureUrl: user.rows[0].profile_picture_url || null,
            time_updated_at: user.rows[0].time_updated_at || null,
            personalIdSet: user.rows[0].personal_id_set, // Add this to the response
          });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
      }
    }
  );

  router.post(
    "/volunteer/profile-picture",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;

        if (!req.files || !req.files.profilePicture) {
          console.log("No file uploaded");
          return res
            .status(400)
            .json({ error: "Please upload a profile picture." });
        }

        const profilePictureFile = req.files.profilePicture;
        const profilePictureFilename = `profile_${userId}_${Date.now()}.png`;
        const isProduction = process.env.NODE_ENV === "production";
        const baseUrl = isProduction
          ? `https://${process.env.S3_BUCKET_NAME}.s3.${
              process.env.AWS_REGION || "us-east-1"
            }.amazonaws.com`
          : `http://localhost:${process.env.PORT || 3001}`;
        const s3Client = isProduction
          ? new S3Client({
              region: process.env.AWS_REGION || "us-east-1",
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              },
            })
          : null;

        // Convert the uploaded file to PNG using sharp
        const pngBuffer = await sharp(profilePictureFile.data).png().toBuffer();
        console.log("File converted to PNG, size:", pngBuffer.length);

        let profilePictureUrl;

        if (isProduction) {
          const uploadToS3 = async (buffer, key) => {
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `profile-pictures/${key}`,
              Body: buffer,
              ContentType: "image/png", // No ACL here
            };
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            return `https://${process.env.S3_BUCKET_NAME}.s3.${
              process.env.AWS_REGION || "eu-north-1"
            }.amazonaws.com/profile-pictures/${key}`;
          };

          profilePictureUrl = await uploadToS3(
            pngBuffer,
            profilePictureFilename
          );
          console.log("Uploaded to S3:", profilePictureUrl);
        } else {
          const uploadDir = path.join(
            __dirname,
            "..",
            "uploads",
            "profile-pictures"
          ); // Corrected to server/uploads
          await fs.mkdir(uploadDir, { recursive: true });

          profilePictureUrl = `${baseUrl}/uploads/profile-pictures/${profilePictureFilename}`;
          const fullPath = path.join(uploadDir, profilePictureFilename);

          await fs.writeFile(fullPath, pngBuffer);
          console.log(`Profile picture saved to: ${fullPath}`);
        }

        const result = await pool.query(
          "UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING profile_picture_url",
          [profilePictureUrl, userId]
        );
        console.log(
          "Database updated with URL:",
          result.rows[0].profile_picture_url
        );

        res.json({
          message: "Profile picture uploaded successfully!",
          profilePictureUrl: result.rows[0].profile_picture_url,
        });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "Failed to upload profile picture" });
      }
    }
  );

  // New endpoint: GET /volunteer/info (to fetch volunteer's own village)
  router.get(
    "/volunteer/info",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const volunteer = await pool.query(
          "SELECT village FROM users WHERE id = $1",
          [volunteerId]
        );
        if (volunteer.rows.length > 0) {
          res.json({ village: volunteer.rows[0].village });
        } else {
          res.status(404).json({ error: "Volunteer not found" });
        }
      } catch (error) {
        console.error("Error fetching volunteer info:", error);
        res.status(500).json({ error: "Failed to fetch volunteer info" });
      }
    }
  );

  // Existing endpoint: GET /volunteer/availabilities
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

  // Existing endpoint: POST /availabilities
  router.post(
    "/availabilities",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const availabilities = req.body;
        const volunteerId = req.user.userId;

        if (!Array.isArray(availabilities)) {
          return res
            .status(400)
            .json({ error: "Invalid input: Availabilities must be an array." });
        }

        const userCheck = await pool.query(
          "SELECT time_updated_at FROM users WHERE id = $1",
          [volunteerId]
        );
        const lastUpdated = userCheck.rows[0].time_updated_at;
        if (lastUpdated) {
          const daysSinceUpdate = moment().diff(moment(lastUpdated), "days");
          if (daysSinceUpdate < 30) {
            return res.status(403).json({
              error: `Vous ne pouvez modifier vos disponibilités qu'une fois tous les 30 jours. Prochaine mise à jour possible dans ${
                30 - daysSinceUpdate
              } jours.`,
            });
          }
        }

        const ongoingReservations = await pool.query(
          "SELECT COUNT(*) FROM reservations WHERE volunteer_id = $1 AND status IN ('pending', 'accepted')",
          [volunteerId]
        );
        if (parseInt(ongoingReservations.rows[0].count) > 0) {
          return res.status(403).json({
            error:
              "Vous ne pouvez pas modifier vos disponibilités tant que vous avez des réservations en cours (en attente ou acceptées).",
          });
        }

        await pool.query("DELETE FROM availabilities WHERE user_id = $1", [
          volunteerId,
        ]);

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
          await pool.query(
            "INSERT INTO availabilities (user_id, day_of_week, start_time, end_time, recurring) VALUES ($1, $2, $3, $4, $5)",
            [volunteerId, dayOfWeek, startTime, endTime, true]
          );
        }

        await pool.query(
          "UPDATE users SET time_updated_at = NOW() WHERE id = $1",
          [volunteerId]
        );

        res.status(201).json({ message: "Availabilities saved successfully" });
      } catch (error) {
        console.error("Error saving availabilities:", error);
        res.status(500).json({ error: "Failed to save availabilities" });
      }
    }
  );

  // Existing endpoint: GET /volunteer/villages-covered
  router.get(
    "/volunteer/villages-covered",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const volunteer = await pool.query(
          "SELECT villages_covered, villages_updated_at FROM users WHERE id = $1",
          [volunteerId]
        );
        if (volunteer.rows.length > 0) {
          res.json({
            villages_covered: volunteer.rows[0].villages_covered || [],
            villages_updated_at: volunteer.rows[0].villages_updated_at || null,
          });
        } else {
          res.status(404).json({ error: "Volunteer not found" });
        }
      } catch (error) {
        console.error("Error fetching villages covered:", error);
        res.status(500).json({ error: "Failed to fetch villages covered" });
      }
    }
  );

  // Existing endpoint: PUT /volunteer/villages-covered
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

        // Fetch volunteer's current data
        const volunteer = await pool.query(
          "SELECT village, villages_covered, villages_updated_at FROM users WHERE id = $1",
          [volunteerId]
        );
        const volunteerVillage = volunteer.rows[0].village;
        const currentVillages = volunteer.rows[0].villages_covered || [];
        const lastUpdated = volunteer.rows[0].villages_updated_at;

        // Ensure volunteer's home village is included
        if (!villagesCovered.includes(volunteerVillage)) {
          villagesCovered.unshift(volunteerVillage);
        }

        // Check 30-day cooldown
        if (lastUpdated) {
          const daysSinceUpdate = moment().diff(moment(lastUpdated), "days");
          if (daysSinceUpdate < 30) {
            return res.status(403).json({
              error: `Vous ne pouvez modifier vos communes qu'une fois tous les 30 jours. Prochaine mise à jour possible dans ${
                30 - daysSinceUpdate
              } jours.`,
            });
          }
        }

        // Check for ongoing reservations
        const ongoingReservations = await pool.query(
          "SELECT COUNT(*) FROM reservations WHERE volunteer_id = $1 AND status IN ('pending', 'accepted')",
          [volunteerId]
        );
        if (parseInt(ongoingReservations.rows[0].count) > 0) {
          return res.status(403).json({
            error:
              "Vous ne pouvez pas modifier vos communes tant que vous avez des réservations en cours (en attente ou acceptées).",
          });
        }

        // Update villages_covered and timestamp
        const villagesCoveredJSON = JSON.stringify(villagesCovered);
        await pool.query(
          "UPDATE users SET villages_covered = $1, villages_updated_at = NOW() WHERE id = $2",
          [villagesCoveredJSON, volunteerId]
        );

        // Notify affected clients (optional, if villages were removed)
        const removedVillages = currentVillages.filter(
          (v) => !villagesCovered.includes(v)
        );
        if (removedVillages.length > 0) {
          connectedClients.forEach((client) => {
            if (
              client.readyState === WebSocket.OPEN &&
              removedVillages.includes(client.village)
            ) {
              client.send(
                JSON.stringify({
                  type: "village_update",
                  message: `Le bénévole ${
                    req.user.username
                  } ne couvre plus ${removedVillages.join(", ")}.`,
                })
              );
            }
          });
        }

        res.json({ message: "Villages mis à jour avec succès" });
      } catch (error) {
        console.error("Error updating villages covered:", error);
        res.status(500).json({ error: "Échec de la mise à jour des communes" });
      }
    }
  );

  // Existing endpoint: GET /volunteers
  router.get("/volunteers", authenticate, async (req, res) => {
    try {
      const clientVillage = req.user.village;
      const context = req.query.context;
      const date = req.query.date;

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
                u.villages_covered,
                COALESCE(json_agg(
                    json_build_object('day_of_week', a.day_of_week, 'start_time', a.start_time::TEXT, 'end_time', a.end_time::TEXT)
                ) FILTER (WHERE a.id IS NOT NULL), '[]'::json) AS availabilities
            FROM users u
            LEFT JOIN availabilities a ON u.id = a.user_id AND a.day_of_week = $1
            WHERE u.role = 'volunteer'
            AND u.holiday_mode IS NOT TRUE
        `;
      const queryParams = [dayOfWeek];

      if (context === "client") {
        volunteersQuery += ` AND $2 = ANY(u.villages_covered)`;
        queryParams.push(clientVillage);
      } else if (context === "volunteer") {
        volunteersQuery += " AND u.id = $3";
        queryParams.push(req.user.userId);
      }

      volunteersQuery +=
        " GROUP BY u.id, u.username, u.email, u.villages_covered";

      console.log("Executing volunteers query:", volunteersQuery, queryParams);
      const volunteers = await pool.query(volunteersQuery, queryParams);

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
      ]);

      console.log("Executing reservations query:", reservationsQuery, [
        date,
        clientVillage,
      ]);

      res.json({
        volunteers: volunteers.rows,
        reservations: reservations.rows,
      });
    } catch (err) {
      console.error("Error fetching volunteers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Updated endpoint: GET /volunteer/reservations with "completed" status logic
  router.get(
    "/volunteer/reservations",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const volunteerId = req.user.userId;

        // Update past reservations
        await client.query(
          `
          UPDATE reservations
          SET status = CASE
            WHEN status = 'accepted' AND (reservation_date + end_time::time) < NOW() THEN 'completed'
            WHEN status = 'pending' AND (reservation_date + end_time::time) < NOW() THEN 'cancelled'
            ELSE status
          END
          WHERE volunteer_id = $1 AND status IN ('accepted', 'pending')
          AND (reservation_date + end_time::time) < NOW()
        `,
          [volunteerId]
        );

        const reservations = await client.query(
          `
            SELECT
                r.id,
                u.username AS client_name,
                d.name AS dog_name,
                r.reservation_date,
                TO_CHAR(r.start_time, 'HH24:MI') as start_time,
                TO_CHAR(r.end_time, 'HH24:MI') as end_time,
                r.status
            FROM reservations r
            JOIN users u ON r.client_id = u.id
            JOIN dogs d ON r.dog_id = d.id
            WHERE r.volunteer_id = $1
            ORDER BY r.reservation_date, r.start_time;
          `,
          [volunteerId]
        );

        await client.query("COMMIT");
        res.json(reservations.rows);
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error fetching volunteer reservations:", error);
        res.status(500).json({ error: "Failed to fetch reservations" });
      } finally {
        client.release();
      }
    }
  );

  // Existing endpoint: PUT /reservations/:id
  router.put(
    "/reservations/:id",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
  
        const reservationId = req.params.id;
        const { status } = req.body;
  
        if (!status || !["pending", "accepted", "rejected", "cancelled"].includes(status)) {
          throw new Error("Invalid reservation status.");
        }
  
        const reservationCheck = await client.query(
          "SELECT volunteer_id, client_id, dog_id, reservation_date, start_time, end_time, status FROM reservations WHERE id = $1",
          [reservationId]
        );
  
        if (reservationCheck.rows.length === 0 || reservationCheck.rows[0].volunteer_id !== req.user.userId) {
          throw new Error("Unauthorized to update this reservation.");
        }
  
        const currentReservation = reservationCheck.rows[0];
        const endDateTime = moment(`${currentReservation.reservation_date} ${currentReservation.end_time}`, "YYYY-MM-DD HH:mm");
        const now = moment();
  
        if (endDateTime.isBefore(now)) {
          if (currentReservation.status === "accepted") {
            await client.query("UPDATE reservations SET status = 'completed' WHERE id = $1", [reservationId]);
            throw new Error("Cannot modify a completed reservation.");
          } else if (currentReservation.status === "pending") {
            await client.query("UPDATE reservations SET status = 'cancelled' WHERE id = $1", [reservationId]);
            throw new Error("Cannot modify a cancelled reservation.");
          }
        }
  
        const updatedReservationResult = await client.query(
          "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
          [status, reservationId]
        );
        const updatedReservation = updatedReservationResult.rows[0];
  
        if (status === "rejected") {
          const { reservation_date, start_time, end_time, client_id, dog_id } = currentReservation;
  
          const clientVillageResult = await client.query("SELECT village FROM users WHERE id = $1", [client_id]);
          const clientVillage = clientVillageResult.rows[0].village;
  
          const dayOfWeek = moment(reservation_date).isoWeekday();
          const availableVolunteersQuery = `
            SELECT u.id, u.username, u.email
            FROM users u
            LEFT JOIN availabilities a ON u.id = a.user_id AND a.day_of_week = $1
            WHERE u.role = 'volunteer'
              AND u.volunteer_status = 'approved'
              AND u.holiday_mode IS NOT TRUE
              AND u.id != $2
              AND u.villages_covered @> jsonb_build_array(CAST($3 AS TEXT))
              AND a.start_time <= $4
              AND a.end_time >= $5
              AND NOT EXISTS (
                SELECT 1 FROM reservations r
                WHERE r.volunteer_id = u.id
                  AND r.reservation_date = $6
                  AND r.status IN ('pending', 'accepted')
                  AND (
                    (r.start_time <= $4 AND r.end_time > $4)
                    OR (r.start_time < $5 AND r.end_time >= $5)
                    OR (r.start_time >= $4 AND r.end_time <= $5)
                  )
              )
            LIMIT 1
          `;
          const availableVolunteers = await client.query(availableVolunteersQuery, [
            dayOfWeek,
            req.user.userId,
            clientVillage,
            start_time,
            end_time,
            reservation_date,
          ]);
  
          if (availableVolunteers.rows.length > 0) {
            const newVolunteer = availableVolunteers.rows[0];
            const reassignedReservationResult = await client.query(
              "UPDATE reservations SET volunteer_id = $1, status = 'pending' WHERE id = $2 RETURNING *",
              [newVolunteer.id, reservationId]
            );
            const reassignedReservation = reassignedReservationResult.rows[0];
  
            const detailsQuery = `
              SELECT 
                c.username AS client_name,
                c.address AS client_address,
                c.phone_number AS client_phone,
                d.name AS dog_name,
                d.breed AS dog_breed,
                d.age AS dog_age
              FROM reservations r
              JOIN users c ON r.client_id = c.id
              JOIN dogs d ON r.dog_id = d.id
              WHERE r.id = $1
            `;
            const detailsResult = await client.query(detailsQuery, [reservationId]);
            const { client_name, dog_name, client_address, dog_breed, dog_age, client_phone } = detailsResult.rows[0];
  
            const formattedDate = new Date(reservation_date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            await sendReservationRequestEmailToVolunteer(
              newVolunteer.email,
              newVolunteer.username,
              client_name,
              dog_name,
              formattedDate,
              start_time,
              end_time,
              reservationId,
              client_address,
              dog_breed,
              dog_age,
              client_phone
            );
  
            connectedClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN && client.village === clientVillage) {
                client.send(JSON.stringify({ type: "reservation_update", reservation: reassignedReservation }));
              }
            });
  
            await client.query("COMMIT");
            return res.json({
              message: "Reservation rejected and reassigned to another volunteer.",
              reservation: reassignedReservation,
            });
          } else {
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
              WHERE r.id = $1
            `;
            const rejectionDetailsResult = await client.query(rejectionDetailsQuery, [reservationId]);
  
            if (rejectionDetailsResult.rows.length > 0) {
              const { client_email, client_name, dog_name, reservation_date, start_time, end_time } = rejectionDetailsResult.rows[0];
              const formattedDate = new Date(reservation_date).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              await sendReservationRejectedEmail(client_email, client_name, dog_name, formattedDate, start_time, end_time);
            }
  
            await client.query("COMMIT");
            return res.json({
              message: "Reservation rejected. No other volunteers available.",
              reservation: updatedReservation,
            });
          }
        } else if (status === "accepted") {
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
              d.breed AS dog_breed,
              d.age AS dog_age,
              v.email AS volunteer_email,
              v.username AS volunteer_name
            FROM reservations r
            JOIN users c ON r.client_id = c.id
            JOIN users v ON r.volunteer_id = v.id
            JOIN dogs d ON r.dog_id = d.id
            WHERE r.id = $1
          `;
          const detailsResult = await client.query(detailsQuery, [reservationId]);
  
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
              dog_breed,
              dog_age,
            } = detailsResult.rows[0];
  
            const formattedDate = new Date(reservation_date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
  
            await sendReservationApprovedEmail(
              client_email,
              client_name,
              dog_name,
              formattedDate,
              start_time,
              end_time,
              client_address,
              dog_breed,
              dog_age,
              client_phone
            );
            await sendVolunteerConfirmationEmail(
              volunteer_email,
              volunteer_name,
              client_name,
              dog_name,
              formattedDate,
              start_time,
              end_time,
              client_address,
              dog_breed,
              dog_age,
              client_phone
            );
          }
  
          connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.village === req.user.village) {
              client.send(JSON.stringify({ type: "reservation_update", reservation: updatedReservation }));
            }
          });
  
          await client.query("COMMIT");
          res.json(updatedReservation);
        } else {
          connectedClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.village === req.user.village) {
              client.send(JSON.stringify({ type: "reservation_update", reservation: updatedReservation }));
            }
          });
  
          await client.query("COMMIT");
          res.json(updatedReservation);
        }
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating reservation status:", error);
        res.status(500).json({ error: error.message || "Failed to update reservation status." });
      } finally {
        client.release();
      }
    }
  );

  // UPLOAD CHARTER / INSURANCE
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

  router.post(
    "/update-charter",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;

        if (!req.files || !req.files.insurance) {
          return res
            .status(400)
            .json({ error: "Please upload an insurance file." });
        }

        const insuranceFile = req.files.insurance;
        const insuranceFilename = `insurance_${userId}_${Date.now()}${path.extname(
          insuranceFile.name
        )}`;

        let insurancePath;

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
            return `https://${process.env.S3_BUCKET_NAME}.s3.${
              process.env.AWS_REGION || "us-east-1"
            }.amazonaws.com/insurance/${key}`;
          };

          insurancePath = await uploadToS3(insuranceFile, insuranceFilename);
        } else {
          const insuranceUploadDir = path.join(__dirname, "forms", "insurance");
          await fs.mkdir(insuranceUploadDir, { recursive: true });
          insurancePath = `/insurance/${insuranceFilename}`;
          const insuranceFullPath = path.join(
            insuranceUploadDir,
            insuranceFilename
          );
          await insuranceFile.mv(insuranceFullPath);
        }

        const result = await pool.query(
          "UPDATE users SET volunteer_status = $1, insurance_file_path = $2 WHERE id = $3 RETURNING *",
          ["pending", insurancePath, userId]
        );

        const volunteer = await pool.query(
          "SELECT username FROM users WHERE id = $1",
          [userId]
        );
        const volunteerName = volunteer.rows[0].username;

        await sendAdminDocumentSubmissionEmail(
          "lilou.ann.mossmann@gmail.com",
          volunteerName,
          null, // No charter path
          insurancePath
        );

        res.json({
          message: "Document submitted successfully!",
          user: result.rows[0],
        });
      } catch (error) {
        console.error("Error updating charter status:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to process document" });
      }
    }
  );

  // Existing endpoint: GET /volunteers/status
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

  // Existing endpoint: PUT /volunteers/:id/status
  router.put("/volunteers/:id/status", authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

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

  // Existing endpoint: GET /volunteer/holiday-mode
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

  // Existing endpoint: PUT /volunteer/holiday-mode
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

  // Existing endpoint: GET /volunteer/subscription
  router.get(
    "/volunteer/subscription",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;

        const subscription = await pool.query(
          "SELECT subscription_paid, subscription_expiry_date FROM users WHERE id = $1 AND role = 'volunteer'",
          [volunteerId]
        );

        if (subscription.rows.length === 0) {
          return res.status(404).json({ error: "Volunteer not found" });
        }

        const { subscription_paid, subscription_expiry_date } =
          subscription.rows[0];
        res.json({
          subscription_paid: subscription_paid || false,
          subscription_expiry_date: subscription_expiry_date || null,
        });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({ error: "Failed to fetch subscription status" });
      }
    }
  );

  // Existing endpoint: POST /volunteer/subscription/pay
  router.post(
    "/volunteer/subscription/pay",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const { payment_method_id } = req.body;

        if (!payment_method_id) {
          return res
            .status(400)
            .json({ error: "Payment method ID is required" });
        }

        const userCheck = await pool.query(
          "SELECT role, email, username FROM users WHERE id = $1",
          [volunteerId]
        );
        if (
          userCheck.rows.length === 0 ||
          userCheck.rows[0].role !== "volunteer"
        ) {
          return res.status(403).json({ error: "Not a volunteer" });
        }

        const { email, username } = userCheck.rows[0];

        // Check if customer exists in Stripe, or create one
        let customer;
        const existingCustomers = await stripe.customers.list({ email });
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email,
            name: username,
            payment_method: payment_method_id,
            invoice_settings: { default_payment_method: payment_method_id },
          });
        }

        // Create a subscription (removed payment_behavior)
        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: "price_1R2rlyGBanlKTQUgFSi07o7J" }],
          billing_cycle_anchor: Math.floor(Date.now() / 1000), // Start now
          proration_behavior: "none",
        });

        // Check subscription status
        if (subscription.status === "incomplete") {
          const invoice = await stripe.invoices.retrieve(
            subscription.latest_invoice
          );
          if (
            invoice.payment_intent &&
            invoice.payment_intent.status === "requires_action"
          ) {
            return res.status(402).json({
              status: "requires_action",
              clientSecret: invoice.payment_intent.client_secret,
              subscriptionId: subscription.id,
            });
          }
        }

        // Subscription is active
        const expiryDate = moment()
          .add(1, "year")
          .format("YYYY-MM-DD HH:mm:ss");
        await pool.query(
          "UPDATE users SET subscription_paid = $1, subscription_expiry_date = $2, stripe_subscription_id = $3 WHERE id = $4",
          [true, expiryDate, subscription.id, volunteerId]
        );

        res.json({
          success: true,
          message: "Subscription created successfully",
          subscriptionId: subscription.id,
        });
      } catch (error) {
        console.error("Error processing subscription payment:", error);
        res.status(500).json({
          error: "Failed to process subscription",
          details: error.message,
        });
      }
    }
  );

  // CHECK DOCUMENT STATUS
  router.get(
    "/volunteer/documents-status",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const volunteerId = req.user.userId;
        const volunteer = await pool.query(
          "SELECT charter_file_path, insurance_file_path, volunteer_status FROM users WHERE id = $1",
          [volunteerId]
        );

        if (volunteer.rows.length === 0) {
          return res.status(404).json({ error: "Volunteer not found" });
        }

        const { charter_file_path, insurance_file_path, volunteer_status } =
          volunteer.rows[0];
        const hasSubmittedDocuments = charter_file_path && insurance_file_path;

        res.json({
          hasSubmittedDocuments,
          volunteerStatus: volunteer_status,
        });
      } catch (error) {
        console.error("Error fetching volunteer documents status:", error);
        res.status(500).json({ error: "Failed to fetch documents status" });
      }
    }
  );

  return router;
};
