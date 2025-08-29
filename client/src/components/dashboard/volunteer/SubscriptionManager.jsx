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

function parseDate(d) {
  if (!d) return null;
  const m = moment(d);
  return m.isValid() ? m : null;
}

const SubscriptionManager = ({ subscriptionStatus, fetchSubscriptionStatus }) => {
  const [loading, setLoading] = useState(false);

  const expiryMoment = parseDate(subscriptionStatus.expiryDate);

  // Build simple banner
  const subscriptionMessage = (() => {
    if (subscriptionStatus.paid) {
      if (expiryMoment) {
        const daysUntilExpiry = expiryMoment.diff(moment(), "days");
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          return {
            message: `ABONNEMENT EXPIRE DANS ${daysUntilExpiry} JOURS (${expiryMoment.format("DD/MM/YYYY")}).`,
            type: daysUntilExpiry <= 7 ? "error" : "warning",
            action: true,
          };
        }
        if (expiryMoment.isBefore(moment())) {
          return {
            message: `ABONNEMENT EXPIRÉ LE ${expiryMoment.format("DD/MM/YYYY")}.`,
            type: "error",
            action: true,
          };
        }
      }
      return null;
    }

    // Not paid
    if (!subscriptionStatus.paid) {
      if (expiryMoment && expiryMoment.isBefore(moment())) {
        return {
          message: `ABONNEMENT EXPIRÉ LE ${expiryMoment.format("DD/MM/YYYY")}.`,
          type: "error",
          action: true,
        };
      }
      return {
        message: "ACQUITTEZ VOTRE COTISATION ANNUELLE (9 €)",
        type: "error",
        action: true,
      };
    }

    return null;
  })();

  // Confirm subscription after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId || subscriptionStatus.paid) return;

    let didRun = false;

    (async () => {
      if (didRun) return;
      didRun = true;
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

        if (res.ok) {
          toast.success("Abonnement confirmé !");
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
          fetchSubscriptionStatus();
        } else {
          const text = await res.text();
          console.warn("First confirm failed:", text);
          setTimeout(async () => {
            try {
              const retry = await fetch(
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
              if (retry.ok) {
                toast.success("Abonnement confirmé !");
                const url2 = new URL(window.location.href);
                url2.searchParams.delete("session_id");
                window.history.replaceState({}, "", url2.toString());
                fetchSubscriptionStatus();
                return;
              }
              toast.error("Impossible de confirmer l'abonnement.");
            } catch (err) {
              toast.error("Impossible de confirmer l'abonnement :", err);
            }
          }, 1500);
        }
      } catch (err) {
        console.error("Confirmation error:", err);
        toast.error("Impossible de confirmer l'abonnement.");
      }
    })();
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
      toast.error(err.message || "Erreur lors du paiement.");
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
    expiryDate: PropTypes.string, // ISO or null
  }).isRequired,
  fetchSubscriptionStatus: PropTypes.func.isRequired,
};

export default SubscriptionManager;