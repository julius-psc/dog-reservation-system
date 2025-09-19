// routes/volunteer/subscriptionStatus.js
const { computeVolunteerSubscriptionStatus } = require("./utils/subscription");

module.exports = function registerSubscriptionStatusRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  moment,
}) {
  router.get(
    "/volunteer/subscription",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        // Optional best-effort sync (ignore errors)
        try {
          await fetch(
            `${process.env.API_BASE_URL}/volunteer/sync-subscription`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${
                  req.headers.authorization?.split(" ")[1]
                }`,
              },
            }
          );
        } catch (_) {}

        const volunteerId = req.user.userId;
        const { rows } = await pool.query(
          `
        SELECT subscription_paid, subscription_expiry_date
        FROM users WHERE id = $1 AND role = 'volunteer'
        `,
          [volunteerId]
        );

        if (!rows.length)
          return res.status(404).json({ error: "Volunteer not found" });

        const computed = computeVolunteerSubscriptionStatus(moment, rows[0]);
        res.json({
          paid: computed.paid,
          expiryDate: computed.expiryDate
            ? computed.expiryDate.toISOString()
            : null,
          // keep interface minimal; no deferral/hide flags anymore
        });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({ error: "Failed to fetch subscription status" });
      }
    }
  );
};
