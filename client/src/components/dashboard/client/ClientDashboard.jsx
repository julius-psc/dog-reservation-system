import { useState, memo } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment/locale/fr";
import Cookies from "js-cookie";
import { Toaster } from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import LogoutButton from "../recycled/LogoutButton";
import DogProfilesManager from "./DogProfilesManager";
import ReservationSlots from "./ReservationsSlots";
import PersonalReservationsTable from "./PersonalReservationsTable";
import useClientData from "./useClientData";
import toast from 'react-hot-toast';
import TemperatureWarning from "../recycled/HotWeatherWarningClient"; 

moment.locale("fr");

const ClientDashboard = memo(({ handleLogout }) => {
  const {
    dogs,
    setDogs,
    allAvailableSlots,
    setAllAvailableSlots,
    availableSlotsError,
    personalReservations,
    setPersonalReservations,
    personalReservationsLoading,
    personalReservationsError,
    reservations,
    setReservations,
    reservationsLoading,
    reservationsError,
    currentWeekStart,
    setCurrentWeekStart,
    fetchDogData,
    fetchAvailableSlots,
    fetchPersonalReservations,
    fetchReservations,
  } = useClientData();

  const [selectedDog, setSelectedDog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().toDate());
  const [reservationLoading, setReservationLoading] = useState(false);
  const [isCurrentWeekDisplayed, setIsCurrentWeekDisplayed] = useState(true);

  const handleReservation = async (volunteerId, startTime, dayIndex) => {
    if (!selectedDog) {
      toast.error("Veuillez sélectionner un chien pour la réservation.");
      return;
    }

    const reservationDate = moment(currentWeekStart).add(dayIndex, "days");
    const formattedDate = reservationDate.format("YYYY-MM-DD");

    setReservationLoading(true);

    try {
      const token = Cookies.get("token");
      const startMoment = moment(startTime, "HH:mm");
      const endMoment = startMoment.clone().add(1, "hour");

      console.log("Création de la réservation :", {
        volunteerId,
        reservationDate: formattedDate,
        startTime: startMoment.format("HH:mm"),
        endTime: endMoment.format("HH:mm"),
        dogId: selectedDog.id,
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          volunteerId,
          reservationDate: formattedDate,
          startTime: startMoment.format("HH:mm"),
          endTime: endMoment.format("HH:mm"),
          dogId: selectedDog.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Impossible de créer une réservation");
      }

      const reservationData = await response.json();
      const newReservation = reservationData.reservation;

      setReservations((prev) => {
        const updated = [...prev, newReservation];
        console.log("Réservations mises à jour :", updated);
        return updated;
      });
      setPersonalReservations((prev) => {
        const updated = [...prev, newReservation];
        console.log("Réservations personnelles mises à jour :", updated);
        return updated;
      });
      setAllAvailableSlots((prevSlots) => {
        const updatedSlots = { ...prevSlots };
        if (updatedSlots[dayIndex]) {
          updatedSlots[dayIndex] = updatedSlots[dayIndex].map((slot) => {
            const slotStart = moment(slot.time, "HH:mm");
            const slotEnd = slotStart.clone().add(1, "hour");
            const resStart = moment(newReservation.start_time, "HH:mm");
            const resEnd = moment(newReservation.end_time, "HH:mm");
            if (
              slotStart.isBefore(resEnd) &&
              slotEnd.isAfter(resStart) &&
              !slot.isReserved
            ) {
              console.log(`Marquage du créneau ${slot.time} comme réservé`);
              return { ...slot, isReserved: true };
            }
            return slot;
          });
        }
        console.log("Mise à jour de allAvailableSlots :", updatedSlots);
        return updatedSlots;
      });

      toast.success(
        "Demande de réservation envoyée. Veuillez attendre la confirmation d'un bénévole."
      );

      console.log("Synchronisation des données avec le serveur...");
      await Promise.all([
        fetchAvailableSlots(),
        fetchReservations(),
        fetchPersonalReservations(),
      ]);
      console.log("Synchronisation des données serveur terminée.");
    } catch (error) {
      console.error("Erreur de réservation :", error);
      toast.error(`${error.message}`);
    } finally {
      setReservationLoading(false);
    }
  };

  if (availableSlotsError || reservationsError || personalReservationsError) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="text-red-500 text-4xl mb-4"
          />
          {availableSlotsError && (
            <p className="text-red-600 dark:text-red-400 mb-2">
              Erreur des créneaux : {availableSlotsError}
            </p>
          )}
          {reservationsError && (
            <p className="text-red-600 dark:text-red-400 mb-2">
              Erreur des réservations : {reservationsError}
            </p>
          )}
          {personalReservationsError && (
            <p className="text-red-600 dark:text-red-400">
              Erreur des réservations personnelles : {personalReservationsError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (reservationsLoading || personalReservationsLoading || !dogs || !allAvailableSlots) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <ClipLoader color={"#3b82f6"} loading={true} size={50} />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
      <Toaster />
      <header className="bg-white dark:bg-gray-800 shadow-md py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-primary-black dark:text-primary-black flex items-center">
              <FontAwesomeIcon icon={faPaw} className="mr-2" />
              Tableau de bord - Propriétaire de chiens
            </h2>
          </div>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>
            <TemperatureWarning />
      <main className="container mx-auto mt-8 px-4 pb-8">
        <div className="grid grid-cols-1 gap-6">
          <DogProfilesManager
            dogs={dogs}
            setDogs={setDogs}
            selectedDog={selectedDog}
            setSelectedDog={setSelectedDog}
            fetchDogData={fetchDogData}
          />
          <ReservationSlots
            allAvailableSlots={allAvailableSlots}
            currentWeekStart={currentWeekStart}
            setCurrentWeekStart={setCurrentWeekStart}
            isCurrentWeekDisplayed={isCurrentWeekDisplayed}
            setIsCurrentWeekDisplayed={setIsCurrentWeekDisplayed}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            reservations={reservations}
            personalReservations={personalReservations}
            handleReservation={handleReservation}
            reservationLoading={reservationLoading}
          />
          <PersonalReservationsTable
            personalReservations={personalReservations}
            personalReservationsLoading={personalReservationsLoading}
            personalReservationsError={personalReservationsError}
          />
        </div>
      </main>
    </div>
  );
});

ClientDashboard.displayName = "ClientDashboard";

ClientDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default ClientDashboard;