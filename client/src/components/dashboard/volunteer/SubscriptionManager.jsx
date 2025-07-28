import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { loadStripe } from "@stripe/stripe-js";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEuroSign } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import "moment/locale/fr";
import toast from "react-hot-toast";

moment.locale("fr");

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const getSubscriptionMessage = (subscriptionStatus) => {
  if (subscriptionStatus.paid) return null;
  if (!subscriptionStatus.expiryDate) {
    return {
      message: "ACQUITTEZ VOTRE COTISATION ANNUELLE (9 €)",
      type: "error",
      action: true,
    };
  }
  const daysUntilExpiry = subscriptionStatus.expiryDate.diff(moment(), "days");
  const gracePeriodEnd = subscriptionStatus.expiryDate.clone().add(14, "days");
  const isGracePeriod =
    moment().isAfter(subscriptionStatus.expiryDate) &&
    moment().isBefore(gracePeriodEnd);

  if (isGracePeriod) {
    return {
      message: `ABONNEMENT EXPIRÉ LE ${subscriptionStatus.expiryDate.format(
        "DD/MM/YYYY"
      )}. RENOUVELEZ DANS ${gracePeriodEnd.diff(moment(), "days")} JOURS.`,
      type: "warning",
      action: true,
    };
  }
  if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    return {
      message: `ABONNEMENT EXPIRE DANS ${daysUntilExpiry} JOURS (${subscriptionStatus.expiryDate.format(
        "DD/MM/YYYY"
      )}).`,
      type: daysUntilExpiry <= 7 ? "error" : "warning",
      action: daysUntilExpiry <= 14,
    };
  }
  return null;
};

const getSessionIdFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("session_id");
};

const SubscriptionManager = ({ subscriptionStatus, fetchSubscriptionStatus }) => {
  const [loading, setLoading] = useState(false);
  const subscriptionMessage = getSubscriptionMessage(subscriptionStatus);

  // 🔁 Confirm subscription manually if redirected from Stripe
  useEffect(() => {
    const sessionId = getSessionIdFromURL();
    if (!sessionId || subscriptionStatus.paid) return;

    const confirmSubscription = async () => {
      try {
        const token = Cookies.get("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/volunteer/confirm-subscription`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId }),
          }
        );
        if (!res.ok) throw new Error("Échec de la confirmation.");
        toast.success("Abonnement confirmé !");
        fetchSubscriptionStatus(); // refresh UI
      } catch (err) {
        console.error("Confirmation error:", err);
        toast.error("Impossible de confirmer l'abonnement.");
      }
    };

    confirmSubscription();
  }, [subscriptionStatus.paid, fetchSubscriptionStatus]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const { sessionId, error } = await res.json();
      if (error || !sessionId)
        throw new Error(error || "Impossible de démarrer le paiement.");

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });
      if (stripeError) throw stripeError;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {subscriptionMessage && (
        <div
          className={`p-4 rounded shadow ${
            subscriptionMessage.type === "error"
              ? "bg-red-100 text-red-800"
              : subscriptionMessage.type === "warning"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          <FontAwesomeIcon icon={faEuroSign} className="mr-2" />
          {subscriptionMessage.message}
        </div>
      )}
      {!subscriptionStatus.paid && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Chargement …" : "Payer 9 €"}
        </button>
      )}
    </div>
  );
};

SubscriptionManager.propTypes = {
  subscriptionStatus: PropTypes.shape({
    paid: PropTypes.bool.isRequired,
    expiryDate: PropTypes.instanceOf(moment).nullable,
  }).isRequired,
  fetchSubscriptionStatus: PropTypes.func.isRequired,
};

export default SubscriptionManager;