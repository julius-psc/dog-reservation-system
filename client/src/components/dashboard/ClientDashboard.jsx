import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Cookies from "js-cookie";
import PropTypes from "prop-types";
import moment from "moment";
import DatePicker from "react-datepicker";
import LogoutButton from "./recycled/LogoutButton";
import ClientCharterForm from "./forms/ClientCharterForm";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaw,
  faCalendarAlt,
  faDog,
  faExclamationTriangle,
  faClock,
  faCheck,
  faCalendarCheck,
  faBan,
  faFlagCheckered,
} from "@fortawesome/free-solid-svg-icons";

const ClientDashboard = memo(({ handleLogout }) => {
  const [protectedError] = useState("");
  const [showDogForm, setShowDogForm] = useState(false);
  const [dogData, setDogData] = useState({ name: "", breed: "", age: "" });
  const [dogs, setDogs] = useState([]);
  const [allAvailableSlots, setAllAvailableSlots] = useState({});
  const [availableSlotsError, setAvailableSlotsError] = useState(null);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [selectedDog, setSelectedDog] = useState(null);
  const [personalReservations, setPersonalReservations] = useState([]);
  const [personalReservationsLoading, setPersonalReservationsLoading] = useState(true);
  const [personalReservationsError, setPersonalReservationsError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().toDate());
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("isoWeek"));
  const [isCurrentWeekDisplayed, setIsCurrentWeekDisplayed] = useState(true);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  const [village, setVillage] = useState(null);

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

      if (dogData.length > 0 && !selectedDog) {
        setSelectedDog(dogData[0]);
      }
    } catch (error) {
      console.error("Error fetching dog data:", error);
      setShowDogForm(true);
    }
  }, [selectedDog]);

  const fetchVillage = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/client/personal-reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.length > 0 && data[0].village) {
        setVillage(data[0].village);
      } else {
        const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/fetchUser`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userResponse.json();
        setVillage(userData.village);
      }
    } catch (error) {
      console.error("Error fetching village:", error);
    }
  }, []);

  const fetchAvailableSlots = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setAvailableSlotsError("Token not found. Please log in.");
      return;
    }

    try {
      const days = Array.from({ length: 7 }, (_, i) =>
        moment(currentWeekStart).add(i, "days").format("YYYY-MM-DD")
      );

      const availabilityPromises = days.map((date) =>
        fetch(`${import.meta.env.VITE_API_BASE_URL}/client/volunteers?date=${date}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch slots for ${date}`);
          return res.json();
        })
      );

      const allAvailabilities = await Promise.all(availabilityPromises);

      const mergedSlots = {};
      days.forEach((date, index) => {
        const dayOfWeek = moment(date).isoWeekday() - 1;
        mergedSlots[dayOfWeek] = allAvailabilities[index].mergedAvailabilities[dayOfWeek] || [];
      });

      setAllAvailableSlots(mergedSlots);
      setAvailableSlotsError(null);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      setAvailableSlotsError(error.message || "An unexpected error occurred.");
    }
  }, [currentWeekStart]);

  const fetchPersonalReservations = useCallback(async () => {
    setPersonalReservationsLoading(true);
    setPersonalReservationsError(null);
    const token = Cookies.get("token");

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/client/personal-reservations?endDate=${moment().endOf("week").format("YYYY-MM-DD")}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch personal reservations");
      }

      const personalReservationsData = await response.json();
      setPersonalReservations(personalReservationsData);
    } catch (err) {
      console.error("Error fetching personal reservations:", err);
      setPersonalReservationsError(err.message);
    } finally {
      setPersonalReservationsLoading(false);
    }
  }, []);

  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true);
    setReservationsError(null);
    const token = Cookies.get("token");

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/client/all-reservations?startDate=${moment(currentWeekStart).format("YYYY-MM-DD")}&endDate=${moment(currentWeekStart).endOf("isoWeek").format("YYYY-MM-DD")}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reservations");
      }

      const reservationsData = await response.json();
      setReservations(reservationsData);
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setReservationsError(err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, [currentWeekStart]);

  const handleReservation = useCallback(async (volunteerId, startTime, dayIndex) => {
    if (!selectedDog) {
      toast.error("Please select a dog for the reservation.");
      return;
    }

    const reservationDate = moment(currentWeekStart).add(dayIndex, "days");
    const formattedDate = reservationDate.format("YYYY-MM-DD");

    setReservationLoading(true);

    try {
      const token = Cookies.get("token");
      const startMoment = moment(startTime, "HH:mm");
      const endMoment = startMoment.clone().add(1, "hour");

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
        throw new Error(errorData.error || "Failed to create reservation");
      }

      const reservationData = await response.json();
      setReservations((prev) => [...prev, reservationData.reservation]);
      toast.success("Reservation request sent. Please wait for volunteer confirmation.");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error(`Error creating reservation: ${error.message}`);
    } finally {
      setReservationLoading(false);
      await Promise.all([fetchAvailableSlots(), fetchReservations(), fetchPersonalReservations()]);
    }
  }, [selectedDog, currentWeekStart, fetchAvailableSlots, fetchReservations, fetchPersonalReservations]);

  const handleConfirmReservation = useCallback(() => {
    if (confirmationDetails) {
      handleReservation(confirmationDetails.volunteerId, confirmationDetails.startTime, confirmationDetails.dayIndex);
      setIsConfirmationVisible(false);
      setConfirmationDetails(null);
    }
  }, [confirmationDetails, handleReservation]);

  const handleCancelConfirmation = useCallback(() => {
    setIsConfirmationVisible(false);
    setConfirmationDetails(null);
  }, []);

  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const goToPreviousWeek = useCallback(() => {
    if (!isCurrentWeekDisplayed) {
      const newWeekStart = moment(currentWeekStart).subtract(1, "week").startOf("isoWeek");
      setCurrentWeekStart(newWeekStart);
      setIsCurrentWeekDisplayed(newWeekStart.isSame(moment(), "week"));
    }
  }, [isCurrentWeekDisplayed, currentWeekStart]);

  const goToNextWeek = useCallback(() => {
    const newWeekStart = moment(currentWeekStart).add(1, "week").startOf("isoWeek");
    setCurrentWeekStart(newWeekStart);
    setIsCurrentWeekDisplayed(newWeekStart.isSame(moment(), "week"));
  }, [currentWeekStart]);

  const handleDogFormChange = useCallback((e) => {
    setDogData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleDogFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    const ageAsNumber = Number(dogData.age);

    if (isNaN(ageAsNumber) || ageAsNumber < 0) {
      toast.error("Please enter a valid non-negative number for age.");
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const newDogData = await response.json();
      setDogs((prevDogs) => [...prevDogs, newDogData]);
      setShowDogForm(false);
      setSelectedDog(newDogData);
      toast.success("Dog information added successfully!");
      setDogData({ name: "", breed: "", age: "" });
    } catch (error) {
      console.error("Error adding dog:", error);
      toast.error(`Error adding dog: ${error.message}`);
    }
  }, [dogData]);

  const daysOfWeek = useMemo(() => ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"], []);

  useEffect(() => {
    fetchDogData();
    fetchVillage();
  }, [fetchDogData, fetchVillage]);

  useEffect(() => {
    console.log("Fetching data for week starting:", currentWeekStart.format("YYYY-MM-DD"));
    const fetchAllData = async () => {
      try {
        await Promise.all([fetchReservations(), fetchAvailableSlots(), fetchPersonalReservations()]);
      } catch (error) {
        console.error("Error in fetchAllData:", error);
      }
    };
    fetchAllData();
  }, [currentWeekStart, fetchAvailableSlots, fetchReservations, fetchPersonalReservations]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    let ws;
    // Align WebSocket URL with API base URL, replacing http with ws
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const wsUrl = apiBaseUrl.replace(/^http/, "ws").replace(/^https/, "wss");

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to", wsUrl);
        if (village) {
          ws.send(JSON.stringify({ type: "join_village", village }));
          console.log(`Sent join_village for: ${village}`);
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "reservation_update") {
          console.log("Received reservation update:", message.reservation);
          setReservations((prev) => [...prev, message.reservation]);
          fetchAvailableSlots();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setTimeout(connectWebSocket, 1000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Component unmounting");
        console.log("WebSocket cleanup: closed connection");
      }
    };
  }, [village, fetchAvailableSlots]);

  const isSlotReserved = useCallback(
    (currentDate, slot, dayIndex) => {
      const slotDate = moment(currentWeekStart).add(dayIndex, "days").format("YYYY-MM-DD");
      const slotStart = moment(`${slotDate} ${slot.time}`, "YYYY-MM-DD HH:mm");
      const slotEnd = slotStart.clone().add(1, "hour");

      return reservations.some((reservation) => {
        const reservationStart = moment(`${reservation.reservation_date} ${reservation.start_time}`, "YYYY-MM-DD HH:mm");
        const reservationEnd = moment(`${reservation.reservation_date} ${reservation.end_time}`, "YYYY-MM-DD HH:mm");

        return (
          reservation.reservation_date === slotDate &&
          slotStart.isBefore(reservationEnd) &&
          slotEnd.isAfter(reservationStart) &&
          (reservation.status === "pending" || reservation.status === "accepted")
        );
      });
    },
    [currentWeekStart, reservations]
  );

  const showConfirmation = useCallback((volunteerId, startTime, dayIndex) => {
    const reservationDate = moment(currentWeekStart).add(dayIndex, "days");
    setConfirmationDetails({
      volunteerId,
      startTime,
      dayIndex,
      date: reservationDate.format("DD/MM/YYYY"),
    });
    setIsConfirmationVisible(true);
  }, [currentWeekStart]);

  if (availableSlotsError || reservationsError || personalReservationsError) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center dark:bg-gray-800">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
          {availableSlotsError && <p className="text-red-600 dark:text-red-400 mb-2">Slots Error: {availableSlotsError}</p>}
          {reservationsError && <p className="text-red-600 dark:text-red-400 mb-2">Reservations Error: {reservationsError}</p>}
          {personalReservationsError && <p className="text-red-600 dark:text-red-400">Personal Reservations Error: {personalReservationsError}</p>}
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
              Tableau de bord - Propriétaire de chiens
            </h2>
          </div>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </header>

      <main className="container mx-auto mt-8 px-4 pb-8">
        <ClientCharterForm />
        <div className="grid grid-cols-1 gap-6">
          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faDog} className="mr-2" />
              Mes profils chiens
            </h3>
            {showDogForm ? (
              <form onSubmit={handleDogFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="dogName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dog Name</label>
                  <input
                    type="text"
                    id="dogName"
                    name="name"
                    placeholder="Dog Name"
                    value={dogData.name}
                    onChange={handleDogFormChange}
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Race</label>
                  <input
                    type="text"
                    id="breed"
                    name="breed"
                    placeholder="Breed"
                    value={dogData.breed}
                    onChange={handleDogFormChange}
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    placeholder="Age"
                    value={dogData.age}
                    onChange={handleDogFormChange}
                    min="0"
                    max="20"
                    step="1"
                    required
                    className="mt-1 block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                  />
                </div>
                <div className="flex justify-start">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                  >
                    Ajouter un profil chien
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 dark:text-gray-300">
                {dogs.length > 0 && (
                  <div className="space-y-3">
                    {dogs.map((dog) => (
                      <div key={dog.id} className="p-4 border rounded-md border-gray-200 dark:border-gray-700 dark:bg-gray-900">
                        <p className="dark:text-gray-300 text-sm"><span className="font-semibold dark:text-gray-100">Nom:</span> {dog.name}</p>
                        <p className="dark:text-gray-300 text-sm"><span className="font-semibold dark:text-gray-100">Race:</span> {dog.breed}</p>
                        <p className="dark:text-gray-300 text-sm"><span className="font-semibold dark:text-gray-100">Âge:</span> {dog.age}</p>
                      </div>
                    ))}
                  </div>
                )}
                {protectedError && <p className="text-red-500 dark:text-red-400">{protectedError}</p>}
                <button
                  onClick={() => setShowDogForm(true)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                >
                  Ajouter un autre profil chien
                </button>
              </div>
            )}
          </section>

          {dogs.length > 0 && (
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faDog} className="mr-2" />
                Choix du chien pour la réservation
              </h3>
              <div className="mt-2">
                <select
                  value={selectedDog ? selectedDog.id : ""}
                  onChange={(e) => {
                    const selectedDogData = dogs.find((dog) => dog.id === e.target.value);
                    setSelectedDog(selectedDogData);
                  }}
                  className="block w-full py-2 px-3 rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-700 dark:text-gray-300"
                >
                  <option value="">Select a Dog</option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.id}>{dog.name} ({dog.breed})</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              Créneaux disponibles
            </h3>
            {availableSlotsError && <p className="text-red-500 dark:text-red-400">{availableSlotsError}</p>}
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
                placeholderText="Choose a date"
              />
              <button
                onClick={goToNextWeek}
                className="bg-gray-400 hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Semaine prochaine
              </button>
            </div>
            <div className="flex flex-col">
              {daysOfWeek.map((dayName, dayIndex) => {
                const currentDate = moment(currentWeekStart).add(dayIndex, "days");
                const isBeforeToday = currentDate.isBefore(moment(), "day");

                if (isBeforeToday) return null;

                const isPastDay = currentDate.isBefore(moment().subtract(2, "days"), "day");

                return (
                  <div key={dayIndex} className="mb-5">
                    <h4 className="text-lg font-semibold mb-2 dark:text-white">{dayName} ({currentDate.format("DD/MM")})</h4>
                    {allAvailableSlots[dayIndex] && allAvailableSlots[dayIndex].length > 0 ? (
                      <div className="flex flex-wrap">
                        {allAvailableSlots[dayIndex].map((slot) => {
                          const isReserved = isSlotReserved(currentDate, slot, dayIndex);
                          const isPastSlot = isPastDay || moment(`${currentDate.format("YYYY-MM-DD")} ${slot.time}`, "YYYY-MM-DD HH:mm").isBefore(moment());

                          return (
                            <button
                              key={`${dayIndex}-${slot.time}`}
                              className={`inline-block rounded-md border px-3 py-2 mr-2 mb-2 text-xs sm:text-sm
                                ${isReserved || isPastSlot
                                  ? "opacity-50 cursor-not-allowed bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                                  : "border-blue-500 bg-white hover:bg-blue-100 dark:border-blue-400 dark:bg-gray-800 dark:hover:bg-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-500"}`}
                              onClick={() => {
                                if (!isPastSlot && !isReserved && !reservationLoading) {
                                  showConfirmation(slot.volunteerIds[0], slot.time, dayIndex);
                                } else if (isReserved) {
                                  toast.error("This slot is already reserved.");
                                }
                              }}
                              disabled={isReserved || isPastSlot || reservationLoading}
                            >
                              {slot.time}{isReserved && " (Créneau réservé)"}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Pas de disponibilités le {dayName}.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {isConfirmationVisible && confirmationDetails && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-500" />
                    Confirm Reservation?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Are you sure you want to reserve the slot at <span className="font-semibold">{confirmationDetails.startTime}</span> on <span className="font-semibold">{confirmationDetails.date}</span>?
                  </p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={handleCancelConfirmation}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmReservation}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
              Mes réservations
            </h3>
            {personalReservationsLoading ? (
              <div className="flex justify-center">
                <ClipLoader color={"#3b82f6"} loading={true} size={30} />
              </div>
            ) : personalReservationsError ? (
              <p className="text-red-500 dark:text-red-400 text-sm">{personalReservationsError}</p>
            ) : personalReservations.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune réservation.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse w-full">
                  <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <tr>
                      {["Bénévole", "Chien", "Jour", "Heure du début", "Heure de fin", "Statut"].map((header) => (
                        <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {personalReservations.map((reservation) => {
                      let statusColor = "";
                      let statusName = "";
                      let statusIcon = null;
                      switch (reservation.status) {
                        case "accepted":
                          statusColor = "bg-green-200 text-green-800";
                          statusIcon = <FontAwesomeIcon icon={faCheck} className="mr-1" />;
                          statusName = "Accepté";
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
                          statusName = "Rejeté";
                          break;
                        case "completed":
                          statusColor = "bg-blue-200 text-blue-800";
                          statusIcon = <FontAwesomeIcon icon={faFlagCheckered} className="mr-1" />;
                          statusName = "Complété";
                          break;
                        default:
                          statusColor = "";
                          statusIcon = null;
                          statusName = reservation.status;
                      }

                      return (
                        <tr key={reservation.id} className="hover:bg-gray-100 dark:hover:bg-gray-900">
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.volunteer_name}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.dog_name}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{moment(reservation.reservation_date, "YYYY-MM-DD").format("DD/MM/YYYY")}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.start_time}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm">{reservation.end_time}</td>
                          <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-300 text-sm font-semibold text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${statusColor}`}>
                              {statusIcon}{statusName}
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
});

ClientDashboard.displayName = "ClientDashboard";

ClientDashboard.propTypes = {
  handleLogout: PropTypes.func.isRequired,
};

export default ClientDashboard;