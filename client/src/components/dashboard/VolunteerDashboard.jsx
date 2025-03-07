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

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Updated Payment Form Component
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

      if (error) throw new Error(error.message);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payment_method_id: paymentMethod.id, amount: 9 }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec du traitement du paiement");
      if (data.success) onSuccess();
      else throw new Error(data.error || "Le paiement n’a pas réussi");
    } catch (err) {
      setPaymentError(err.message || "Une erreur s’est produite lors du paiement");
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
        Rejoignez-nous en tant que bénévole promeneur en réglant votre adhésion annuelle dès maintenant !
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
        {paymentError && <p className="text-red-500 text-sm animate-pulse">{paymentError}</p>}
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
  const [customVillage, setCustomVillage] = useState("");
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
      setErrorSubscription("Authentification requise");
      setLoadingSubscription(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Échec du chargement du statut d’abonnement");
      const data = await response.json();
      setSubscriptionStatus({
        paid: data.subscription_paid,
        expiryDate: data.subscription_expiry_date ? moment(data.subscription_expiry_date) : null,
      });
    } catch (err) {
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
      setErrorAvailabilities("Authentification requise");
      setLoadingAvailabilities(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/availabilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Échec du chargement des disponibilités");
      const data = await response.json();
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err) {
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
      setReservationsError("Authentification requise");
      setReservationsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Échec du chargement des réservations");
      const data = await response.json();
      setReservations(data);
    } catch (err) {
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
      setErrorVillages("Authentification requise");
      setLoadingVillages(false);
      return;
    }
    try {
      const [villageResponse, villagesCoveredResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/info`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!villageResponse.ok) throw new Error("Échec du chargement des informations du bénévole");
      const villageData = await villageResponse.json();
      setVolunteerVillage(villageData.village);

      if (!villagesCoveredResponse.ok) throw new Error("Échec du chargement des villages couverts");
      const villagesData = await villagesCoveredResponse.json();
      const fetchedVillages = villagesData.villages_covered || [];

      if (fetchedVillages.length === 0 && villageData.village) {
        setVillagesCovered([villageData.village]);
      } else {
        setVillagesCovered(fetchedVillages);
        setHasVillagesCoveredBeenSet(fetchedVillages.length > 0);
      }
    } catch (error) {
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

  const handleAvailabilitySaved = () => {
    setShowAvailabilityForm(false);
    fetchAvailabilities();
  };

  const handleReservationAction = async (reservationId, status) => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`Échec de ${status} la réservation`);
      fetchReservations();
      setActionMessage(`Réservation ${status} avec succès!`);
      setActionType("success");
    } catch (err) {
      setActionMessage(`Erreur: ${err.message}`);
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
      const currentYear = moment().year();
      return { message: `Cotisation ${currentYear} acquittée. Merci!`, type: "success", action: false };
    }
    if (!subscriptionStatus.expiryDate) {
      return { message: "Acquittez votre cotisation annuelle (9€)", type: "error", action: true };
    }
    const daysUntilExpiry = subscriptionStatus.expiryDate.diff(moment(), "days");
    const gracePeriodEnd = subscriptionStatus.expiryDate.clone().add(21, "days");
    const isGracePeriod = moment().isAfter(subscriptionStatus.expiryDate) && moment().isBefore(gracePeriodEnd);

    if (isGracePeriod) {
      return {
        message: `Abonnement expiré le ${subscriptionStatus.expiryDate.format("DD/MM/YYYY")}. Renouvelez dans ${gracePeriodEnd.diff(moment(), "days")} jours.`,
        type: "warning",
        action: true,
      };
    }
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return {
        message: `Abonnement expire dans ${daysUntilExpiry} jours (${subscriptionStatus.expiryDate.format("DD/MM/YYYY")}).`,
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

  const handleAddVillage = (source) => {
    let villageToAdd = source === "dropdown" ? selectedVillage : customVillage.trim();
    if (!villageToAdd) {
      setActionMessage("Sélectionnez ou entrez un village valide.");
      setActionType("error");
      return;
    }
    if (villagesCovered.includes(villageToAdd)) {
      setActionMessage(`"${villageToAdd}" est déjà ajouté.`);
      setActionType("warning");
      return;
    }
    setVillagesCovered([...villagesCovered, villageToAdd]);
    if (source === "dropdown") setSelectedVillage("");
    if (source === "custom") setCustomVillage("");
  };

  const handleRemoveVillage = (villageToRemove) => {
    if (villageToRemove === volunteerVillage) {
      setActionMessage("Impossible de supprimer votre village par défaut.");
      setActionType("error");
      return;
    }
    setVillagesCovered(villagesCovered.filter((village) => village !== villageToRemove));
  };

  const handleSubmitVillages = async () => {
    const token = Cookies.get("token");
    if (!token) {
      setActionMessage("Authentification requise.");
      setActionType("error");
      return;
    }
    if (villagesCovered.length === 0) {
      setActionMessage("Ajoutez au moins un village.");
      setActionType("error");
      return;
    }

    const confirmation = window.confirm("Attention : Les communes sont définies une seule fois de manière permanente. Continuer ?");
    if (!confirmation) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ villagesCovered }),
      });
      if (!response.ok) throw new Error("Échec de la mise à jour des villages");
      setActionMessage("Villages définis avec succès!");
      setActionType("success");
      setHasVillagesCoveredBeenSet(true);
    } catch (error) {
      setActionMessage(`Erreur: ${error.message}`);
      setActionType("error");
    }
  };

  if (loadingAvailabilities || reservationsLoading || loadingVillages || loadingSubscription) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <ClipLoader color="#72B5F4" loading={true} size={60} />
      </div>
    );
  }

  if (errorAvailabilities || reservationsError || errorVillages || errorSubscription) {
    return (
      <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 text-center transform transition-all duration-300">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-5xl mb-4 animate-bounce" />
          {errorAvailabilities && <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Erreur disponibilités: {errorAvailabilities}</p>}
          {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Erreur réservations: {reservationsError}</p>}
          {errorVillages && <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">Erreur villages: {errorVillages}</p>}
          {errorSubscription && <p className="text-red-600 dark:text-red-400 font-semibold">Erreur abonnement: {errorSubscription}</p>}
        </div>
      </div>
    );
  }

  const subscriptionMessage = getSubscriptionMessage();

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-screen font-sans">
      <header className="bg-white dark:bg-gray-900 shadow-lg py-6 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-primary-blue dark:text-primary-blue flex items-center">
            <FontAwesomeIcon icon={faPaw} className="mr-3 text-primary-blue animate-pulse" />
            Tableau de Bord Bénévole
          </h2>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-12">
        {actionMessage && (
          <div
            className={`mb-8 p-6 rounded-xl shadow-lg flex items-center transform transition-all duration-300 ${
              actionType === "success" ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200"
            }`}
          >
            <svg className={`h-6 w-6 mr-3 ${actionType === "success" ? "text-green-600" : "text-red-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {actionType === "success" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <p className="text-sm font-semibold">{actionMessage}</p>
          </div>
        )}

        {/* Subscription Banner */}
        {subscriptionMessage && (
          <div
            className={`mb-8 p-6 rounded-xl shadow-lg flex items-center justify-between transform transition-all duration-300 hover:shadow-xl ${
              subscriptionMessage.type === "error" ? "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200" :
              subscriptionMessage.type === "warning" ? "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200" :
              "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200"
            }`}
          >
            <div className="flex items-center">
              <FontAwesomeIcon icon={faEuroSign} className="mr-3 text-lg" />
              <p className="text-sm font-semibold">{subscriptionMessage.message}</p>
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
              <PaymentForm onSuccess={handlePaymentSuccess} onCancel={() => setShowPaymentForm(false)} />
            </Elements>
          </div>
        )}

        {/* Combined Availability and Location Settings */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mb-8 transform transition-all duration-300 hover:shadow-xl">
          <h3 className="text-2xl font-bold text-primary-blue dark:text-primary-blue mb-6 flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-3" />
            Paramètres de disponibilité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Villages Covered */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-primary-blue" />
                Communes de promenade
              </h4>
              {!hasVillagesCoveredBeenSet ? (
                <>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4 font-medium">
                    Définition permanente une seule fois
                  </p>
                  <select
                    className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200 mb-4"
                    value={selectedVillage}
                    onChange={(e) => setSelectedVillage(e.target.value)}
                  >
                    <option value="">Choisir une commune</option>
                    {villageOptions.filter(v => v !== volunteerVillage).map(village => (
                      <option key={village} value={village}>{village}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all duration-200 mb-4"
                    value={customVillage}
                    onChange={(e) => setCustomVillage(e.target.value)}
                    placeholder="Ou entrez une commune"
                  />
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => handleAddVillage("dropdown")}
                      className="bg-primary-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                      disabled={!selectedVillage}
                    >
                      Ajouter (liste)
                    </button>
                    <button
                      onClick={() => handleAddVillage("custom")}
                      className="bg-primary-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                      disabled={!customVillage.trim()}
                    >
                      Ajouter (personnalisé)
                    </button>
                  </div>
                  {villagesCovered.length > 0 && (
                    <div>
                      <ul className="space-y-3">
                        {villagesCovered.map(village => (
                          <li key={village} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <span className="text-gray-800 dark:text-gray-200">{village} {village === volunteerVillage && "(Défaut)"}</span>
                            <button
                              onClick={() => handleRemoveVillage(village)}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-lg text-sm transition-all duration-300 disabled:opacity-50"
                              disabled={village === volunteerVillage}
                            >
                              Supprimer
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={handleSubmitVillages}
                        className="mt-6 bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300"
                      >
                        Soumettre
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Communes définies :</p>
                  <ul className="space-y-2">
                    {villagesCovered.map(village => (
                      <li key={village} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-800 dark:text-gray-200">
                        {village} {village === volunteerVillage && "(Défaut)"}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">Modifications impossibles</p>
                </div>
              )}
            </div>

            {/* Time Availability */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-primary-blue" />
                Horaires
              </h4>
              {showAvailabilityForm ? (
                <AvailabilityForm onAvailabilitySaved={handleAvailabilitySaved} />
              ) : availabilities.length === 0 ? (
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune disponibilité définie</p>
                  <button
                    className="bg-primary-blue hover:bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold transition-all duration-300"
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
                      <div key={dayNumber} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <h5 className="text-md font-semibold text-gray-800 dark:text-white mb-2">{label}</h5>
                        <div className="flex flex-wrap gap-2">
                          {groupedAvailabilities[dayNumber].map((slot, i) => (
                            <span
                              key={i}
                              className="bg-primary-blue text-white py-1 px-3 rounded-full text-sm font-medium"
                            >
                              {slot.startTime} - {slot.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Reservations Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
          <h3 className="text-2xl font-bold text-primary-blue dark:text-primary-blue mb-6 flex items-center">
            <FontAwesomeIcon icon={faCalendarCheck} className="mr-3" />
            Réservations
          </h3>
          {reservationsLoading ? (
            <div className="flex justify-center">
              <ClipLoader color="#72B5F4" loading={true} size={40} />
            </div>
          ) : reservationsError ? (
            <p className="text-red-500 dark:text-red-400 font-semibold">{reservationsError}</p>
          ) : reservations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center">Aucune réservation à afficher</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <tr>
                    {["Client", "Chien", "Date", "Début", "Fin", "Statut", "Actions"].map(header => (
                      <th key={header} className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reservations.map(reservation => {
                    let statusColor = "";
                    let statusIcon = null;
                    let statusText = frenchStatusMap[reservation.status] || reservation.status;

                    switch (reservation.status) {
                      case "accepted":
                        statusColor = "bg-green-100 text-green-800";
                        statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                        break;
                      case "pending":
                        statusColor = "bg-yellow-100 text-yellow-800";
                        statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
                        break;
                      case "rejected":
                      case "cancelled":
                        statusColor = "bg-red-100 text-red-800";
                        statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
                        break;
                      case "completed":
                        statusColor = "bg-primary-blue text-white";
                        statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
                        break;
                      default:
                        statusColor = "";
                        statusIcon = null;
                    }

                    return (
                      <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">{reservation.client_name}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">{reservation.dog_name}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">{moment(reservation.reservation_date).format("DD/MM/YYYY")}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">{reservation.start_time}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 text-sm">{reservation.end_time}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusColor}`}>
                            {statusIcon}{statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {reservation.status === "pending" ? (
                            <div className="flex space-x-4 justify-center">
                              <button
                                className="bg-green-500 hover:bg-green-600 text-white py-1 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                                onClick={() => handleReservationAction(reservation.id, "accepted")}
                              >
                                Accepter
                              </button>
                              <button
                                className="bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-lg text-sm font-semibold transition-all duration-300"
                                onClick={() => handleReservationAction(reservation.id, "rejected")}
                              >
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600">—</span>
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
      </main>
    </div>
  );
};

VolunteerDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default VolunteerDashboard;