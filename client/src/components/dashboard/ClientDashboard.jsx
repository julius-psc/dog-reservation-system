import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import moment from "moment";
import DatePicker from "react-datepicker";
import LogoutButton from "./recycled/LogoutButton";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { ClipLoader } from 'react-spinners'; // Import ClipLoader for loading state
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendarAlt, faDog, faExclamationTriangle, faClock, faCheck,faCalendarCheck,  faBan } from '@fortawesome/free-solid-svg-icons'; // Icons


const ClientDashboard = ({ handleLogout }) => {
  const [protectedError] = useState("");
  const [showDogForm, setShowDogForm] = useState(false);
  const [dogData, setDogData] = useState({ name: "", breed: "", age: "" });
  const [dogs, setDogs] = useState([]);
  const [allAvailableSlots, setAllAvailableSlots] = useState({});
  const [availableSlotsError, setAvailableSlotsError] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [selectedDog, setSelectedDog] = useState(null);
  const [personalReservations, setPersonalReservations] = useState([]);
  const [personalReservationsLoading, setPersonalReservationsLoading] =
    useState(true);
  const [personalReservationsError, setPersonalReservationsError] =
    useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true); // Set to true initially for loading
  const [reservationsError, setReservationsError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().toDate());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    moment().startOf("isoWeek")
  );
  const [isCurrentWeekDisplayed, setIsCurrentWeekDisplayed] = useState(true);

  // New state for confirmation dialog
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);

  const fetchDogData = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setShowDogForm(true);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/fetchDog`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Error fetching dogs:", await response.text());
        setShowDogForm(true);
        return;
      }

      const dogData = await response.json();
      setDogs(dogData);
      setShowDogForm(dogData.length === 0);

      // Conditionally set selectedDog only if it's not already set and dogs are available
      if (dogData.length > 0 && !selectedDog) {
        setSelectedDog(dogData[0]);
        console.log("Initial dog selected:", dogData[0]);
      }
    } catch (error) {
      console.error("Error fetching dog data:", error);
      setShowDogForm(true);
    }
  }, [selectedDog]);

  const handleDogFormChange = (e) => {
    setDogData({ ...dogData, [e.target.name]: e.target.value });
  };

  const handleDogFormSubmit = async (e) => {
    e.preventDefault();
    const ageAsNumber = Number(dogData.age);

    if (isNaN(ageAsNumber) || ageAsNumber < 0) {
      toast.error("Veuillez entrer un nombre non négatif valide pour l'âge.");
      return;
    }

    try {
      const token = Cookies.get("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/addDog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: dogData.name,
          breed: dogData.breed,
          age: ageAsNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Erreur HTTP ! statut : ${response.status}`
        );
      }

      const newDogData = await response.json();
      setDogs((prevDogs) => [...prevDogs, newDogData]);
      setShowDogForm(false);
      setSelectedDog(newDogData);
      console.log("Nouveau chien ajouté et sélectionné:", newDogData);
      toast.success("Informations sur le chien ajoutées avec succès !");
      setDogData({ name: "", breed: "", age: "" });
    } catch (error) {
      console.error("Erreur lors de l'ajout du chien:", error);
      toast.error(`Erreur lors de l'ajout du chien: ${error.message}`);
    }
  };

  const fetchAvailableSlots = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setAvailableSlotsError("Token non trouvé. Veuillez vous connecter.");
      return;
    }

    try {
      const days = Array.from({ length: 7 }, (_, i) =>
        moment(currentWeekStart).add(i, "days").format("YYYY-MM-DD")
      );

      const availabilityPromises = days.map((date) =>
        fetch(`${import.meta.env.VITE_API_BASE_URL}/client/volunteers?date=${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json())
      );

      const allAvailabilities = await Promise.all(availabilityPromises);

      const mergedSlots = {};
      days.forEach((date, index) => {
        const dayOfWeek = moment(date).isoWeekday() - 1;
        mergedSlots[dayOfWeek] =
          allAvailabilities[index].mergedAvailabilities[dayOfWeek] || [];
      });

      setAllAvailableSlots(mergedSlots);
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités:", error);
      setAvailableSlotsError(error.message || "Une erreur inattendue est survenue.");
    }
  }, [currentWeekStart]);

  const fetchPersonalReservations = useCallback(async () => {
    setPersonalReservationsLoading(true);
    setPersonalReservationsError(null);
    const token = Cookies.get("token");

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/client/personal-reservations`;
      const queryParams = new URLSearchParams();

      queryParams.append(
        "endDate",
        moment().endOf("week").format("YYYY-MM-DD")
      );

      url += "?" + queryParams.toString();

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Échec de la récupération des réservations personnelles, réponse non ok:",
          response
        );
        throw new Error(
          errorData.error || "Échec de la récupération des réservations personnelles"
        );
      }

      const personalReservationsData = await response.json();
      setPersonalReservations(personalReservationsData);
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations personnelles:", err);
      setPersonalReservationsError(err.message);
    } finally {
      setPersonalReservationsLoading(false);
    }
  }, []);

  const fetchReservations = useCallback(async (startDate, endDate) => {
    setReservationsLoading(true);
    setReservationsError(null);
    const token = Cookies.get("token");

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/client/all-reservations`; // Or adjust if needed for client dashboard
      const queryParams = new URLSearchParams();

      if (startDate && endDate) {
        queryParams.append(
          "startDate",
          moment().startOf("month").format("YYYY-MM-DD")
        );
        queryParams.append(
          "endDate",
          moment().endOf("month").format("YYYY-MM-DD")
        );
      } else {
        queryParams.append(
          "endDate",
          moment().endOf("month").format("YYYY-MM-DD")
        );
      }

      url += "?" + queryParams.toString();

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la récupération des réservations");
      }

      const reservationsData = await response.json();
      console.log("Données des réservations depuis le backend:", reservationsData);
      setReservations(reservationsData);
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations:", err);
      setReservationsError(err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  const handleReservation = async (volunteerId, startTime, dayIndex) => {
    console.log("Chien sélectionné avant la réservation:", selectedDog);
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
      let endMoment = startMoment.clone().add(1, "hour");

      const startTimeFormatted = startMoment.format("HH:mm");
      const endTimeFormatted = endMoment.format("HH:mm");

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          volunteerId: volunteerId,
          reservationDate: formattedDate,
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          dogId: selectedDog.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la création de la réservation");
      }

      const reservationData = await response.json();
      setReservations((prevReservations) => [
        ...prevReservations,
        reservationData,
      ]);

      toast.success(
        "Demande de réservation envoyée. Veuillez attendre la confirmation du bénévole."
      );

      // Broadcast the reservation update via WebSocket
      const ws = new WebSocket(`wss://${import.meta.env.VITE_API_BASE_URL.replace(/^http(s?):\/\//, '')}`);
      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "reservation_update",
            reservation: reservationData,
          })
        );
        ws.close();
      };
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      toast.error(`Erreur lors de la création de la réservation: ${error.message}`);
    } finally {
      setReservationLoading(false);
      fetchAvailableSlots();
      fetchReservations();
      fetchPersonalReservations();
    }
    console.log("ID du chien envoyé:", selectedDog?.id);
  };

  const handleConfirmReservation = () => {
    if (confirmationDetails) {
      handleReservation(
        confirmationDetails.volunteerId,
        confirmationDetails.startTime,
        confirmationDetails.dayIndex
      );
      setIsConfirmationVisible(false);
      setConfirmationDetails(null);
    }
  };

  // Function to handle cancellation of confirmation
  const handleCancelConfirmation = () => {
    setIsConfirmationVisible(false);
    setConfirmationDetails(null);
  };


  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const goToPreviousWeek = () => {
    if (!isCurrentWeekDisplayed) {
      setCurrentWeekStart(
        moment(currentWeekStart).subtract(1, "week").startOf("isoWeek")
      );
      setIsCurrentWeekDisplayed(
        moment(currentWeekStart).subtract(1, "week").isSame(moment(), "week")
      );
    }
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(
      moment(currentWeekStart).add(1, "week").startOf("isoWeek")
    );
    setIsCurrentWeekDisplayed(
      moment(currentWeekStart).add(1, "week").isSame(moment(), "week")
    );
  };

  const daysOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  useEffect(() => {
    fetchDogData();
  }, [fetchDogData]);

  useEffect(() => {
    fetchAvailableSlots();
    fetchReservations();
    fetchPersonalReservations();
    setIsCurrentWeekDisplayed(
      moment(currentWeekStart).isSame(moment(), "week")
    );
  }, [
    fetchAvailableSlots,
    fetchReservations,
    fetchPersonalReservations,
    currentWeekStart,
  ]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8081");

    ws.onopen = () => {
      console.log("Connecté au serveur WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message WebSocket reçu:", data);

        if (data.type === "reservation_update") {
          fetchAvailableSlots();
          fetchReservations();
          fetchPersonalReservations();
        }
      } catch (error) {
        console.error("Erreur lors de l'analyse du message WebSocket:", error);
      }
    };

    ws.onclose = () => {
      console.log("Déconnecté du serveur WebSocket");
      setTimeout(() => {
        console.log("Tentative de reconnexion...");
        ws.close();
      }, 5000);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchAvailableSlots, fetchReservations, fetchPersonalReservations]);

  useEffect(() => {}, [
    personalReservationsLoading,
    personalReservationsError,
    personalReservations,
  ]);

  const isSlotReserved = useCallback(
    (currentDate, slot, dayIndex, reservations) => {
      const slotDate = moment(currentWeekStart)
        .add(dayIndex, "days")
        .format("YYYY-MM-DD");
      const slotStart = moment(`${slotDate} ${slot.time}`, "YYYY-MM-DD HH:mm");

      return reservations.some((reservation) => {
        const isVolunteerMatch = slot.volunteerIds.includes(
          reservation.volunteer_id
        );

        if (!isVolunteerMatch) return false;

        const reservationDate = reservation.reservation_date;
        const reservationStart = moment(
          `${reservationDate} ${reservation.start_time}`,
          "YYYY-MM-DD HH:mm"
        );
        const reservationEnd = moment(
          `${reservationDate} ${reservation.end_time}`,
          "YYYY-MM-DD HH:mm"
        );

        return (
          reservationDate === slotDate &&
          slotStart.isSameOrAfter(reservationStart) &&
          slotStart.isBefore(reservationEnd) &&
          (reservation.status === "pending" ||
            reservation.status === "reserved")
        );
      });
    },
    [currentWeekStart]
  );

  // Function to show confirmation dialog
  const showConfirmation = (volunteerId, startTime, dayIndex) => {
    const reservationDate = moment(currentWeekStart).add(dayIndex, "days");
    setConfirmationDetails({ volunteerId, startTime, dayIndex, date: reservationDate.format("DD/MM/YYYY") });
    setIsConfirmationVisible(true);
  };

  if (availableSlotsError || reservationsError || personalReservationsError) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
          {availableSlotsError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur de créneaux horaires: {availableSlotsError}</p>}
          {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2">Erreur de réservations: {reservationsError}</p>}
          {personalReservationsError && <p className="text-red-600 dark:text-red-400">Erreur de réservations personnelles: {personalReservationsError}</p>}
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
      <header className="bg-white dark:bg-gray-800 shadow-md py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              <FontAwesomeIcon icon={faPaw} className="mr-2" />
              Tableau de Bord Client
            </h2>
          </div>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8">
        <div className="grid grid-cols-1 gap-6">

          {/* Dog Information Section */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faDog} className="mr-2" />
              Informations sur mon chien
            </h3>

            {showDogForm ? (
              <form onSubmit={handleDogFormSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="dogName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Nom du chien
                  </label>
                  <input
                    type="text"
                    id="dogName"
                    name="name"
                    placeholder="Nom du chien"
                    value={dogData.name}
                    onChange={handleDogFormChange}
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="breed"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Race
                  </label>
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    placeholder="Race"
                    value={dogData.breed}
                    onChange={handleDogFormChange}
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="age"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Âge
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    placeholder="Âge"
                    value={dogData.age}
                    onChange={handleDogFormChange}
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300  shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div className="flex justify-start">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                  >
                    Soumettre les infos du chien
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 dark:text-gray-300">
                {dogs.length > 0 && (
                  <div className="space-y-3">
                    {dogs.map((dog) => (
                      <div
                        key={dog.id}
                        className="p-4 border rounded-md border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <p className="dark:text-gray-300 text-sm">
                          <span className="font-semibold dark:text-gray-100">Nom:</span> {dog.name}
                        </p>
                        <p className="dark:text-gray-300 text-sm">
                          <span className="font-semibold dark:text-gray-100">Race:</span> {dog.breed}
                        </p>
                        <p className="dark:text-gray-300 text-sm">
                          <span className="font-semibold dark:text-gray-100">Âge:</span> {dog.age}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {protectedError && (
                  <p className="text-red-500 dark:text-red-400">
                    {protectedError}
                  </p>
                )}
                <button
                  onClick={() => setShowDogForm(true)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                >
                  Ajouter un autre chien
                </button>
              </div>
            )}
          </section>

          {/* Dog Selection Section */}
          {dogs.length > 0 && (
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faDog} className="mr-2" />
                Sélectionner un chien pour la réservation
              </h3>
              <div className="mt-2">
                <select
                  value={selectedDog ? selectedDog.id : ""}
                  onChange={(e) => {
                    const selectedDogData = dogs.find(
                      (dog) => dog.id === e.target.value
                    );
                    setSelectedDog(selectedDogData);
                  }}
                  className="block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <option value="">Sélectionner un chien</option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.id}>
                      {dog.name} ({dog.breed})
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Available Time Slots Section */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              Créneaux horaires disponibles
            </h3>
            {availableSlotsError && (
              <p className="text-red-500 dark:text-red-400">
                {availableSlotsError}
              </p>
            )}
            <div className="mb-4 flex justify-center space-x-3">
              <button
                onClick={goToPreviousWeek}
                className="bg-gray-400 hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                disabled={isCurrentWeekDisplayed}
              >
                Semaine précédente
              </button>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                className="mt-1 py-2 px-3 rounded-md border-gray-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 text-center"
                minDate={moment().add(2, "days").toDate()}
                placeholderText="Choisir une date"
              />
              <button
                onClick={goToNextWeek}
                className="bg-gray-400 hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Semaine suivante
              </button>
            </div>
            <div className="flex flex-col">
              {daysOfWeek.map((dayName, dayIndex) => {
                const currentDate = moment(currentWeekStart).add(
                  dayIndex,
                  "days"
                );
                const isBeforeToday = currentDate.isBefore(moment(), "day");

                if (isBeforeToday) {
                  return null;
                }

                const isPastDay = currentDate.isBefore(
                  moment().subtract(2, "days"),
                  "day"
                );

                return (
                  <div key={dayIndex} className="mb-5">
                    <h4 className="text-lg font-semibold mb-2 dark:text-white">
                      {dayName} ({currentDate.format("DD/MM")})
                    </h4>
                    {allAvailableSlots[dayIndex] &&
                    allAvailableSlots[dayIndex].length > 0 ? (
                      <div className="flex flex-wrap">
                        {allAvailableSlots[dayIndex].map((slot) => {
                          const isReserved = isSlotReserved(
                            currentDate,
                            slot,
                            dayIndex,
                            [...reservations, ...personalReservations]
                          );
                          const isPastSlot =
                            isPastDay ||
                            moment(
                              `${currentDate.format("YYYY-MM-DD")} ${slot.time}`,
                              "YYYY-MM-DD HH:mm"
                            ).isBefore(moment());


                          return (
                            <button
                              key={`${dayIndex}-${slot.time}`}
                              className={`inline-block rounded-md border px-3 py-2 mr-2 mb-2 text-xs sm:text-sm
                              ${isReserved || isPastSlot || isPastDay
                                ? "opacity-50 cursor-not-allowed bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                : "border-blue-500 bg-white hover:bg-blue-100 dark:border-blue-400 dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-500"
                              }`}
                              onClick={() => {
                                if (
                                  !isPastSlot &&
                                  !reservationLoading &&
                                  !isPastDay &&
                                  !isReserved
                                ) {
                                  showConfirmation(
                                    slot.volunteerIds[0],
                                    slot.time,
                                    dayIndex
                                  );
                                }
                              }}
                              disabled={
                                isReserved ||
                                isPastSlot ||
                                reservationLoading ||
                                isPastDay
                              }
                            >
                              {slot.time}
                              {isReserved && " (Réservé)"}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Pas de créneaux disponibles le {dayName}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirmation Dialog Section */}
            {isConfirmationVisible && confirmationDetails && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-500" />
                    Confirmer la réservation ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Êtes-vous sûr de vouloir réserver le créneau de{" "}
                    <span className="font-semibold">{confirmationDetails.startTime}</span> le{" "}
                    <span className="font-semibold">{confirmationDetails.date}</span> ?
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleCancelConfirmation}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleConfirmReservation}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* My Reservations Section */}
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
              Mes Réservations
            </h3>
            {personalReservationsLoading ? (
              <div className="flex justify-center">
                <ClipLoader color={"#3b82f6"} loading={true} size={30} />
              </div>
            ) : personalReservationsError ? (
              <p className="text-red-500 dark:text-red-400 text-sm">
                {personalReservationsError}
              </p>
            ) : personalReservations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Pas encore de réservations.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse w-full">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      {[
                        "Bénévole",
                        "Chien",
                        "Jour",
                        "Heure de début",
                        "Heure de fin",
                        "Statut",
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {personalReservations.map((reservation) => {
                      let statusColor = "";
                      let statusName = ""
                      let statusIcon = null;
                      switch (reservation.status) {
                        case "accepted":
                          statusColor = "bg-green-200 text-green-800";
                          statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                          statusName = "Approuvé";
                          break;
                        case "pending":
                          statusColor = "bg-yellow-200 text-yellow-800";
                          statusIcon = <FontAwesomeIcon icon={faClock} className="mr-1" />;
                          statusName = "En attente";
                          break;
                        case "rejected":
                        case "cancelled":
                          statusColor = "bg-red-200 text-red-800";
                          statusIcon = <FontAwesomeIcon icon={faBan} className="mr-1" />;
                          break;
                        default:
                          statusColor = "";
                          statusIcon = null;
                          statusName = "Rejeté";
                      }

                      return (
                        <tr
                          key={reservation.id}
                          className="hover:bg-gray-100 dark:hover:bg-gray-900"
                        >
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.volunteer_name}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.dog_name}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {moment(
                              reservation.reservation_date,
                              "YYYY-MM-DD"
                            ).format("DD/MM/YYYY")}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.start_time}
                          </td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">
                            {reservation.end_time}
                          </td>
                          <td className={`border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm font-semibold text-center`}>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${statusColor}`}>
                              {statusIcon}
                              {statusName}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

ClientDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default ClientDashboard;