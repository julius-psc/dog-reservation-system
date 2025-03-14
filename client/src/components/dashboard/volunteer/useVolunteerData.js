// components/dashboard/volunteer/useVolunteerData.js
import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import "moment/locale/fr";
import toast from "react-hot-toast";

moment.locale("fr");

const useVolunteerData = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loadingAvailabilities, setLoadingAvailabilities] = useState(true);
  const [errorAvailabilities, setErrorAvailabilities] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [villagesCovered, setVillagesCovered] = useState([]);
  const [villagesUpdatedAt, setVillagesUpdatedAt] = useState(null);
  const [timeUpdatedAt, setTimeUpdatedAt] = useState(null);
  const [hasVillagesCoveredBeenSet, setHasVillagesCoveredBeenSet] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [errorVillages, setErrorVillages] = useState(null);
  const [volunteerId, setVolunteerId] = useState(null);
  const [username, setUsername] = useState("");
  const [loadingVolunteerInfo, setLoadingVolunteerInfo] = useState(true);
  const [errorVolunteerInfo, setErrorVolunteerInfo] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    paid: false,
    expiryDate: null,
  });
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [errorSubscription, setErrorSubscription] = useState(null);
  const [volunteerVillage, setVolunteerVillage] = useState(null);

  const fetchVolunteerInfo = useCallback(async () => {
    setLoadingVolunteerInfo(true);
    setErrorVolunteerInfo(null);
    const token = Cookies.get("token");
    if (!token) {
      setErrorVolunteerInfo("Authentification requise");
      setLoadingVolunteerInfo(false);
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok)
        throw new Error("Échec du chargement des informations du bénévole");
      const userData = await response.json();
      setVolunteerId(userData.personalId);
      setUsername(userData.username);
    } catch (err) {
      setErrorVolunteerInfo(err.message);
      toast.error(err.message);
    } finally {
      setLoadingVolunteerInfo(false);
    }
  }, []);

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
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok)
        throw new Error("Échec du chargement du statut d’abonnement");
      const data = await response.json();
      setSubscriptionStatus({
        paid: data.subscription_paid,
        expiryDate: data.subscription_expiry_date
          ? moment(data.subscription_expiry_date)
          : null,
      });
    } catch (err) {
      setErrorSubscription(err.message);
      toast.error(err.message);
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
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/availabilities`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok)
        throw new Error("Échec du chargement des disponibilités");
      const data = await response.json();
      setAvailabilities(Array.isArray(data) ? data : []);
      const profileResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const profileData = await profileResponse.json();
      setTimeUpdatedAt(profileData.time_updated_at || null);
    } catch (err) {
      setErrorAvailabilities(err.message);
      toast.error(err.message);
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
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/volunteer/reservations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Échec du chargement des réservations");
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setReservationsError(err.message);
      toast.error(err.message);
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
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/info`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/volunteer/villages-covered`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!villageResponse.ok)
        throw new Error("Échec du chargement des informations du bénévole");
      const villageData = await villageResponse.json();
      setVolunteerVillage(villageData.village);

      if (!villagesCoveredResponse.ok)
        throw new Error("Échec du chargement des villages couverts");
      const villagesData = await villagesCoveredResponse.json();
      const fetchedVillages = villagesData.villages_covered || [];
      setVillagesUpdatedAt(villagesData.villages_updated_at || null);

      if (fetchedVillages.length === 0 && villageData.village) {
        setVillagesCovered([villageData.village]);
      } else {
        setVillagesCovered(fetchedVillages);
        setHasVillagesCoveredBeenSet(fetchedVillages.length > 0);
      }
    } catch (error) {
      setErrorVillages(error.message);
      toast.error(`ÉCHEC DU CHARGEMENT DES DONNÉES: ${error.message}`);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  useEffect(() => {
    fetchVolunteerInfo();
    fetchSubscriptionStatus();
    fetchAvailabilities();
    fetchReservations();
    fetchVolunteerData();
  }, [
    fetchVolunteerInfo,
    fetchSubscriptionStatus,
    fetchAvailabilities,
    fetchReservations,
    fetchVolunteerData,
  ]);

  return {
    availabilities,
    setAvailabilities,
    loadingAvailabilities,
    errorAvailabilities,
    reservations,
    setReservations,
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
    setSubscriptionStatus,
    loadingSubscription,
    errorSubscription,
    volunteerVillage,
    fetchVolunteerInfo,
    fetchSubscriptionStatus,
    fetchAvailabilities,
    fetchReservations,
    fetchVolunteerData,
  };
};

export default useVolunteerData;