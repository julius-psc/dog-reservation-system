// routes/volunteer/documentsStatus.js
module.exports = function registerVolunteerDocumentsStatusRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
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
};
