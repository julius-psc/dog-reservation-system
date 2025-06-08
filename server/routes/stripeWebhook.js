const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = (pool) => {
  router.post(
    "/webhooks/stripe",
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
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const data = event.data.object;
      const type = event.type;

      console.log(`✅ Received Stripe event: ${type}`);

      try {
        switch (type) {
          case "checkout.session.completed":
            if (
              data.mode === "subscription" &&
              data.subscription &&
              data.customer_email
            ) {
              // Save stripe_subscription_id in user row
              await pool.query(
                `UPDATE users 
                 SET stripe_subscription_id = $1
                 WHERE email = $2`,
                [data.subscription, data.customer_email]
              );
              console.log(
                `✅ User ${data.customer_email} subscription saved: ${data.subscription}`
              );
            }
            break;

          case "invoice.paid":
            const invoicePeriodEnd = data.lines.data[0].period.end * 1000;
            await pool.query(
              `UPDATE users 
               SET subscription_paid = $1, 
                   subscription_expiry_date = $2 
               WHERE stripe_subscription_id = $3`,
              [true, new Date(invoicePeriodEnd), data.subscription]
            );
            console.log(
              `✅ Subscription ${data.subscription} marked as paid, expiry updated.`
            );
            break;

          case "invoice.payment_failed":
          case "customer.subscription.deleted":
            await pool.query(
              `UPDATE users 
               SET subscription_paid = $1, 
                   subscription_expiry_date = $2 
               WHERE stripe_subscription_id = $3`,
              [false, null, data.subscription || data.id]
            );
            console.log(
              `⚠️ Subscription ${
                data.subscription || data.id
              } marked as unpaid.`
            );
            break;

          case "customer.subscription.updated":
            const periodEnd = data.current_period_end * 1000;
            await pool.query(
              `UPDATE users 
               SET subscription_expiry_date = $1 
               WHERE stripe_subscription_id = $2`,
              [new Date(periodEnd), data.id]
            );
            console.log(`✅ Subscription ${data.id} expiry updated.`);
            break;

          default:
            console.log(`ℹ️ Unhandled event type: ${type}`);
        }

        res.json({ received: true });
      } catch (err) {
        console.error("❌ Error processing webhook:", err);
        res.status(500).send("Internal Server Error");
      }
    }
  );

  return router;
};