// routes/volunteer/subscriptionStatus.js
const { computeVolunteerSubscriptionStatus } = require("./utils/subscription");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const volunteerId = req.user.userId;

        // --- Inline best-effort sync with Stripe (no external fetch) ---
        try {
          const { rows: subRows } = await pool.query(
            "SELECT stripe_subscription_id FROM users WHERE id = $1",
            [volunteerId]
          );
          const subId = subRows[0]?.stripe_subscription_id;
          if (subId) {
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
              [active, expiryDate, volunteerId]
            );
          }
        } catch (syncErr) {
          // non-fatal — just log
          console.warn("subscription inline sync failed:", syncErr?.message);
        }

        // --- Return current status from DB ---
        const { rows } = await pool.query(
          `
          SELECT subscription_paid, subscription_expiry_date
            FROM users
           WHERE id = $1 AND role = 'volunteer'
          `,
          [volunteerId]
        );

        if (!rows.length) {
          return res.status(404).json({ error: "Volunteer not found" });
        }

        const computed = computeVolunteerSubscriptionStatus(moment, rows[0]);
        res.json({
          paid: computed.paid,
          expiryDate: computed.expiryDate ? computed.expiryDate.toISOString() : null,
        });
      } catch (error) {
        console.error("Error fetching subscription status:", error);
        res.status(500).json({ error: "Failed to fetch subscription status" });
      }
    }
  );
};