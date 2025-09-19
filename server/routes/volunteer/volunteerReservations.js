// routes/volunteer/volunteerReservations.js
module.exports = function registerVolunteerReservationsRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  moment,
}) {
  router.get(
    "/volunteer/reservations",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const volunteerId = req.user.userId;

        await client.query(
          `
          UPDATE reservations
          SET status = CASE
            WHEN status = 'accepted' AND (reservation_date + end_time::time) < NOW() THEN 'completed'
            WHEN status = 'pending' AND (reservation_date + end_time::time) < NOW() THEN 'cancelled'
            ELSE status
          END
          WHERE volunteer_id = $1 
            AND status IN ('accepted', 'pending')
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
          ORDER BY r.reservation_date, r.start_time
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
};
