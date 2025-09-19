// routes/volunteer/availabilities.js
module.exports = function registerVolunteerAvailabilitiesRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  isValidTime,
  moment,
}) {
  // GET /volunteer/availabilities
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

  // POST /availabilities
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
};
