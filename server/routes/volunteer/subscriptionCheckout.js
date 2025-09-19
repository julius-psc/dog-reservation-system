// routes/volunteer/subscriptionCheckout.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = function registerSubscriptionCheckoutRoutes({
  router,
  authenticate,
  authorizeVolunteer,
}) {
  router.post(
    "/volunteer/create-checkout-session",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const YOUR_PRICE_ID = process.env.STRIPE_PRICE;
        const domain = process.env.FRONTEND_URL;

        console.log("Creating checkout session for userId:", req.user.userId); // Debug log

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: YOUR_PRICE_ID, quantity: 1 }],
          success_url: `${domain}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${domain}/subscription/cancel`,
          // CRITICAL: Use the actual numeric user ID, not a UUID
          client_reference_id: String(req.user.userId), // Ensure it's a string but contains the numeric ID
          customer_email: req.user.email,
          // Add metadata as backup
          metadata: {
            user_id: String(req.user.userId),
            user_email: req.user.email,
          },
        });

        console.log(
          `✅ Created Checkout Session: ${session.id} for userId ${req.user.userId}`
        );

        res.json({ sessionId: session.id });
      } catch (err) {
        console.error("❌ Error creating Checkout session:", err);
        res.status(500).json({ error: "Failed to create session" });
      }
    }
  );
};
