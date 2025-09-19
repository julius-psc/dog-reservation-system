import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { loadStripe } from "@stripe/stripe-js";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEuroSign, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import "moment/locale/fr";
import toast from "react-hot-toast";

moment.locale("fr");

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const API = import.meta.env.VITE_API_BASE_URL;

function parseDate(d) {
  if (!d) return null;
  const m = moment(d);
  return m.isValid() ? m : null;
}

const SubscriptionManager = ({ subscriptionStatus, fetchSubscriptionStatus }) => {
  const [loading, setLoading] = useState(false);
  const expiryMoment = parseDate(subscriptionStatus.expiryDate);

  const subscriptionMessage = (() => {
    if (subscriptionStatus.paid) {
      if (expiryMoment) {
        const daysUntilExpiry = expiryMoment.diff(moment(), "days");
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          return {
            message: `ABONNEMENT EXPIRE DANS ${daysUntilExpiry} JOURS (${expiryMoment.format(
              "DD/MM/YYYY"
            )}).`,
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    if (subscriptionStatus.paid) {
      const url = new URL(window.location.href);
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = Cookies.get("token");
        await fetch(`${API}/volunteer/confirm-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sessionId }),
        });
      } catch {
        // Intentionally left blank: error handled in finally
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
          if (typeof fetchSubscriptionStatus === "function") {
            fetchSubscriptionStatus();
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      const res = await fetch(`${API}/volunteer/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const { sessionId, error } = await res.json();
      if (error || !sessionId) throw new Error(error || "Impossible de démarrer le paiement.");

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe non initialisé.");
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw stripeError;
    } catch (err) {
      toast.error(err?.message || "Erreur lors du paiement.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      if (typeof fetchSubscriptionStatus === "function") {
        await fetchSubscriptionStatus();
      }
      toast.success("Statut d’abonnement mis à jour.");
    } catch {
      toast.error("Échec de la mise à jour.");
    }
  }, [fetchSubscriptionStatus]);

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

      {!subscriptionStatus.paid ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Chargement …" : "Payer 9 €"}
          </button>
          <button
            onClick={handleRefresh}
            className="border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2 px-3 rounded inline-flex items-center"
            title="Rafraîchir le statut"
          >
            <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
            Rafraîchir
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-green-700 font-medium">
            Abonnement actif{expiryMoment ? ` jusqu’au ${expiryMoment.format("DD/MM/YYYY")}` : ""}.
          </span>
          <button
            onClick={handleRefresh}
            className="border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2 px-3 rounded inline-flex items-center"
            title="Rafraîchir le statut"
          >
            <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
            Rafraîchir
          </button>
        </div>
      )}
    </div>
  );
};

SubscriptionManager.propTypes = {
  subscriptionStatus: PropTypes.shape({
    paid: PropTypes.bool.isRequired,
    expiryDate: PropTypes.string,
  }).isRequired,
  fetchSubscriptionStatus: PropTypes.func.isRequired,
};

export default SubscriptionManager;