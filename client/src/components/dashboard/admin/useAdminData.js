import { useState, useEffect } from "react";
import Cookies from "js-cookie";

const useAdminData = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allReservations, setAllReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [otherVillageRequests, setOtherVillageRequests] = useState([]);
  const [otherVillageLoading, setOtherVillageLoading] = useState(true);
  const [otherVillageError, setOtherVillageError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    const fetchData = async (url, setData, setLoading, setError) => {
      const token = Cookies.get("token");
      if (!token) {
        setError("Aucun token trouvé. Veuillez vous connecter.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Échec de la récupération depuis ${url}`);
        const data = await response.json();
        setData(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData(`${API_BASE_URL}/admins/volunteers`, setVolunteers, setLoading, setError);
    fetchData(`${API_BASE_URL}/admin/reservations`, setAllReservations, setReservationsLoading, setReservationsError);
    fetchData(`${API_BASE_URL}/admin/all-users`, setAllUsers, setUsersLoading, setUsersError);
    fetchData(`${API_BASE_URL}/admin/other-village-requests`, setOtherVillageRequests, setOtherVillageLoading, setOtherVillageError);
  }, [API_BASE_URL]);

  return {
    volunteers,
    setVolunteers,
    loading,
    error,
    allReservations,
    setAllReservations,
    reservationsLoading,
    reservationsError,
    allUsers,
    setAllUsers,
    usersLoading,
    usersError,
    otherVillageRequests,
    setOtherVillageRequests,
    otherVillageLoading,
    otherVillageError,
  };
};

export default useAdminData;