import { useState } from "react";
import PropTypes from "prop-types";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
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
      message: "ACQUITTEZ VOTRE COTISATION ANNUELLE (9€)",
      type: "error",
      action: true,
    };
  }
  const daysUntilExpiry = subscriptionStatus.expiryDate.diff(moment(), "days");
  const gracePeriodEnd = subscriptionStatus.expiryDate.clone().add(14, "days"); // 2-week grace period
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

const SubscriptionManager = ({
  subscriptionStatus,
  fetchSubscriptionStatus,
  showPaymentForm,
  setShowPaymentForm,
}) => {
  const subscriptionMessage = getSubscriptionMessage(subscriptionStatus);

  const PaymentForm = ({ onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentError, setPaymentError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setProcessing(true);
      setPaymentError(null);

      const token = Cookies.get("token");
      try {
        const cardElement = elements.getElement(CardElement);
        const { error: paymentMethodError, paymentMethod } =
          await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
          });

        if (paymentMethodError) {
          throw new Error(paymentMethodError.message);
        }

        console.log("Payment Method ID:", paymentMethod.id);

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription/pay`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              payment_method_id: paymentMethod.id,
            }),
          }
        );

        const data = await response.json();
        console.log("Backend Response:", data);

        // CASE 1 — fully paid already
        if (response.ok && data.success) {
          onSuccess();
          toast.success("ABONNEMENT ACTIVÉ AVEC SUCCÈS!");
        }
        // CASE 2 — requires_action (3DSecure)
        else if (response.status === 402 && data.status === "requires_action") {
          const { error: confirmError, paymentIntent } =
            await stripe.confirmCardPayment(data.clientSecret);

          if (confirmError) {
            throw new Error(confirmError.message);
          }

          if (paymentIntent.status === "succeeded") {
            onSuccess();
            toast.success("ABONNEMENT ACTIVÉ AVEC SUCCÈS!");
          } else {
            throw new Error(
              `Échec de la confirmation: statut ${paymentIntent.status}`
            );
          }
        }
        // CASE 3 — error
        else {
          throw new Error(data.error || "Échec du traitement de l'abonnement");
        }
      } catch (err) {
        setPaymentError(err.message);
        toast.error(err.message);
      } finally {
        setProcessing(false);
      }
    };

    return (
      <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100 hover:scale-105">
        <h3 className="text-xl font-bold mb-4 text-primary-blue dark:text-primary-blue">
          Adhésion annuelle (9€)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Rejoignez-nous en tant que bénévole promeneur avec un abonnement
          annuel !
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": { color: "#aab7c4" },
                  },
                  invalid: { color: "#9e2146" },
                },
              }}
            />
          </div>
          {paymentError && (
            <p className="text-red-500 text-sm animate-pulse">{paymentError}</p>
          )}
          <div className="flex justify-between gap-4">
            <button
              type="submit"
              disabled={!stripe || processing}
              className="flex-1 bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition-all duration-300"
            >
              {processing ? "Traitement..." : "Payer 9€"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all duration-300"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    );
  };

  PaymentForm.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  return (
    <>
      {subscriptionMessage && (
        <div
          className={`mb-8 p-6 rounded-xl shadow-lg flex items-center justify-between transform transition-all duration-300 hover:shadow-xl ${
            subscriptionMessage.type === "error"
              ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200"
              : subscriptionMessage.type === "warning"
              ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
              : "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
          }`}
        >
          <div className="flex items-center">
            <FontAwesomeIcon icon={faEuroSign} className="mr-3 text-lg" />
            <p className="text-sm font-semibold">
              {subscriptionMessage.message}
            </p>
          </div>
          {subscriptionMessage.action && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-primary-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              {subscriptionStatus.paid ? "Renouveler" : "Payer maintenant"}
            </button>
          )}
        </div>
      )}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50">
          <Elements stripe={stripePromise}>
            <PaymentForm
              onSuccess={() => {
                setShowPaymentForm(false);
                fetchSubscriptionStatus();
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Elements>
        </div>
      )}
    </>
  );
};

SubscriptionManager.propTypes = {
  subscriptionStatus: PropTypes.shape({
    paid: PropTypes.bool.isRequired,
    expiryDate: PropTypes.instanceOf(moment).nullable,
  }).isRequired,
  fetchSubscriptionStatus: PropTypes.func.isRequired,
  showPaymentForm: PropTypes.bool.isRequired,
  setShowPaymentForm: PropTypes.func.isRequired,
};

export default SubscriptionManager;
