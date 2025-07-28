const express = require("express");
const router = express.Router();
const {
  sendReservationRequestEmailToVolunteer,
} = require("../email/emailService");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs").promises;

module.exports = (
  pool,
  authenticate,
  moment,
  connectedClients,
  WebSocket,
  isValidTime
) => {
  // AWS S3 Configuration
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

  // CREATE A CLIENT RESERVATION
  router.post("/reservations", authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { volunteerId, reservationDate, startTime, endTime, dogId } =
        req.body;

      // Validate required fields
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
      if (moment(endTime, "HH:mm").isSameOrBefore(moment(startTime, "HH:mm"))) {
        throw new Error("End time must be after start time");
      }

      // Enforce 1-day advance booking rule
      const reservationMoment = moment(reservationDate);
      const oneDayFromNow = moment().add(1, "days").startOf("day");
      if (reservationMoment.isBefore(oneDayFromNow)) {
        throw new Error(
          "Les réservations doivent se faire au moins 1 jour à l'avance."
        );
      }

      // Verify dog belongs to the client
      const dogResult = await client.query(
        "SELECT id, name FROM dogs WHERE id = $1 AND user_id = $2",
        [dogId, req.user.userId]
      );
      if (dogResult.rows.length === 0) {
        throw new Error("Invalid dog ID or dog doesn't belong to you");
      }

      // Determine volunteer to assign
      let chosenVolunteerId = volunteerId;

      if (!chosenVolunteerId) {
        // No preference: pick a volunteer randomly
        const availableVolunteersQuery = `
        SELECT u.id
        FROM users u
        WHERE u.role = 'volunteer'
          AND u.volunteer_status = 'approved'
          AND u.holiday_mode IS NOT TRUE
          AND (
            u.village = $1 OR
            u.villages_covered @> jsonb_build_array(CAST($1 AS TEXT))
          )
          AND NOT EXISTS (
            SELECT 1 FROM reservations r2
            WHERE r2.volunteer_id = u.id
              AND r2.reservation_date = $2
              AND r2.status IN ('pending', 'accepted')
              AND (
                (r2.start_time <= $3 AND r2.end_time > $3)
                OR (r2.start_time < $4 AND r2.end_time >= $4)
                OR (r2.start_time >= $3 AND r2.end_time <= $4)
              )
          )
      `;

        const available = await client.query(availableVolunteersQuery, [
          req.user.village,
          reservationDate,
          startTime,
          endTime,
        ]);

        if (available.rows.length === 0) {
          throw new Error("Aucun bénévole disponible à ce créneau.");
        }

        const randomIndex = Math.floor(Math.random() * available.rows.length);
        chosenVolunteerId = available.rows[randomIndex].id;
      }

      // Check for overlapping reservations with chosen volunteer
      const overlapQuery = `
      SELECT id
      FROM reservations
      WHERE reservation_date = $1
        AND volunteer_id = $2
        AND status IN ('pending', 'accepted')
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )
    `;
      const overlapResult = await client.query(overlapQuery, [
        reservationDate,
        chosenVolunteerId,
        startTime,
        endTime,
      ]);
      if (overlapResult.rows.length > 0) {
        throw new Error(
          "Ce créneau est déjà réservé. Veuillez en choisir un autre."
        );
      }

      // Check for client's own overlapping reservations
      const clientOverlapQuery = `
      SELECT id
      FROM reservations
      WHERE reservation_date = $1
        AND client_id = $2
        AND status IN ('pending', 'accepted')
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )
    `;
      const clientOverlapResult = await client.query(clientOverlapQuery, [
        reservationDate,
        req.user.userId,
        startTime,
        endTime,
      ]);
      if (clientOverlapResult.rows.length > 0) {
        throw new Error("Vous avez déjà une réservation pour ce créneau.");
      }

      // Insert new reservation
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
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
      RETURNING *;
    `;
      const values = [
        req.user.userId,
        chosenVolunteerId,
        dogId,
        reservationDate,
        startTime,
        endTime,
      ];
      const result = await client.query(insertQuery, values);
      const newReservation = result.rows[0];

      // Auto-cancel if past date (edge case)
      const endDateTime = moment(
        `${reservationDate} ${endTime}`,
        "YYYY-MM-DD HH:mm"
      );
      const now = moment();
      if (endDateTime.isBefore(now)) {
        const updatedStatus = "cancelled";
        await client.query(
          "UPDATE reservations SET status = $1 WHERE id = $2",
          [updatedStatus, newReservation.id]
        );
        newReservation.status = updatedStatus;
      }

      // Fetch full reservation details
      const reservationQuery = `
      SELECT
        r.id as reservation_id,
        r.reservation_date,
        TO_CHAR(r.start_time, 'HH24:MI') as start_time,
        TO_CHAR(r.end_time, 'HH24:MI') as end_time,
        r.status,
        d.name as dog_name,
        u_vol.username as volunteer_name,
        u_vol.email as volunteer_email,
        u_cli.village as client_village,
        u_cli.username as client_name
      FROM reservations r
      JOIN dogs d ON r.dog_id = d.id
      JOIN users u_vol ON r.volunteer_id = u_vol.id
      JOIN users u_cli ON r.client_id = u_cli.id
      WHERE r.id = $1
    `;
      const newReservationDetails = await client.query(reservationQuery, [
        newReservation.id,
      ]);

      if (newReservationDetails.rows.length === 0) {
        throw new Error("Reservation created, but details not found.");
      }

      const reservationData = newReservationDetails.rows[0];

      // Send reservation email to volunteer
      if (reservationData.volunteer_email) {
        try {
          await sendReservationRequestEmailToVolunteer(
            reservationData.volunteer_email,
            reservationData.volunteer_name,
            reservationData.client_name,
            reservationData.dog_name,
            reservationData.reservation_date,
            reservationData.start_time,
            reservationData.end_time,
            reservationData.reservation_id,
            reservationData.client_village
          );
        } catch (emailError) {
          console.error("Error sending email:", emailError);
        }
      }

      // WebSocket broadcast to village users
      const volunteerQuery = await client.query(
        "SELECT villages_covered FROM users WHERE id = $1",
        [chosenVolunteerId]
      );
      const volunteerVillages = volunteerQuery.rows[0]?.villages_covered || [];

      connectedClients.forEach((ws) => {
        if (
          ws.readyState === WebSocket.OPEN &&
          volunteerVillages.includes(ws.village)
        ) {
          ws.send(
            JSON.stringify({
              type: "reservation_update",
              reservation: reservationData,
            })
          );
        }
      });

      await client.query("COMMIT");
      res.status(201).json({
        message: "Réservation enregistrée avec succès",
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
        let clientId = req.user.userId || req.user.id || req.user._id;
        if (!clientId) {
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
            v.village AS village,
            r.status,
            r.client_id
        FROM reservations r
        JOIN dogs d ON r.dog_id = d.id
        JOIN users v ON r.volunteer_id = v.id
        WHERE r.client_id = $1
        ORDER BY r.reservation_date, r.start_time
      `;

        const reservationsResult = await pool.query(query, [clientId]);
        const reservations = reservationsResult.rows;

        const now = moment();
        const updatedReservations = reservations.map((reservation) => {
          const endDateTime = moment(
            `${reservation.reservation_date} ${reservation.end_time}`,
            "YYYY-MM-DD HH:mm"
          );
          if (endDateTime.isBefore(now) && reservation.status === "accepted") {
            return { ...reservation, status: "completed" };
          }
          return reservation;
        });

        res.json(updatedReservations || []);
      } catch (err) {
        console.error("Error fetching personal client reservations:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  );

  // FETCH USER
  router.get("/fetchUser", authenticate, async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await pool.query(
        "SELECT username, village FROM users WHERE id = $1",
        [userId]
      );
      if (user.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user.rows[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // FETCH ALL RESERVATIONS
  router.get("/client/all-reservations", authenticate, async (req, res) => {
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
          d.name AS dog_name,
          v.username AS volunteer_name,
          r.status,
          r.client_id
        FROM reservations r
        JOIN dogs d ON r.dog_id = d.id
        JOIN users v ON r.volunteer_id = v.id
        WHERE r.volunteer_id IN (
          SELECT id FROM users 
          WHERE role = 'volunteer' 
          AND villages_covered @> jsonb_build_array(CAST($1 AS TEXT))
        )
        AND r.status IN ('pending', 'accepted')
      `;
      const queryParams = [village];

      if (startDate && endDate) {
        query += " AND r.reservation_date BETWEEN $2 AND $3";
        queryParams.push(startDate, endDate);
      }

      query += " ORDER BY r.reservation_date, r.start_time";

      const reservations = await pool.query(query, queryParams);
      console.log(
        `Fetched ${reservations.rows.length} reservations for village: ${village}`
      );
      res.json(reservations.rows || []);
    } catch (err) {
      console.error("Error fetching client reservations:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // HELPER FUNCTION TO MERGE AVAILABILITIES
  function mergeAvailabilities(volunteersData, reservations, dateStr) {
    const mergedSlotsByDay = {};
    // The day of the week (0-6, where Monday is 0) for which we are generating slots.
    const targetDayIndex = moment(dateStr, "YYYY-MM-DD").isoWeekday() - 1;

    volunteersData.forEach((volunteer) => {
      if (!volunteer.availabilities || volunteer.availabilities.length === 0) {
        return;
      }

      volunteer.availabilities.forEach((availability) => {
        const startMoment = moment(availability.start_time, "HH:mm");
        const endMoment = moment(availability.end_time, "HH:mm");
        const isOvernight = endMoment.isBefore(startMoment);

        // Determine the actual start date/time of the availability period.
        // This is necessary to correctly handle iterating past midnight.
        let availabilityStartDateTime;
        const availabilityDayOfWeek = availability.day_of_week; // From DB (1=Mon, 7=Sun)
        const targetDayOfWeek = moment(dateStr, "YYYY-MM-DD").isoWeekday();

        if (availabilityDayOfWeek === targetDayOfWeek) {
          // The availability starts on the day we are currently processing.
          availabilityStartDateTime = moment(dateStr, "YYYY-MM-DD").set({
            hour: startMoment.get("hour"),
            minute: startMoment.get("minute"),
          });
        } else {
          // The availability must have started on the previous day.
          availabilityStartDateTime = moment(dateStr, "YYYY-MM-DD")
            .subtract(1, "day")
            .set({
              hour: startMoment.get("hour"),
              minute: startMoment.get("minute"),
            });
        }

        // Determine the end date/time of the availability period.
        const availabilityEndDateTime = availabilityStartDateTime.clone().set({
          hour: endMoment.get("hour"),
          minute: endMoment.get("minute"),
        });

        if (isOvernight) {
          availabilityEndDateTime.add(1, "day");
        }

        // Iterate from the start to the end of the availability, one hour at a time.
        let currentSlotMoment = availabilityStartDateTime.clone();
        while (currentSlotMoment.isBefore(availabilityEndDateTime)) {
          // We only create a slot if its date matches the target date (`dateStr`).
          if (currentSlotMoment.isSame(moment(dateStr, "YYYY-MM-DD"), "day")) {
            const slotTime = currentSlotMoment.format("HH:mm");
            const slotStartMomentForCheck = moment(slotTime, "HH:mm");
            const slotEndMomentForCheck = slotStartMomentForCheck
              .clone()
              .add(1, "hour");

            const isSlotTaken = reservations.some((reservation) => {
              const reservationDate = moment(
                reservation.reservation_date
              ).format("YYYY-MM-DD");
              const reservationStart = moment(reservation.start_time, "HH:mm");
              const reservationEnd = moment(reservation.end_time, "HH:mm");

              return (
                reservationDate === dateStr &&
                reservation.volunteer_id === volunteer.id &&
                reservationStart.isBefore(slotEndMomentForCheck) &&
                reservationEnd.isAfter(slotStartMomentForCheck) &&
                (reservation.status === "accepted" ||
                  reservation.status === "pending")
              );
            });

            // Initialize the structure if it doesn't exist.
            if (!mergedSlotsByDay[targetDayIndex]) {
              mergedSlotsByDay[targetDayIndex] = {};
            }
            if (!mergedSlotsByDay[targetDayIndex][slotTime]) {
              mergedSlotsByDay[targetDayIndex][slotTime] = {
                time: slotTime,
                volunteerUsernames: [],
                volunteerIds: [],
                isReserved: isSlotTaken,
              };
            }

            // Add the volunteer to the slot if it's not taken.
            if (!isSlotTaken) {
              mergedSlotsByDay[targetDayIndex][
                slotTime
              ].volunteerUsernames.push(volunteer.username);
              mergedSlotsByDay[targetDayIndex][slotTime].volunteerIds.push(
                volunteer.id
              );
            }
          }

          currentSlotMoment.add(1, "hour");
        }
      });
    });

    // Format the output to be an array of slots for each day.
    const formattedMergedSlots = {};
    Object.keys(mergedSlotsByDay).forEach((dayIndex) => {
      formattedMergedSlots[dayIndex] = Object.values(mergedSlotsByDay[dayIndex])
        .filter((slot) => slot.volunteerIds.length > 0 || slot.isReserved)
        .sort((a, b) => moment(a.time, "HH:mm").diff(moment(b.time, "HH:mm")));
    });

    return formattedMergedSlots;
  }

  // FETCH VOLUNTEERS (clients)
  router.get("/client/volunteers", authenticate, async (req, res) => {
    try {
      const clientVillage = req.user.village;
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

      // MODIFIED QUERY: This query now fetches availabilities for the requested day
      // AND the previous day, to correctly handle overnight slots.
      const volunteersQuery = `
        SELECT
          u.id,
          u.username,
          u.email,
          u.village,
          u.villages_covered,
          COALESCE(json_agg(
            json_build_object(
              'day_of_week', a.day_of_week,
              'start_time',  TO_CHAR(a.start_time,'HH24:MI'),
              'end_time',    TO_CHAR(a.end_time,  'HH24:MI'),
              'recurring',   a.recurring
            )
          ) FILTER (WHERE a.id IS NOT NULL), '[]') AS availabilities
        FROM users u
        LEFT JOIN availabilities a
          ON u.id = a.user_id
          AND a.day_of_week IN ($1, CASE WHEN $1 = 1 THEN 7 ELSE $1 - 1 END)
        WHERE u.role = 'volunteer'
          AND u.volunteer_status = 'approved'
          AND u.holiday_mode IS NOT TRUE
          AND (
            u.village = $2 OR
            u.villages_covered @> jsonb_build_array(CAST($2 AS TEXT))
          )
        GROUP BY u.id, u.username, u.email, u.village, u.villages_covered
      `;

      const reservationsQuery = `
      SELECT
        TO_CHAR(r.reservation_date, 'YYYY-MM-DD') as reservation_date,
        TO_CHAR(r.start_time, 'HH24:MI') as start_time,
        TO_CHAR(r.end_time, 'HH24:MI') as end_time,
        r.volunteer_id,
        r.id,
        r.status
      FROM reservations r
      WHERE r.reservation_date = $1
        AND r.volunteer_id IN (
          SELECT id FROM users
          WHERE role = 'volunteer'
            AND (
              village = $2 OR
              villages_covered @> jsonb_build_array(CAST($2 AS TEXT))
            )
        )
        AND r.status IN ('pending', 'accepted')
    `;

      const [volunteersResult, reservationsResult] = await Promise.all([
        pool.query(volunteersQuery, [dayOfWeek, clientVillage]),
        pool.query(reservationsQuery, [date, clientVillage]),
      ]);

      res.json({
        mergedAvailabilities: mergeAvailabilities(
          volunteersResult.rows,
          reservationsResult.rows,
          date
        ),
        reservations: reservationsResult.rows,
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

  router.post("/client/other-village", async (req, res) => {
    try {
      const {
        autreCommuneNom,
        autreCommuneEmail,
        autreCommuneTelephone,
        autreCommuneVillageSouhaite,
        village,
        role,
        noRiskConfirmed,
        unableToWalkConfirmed,
        photoPermission,
      } = req.body;

      if (
        !autreCommuneNom ||
        !autreCommuneEmail ||
        !autreCommuneTelephone ||
        !autreCommuneVillageSouhaite ||
        !village ||
        !role ||
        noRiskConfirmed === undefined ||
        unableToWalkConfirmed === undefined
      ) {
        return res.status(400).json({
          error: "Missing required information for 'Autres communes' request.",
        });
      }

      if (!noRiskConfirmed || !unableToWalkConfirmed) {
        return res.status(400).json({
          error:
            "Vous devez cocher les cases 'noRiskConfirmed' et 'unableToWalkConfirmed'",
        });
      }

      if (
        typeof autreCommuneNom !== "string" ||
        typeof autreCommuneVillageSouhaite !== "string"
      ) {
        return res.status(400).json({
          error: "Incorrect data type in 'Autres communes'",
        });
      }

      if (
        !autreCommuneEmail.includes("@") ||
        typeof autreCommuneEmail !== "string"
      ) {
        return res.status(400).json({
          error: "Invalid email format for 'Autres communes'",
        });
      }

      if (!/^[0-9]{10}$/.test(autreCommuneTelephone)) {
        return res.status(400).json({
          error: "Phone number must be exactly 10 digits.",
        });
      }

      // Insert into other_village_requests
      const requestQuery = `
        INSERT INTO other_village_requests (name, email, phone_number, desired_village, request_date)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *;
      `;
      const requestValues = [
        autreCommuneNom,
        autreCommuneEmail,
        autreCommuneTelephone,
        autreCommuneVillageSouhaite,
      ];
      const newRequest = await pool.query(requestQuery, requestValues);

      console.log("New 'autres communes' request logged:", newRequest.rows[0]);

      res.status(201).json({
        message:
          "Request for other villages recorded successfully. We will contact you soon.",
      });
    } catch (error) {
      console.error("Error handling 'autres communes' request:", error);
      res.status(500).json({
        error: "Failed to process your request for autres communes.",
      });
    }
  });

  // DONATE
  router.post("/donate", async (req, res) => {
    try {
      const { amount } = req.body;
      if (!amount || isNaN(amount) || amount < 1) {
        return res
          .status(400)
          .json({ error: "Invalid donation amount. Minimum 1 EUR." });
      }
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        payment_method_types: ["card"],
        description: "Donation to Chiens en Cavale",
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Failed to process donation" });
    }
  });

  return router;
};