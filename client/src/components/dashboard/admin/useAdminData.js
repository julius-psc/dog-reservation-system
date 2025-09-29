import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useAdminData = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [volunteerCountLoading, setVolunteerCountLoading] = useState(true);
  const [volunteerCountError, setVolunteerCountError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allReservations, setAllReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);

  const [allUsers, setAllUsers] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const [otherVillageRequests, setOtherVillageRequests] = useState([]);
  const [otherVillageLoading, setOtherVillageLoading] = useState(true);
  const [otherVillageError, setOtherVillageError] = useState(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const token = Cookies.get("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchAllData = async () => {
      // Mettre tous les états de chargement à true au début
      setLoading(true);
      setVolunteerCountLoading(true);
      setReservationsLoading(true);
      setUsersLoading(true);
      setOtherVillageLoading(true);

      try {
        // Préparer toutes les requêtes
        const requests = [
          fetch(`${API_BASE_URL}/admins/volunteers/minimal`, { headers }),
          fetch(`${API_BASE_URL}/admin/volunteers/count`, { headers }),
          fetch(`${API_BASE_URL}/admin/reservations`, { headers }),
          fetch(`${API_BASE_URL}/admin/all-users`, { headers }),
          fetch(`${API_BASE_URL}/admin/users/count`, { headers }),
          fetch(`${API_BASE_URL}/admin/other-village-requests`, { headers }),
        ];

        // Attendre que toutes les requêtes soient terminées
        const responses = await Promise.all(requests);

        // Vérifier que toutes les réponses sont OK
        for (const res of responses) {
          if (!res.ok) {
            throw new Error(
              `Échec de la récupération des données : ${res.statusText}`
            );
          }
        }

        // Extraire les données JSON de toutes les réponses
        const [
          volunteersData,
          volunteerCountData,
          reservationsData,
          usersData,
          usersCountData,
          otherVillageData,
        ] = await Promise.all(responses.map((res) => res.json()));

        // Mettre à jour tous les états en une seule fois
        setVolunteers(volunteersData);
        setVolunteerCount(volunteerCountData.count);
        setAllReservations(reservationsData);
        setAllUsers(usersData);
        setUsersCount(usersCountData.count);
        setOtherVillageRequests(otherVillageData);
      } catch (err) {
        console.error("Erreur lors de la récupération des données admin:", err);
        // Mettre à jour les états d'erreur
        setError(err.message);
        setVolunteerCountError(err.message);
        setReservationsError(err.message);
        setUsersError(err.message);
        setOtherVillageError(err.message);
      } finally {
        // Mettre tous les états de chargement à false à la fin
        setLoading(false);
        setVolunteerCountLoading(false);
        setReservationsLoading(false);
        setUsersLoading(false);
        setOtherVillageLoading(false);
      }
    };

    fetchAllData();
  }, [API_BASE_URL]); // La dépendance est correcte

  const fetchVolunteerDetails = async (volunteerId) => {
    const token = Cookies.get("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/admin/volunteers/${volunteerId}`, {
      headers,
    });
    if (!res.ok)
      throw new Error("Échec de la récupération des détails du bénévole");
    return await res.json();
  };

  return {
    volunteers,
    volunteerCount,
    volunteerCountLoading,
    volunteerCountError,
    loading,
    error,
    allReservations,
    reservationsLoading,
    reservationsError,
    allUsers,
    usersCount,
    setAllUsers,
    usersLoading,
    usersError,
    otherVillageRequests,
    setOtherVillageRequests,
    otherVillageLoading,
    otherVillageError,
    fetchVolunteerDetails,
  };
};

export default useAdminData;