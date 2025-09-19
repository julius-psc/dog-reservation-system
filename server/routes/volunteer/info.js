// routes/volunteer/info.js
module.exports = function registerVolunteerInfoRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
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
};
