const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
      console.log("➡️ Webhook received:", event.type, event.id);
      
      const db = req.app.get("db");
      if (!db) {
        console.error("❌ Database connection not available");
        return res.status(500).send("Database connection error");
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          console.log("🔍 Session data:", {
            id: session.id,
            mode: session.mode,
            client_reference_id: session.client_reference_id,
            customer: session.customer,
            subscription: session.subscription,
            payment_status: session.payment_status,
            metadata: session.metadata
          });

          if (session.mode === "subscription") {
            // Get user ID from client_reference_id or metadata
            let userId = session.client_reference_id;
            if (!userId && session.metadata?.user_id) {
              userId = session.metadata.user_id;
            }

            const subscriptionId = session.subscription;
            const customerId = session.customer;

            if (!userId) {
              console.error("❌ Missing user ID in session - cannot process");
              break;
            }

            if (!subscriptionId) {
              console.error("❌ Missing subscription ID in session - retrying in 10 seconds");
              // Sometimes Stripe doesn't include subscription immediately, let's wait
              setTimeout(async () => {
                try {
                  const updatedSession = await stripe.checkout.sessions.retrieve(session.id);
                  if (updatedSession.subscription) {
                    console.log("✅ Found subscription on retry:", updatedSession.subscription);
                    await processSubscription(db, userId, updatedSession.subscription, customerId);
                  }
                } catch (retryErr) {
                  console.error("❌ Retry failed:", retryErr);
                }
              }, 10000);
              break;
            }

            console.log("🔍 Processing subscription for userId:", userId);

            await processSubscription(db, userId, subscriptionId, customerId);
          }
          break;
        }

        case "customer.subscription.updated":
        case "customer.subscription.created":
        case "invoice.paid": {
          const sub = event.type === "invoice.paid"
            ? await stripe.subscriptions.retrieve(event.data.object.subscription)
            : event.data.object;
            
          const subscriptionId = sub.id;
          const customerId = sub.customer;
          const active = ["active", "trialing"].includes(sub.status);
          const expiry = sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : null;

          console.log("🔍 Updating subscription:", {
            subscriptionId,
            customerId,
            status: sub.status,
            active,
            expiry: expiry?.toISOString()
          });

          const updateResult = await db.query(
            `
            UPDATE users SET
              stripe_customer_id = COALESCE($1, stripe_customer_id),
              subscription_paid = $2,
              subscription_expiry_date = $3
            WHERE stripe_subscription_id = $4
               OR stripe_customer_id = $1
            RETURNING id, username, subscription_paid, subscription_expiry_date
            `,
            [customerId, active, expiry, subscriptionId]
          );

          console.log("✅ Subscription update result:", {
            rowsAffected: updateResult.rowCount,
            updatedUsers: updateResult.rows
          });
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          console.log("🔍 Deleting subscription:", sub.id);

          const updateResult = await db.query(
            `
            UPDATE users SET
              subscription_paid = FALSE,
              subscription_expiry_date = NOW()
            WHERE stripe_subscription_id = $1
            RETURNING id, username
            `,
            [sub.id]
          );

          console.log("✅ Subscription deletion result:", {
            rowsAffected: updateResult.rowCount,
            updatedUsers: updateResult.rows
          });
          break;
        }

        default:
          console.log("ℹ️ Ignoring webhook event type:", event.type);
          break;
      }

      res.json({ received: true });
    } catch (err) {
      console.error("❌ Webhook handler error:", err);
      console.error("❌ Error stack:", err.stack);
      res.status(500).send("Server error in webhook");
    }
  }
);

async function processSubscription(db, userId, subscriptionId, customerId) {
  try {
    // Verify user exists
    const userCheck = await db.query("SELECT id, username FROM users WHERE id = $1", [userId]);
    console.log("🔍 User found:", userCheck.rows.length > 0 ? userCheck.rows[0] : "NONE");

    if (userCheck.rows.length === 0) {
      console.error("❌ User not found with ID:", userId);
      return;
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const active = ["active", "trialing"].includes(sub.status);
    const expiry = sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null;

    console.log("🔍 Subscription details:", {
      subscriptionId,
      status: sub.status,
      active,
      expiry: expiry?.toISOString()
    });

    const updateResult = await db.query(
      `
      UPDATE users SET
        stripe_customer_id = COALESCE($1, stripe_customer_id),
        stripe_subscription_id = COALESCE($2, stripe_subscription_id),
        subscription_paid = $3,
        subscription_expiry_date = $4,
        first_subscription_paid_at = COALESCE(first_subscription_paid_at, NOW())
      WHERE id = $5
      RETURNING id, username, subscription_paid, subscription_expiry_date
      `,
      [customerId, subscriptionId, active, expiry, userId]
    );

    console.log("✅ Database update result:", {
      rowsAffected: updateResult.rowCount,
      updatedUser: updateResult.rows[0]
    });

    if (updateResult.rowCount === 0) {
      console.error("❌ No rows updated for userId:", userId);
    }
  } catch (error) {
    console.error("❌ Error processing subscription:", error);
  }
}

module.exports = router;