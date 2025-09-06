const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// IMPORTANT: route path is "/" here; express.raw only on this route
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      console.log("➡️  Webhook received:", event.type, event.id); // TEMP log

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          if (session.mode === "subscription") {
            const userId = session.client_reference_id;
            const subscriptionId = session.subscription;
            const customerId = session.customer;

            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const active = ["active", "trialing"].includes(sub.status);
            const expiry = sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null;

            await req.app.get("db").query(
              `
              UPDATE users SET
                stripe_customer_id = COALESCE($1, stripe_customer_id),
                stripe_subscription_id = COALESCE($2, stripe_subscription_id),
                subscription_paid = $3,
                subscription_expiry_date = $4,
                first_subscription_paid_at = COALESCE(first_subscription_paid_at, NOW())
              WHERE id = $5
              `,
              [customerId, subscriptionId, active, expiry, userId]
            );
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.created":
        case "invoice.paid": {
          const sub =
            event.type === "invoice.paid"
              ? await stripe.subscriptions.retrieve(event.data.object.subscription)
              : event.data.object;

          const subscriptionId = sub.id;
          const customerId = sub.customer;
          const active = ["active", "trialing"].includes(sub.status);
          const expiry = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null;

          await req.app.get("db").query(
            `
            UPDATE users SET
              stripe_customer_id = COALESCE($1, stripe_customer_id),
              subscription_paid = $2,
              subscription_expiry_date = $3
            WHERE stripe_subscription_id = $4
               OR stripe_customer_id = $1
            `,
            [customerId, active, expiry, subscriptionId]
          );
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          await req.app.get("db").query(
            `
            UPDATE users SET
              subscription_paid = FALSE,
              subscription_expiry_date = NOW()
            WHERE stripe_subscription_id = $1
            `,
            [sub.id]
          );
          break;
        }

        default:
          // ignore others
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook handler error:", err);
      res.status(500).send("Server error in webhook");
    }
  }
);

module.exports = router;