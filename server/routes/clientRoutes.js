const express = require("express");
const router = express.Router();
const { sendReservationRequestEmailToVolunteer } = require('../email/emailService'); 
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

      const { volunteerId, reservationDate, startTime, endTime, dogId } = req.body;

      if (!reservationDate || !startTime || !endTime || !dogId) {
        throw new Error("Missing required fields");
      }

      if (!moment(reservationDate, "YYYY-MM-DD", true).isValid()) {
        throw new Error("Invalid date format");
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        throw new Error("Invalid time format");
      }

      if (moment(endTime, "HH:mm").isSameOrBefore(moment(startTime, "HH:mm"))) {
        throw new Error("End time must be after start time");
      }

      const reservationMoment = moment(reservationDate);
      const twoDaysFromNow = moment().add(2, "days").startOf("day");
      if (reservationMoment.isBefore(twoDaysFromNow)) {
        throw new Error("Reservations must be made at least 2 days in advance");
      }

      const dogResult = await client.query(
        "SELECT id, name FROM dogs WHERE id = $1 AND user_id = $2",
        [dogId, req.user.userId]
      );

      if (dogResult.rows.length === 0) {
        throw new Error("Invalid dog ID or dog doesn't belong to you");
      }

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
        throw new Error("Ce créneau est déjà réservé. Veuillez choisir une autre horaire.");
      }

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
        throw new Error("Vous avez déjà une résérvation à ce créneau.");
      }

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

      const newReservationDetails = await client.query(reservationQuery, [newReservationId]);

      const reservationDataForEmail = newReservationDetails.rows[0];

      await client.query("COMMIT");

      try {
        await sendReservationRequestEmailToVolunteer(
          reservationDataForEmail.volunteer_email,
          reservationDataForEmail.volunteer_name,
          reservationDataForEmail.client_name,
          reservationDataForEmail.dog_name,
          reservationDataForEmail.reservation_date,
          reservationDataForEmail.start_time,
          reservationDataForEmail.end_time,
          reservationDataForEmail.reservation_id
        );
      } catch (emailError) {
        console.error("Error sending reservation request email:", emailError);
      }

      const reservationData = newReservationDetails.rows[0];
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
        let clientId;
        if (req.user && req.user.id) {
          clientId = req.user.id;
        } else if (req.user && req.user.userId) {
          clientId = req.user.userId;
        } else if (req.user && req.user._id) {
          clientId = req.user._id;
        } else {
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
            WHERE r.client_id = $1
            ORDER BY r.reservation_date, r.start_time
          `;

        const queryParams = [clientId];
        const reservationsResult = await pool.query(query, queryParams);
        const reservations = reservationsResult.rows;

        // Dynamically update status to "completed" for past accepted reservations
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
        WHERE r.volunteer_id IN (SELECT id FROM users WHERE role = 'volunteer' AND village = $1)
          AND r.status IN ('pending', 'accepted')
      `;
      const queryParams = [village];
  
      if (startDate && endDate) {
        query += " AND r.reservation_date BETWEEN $2 AND $3";
        queryParams.push(startDate, endDate);
      }
  
      query += " ORDER BY r.reservation_date, r.start_time";
  
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

          const slotStartMoment = moment(slotTime, "HH:mm");
          const slotEndMoment = slotStartMoment.clone().add(1, "hour");

          const isSlotTaken = reservations.some((reservation) => {
            const reservationDate = moment(reservation.reservation_date).format("YYYY-MM-DD");
            const reservationStart = moment(reservation.start_time, "HH:mm");
            const reservationEnd = moment(reservation.end_time, "HH:mm");

            return (
              reservationDate === dateStr &&
              reservation.volunteer_id === volunteer.id &&
              reservationStart.isBefore(slotEndMoment) &&
              reservationEnd.isAfter(slotStartMoment) &&
              (reservation.status === "accepted" || reservation.status === "pending")
            );
          });

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

          if (!isSlotTaken) {
            mergedSlotsByDay[dayOfWeek][slotTime].volunteerUsernames.push(volunteer.username);
            mergedSlotsByDay[dayOfWeek][slotTime].volunteerIds.push(volunteer.id);
          }

          currentMoment.add(1, "hour");
        }
      });
    });

    const formattedMergedSlots = {};
    Object.keys(mergedSlotsByDay).forEach((dayIndex) => {
      formattedMergedSlots[dayIndex] = Object.values(mergedSlotsByDay[dayIndex]).filter(
        (slot) => slot.volunteerIds.length > 0 || slot.isReserved
      );
    });

    return formattedMergedSlots;
  }

  // FETCH VOLUNTEERS (clients)
  router.get("/client/volunteers", authenticate, async (req, res) => {
    try {
      const clientVillage = req.user.village;
      const context = req.query.context;
      const date = req.query.date;

      if (!date) {
        return res.status(400).json({ error: "Date parameter is required." });
      }

      const dayOfWeek = moment(date, "YYYY-MM-DD").isoWeekday();
      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
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
        volunteersQuery += " AND u.id = $2";
        queryParams.push(req.user.userId);
      }

      volunteersQuery += " GROUP BY u.id, u.username, u.email, u.villages_covered";

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
      const reservations = await pool.query(reservationsQuery, reservationsParams);

      res.json({
        mergedAvailabilities: mergeAvailabilities(volunteers.rows, reservations.rows, date),
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
      const dogs = await pool.query("SELECT * FROM dogs WHERE user_id = $1", [userId]);
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

      if (typeof name !== "string" || typeof breed !== "string" || typeof age !== "number" || age < 0) {
        return res.status(400).json({
          error: "Invalid dog information. Name and breed must be strings, age must be a non-negative number.",
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
      const { autreCommuneNom, autreCommuneEmail, autreCommuneTelephone, autreCommuneVillageSouhaite } = req.body;

      if (!autreCommuneNom || !autreCommuneEmail || !autreCommuneTelephone || !autreCommuneVillageSouhaite) {
        return res.status(400).json({
          error: "Missing required information for 'Autres communes' request.",
        });
      }

      if (typeof autreCommuneNom !== "string" || typeof autreCommuneVillageSouhaite !== "string") {
        return res.status(400).json({
          error: "Type de données incorrectes dans 'Autres communes'",
        });
      }

      if (!autreCommuneEmail.includes("@") || typeof autreCommuneEmail !== "string") {
        return res.status(400).json({
          error: "Format de l'email incorrect pour 'Autres communes'",
        });
      }

      if (!/^[0-9]{10}$/.test(autreCommuneTelephone)) {
        return res.status(400).json({
          error: "Phone number must be exactly 10 digits.",
        });
      }

      const query = `
        INSERT INTO other_village_requests (name, email, phone_number, desired_village, request_date)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *;
      `;

      const values = [autreCommuneNom, autreCommuneEmail, autreCommuneTelephone, autreCommuneVillageSouhaite];
      const newRequest = await pool.query(query, values);

      console.log("New 'autres communes' request logged:", newRequest.rows[0]);

      res.status(201).json({
        message: "Demande pour autres communes enregistrée avec succès. Nous vous contacterons bientôt.",
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
        return res.status(400).json({ error: "Montant de don invalide. Minimum 1 EUR." });
      }
      const amountInCents = Math.round(amount * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        payment_method_types: ["card"],
        description: "Don à Chiens en Cavale",
      });
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'intention de paiement:", error);
      res.status(500).json({ error: "Échec du traitement du don" });
    }
  });

  return router;
};