// routes/volunteer/profile.js
const { computeVolunteerSubscriptionStatus } = require("./utils/subscription");

module.exports = function registerVolunteerProfileRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
  moment,
}) {
  router.get(
    "/volunteer/profile",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;
        const user = await pool.query(
          `
          SELECT 
            username,
            personal_id,
            personal_id_set,
            subscription_paid,
            subscription_expiry_date,
            profile_picture_url,
            time_updated_at,
            first_subscription_paid_at
          FROM users 
          WHERE id = $1
          `,
          [userId]
        );

        if (user.rows.length > 0) {
          const row = user.rows[0];
          const computed = computeVolunteerSubscriptionStatus(moment, row);

          res.json({
            username: row.username,
            personalId: row.personal_id,
            subscriptionPaid: computed.paid, // computed
            subscriptionExpiryDate: computed.expiryDate
              ? computed.expiryDate.toISOString()
              : null,
            profilePictureUrl: row.profile_picture_url || null,
            time_updated_at: row.time_updated_at || null,
            personalIdSet: row.personal_id_set,
            // NEW:
            canUnlockCard: computed.canUnlockCard,
          });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Failed to fetch user profile" });
      }
    }
  );
};
