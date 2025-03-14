import { useState, useEffect, useCallback, useRef } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");

const useClientData = () => {
  const [dogs, setDogs] = useState([]);
  const [allAvailableSlots, setAllAvailableSlots] = useState({});
  const [availableSlotsError, setAvailableSlotsError] = useState(null);
  const [personalReservations, setPersonalReservations] = useState([]);
  const [personalReservationsLoading, setPersonalReservationsLoading] = useState(true);
  const [personalReservationsError, setPersonalReservationsError] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [village, setVillage] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(moment().startOf("isoWeek"));

  const currentWeekStartRef = useRef(currentWeekStart);

  const fetchDogData = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/fetchDog`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Erreur lors de la récupération des chiens :", await response.text());
        return;
      }

      const dogData = await response.json();
      setDogs(dogData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données des chiens :", error);
    }
  }, []);

  const fetchVillage = useCallback(async () => {
    try {
      const token = Cookies.get("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/fetchUser`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Échec de la récupération des données utilisateur");
      const userData = await response.json();
      setVillage(userData.village);
      console.log("Village du client défini à :", userData.village);
    } catch (error) {
      console.error("Erreur lors de la récupération du village :", error);
    }
  }, []);

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
        }).then((res) => {
          if (!res.ok) throw new Error(`Échec de la récupération des créneaux pour ${date}`);
          return res.json();
        })
      );

      const allAvailabilities = await Promise.all(availabilityPromises);

      const mergedSlots = {};
      days.forEach((date, index) => {
        const dayOfWeek = moment(date).isoWeekday() - 1;
        mergedSlots[dayOfWeek] =
          allAvailabilities[index].mergedAvailabilities[dayOfWeek] || [];
      });

      setAllAvailableSlots(mergedSlots);
      setAvailableSlotsError(null);
    } catch (error) {
      console.error("Erreur lors de la récupération des disponibilités :", error);
      setAvailableSlotsError(error.message || "Une erreur inattendue s’est produite.");
    }
  }, [currentWeekStart]);

  const fetchPersonalReservations = useCallback(async () => {
    setPersonalReservationsLoading(true);
    setPersonalReservationsError(null);
    const token = Cookies.get("token");

    try {
      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/client/personal-reservations?endDate=${moment().endOf("week").format("YYYY-MM-DD")}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la récupération des réservations personnelles");
      }

      const personalReservationsData = await response.json();
      setPersonalReservations(personalReservationsData);
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations personnelles :", err);
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
      const url = `${
        import.meta.env.VITE_API_BASE_URL
      }/client/all-reservations?startDate=${moment(currentWeekStart).format(
        "YYYY-MM-DD"
      )}&endDate=${moment(currentWeekStart).endOf("isoWeek").format("YYYY-MM-DD")}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la récupération des réservations");
      }

      const reservationsData = await response.json();
      console.log("Réservations récupérées pour le village", village, ":", reservationsData);
      setReservations(reservationsData);
    } catch (err) {
      console.error("Erreur lors de la récupération des réservations :", err);
      setReservationsError(err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, [currentWeekStart, village]);

  useEffect(() => {
    currentWeekStartRef.current = currentWeekStart;
  }, [currentWeekStart]);

  useEffect(() => {
    const fetchInitialData = async () => {
      console.log(
        "Récupération des données initiales UNE FOIS pour la semaine commençant le :",
        currentWeekStart.format("YYYY-MM-DD")
      );
      try {
        await Promise.all([fetchDogData(), fetchVillage()]);
      } catch (error) {
        console.error("Erreur lors de la récupération des données initiales :", error);
      }
    };
    fetchInitialData();
  }, [fetchDogData, fetchVillage, currentWeekStart]);

  useEffect(() => {
    console.log(
      "Récupération des données hebdomadaires pour la semaine commençant le :",
      currentWeekStart.format("YYYY-MM-DD")
    );
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchReservations(),
          fetchAvailableSlots(),
          fetchPersonalReservations(),
        ]);
      } catch (error) {
        console.error("Erreur dans fetchAllData :", error);
      }
    };
    fetchAllData();
  }, [currentWeekStart, fetchReservations, fetchAvailableSlots, fetchPersonalReservations]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token || !village) return;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    const wsUrl = apiBaseUrl.replace(/^http/, "ws").replace(/^https/, "wss");
    let ws;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connecté à", wsUrl);
        ws.send(JSON.stringify({ type: "join_village", village }));
        console.log(`Envoyé join_village pour : ${village}`);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "reservation_update") {
          console.log(`Mise à jour WebSocket pour ${village} :`, message.reservation);
          setReservations((prev) => {
            const exists = prev.some((res) => res.id === message.reservation.id);
            if (!exists) {
              console.log("Ajout d'une nouvelle réservation à l'état :", message.reservation);
              return [...prev, message.reservation];
            }
            return prev.map((res) =>
              res.id === message.reservation.id ? message.reservation : res
            );
          });
          setPersonalReservations((prev) => {
            const reservation = message.reservation;
            if (reservation.client_id === Cookies.get("userId")) {
              const exists = prev.some((res) => res.id === reservation.id);
              if (!exists) {
                console.log("Ajout à personalReservations :", reservation);
                return [...prev, reservation];
              }
              return prev.map((res) =>
                res.id === reservation.id ? reservation : res
              );
            }
            return prev;
          });
          setAllAvailableSlots((prevSlots) => {
            const updatedSlots = { ...prevSlots };
            const reservation = message.reservation;
            const dayIndex = moment(reservation.reservation_date).diff(
              moment(currentWeekStartRef.current),
              "days"
            );
            if (updatedSlots[dayIndex]) {
              updatedSlots[dayIndex] = updatedSlots[dayIndex].map((slot) => {
                const slotStart = moment(slot.time, "HH:mm");
                const slotEnd = slotStart.clone().add(1, "hour");
                const resStart = moment(reservation.start_time, "HH:mm");
                const resEnd = moment(reservation.end_time, "HH:mm");
                if (
                  slotStart.isBefore(resEnd) &&
                  slotEnd.isAfter(resStart) &&
                  !slot.isReserved
                ) {
                  console.log(`Marquage du créneau ${slot.time} comme réservé via WebSocket`);
                  return { ...slot, isReserved: true };
                }
                return slot;
              });
            }
            console.log("Mise à jour de allAvailableSlots :", updatedSlots);
            return updatedSlots;
          });
        }
      };

      ws.onerror = (error) => console.error("Erreur WebSocket :", error);
      ws.onclose = (event) => {
        console.log("WebSocket fermé :", event.code, event.reason);
        setTimeout(connectWebSocket, 1000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Composant démonté");
        console.log("Nettoyage WebSocket : connexion fermée");
      }
    };
  }, [village]);

  return {
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
    village,
    currentWeekStart,
    setCurrentWeekStart,
    fetchDogData,
    fetchVillage,
    fetchAvailableSlots,
    fetchPersonalReservations,
    fetchReservations,
  };
};

export default useClientData;