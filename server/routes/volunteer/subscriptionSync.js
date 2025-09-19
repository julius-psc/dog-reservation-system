// routes/volunteer/subscriptionSync.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = function registerSubscriptionSyncRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
  router.post(
    "/volunteer/sync-subscription",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const { rows } = await pool.query(
          "SELECT stripe_subscription_id FROM users WHERE id = $1",
          [req.user.userId]
        );
        const subId = rows[0]?.stripe_subscription_id;
        if (!subId) return res.json({ synced: false });

        const sub = await stripe.subscriptions.retrieve(subId);
        const active = ["active", "trialing"].includes(sub.status);
        const expiryDate = sub.current_period_end
          ? new Date(sub.current_period_end * 1000)
          : null;

        await pool.query(
          `
        UPDATE users
        SET subscription_paid = $1,
            subscription_expiry_date = $2
        WHERE id = $3
        `,
          [active, expiryDate, req.user.userId]
        );

        res.json({ synced: true, status: sub.status, expiryDate });
      } catch (e) {
        console.error("sync-subscription error:", e);
        res.status(500).json({ error: "Failed to sync subscription." });
      }
    }
  );
};
