// routes/volunteer/subscriptionConfirm.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = function registerSubscriptionConfirmRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
  router.post(
    "/volunteer/confirm-subscription",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const { sessionId } = req.body;
        if (!sessionId) {
          return res.status(400).json({ error: "Missing sessionId" });
        }

        // Expand essential fields for both "subscription" and "payment" modes
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["subscription"],
        });

        // Verify ownership
        const crid = session.client_reference_id;
        if (!crid || String(crid) !== String(req.user.userId)) {
          return res
            .status(403)
            .json({ error: "Session does not belong to the current user." });
        }

        // Validate success depending on mode
        const mode = session.mode; // "subscription" or "payment"
        let ok = false;

        if (mode === "subscription") {
          const subscription = session.subscription;
          if (!subscription) {
            return res.status(400).json({
              error:
                "No subscription found on session yet. Try again in a few seconds.",
            });
          }
          ok = ["active", "trialing"].includes(subscription.status);
        } else if (mode === "payment") {
          ok = session.payment_status === "paid";
        } else {
          return res
            .status(400)
            .json({ error: `Unsupported session mode: ${mode}` });
        }

        if (!ok) {
          return res.status(400).json({ error: "Payment not completed." });
        }

        // === Core change: set expiry to now + 1 year ===
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await pool.query(
          `
        UPDATE users 
        SET 
          stripe_subscription_id = COALESCE($1, stripe_subscription_id),
          subscription_paid = TRUE,
          subscription_expiry_date = $2,
          first_subscription_paid_at = COALESCE(first_subscription_paid_at, NOW())
        WHERE id = $3
        `,
          [session.subscription?.id || null, expiryDate, req.user.userId]
        );

        console.log(
          `✅ Marked userId ${
            req.user.userId
          } as paid until ${expiryDate.toISOString()}`
        );

        res.json({
          message: "Subscription confirmed.",
          expiryDate: expiryDate.toISOString(),
        });
      } catch (err) {
        console.error("Error confirming subscription:", err);
        res.status(500).json({ error: "Failed to confirm subscription" });
      }
    }
  );
};
