// components/dashboard/volunteer/VolunteerDashboard.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import moment from "moment";
import "moment/locale/fr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
import { Toaster } from "react-hot-toast";
import VolunteerCard from "./VolunteerCard";
import AvailabilityForm from "./AvailabilityForm";
import HolidayModeButton from "../recycled/HolidayButton";
import LogoutButton from "../recycled/LogoutButton";
import SubscriptionManager from "./SubscriptionManager";
import VillagesCoveredManager from "./VillagesCoveredManager";
import AvailabilityDisplay from "./AvailabilityDisplay";
import ReservationsTable from "./ReservationsTable";
import useVolunteerData from "./useVolunteerData";
import toast from "react-hot-toast";

moment.locale("fr");

const VolunteerDashboard = ({ handleLogout }) => {
  const {
    availabilities,
    loadingAvailabilities,
    errorAvailabilities,
    reservations,
    reservationsLoading,
    reservationsError,
    villagesCovered,
    setVillagesCovered,
    villagesUpdatedAt,
    timeUpdatedAt,
    hasVillagesCoveredBeenSet,
    loadingVillages,
    errorVillages,
    volunteerId,
    username,
    loadingVolunteerInfo,
    errorVolunteerInfo,
    subscriptionStatus,
    loadingSubscription,
    errorSubscription,
    volunteerVillage,
    fetchSubscriptionStatus,
    fetchAvailabilities,
    fetchReservations,
    fetchVolunteerData,
  } = useVolunteerData();

  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);

  const villageOptions = [
    "ANISY",
    "MATHIEU",
    "EPRON",
    "CAMBES-EN-PLAINE",
    "AUTHIE",
    "SAINT-CONTEST",
    "BANVILLE",
    "BIÉVILLE-BEUVILLE",
    "PÉRIERS-SUR-LE-DAN",
    "BLAINVILLE-SUR-ORNE",
    "CAEN",
    "DOUVRES-LA-DÉLIVRANDE",
    "HÉROUVILLE-SAINT-CLAIR",
    "OUISTREHAM",
    "VIRE",
  ];

  const daysOfWeekLabels = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  const fullyCapitalizeString = (str) => str.toUpperCase();

  const villageOptionsFormatted = villageOptions
    .filter((v) => v !== volunteerVillage)
    .map((village) => ({
      value: fullyCapitalizeString(village),
      label: fullyCapitalizeString(village),
    }));

  const groupedAvailabilities = availabilities.reduce((acc, availability) => {
    const day = availability.day_of_week;
    acc[day] = acc[day] || [];
    acc[day].push({
      startTime: availability.start_time,
      endTime: availability.end_time,
    });
    return acc;
  }, {});

  const canUpdateVillages = () => {
    if (!villagesUpdatedAt) return true;
    const daysSinceUpdate = moment().diff(moment(villagesUpdatedAt), "days");
    return (
      daysSinceUpdate >= 30 &&
      reservations.every((r) => !["pending", "accepted"].includes(r.status))
    );
  };

  const canUpdateAvailability = () => {
    if (!timeUpdatedAt) return true;
    const daysSinceUpdate = moment().diff(moment(timeUpdatedAt), "days");
    return (
      daysSinceUpdate >= 30 &&
      reservations.every((r) => !["pending", "accepted"].includes(r.status))
    );
  };

  const handleAvailabilitySaved = () => {
    setShowAvailabilityForm(false);
    fetchAvailabilities();
    toast.success("Disponibilités mises à jour avec succès !");
  };

  const handleReservationAction = async (reservationId, status) => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/reservations/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) throw new Error(`Échec de ${status} la réservation`);
      fetchReservations();
      toast.success(`RÉSERVATION ${status} AVEC SUCCÈS !`);
    } catch (err) {
      toast.error(`ERREUR: ${err.message}`);
    }
  };

  const handleRemoveVillage = (villageToRemove) => {
    if (villageToRemove === volunteerVillage) {
      toast.error("IMPOSSIBLE DE SUPPRIMER VOTRE VILLAGE PAR DÉFAUT.");
      return;
    }
    setVillagesCovered(
      villagesCovered.filter((village) => village !== villageToRemove)
    );
  };

  const handleSubmitVillages = async () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("AUTHENTIFICATION REQUISE.");
      return;
    }
    if (villagesCovered.length === 0) {
      toast.error("AJOUTEZ AU MOINS UN VILLAGE.");
      return;
    }
    if (!canUpdateVillages()) {
      const daysSinceUpdate = villagesUpdatedAt
        ? moment().diff(moment(villagesUpdatedAt), "days")
        : 0;
      const daysRemaining = 30 - daysSinceUpdate;
      toast.error(
        reservations.some((r) => ["pending", "accepted"].includes(r.status))
          ? "VOUS NE POUVEZ PAS MODIFIER VOS COMMUNES TANT QUE VOUS AVEZ DES RÉSERVATIONS EN COURS."
          : `VOUS NE POUVEZ MODIFIER VOS COMMUNES QU'UNE FOIS TOUS LES 30 JOURS. PROCHAINE MISE À JOUR POSSIBLE DANS ${daysRemaining} JOURS.`
      );
      return;
    }
    const confirmation = window.confirm(
      "ATTENTION : LES COMMUNES SONT DÉFINIES AVEC UN DÉLAI DE 30 JOURS ENTRE LES CHANGEMENTS. CONTINUER ?"
    );
    if (!confirmation) return;

    try {
      const fullyCapitalizedVillages = villagesCovered.map((village) =>
        fullyCapitalizeString(village)
      );
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ villagesCovered: fullyCapitalizedVillages }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "ÉCHEC DE LA MISE À JOUR DES VILLAGES"
        );
      }
      toast.success("VILLAGES DÉFINIS AVEC SUCCÈS !");
      fetchVolunteerData();
    } catch (error) {
      toast.error(`ERREUR: ${error.message}`);
    }
  };

  if (
    loadingAvailabilities ||
    reservationsLoading ||
    loadingVillages ||
    loadingSubscription ||
    loadingVolunteerInfo
  ) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <ClipLoader color="#72B5F4" loading={true} size={60} />
      </div>
    );
  }

  if (
    errorAvailabilities ||
    reservationsError ||
    errorVillages ||
    errorSubscription ||
    errorVolunteerInfo
  ) {
    return (
      <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 text-center transform transition-all duration-300">
          {errorAvailabilities && (
            <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
              ERREUR DISPONIBILITÉS: {errorAvailabilities}
            </p>
          )}
          {reservationsError && (
            <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
              ERREUR RÉSERVATIONS: {reservationsError}
            </p>
          )}
          {errorVillages && (
            <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
              ERREUR VILLAGES: {errorVillages}
            </p>
          )}
          {errorSubscription && (
            <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
              ERREUR ABONNEMENT: {errorSubscription}
            </p>
          )}
          {errorVolunteerInfo && (
            <p className="text-red-600 dark:text-red-400 font-semibold">
              ERREUR INFO BÉNÉVOLE: {errorVolunteerInfo}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 min-h-screen font-sans">
      <Toaster />
      <header className="bg-white dark:bg-gray-900 shadow-lg py-6 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-primary-blue dark:text-primary-blue flex items-center">
            <FontAwesomeIcon
              icon={faPaw}
              className="mr-3 text-primary-blue animate-pulse"
            />
            Tableau de Bord Bénévole
          </h2>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-12">
        <SubscriptionManager
          subscriptionStatus={subscriptionStatus}
          fetchSubscriptionStatus={fetchSubscriptionStatus}
        />

        <div className="mt-8">
          <p className="text-3xl text-primary-blue font-semibold dark:text-white">
            Bonjour {username} !
          </p>
          <p className="text-md text-gray-600 dark:text-gray-400">
            Votre Numéro Promeneur (NP) :{" "}
            <span className="font-bold">{volunteerId}</span>
          </p>
        </div>

        <VolunteerCard />

        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 mb-8 transform transition-all duration-300 hover:shadow-xl">
          <h3 className="text-2xl font-bold text-primary-blue dark:text-primary-blue mb-6">
            Paramètres de disponibilité
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <VillagesCoveredManager
              villagesCovered={villagesCovered}
              setVillagesCovered={setVillagesCovered}
              volunteerVillage={volunteerVillage}
              canUpdateVillages={canUpdateVillages}
              handleSubmitVillages={handleSubmitVillages}
              handleRemoveVillage={handleRemoveVillage}
              villageOptionsFormatted={villageOptionsFormatted}
              hasVillagesCoveredBeenSet={hasVillagesCoveredBeenSet}
            />

            {showAvailabilityForm ? (
              <AvailabilityForm
                onAvailabilitySaved={handleAvailabilitySaved}
                canUpdate={canUpdateAvailability()}
                reservations={reservations}
                timeUpdatedAt={timeUpdatedAt}
              />
            ) : (
              <AvailabilityDisplay
                groupedAvailabilities={groupedAvailabilities}
                daysOfWeekLabels={daysOfWeekLabels}
                canUpdateAvailability={canUpdateAvailability()}
                setShowAvailabilityForm={setShowAvailabilityForm}
              />
            )}
          </div>
        </section>

        <ReservationsTable
          reservations={reservations}
          handleReservationAction={handleReservationAction}
        />

        <HolidayModeButton />
      </main>
    </div>
  );
};

VolunteerDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default VolunteerDashboard;