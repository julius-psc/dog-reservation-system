import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import HolidayModeButton from "./recycled/HolidayButton";
import AvailabilityForm from "./forms/AvailabilityForm";
import LogoutButton from "./recycled/LogoutButton";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faCalendarCheck,
  faCheck,
  faBan,
  faExclamationTriangle,
  faPaw,
  faEuroSign,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

// Initialize Stripe with your Publishable Key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component (unchanged)
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
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          payment_method_id: paymentMethod.id, 
          amount: 10 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Payment processing failed");
      }

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.error || "Payment was not successful");
      }
    } catch (err) {
      setPaymentError(err.message || "An error occurred during payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <h3 className="text-lg font-semibold mb-4 dark:text-white"> Pour devenir bénévole promeneur vous devez vous acquitter dans les meilleurs délais de l’adhésion annuelle (9 euros)</h3>
      <form onSubmit={handleSubmit} className="space-y-4 w-100">
        <CardElement
          className="p-2 border rounded dark:bg-gray-700 dark:text-white"
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#fff",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
        />
        {paymentError && <p className="text-red-500 text-sm">{paymentError}</p>}
        <div className="flex justify-between">
          <button
            type="submit"
            disabled={!stripe || processing}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Traitement..." : "Payer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
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

const VolunteerDashboard = ({ handleLogout }) => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(true);
  const [errorAvailabilities, setErrorAvailabilities] = useState(null);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [villagesCovered, setVillagesCovered] = useState([]);
  const [selectedVillage, setSelectedVillage] = useState("");
  const [hasVillagesCoveredBeenSet, setHasVillagesCoveredBeenSet] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [errorVillages, setErrorVillages] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    paid: false,
    expiryDate: null,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [errorSubscription, setErrorSubscription] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [volunteerVillage, setVolunteerVillage] = useState(null);

  const villageOptions = [
    "Anisy", "Mathieu", "Epron", "Cambes-en-Plaine", "Authie", "Saint-Contest",
    "Banville", "Biéville-Beuville", "Périers-sur-le-Dan", "Blainville-sur-Orne",
    "Caen", "Douvres-la-Délivrande", "Hérouville-Saint-Clair", "Ouistreham", "Vire",
  ];

  const frenchStatusMap = {
    pending: "En attente",
    accepted: "Accepté",
    rejected: "Refusée",
    cancelled: "Annulée",
    completed: "Terminé",
  };

  const fetchSubscriptionStatus = useCallback(async () => {
    setLoadingSubscription(true);
    setErrorSubscription(null);
    const token = Cookies.get("token");
    if (!token) {
      setErrorSubscription("Authentication required");
      setLoadingSubscription(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch subscription status");
      }
      const data = await response.json();
      setSubscriptionStatus({
        paid: data.subscription_paid,
        expiryDate: data.subscription_expiry_date ? moment(data.subscription_expiry_date) : null,
      });
    } catch (err) {
      console.error("Subscription fetch error:", err);
      setErrorSubscription(err.message);
    } finally {
      setLoadingSubscription(false);
    }
  }, []);

  const fetchAvailabilities = useCallback(async () => {
    setLoadingAvailabilities(true);
    setErrorAvailabilities(null);
    const token = Cookies.get("token");
    if (!token) {
      setErrorAvailabilities("Authentication required");
      setLoadingAvailabilities(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/availabilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch availability data");
      }
      const data = await response.json();
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Availability fetch error:", err);
      setErrorAvailabilities(err.message);
    } finally {
      setLoadingAvailabilities(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true);
    setReservationsError(null);
    const token = Cookies.get("token");
    if (!token) {
      setReservationsError("Authentication required");
      setReservationsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reservation data");
      }
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      console.error("Reservation fetch error:", err);
      setReservationsError(err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  const fetchVolunteerData = useCallback(async () => {
    setLoadingVillages(true);
    setErrorVillages(null);
    const token = Cookies.get("token");
    if (!token) {
      setErrorVillages("Authentication required");
      setLoadingVillages(false);
      return;
    }
    try {
      const [villageResponse, villagesCoveredResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/info`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!villageResponse.ok) {
        const errorData = await villageResponse.json();
        throw new Error(errorData.error || "Failed to fetch volunteer info");
      }
      const villageData = await villageResponse.json();
      setVolunteerVillage(villageData.village);

      if (!villagesCoveredResponse.ok) {
        const errorData = await villagesCoveredResponse.json();
        throw new Error(errorData.error || "Failed to fetch villages covered");
      }
      const villagesData = await villagesCoveredResponse.json();
      const fetchedVillages = villagesData.villages_covered || [];

      if (fetchedVillages.length === 0 && villageData.village) {
        await updateVillages([villageData.village]);
      } else {
        setVillagesCovered(fetchedVillages);
        setHasVillagesCoveredBeenSet(fetchedVillages.length > 0);
      }
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      setErrorVillages(error.message);
      setActionMessage(`Échec du chargement des données: ${error.message}`);
      setActionType("error");
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailabilities();
    fetchReservations();
    fetchVolunteerData();
    fetchSubscriptionStatus();
  }, [fetchAvailabilities, fetchReservations, fetchVolunteerData, fetchSubscriptionStatus]);

  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => {
        setActionMessage(null);
        setActionType(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  const handleAvailabilitySaved = () => {
    setShowAvailabilityForm(false);
    fetchAvailabilities();
  };

  const handleReservationAction = async (reservationId, status) => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Échec de ${status} la réservation`);
      }
      fetchReservations();
      setActionMessage(`Réservation ${status} avec succès!`);
      setActionType("success");
    } catch (err) {
      console.error(`${status} reservation error:`, err);
      setActionMessage(`Erreur lors du traitement de la réservation: ${err.message}`);
      setActionType("error");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setActionMessage("Paiement effectué avec succès!");
    setActionType("success");
    fetchSubscriptionStatus();
  };

  const getSubscriptionMessage = () => {
    if (subscriptionStatus.paid) {
      // Use current year or expiry year (commented alternative below)
      const currentYear = moment().year();
      return {
        message: `Votre cotisation annuelle ${currentYear} est acquittée et nous vous en remercions.`,
        type: "success",
        action: false,
      };
      // Alternative: Use expiry year
      // const expiryYear = subscriptionStatus.expiryDate ? subscriptionStatus.expiryDate.year() : moment().year();
      // return {
      //   message: `Votre cotisation annuelle ${expiryYear} est acquittée et nous vous en remercions.`,
      //   type: "success",
      //   action: false,
      // };
    }

    if (!subscriptionStatus.expiryDate) {
      return {
        message: "Votre abonnement de 10€/an est requis. Veuillez payer maintenant.",
        type: "error",
        action: true,
      };
    }

    const daysUntilExpiry = subscriptionStatus.expiryDate.diff(moment(), "days");
    const gracePeriodEnd = subscriptionStatus.expiryDate.clone().add(21, "days");
    const isGracePeriod =
      moment().isAfter(subscriptionStatus.expiryDate) && moment().isBefore(gracePeriodEnd);

    if (isGracePeriod) {
      return {
        message: `Votre abonnement a expiré le ${subscriptionStatus.expiryDate.format(
          "DD/MM/YYYY"
        )}. Renouvelez-le dans les ${gracePeriodEnd.diff(moment(), "days")} jours.`,
        type: "warning",
        action: true,
      };
    }

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return {
        message: `Votre abonnement expire dans ${daysUntilExpiry} jours (le ${subscriptionStatus.expiryDate.format(
          "DD/MM/YYYY"
        )}).`,
        type: daysUntilExpiry <= 7 ? "error" : "warning",
        action: daysUntilExpiry <= 14,
      };
    }

    return null;
  };

  const groupedAvailabilities = availabilities.reduce((acc, availability) => {
    const day = availability.day_of_week;
    acc[day] = acc[day] || [];
    acc[day].push({ startTime: availability.start_time, endTime: availability.end_time });
    return acc;
  }, {});

  const daysOfWeekLabels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const handleAddVillage = async () => {
    if (!selectedVillage.trim()) return;
    if (villagesCovered.includes(selectedVillage)) {
      setActionMessage(`Le village "${selectedVillage}" est déjà dans votre liste.`);
      setActionType("warning");
      return;
    }
    const newVillages = [...villagesCovered, selectedVillage.trim()];
    await updateVillages(newVillages);
    setSelectedVillage("");
  };

  const handleRemoveVillage = async (villageToRemove) => {
    if (villageToRemove === volunteerVillage) {
      setActionMessage("Vous ne pouvez pas supprimer votre village par défaut.");
      setActionType("error");
      return;
    }
    const updatedVillages = villagesCovered.filter((village) => village !== villageToRemove);
    await updateVillages(updatedVillages);
  };

  const updateVillages = async (updatedVillages) => {
    const token = Cookies.get("token");
    if (!token) {
      setActionMessage("Authentification requise pour mettre à jour les villages.");
      setActionType("error");
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ villagesCovered: updatedVillages }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la mise à jour des villages.");
      }
      setVillagesCovered(updatedVillages);
      setActionMessage("Villages mis à jour avec succès!");
      setActionType("success");
      setHasVillagesCoveredBeenSet(true);
    } catch (error) {
      console.error("Error updating villages covered:", error);
      setActionMessage(`Erreur lors de la mise à jour des villages: ${error.message}`);
      setActionType("error");
    }
  };

  if (loadingAvailabilities || reservationsLoading || loadingVillages || loadingSubscription) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <ClipLoader color={"#3b82f6"} loading={true} size={50} />
      </div>
    );
  }

  if (errorAvailabilities || reservationsError || errorVillages || errorSubscription) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
          {errorAvailabilities && (
            <p className="text-red-600 dark:text-red-400 mb-2">Erreur de disponibilités: {errorAvailabilities}</p>
          )}
          {reservationsError && (
            <p className="text-red-600 dark:text-red-400 mb-2">Erreur de réservations: {reservationsError}</p>
          )}
          {errorVillages && (
            <p className="text-red-600 dark:text-red-400 mb-2">Erreur de villages: {errorVillages}</p>
          )}
          {errorSubscription && (
            <p className="text-red-600 dark:text-red-400">Erreur d&#39;abonnement: {errorSubscription}</p>
          )}
        </div>
      </div>
    );
  }

  const subscriptionMessage = getSubscriptionMessage();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              <FontAwesomeIcon icon={faPaw} className="mr-2" />
              Tableau de Bord Bénévole
            </h2>
          </div>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8">
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-md shadow-lg ${
              actionType === "success" ? "bg-green-500 dark:bg-green-700" : "bg-red-500 dark:bg-red-700"
            } text-white`}
          >
            <div className="flex items-center">
              <svg
                className={`h-6 w-6 ${actionType === "success" ? "text-green-100" : "text-red-100"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {actionType === "success" ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
              <p className="ml-3 text-sm font-medium text-white">{actionMessage}</p>
            </div>
          </div>
        )}

        {subscriptionMessage && (
          <div
            className={`mb-6 p-4 rounded-md shadow-lg ${
              subscriptionMessage.type === "error"
                ? "bg-red-500 dark:bg-red-700"
                : subscriptionMessage.type === "warning"
                ? "bg-yellow-500 dark:bg-yellow-700"
                : "bg-green-500 dark:bg-green-700"
            } text-white flex items-center justify-between`}
          >
            <div className="flex items-center">
              <FontAwesomeIcon icon={faEuroSign} className="mr-2" />
              <p className="text-sm font-medium">{subscriptionMessage.message}</p>
            </div>
            {subscriptionMessage.action && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
              >
                {subscriptionStatus.paid ? "Renouveler" : "Payer maintenant"}
              </button>
            )}
          </div>
        )}

        {showPaymentForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
            <Elements stripe={stripePromise}>
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentForm(false)}
              />
            </Elements>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Villages Covered Section */}
          <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
              Communes de promenades 
            </h3>
            <div className="mt-4 space-y-4 dark:text-gray-300">
              {!hasVillagesCoveredBeenSet ? (
                <>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                    Attention : Vous ne pouvez définir vos villages qu’une seule fois de manière permanente.
                  </p>
                  <div>
                    <label
                      htmlFor="villageSelect"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Sélectionner une commune (votre commune par défaut: {volunteerVillage})
                    </label>
                    <div className="flex">
                      <select
                        id="villageSelect"
                        className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300 mr-2"
                        value={selectedVillage}
                        onChange={(e) => setSelectedVillage(e.target.value)}
                        disabled={hasVillagesCoveredBeenSet}
                      >
                        <option value="">Choisir votre (ou vos) commune(s) de promenades </option>
                        {villageOptions
                          .filter((village) => village !== volunteerVillage)
                          .map((village) => (
                            <option key={village} value={village}>
                              {village}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleAddVillage}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm cursor-pointer"
                        disabled={!selectedVillage || hasVillagesCoveredBeenSet}
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                  {villagesCovered.length > 0 && (
                    <div className="mt-2">
                      <ul className="list-disc ml-6">
                        {villagesCovered.map((village) => (
                          <li key={village} className="flex items-center justify-between dark:text-gray-300 my-2">
                            {village} {village === volunteerVillage && "(Votre village)"}
                            <button
                              onClick={() => handleRemoveVillage(village)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                              disabled={village === volunteerVillage || hasVillagesCoveredBeenSet}
                            >
                              Enlever
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Villages de promenade définis :
                  </p>
                  {villagesCovered.length > 0 && (
                    <div className="mt-2">
                      <ul className="list-disc ml-6">
                        {villagesCovered.map((village) => (
                          <li key={village} className="dark:text-gray-300 my-2">
                            {village} {village === volunteerVillage && "(Votre village)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Villages de promenade définis, modifications impossibles.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Availability Section */}
          <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2" />
              Mes disponibilités
            </h3>
            {showAvailabilityForm ? (
              <div className="dark:text-gray-300">
                <AvailabilityForm onAvailabilitySaved={handleAvailabilitySaved} />
              </div>
            ) : (
              <>
                {availabilities.length === 0 ? (
                  <div className="text-center dark:text-gray-300">
                    <p className="text-gray-500 mb-4 dark:text-gray-400">Aucune disponibilité définie.</p>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm cursor-pointer"
                      onClick={() => setShowAvailabilityForm(true)}
                    >
                      Définir disponibilités
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {daysOfWeekLabels.map((label, index) => {
                      const dayNumber = index + 1;
                      return groupedAvailabilities[dayNumber] ? (
                        <div key={dayNumber} className="mb-4">
                          <h4 className="text-lg font-semibold mb-2 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700 flex items-center">
                            {label}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {groupedAvailabilities[dayNumber].map((slot, i) => (
                              <button
                                key={i}
                                className="bg-blue-100 dark:bg-blue-500 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-100 font-medium py-1.5 px-3 rounded-md text-sm transition-colors duration-200 cursor-pointer"
                              >
                                {slot.startTime} - {slot.endTime}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Reservations Section */}
          <section className="bg-white shadow rounded-lg p-6 dark:bg-gray-800 col-span-full">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
              Réservations
            </h3>
            {reservationsLoading ? (
              <div className="flex justify-center">
                <ClipLoader color={"#3b82f6"} loading={true} size={30} />
              </div>
            ) : reservationsError ? (
              <p className="text-red-500 dark:text-red-400">{reservationsError}</p>
            ) : reservations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Aucune réservation</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse w-full">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      {["Client", "Chien", "Date", "Début", "Fin", "Statut", "Actions"].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reservations.map((reservation) => {
                      let statusColor = "";
                      let statusIcon = null;
                      let statusText = frenchStatusMap[reservation.status] || reservation.status;

                      switch (reservation.status) {
                        case "accepted":
                          statusColor = "bg-green-200 text-green-800";
                          statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                          break;
                        case "pending":
                          statusColor = "bg-yellow-200 text-yellow-800";
                          statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
                          break;
                        case "rejected":
                        case "cancelled":
                          statusColor = "bg-red-200 text-red-800";
                          statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
                          break;
                        case "completed":
                          statusColor = "bg-blue-200 text-blue-800";
                          statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
                          break;
                        default:
                          statusColor = "";
                          statusIcon = null;
                      }

                      return (
                        <tr key={reservation.id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.client_name}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.dog_name}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {moment(reservation.reservation_date).format("DD/MM/YYYY")}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.start_time}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.end_time}
                          </td>
                          <td
                            className={`border px-4 py-2 capitalize dark:border-gray-700 dark:text-gray-300 text-sm font-semibold text-center`}
                          >
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${statusColor}`}>
                              {statusIcon}
                              {statusText}
                            </span>
                          </td>
                          <td className="border px-4 py-2 text-center dark:border-gray-700 dark:text-gray-300">
                            {reservation.status === "pending" ? (
                              <div className="flex space-x-2 justify-center">
                                <button
                                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                                  onClick={() => handleReservationAction(reservation.id, "accepted")}
                                >
                                  Accepter
                                </button>
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded focus:outline-none focus:shadow-outline text-xs cursor-pointer"
                                  onClick={() => handleReservationAction(reservation.id, "rejected")}
                                >
                                  Refuser
                                </button>
                              </div>
                            ) : (
                              <span></span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <HolidayModeButton />
        </div>
      </main>
    </div>
  );
};

VolunteerDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default VolunteerDashboard;