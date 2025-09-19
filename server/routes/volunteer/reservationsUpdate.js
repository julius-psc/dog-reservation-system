// routes/volunteer/reservationsUpdate.js
const {
  sendReservationApprovedEmail,
  sendVolunteerConfirmationEmail,
  sendReservationRejectedEmail,
  sendReservationRequestEmailToVolunteer,
} = require("../../email/emailService");

module.exports = function registerReservationsUpdateRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  moment,
  connectedClients,
  WebSocket,
}) {
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

        if (
          !status ||
          !["pending", "accepted", "rejected", "cancelled"].includes(status)
        ) {
          throw new Error("Invalid reservation status.");
        }

        const reservationCheck = await client.query(
          "SELECT volunteer_id, client_id, dog_id, reservation_date, start_time, end_time, status FROM reservations WHERE id = $1",
          [reservationId]
        );

        if (
          reservationCheck.rows.length === 0 ||
          reservationCheck.rows[0].volunteer_id !== req.user.userId
        ) {
          throw new Error("Unauthorized to update this reservation.");
        }

        const currentReservation = reservationCheck.rows[0];
        const endDateTime = moment(
          `${currentReservation.reservation_date} ${currentReservation.end_time}`,
          "YYYY-MM-DD HH:mm"
        );
        const now = moment();

        if (endDateTime.isBefore(now)) {
          if (currentReservation.status === "accepted") {
            await client.query(
              "UPDATE reservations SET status = 'completed' WHERE id = $1",
              [reservationId]
            );
            throw new Error("Cannot modify a completed reservation.");
          } else if (currentReservation.status === "pending") {
            await client.query(
              "UPDATE reservations SET status = 'cancelled' WHERE id = $1",
              [reservationId]
            );
            throw new Error("Cannot modify a cancelled reservation.");
          }
        }

        const updatedReservationResult = await client.query(
          "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
          [status, reservationId]
        );
        const updatedReservation = updatedReservationResult.rows[0];

        if (status === "rejected") {
          const { reservation_date, start_time, end_time, client_id, dog_id } =
            currentReservation;

          const clientVillageResult = await client.query(
            "SELECT village FROM users WHERE id = $1",
            [client_id]
          );
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
          const availableVolunteers = await client.query(
            availableVolunteersQuery,
            [
              dayOfWeek,
              req.user.userId,
              clientVillage,
              start_time,
              end_time,
              reservation_date,
            ]
          );

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
            const detailsResult = await client.query(detailsQuery, [
              reservationId,
            ]);
            const {
              client_name,
              dog_name,
              client_address,
              dog_breed,
              dog_age,
              client_phone,
            } = detailsResult.rows[0];

            const formattedDate = new Date(reservation_date).toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );
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

            connectedClients.forEach((clientWs) => {
              if (
                clientWs.readyState === WebSocket.OPEN &&
                clientWs.village === clientVillage
              ) {
                clientWs.send(
                  JSON.stringify({
                    type: "reservation_update",
                    reservation: reassignedReservation,
                  })
                );
              }
            });

            await client.query("COMMIT");
            return res.json({
              message:
                "Reservation rejected and reassigned to another volunteer.",
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
            const rejectionDetailsResult = await client.query(
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
              const formattedDate = new Date(
                reservation_date
              ).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              await sendReservationRejectedEmail(
                client_email,
                client_name,
                dog_name,
                formattedDate,
                start_time,
                end_time
              );
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
          const detailsResult = await client.query(detailsQuery, [
            reservationId,
          ]);

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

            const formattedDate = new Date(reservation_date).toLocaleDateString(
              "fr-FR",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );

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

          connectedClients.forEach((clientWs) => {
            if (
              clientWs.readyState === WebSocket.OPEN &&
              clientWs.village === req.user.village
            ) {
              clientWs.send(
                JSON.stringify({
                  type: "reservation_update",
                  reservation: updatedReservation,
                })
              );
            }
          });

          await client.query("COMMIT");
          res.json(updatedReservation);
        } else {
          connectedClients.forEach((clientWs) => {
            if (
              clientWs.readyState === WebSocket.OPEN &&
              clientWs.village === req.user.village
            ) {
              clientWs.send(
                JSON.stringify({
                  type: "reservation_update",
                  reservation: updatedReservation,
                })
              );
            }
          });

          await client.query("COMMIT");
          res.json(updatedReservation);
        }
      } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating reservation status:", error);
        res.status(500).json({
          error: error.message || "Failed to update reservation status.",
        });
      } finally {
        client.release();
      }
    }
  );
};
