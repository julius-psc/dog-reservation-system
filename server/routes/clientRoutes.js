const express = require("express");
const router = express.Router();
const { sendReservationRequestEmailToVolunteer } = require('../email/emailService'); 

module.exports = (
  pool,
  authenticate,
  moment,
  connectedClients,
  WebSocket,
  isValidTime
) => {
  // CREATE A CLIENT RESERVATION
  router.post("/reservations", authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { volunteerId, reservationDate, startTime, endTime, dogId } =
        req.body;

      // Validation
      if (!reservationDate || !startTime || !endTime || !dogId) {
        throw new Error("Missing required fields");
      }

      // Validate date and time formats
      if (!moment(reservationDate, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Invalid date format");
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        throw new Error("Invalid time format");
      }

      // Check if end time is after start time
      if (moment(endTime, "HH:mm").isSameOrBefore(moment(startTime, "HH:mm"))) {
        throw new Error("End time must be after start time");
      }

      // Validate 2-day advance booking
      const reservationMoment = moment(reservationDate);
      const twoDaysFromNow = moment().add(2, "days").startOf("day");
      if (reservationMoment.isBefore(twoDaysFromNow)) {
        throw new Error("Reservations must be made at least 2 days in advance");
      }

      // Check if dog belongs to user
      const dogResult = await client.query(
        "SELECT id, name FROM dogs WHERE id = $1 AND user_id = $2",
        [dogId, req.user.userId]
      );

      if (dogResult.rows.length === 0) {
        throw new Error("Invalid dog ID or dog doesn't belong to you");
      }

      // Check for overlapping reservations
      const overlapQuery = `
        SELECT id
        FROM reservations
        WHERE reservation_date = $1
        AND volunteer_id = $2
        AND status != 'rejected'
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )`;

      const overlapResult = await client.query(overlapQuery, [
        reservationDate,
        volunteerId,
        startTime,
        endTime,
      ]);

      if (overlapResult.rows.length > 0) {
        throw new Error(
          "This time slot is already booked. Please choose another time."
        );
      }

      // Check for existing reservations by the same client for the same time
      const clientOverlapQuery = `
        SELECT id
        FROM reservations
        WHERE reservation_date = $1
        AND client_id = $2
        AND status != 'rejected'
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )`;

      const clientOverlapResult = await client.query(clientOverlapQuery, [
        reservationDate,
        req.user.userId,
        startTime,
        endTime,
      ]);

      if (clientOverlapResult.rows.length > 0) {
        throw new Error(
          "You already have a reservation during this time slot."
        );
      }

      // Create the reservation
      const insertQuery = `
        INSERT INTO reservations (
          client_id,
          volunteer_id,
          dog_id,
          reservation_date,
          start_time,
          end_time,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id`;

      const values = [
        req.user.userId,
        volunteerId,
        dogId,
        reservationDate,
        startTime,
        endTime,
        "pending",
      ];

      const result = await client.query(insertQuery, values);
      const newReservationId = result.rows[0].id;

      // Fetch the complete reservation details including volunteer and client names and emails for email sending
      const reservationQuery = `
        SELECT
          r.id as reservation_id,
          r.reservation_date,
          r.start_time,
          r.end_time,
          r.status,
          d.name as dog_name,
          u_vol.username as volunteer_name,
          u_vol.email as volunteer_email,
          u_cli.username as client_name
        FROM reservations r
        JOIN dogs d ON r.dog_id = d.id
        JOIN users u_vol ON r.volunteer_id = u_vol.id
        JOIN users u_cli ON r.client_id = u_cli.id
        WHERE r.id = $1`;

      const newReservationDetails = await client.query(reservationQuery, [
        newReservationId,
      ]);

      const reservationDataForEmail = newReservationDetails.rows[0];

      await client.query("COMMIT");

      // Send email to volunteer
      try {
        await sendReservationRequestEmailToVolunteer(
          reservationDataForEmail.volunteer_email,
          reservationDataForEmail.volunteer_name,
          reservationDataForEmail.client_name,
          reservationDataForEmail.dog_name,
          reservationDataForEmail.reservation_date,
          reservationDataForEmail.start_time,
          reservationDataForEmail.end_time,
          reservationDataForEmail.reservation_id // Pass reservation ID
        );
      } catch (emailError) {
        console.error("Error sending reservation request email:", emailError);
        // Consider if email sending failure should rollback the whole transaction or just log the error.
        // For now, logging and continuing.
      }

      // Notify connected clients via WebSocket
      const reservationData = newReservationDetails.rows[0]; // Use details for websocket data
      connectedClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "reservation_update",
              reservation: reservationData,
            })
          );
        }
      });

      res.status(201).json({
        message: "Reservation created successfully",
        reservation: reservationData,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Reservation creation error:", error);
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  // FETCH PERSONAL RESERVATIONS
  router.get(
    "/client/personal-reservations",
    authenticate,
    async (req, res) => {
      try {
        // Retrieve client ID safely from req.user.
        // Check for 'id', 'userId', or '_id' in req.user object
        let clientId;
        if (req.user && req.user.id) {
          clientId = req.user.id;
        } else if (req.user && req.user.userId) {
          clientId = req.user.userId;
        } else if (req.user && req.user._id) {
          clientId = req.user._id;
        } else {
          // If no recognizable user ID is found, return an error.
          return res
            .status(400)
            .json({ error: "Could not identify user ID from token." });
        }

        const query = `
            SELECT
                TO_CHAR(r.reservation_date, 'YYYY-MM-DD') as reservation_date,
                TO_CHAR(r.start_time, 'HH24:MI') as start_time,
                TO_CHAR(r.end_time, 'HH24:MI') as end_time,
                r.volunteer_id,
                r.id,
                d.name AS dog_name,
                v.username AS volunteer_name,
                r.status,
                r.client_id
            FROM reservations r
            JOIN dogs d ON r.dog_id = d.id
            JOIN users v ON r.volunteer_id = v.id
            WHERE r.client_id = $1  -- Filter by client_id
            ORDER BY r.reservation_date, r.start_time
          `;

        const queryParams = [clientId]; // Use the retrieved clientId

        const reservations = await pool.query(query, queryParams);

        res.json(reservations.rows || []);
      } catch (err) {
        console.error("Error fetching personal client reservations:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  // FETCH ALL RESERVATIONS IN THE SAME VILLAGE
  router.get("/client/village-reservations", authenticate, async (req, res) => {
    try {
      const { village } = req.user;
      const { startDate, endDate } = req.query;

      let query = `
        SELECT
            TO_CHAR(r.reservation_date, 'YYYY-MM-DD') as reservation_date,
            TO_CHAR(r.start_time, 'HH24:MI') as start_time,
            TO_CHAR(r.end_time, 'HH24:MI') as end_time,
            r.volunteer_id,
            r.id,
            r.status
        FROM reservations r
        JOIN users v ON r.volunteer_id = v.id
        WHERE v.role = 'volunteer' AND v.village = $1
      `;
      const queryParams = [village];

      if (startDate && endDate) {
        query += " AND r.reservation_date BETWEEN $2 AND $3";
        queryParams.push(startDate, endDate);
      } else {
        query += " AND r.reservation_date BETWEEN $2 AND $3";
        queryParams.push(moment().startOf("month").format("YYYY-MM-DD"), moment().endOf("month").format("YYYY-MM-DD"));
      }

      query += " ORDER BY r.reservation_date, r.start_time";

      const reservations = await pool.query(query, queryParams);

      res.json(reservations.rows || []);
    } catch (err) {
      console.error("Error fetching village reservations:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // FETCH ALL RESERVATIONS
  router.get("/client/all-reservations", authenticate, async (req, res) => {
    try {
      const { village } = req.user;
      const { startDate, endDate } = req.query; // Get start and end dates

      let query = `
        SELECT
            TO_CHAR(r.reservation_date, 'YYYY-MM-DD') as reservation_date,
            TO_CHAR(r.start_time, 'HH24:MI') as start_time,
            TO_CHAR(r.end_time, 'HH24:MI') as end_time,
            r.volunteer_id,
            r.id,
            d.name AS dog_name,
            v.username AS volunteer_name,
            r.status,
            r.client_id
        FROM reservations r
        JOIN dogs d ON r.dog_id = d.id
        JOIN users v ON r.volunteer_id = v.id
        WHERE r.volunteer_id IN (SELECT id FROM users WHERE role = 'volunteer' AND village = $1)
      `;
      const queryParams = [village];

      // Add date filtering *only* if startDate and endDate are provided.
      if (startDate && endDate) {
        query += " AND r.reservation_date BETWEEN $2 AND $3";
        queryParams.push(startDate, endDate);
      } else if (endDate) {
        query += " AND r.reservation_date <= $2";
        queryParams.push(endDate);
      }

      query += " ORDER BY r.reservation_date, r.start_time"; // Add to the end

      const reservations = await pool.query(query, queryParams);

      res.json(reservations.rows || []);
    } catch (err) {
      console.error("Error fetching client reservations:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // HELPER FUNCTION TO MERGE AVAILABILITIES
  function mergeAvailabilities(volunteersData, reservations, dateStr) {
    const mergedSlotsByDay = {};

    volunteersData.forEach((volunteer) => {
      if (!volunteer.availabilities || volunteer.availabilities.length === 0) {
        return;
      }

      volunteer.availabilities.forEach((availability) => {
        const dayOfWeek = availability.day_of_week - 1;
        const startTime = availability.start_time;
        const endTime = availability.end_time;

        let currentMoment = moment(startTime, "HH:mm");
        const endMoment = moment(endTime, "HH:mm");

        while (currentMoment.isBefore(endMoment)) {
          const slotTime = currentMoment.format("HH:mm");

          // Check if the slot is reserved
          const slotStartMoment = moment(slotTime, "HH:mm");
          const slotEndMoment = slotStartMoment.clone().add(1, "hour");

          const isSlotTaken = reservations.some((reservation) => {
            const reservationDate = moment(reservation.reservation_date).format(
              "YYYY-MM-DD"
            );
            const reservationStart = moment(reservation.start_time, "HH:mm");
            const reservationEnd = moment(reservation.end_time, "HH:mm");

            return (
              reservationDate === dateStr &&
              reservation.volunteer_id === volunteer.id &&
              reservationStart.isBefore(slotEndMoment) &&
              reservationEnd.isAfter(slotStartMoment) &&
              (reservation.status === "reserved" ||
                reservation.status === "pending")
            );
          });

          // Add all slots, marking them as reserved if taken
          if (!mergedSlotsByDay[dayOfWeek]) {
            mergedSlotsByDay[dayOfWeek] = {};
          }
          if (!mergedSlotsByDay[dayOfWeek][slotTime]) {
            mergedSlotsByDay[dayOfWeek][slotTime] = {
              time: slotTime,
              volunteerUsernames: [],
              volunteerIds: [],
              isReserved: isSlotTaken,
            };
          }

          // Only add volunteer information if the slot isn't taken
          if (!isSlotTaken) {
            mergedSlotsByDay[dayOfWeek][slotTime].volunteerUsernames.push(
              volunteer.username
            );
            mergedSlotsByDay[dayOfWeek][slotTime].volunteerIds.push(
              volunteer.id
            );
          }

          currentMoment.add(1, "hour");
        }
      });
    });

    const formattedMergedSlots = {};
    Object.keys(mergedSlotsByDay).forEach((dayIndex) => {
      formattedMergedSlots[dayIndex] = Object.values(
        mergedSlotsByDay[dayIndex]
      ).filter((slot) => slot.volunteerIds.length > 0 || slot.isReserved);
    });

    return formattedMergedSlots;
  }

  // FETCH VOLUNTEERS (clients) - MODIFIED TO MERGE AVAILABILITIES
  router.get("/client/volunteers", authenticate, async (req, res) => {
    try {
      const clientVillage = req.user.village;
      const context = req.query.context;
      const date = req.query.date; // Date is already in YYYY-MM-DD format

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
                  AND u.volunteer_status = 'approved'
                  AND u.holiday_mode IS NOT TRUE  
            `;

      const queryParams = [dayOfWeek];

      if (context === "client") {
        volunteersQuery += ` AND u.villages_covered @> jsonb_build_array(CAST($2 AS TEXT))`;
        queryParams.push(clientVillage);
      } else if (context === "volunteer") {
        volunteersQuery += " AND u.id = $2"; // Use $2 consistently
        queryParams.push(req.user.userId);
      }

      volunteersQuery +=
        " GROUP BY u.id, u.username, u.email, u.villages_covered";

      const reservationsQuery = `
                SELECT
                    TO_CHAR(r.reservation_date, 'YYYY-MM-DD') as reservation_date,
                    TO_CHAR(r.start_time, 'HH24:MI') as start_time,
                    TO_CHAR(r.end_time, 'HH24:MI') as end_time,
                    r.volunteer_id,
                    r.id,
                    d.name AS dog_name,
                    v.username AS volunteer_name,
                    r.status
                FROM reservations r
                JOIN dogs d ON r.dog_id = d.id
                JOIN users v ON r.volunteer_id = v.id
                WHERE r.reservation_date = $1
                  AND v.role = 'volunteer'
                  AND (v.village = $2 OR v.villages_covered @> jsonb_build_array($2::TEXT))

            `;

      const reservationsParams = [date, clientVillage];
      const volunteers = await pool.query(volunteersQuery, queryParams);

      const reservations = await pool.query(
        reservationsQuery,
        reservationsParams
      );

      res.json({
        mergedAvailabilities: mergeAvailabilities(
          volunteers.rows,
          reservations.rows,
          date
        ), // Pass date string to mergeAvailabilities
        reservations: reservations.rows,
      });
    } catch (err) {
      console.error("Error fetching volunteers:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // FETCH DOG
  router.get("/fetchDog", authenticate, async (req, res) => {
    try {
      const userId = req.user.userId;
      const dogs = await pool.query("SELECT * FROM dogs WHERE user_id = $1", [
        userId,
      ]);
      res.json(dogs.rows);
    } catch (error) {
      console.error("Error fetching dog:", error);
      res.status(500).json({ error: "Failed to fetch dog information." });
    }
  });

  // ADD DOG
  router.post("/addDog", authenticate, async (req, res) => {
    try {
      const { name, breed, age } = req.body;
      const userId = req.user.userId;

      if (!name || !breed || !age) {
        return res.status(400).json({
          error: "Missing required dog information (name, breed, age).",
        });
      }

      if (
        typeof name !== "string" ||
        typeof breed !== "string" ||
        typeof age !== "number" ||
        age < 0
      ) {
        return res.status(400).json({
          error:
            "Invalid dog information. Name and breed must be strings, age must be a non-negative number.",
        });
      }

      const newDog = await pool.query(
        "INSERT INTO dogs (name, breed, age, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [name, breed, age, userId]
      );

      res.status(201).json(newDog.rows[0]);
    } catch (error) {
      console.error("Error adding dog:", error);
      res.status(500).json({ error: "Failed to add dog information." });
    }
  });

  // OTHER VILLAGE FORM SUBMISSION ENDPOINT
  router.post("/client/other-village", async (req, res) => {
    try {
      const {
        autreCommuneNom,
        autreCommuneEmail,
        autreCommuneTelephone,
        autreCommuneVillageSouhaite,
        autreCommuneTypeDemande,
        village,
      } = req.body;

      if (
        !autreCommuneNom ||
        !autreCommuneEmail ||
        !autreCommuneVillageSouhaite ||
        !autreCommuneTypeDemande
      ) {
        return res.status(400).json({
          error: "Missing required information for 'Autres communes' request.",
        });
      }
      if (
        typeof autreCommuneNom !== "string" ||
        typeof autreCommuneVillageSouhaite !== "string" ||
        !["ponctuel", "regulier"].includes(autreCommuneTypeDemande)
      ) {
        return res
          .status(400)
          .json({ error: "Invalid data types in 'Autres communes' request." });
      }
      if (
        (autreCommuneEmail && typeof autreCommuneEmail !== "string") ||
        !autreCommuneEmail.includes("@")
      ) {
        return res.status(400).json({
          error: "Invalid email format in 'Autres communes' request.",
        });
      }
      if (
        (autreCommuneTelephone && typeof autreCommuneTelephone !== "string") ||
        isNaN(autreCommuneTelephone.replace(/\s/g, ""))
      ) {
        return res.status(400).json({
          error: "Invalid phone number format in 'Autres communes' request.",
        });
      }

      const query = `
                INSERT INTO other_village_requests (name, email, phone_number, desired_village, request_type, request_date)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING *;`;

      const values = [
        autreCommuneNom,
        autreCommuneEmail || null,
        autreCommuneTelephone || null,
        autreCommuneVillageSouhaite,
        autreCommuneTypeDemande,
      ];

      const newRequest = await pool.query(query, values);

      console.log("New 'autres communes' request logged:", newRequest.rows[0]);

      res.status(201).json({
        message:
          "Demande pour autres communes enregistrée avec succès. Nous vous contacterons bientôt.",
      });
    } catch (error) {
      console.error("Error handling 'autres communes' request:", error);
      res
        .status(500)
        .json({ error: "Failed to process your request for autres communes." });
    }
  });


  return router;
};

