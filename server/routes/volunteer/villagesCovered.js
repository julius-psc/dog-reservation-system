// routes/volunteer/villagesCovered.js
module.exports = function registerVolunteerVillagesCoveredRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  moment,
  connectedClients,
  WebSocket,
}) {
  // GET /volunteer/villages-covered
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

  // PUT /volunteer/villages-covered
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
};
